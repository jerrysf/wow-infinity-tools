import { test, expect } from "@playwright/test";

const WARRIOR = "/zh-cn/talents/warrior";

// Real beta data (1.60.1.70425), warrior Arms tree:
// row 0: 强化英勇打击 (3), 偏斜 (5), 强化撕裂 (3)
// row 1: 强化冲锋 (2), 强化战术掌握 (5)   -- needs 5 pts in tree
// row 2: 愤怒掌控 (1, req 强化战术掌握)   -- needs 10 pts in tree
async function spendFive(page: import("@playwright/test").Page) {
  const strike = page.getByRole("button", { name: /^强化英勇打击/ });
  await strike.click(); await strike.click(); await strike.click();
  const deflect = page.getByRole("button", { name: /^偏斜/ });
  await deflect.click(); await deflect.click();
}

test.describe("talent simulator", () => {
  test("loads with verified-data provenance", async ({ page }) => {
    await page.goto(WARRIOR);
    await expect(page.locator("h1")).toContainText("战士");
    await expect(page.getByText("已审核").first()).toBeVisible();
    await expect(page.getByText("1.60.1.70425").first()).toBeVisible();
    await expect(page.getByText("剩余点数")).toBeVisible();
  });

  test("allocating a point updates counters and URL", async ({ page }) => {
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化英勇打击/ }).click();
    await expect(page.getByText("已分配: 1/")).toBeVisible();
    await expect(page).toHaveURL(/\?.*b=/);
  });

  test("locked nodes show prerequisites and reject allocation", async ({ page }) => {
    await page.goto(WARRIOR);
    // 愤怒掌控 requires 强化战术掌握 maxed; selecting it shows the lock reason
    await page.getByRole("button", { name: /^愤怒掌控/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "前置天赋尚未满足" })).toBeVisible();
    await expect(page.getByText(/需要先点满 强化战术掌握/)).toBeVisible();
  });

  test("tree points gate deeper rows", async ({ page }) => {
    await page.goto(WARRIOR);
    // row 1 needs 5 points in tree before unlocking
    const mastery = page.getByRole("button", { name: /^强化战术掌握/ });
    await mastery.click();
    await expect(page.getByText("需要在此天赋树中投入 0/5 点")).toBeVisible();
    await spendFive(page);
    await mastery.click();
    await expect(page.getByText("已分配: 6/")).toBeVisible();
  });

  test("reset clears the build", async ({ page }) => {
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化英勇打击/ }).click();
    await page.getByRole("button", { name: "重置全部点数" }).click();
    await expect(page.getByText("已分配: 0/")).toBeVisible();
    await expect(page).not.toHaveURL(/b=/);
  });

  test("share link restores the build after reload", async ({ page }) => {
    await page.goto(WARRIOR);
    const strike = page.getByRole("button", { name: /^强化英勇打击/ });
    await strike.click(); await strike.click(); await strike.click();
    const url = page.url();
    expect(url).toContain("b=");
    await page.goto(url);
    await expect(page.getByText("已分配: 3/")).toBeVisible();
  });

  test("refund removes a point", async ({ page }) => {
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化英勇打击/ }).click();
    await page.getByRole("button", { name: "Refund 强化英勇打击" }).click();
    await expect(page.getByText("已分配: 0/")).toBeVisible();
  });

  test("cannot refund a node others depend on", async ({ page }) => {
    await page.goto(WARRIOR);
    await spendFive(page);
    const mastery = page.getByRole("button", { name: /^强化战术掌握/ });
    for (let i = 0; i < 5; i++) await mastery.click();
    await page.getByRole("button", { name: /^愤怒掌控/ }).click();
    await mastery.click({ button: "right" });
    await expect(page.getByRole("alert").filter({ hasText: "依赖此天赋" })).toBeVisible();
  });

  test("invalid share link does not crash and shows a notice", async ({ page }) => {
    await page.goto(`${WARRIOR}?b=corrupted-link-%%%`);
    await expect(page.locator("h1")).toContainText("战士");
    await expect(page.getByText("分享链接无效")).toBeVisible();
  });

  test("mobile viewport can allocate talents", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only check");
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化英勇打击/ }).click();
    await expect(page.getByText("已分配: 1/")).toBeVisible();
  });
});
