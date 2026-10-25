import { test, expect } from "@playwright/test";

const WARRIOR = "/zh-cn/talents/warrior";

test.describe("talent simulator", () => {
  test("loads with data status banner (demo)", async ({ page }) => {
    await page.goto(WARRIOR);
    await expect(page.locator("h1")).toContainText("战士");
    await expect(page.getByText("演示数据").first()).toBeVisible();
    await expect(page.getByText("剩余点数")).toBeVisible();
  });

  test("allocating a point updates counters and URL", async ({ page }) => {
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化打击/ }).click();
    await expect(page.getByText("已分配: 1/")).toBeVisible();
    await expect(page).toHaveURL(/\?.*b=/);
  });

  test("locked nodes show prerequisites and reject allocation", async ({ page }) => {
    await page.goto(WARRIOR);
    // 横扫 requires 3 points in 强化打击
    await expect(page.getByText(/需要先点满 强化打击/)).toBeVisible();
    await page.getByRole("button", { name: /^横扫/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "前置天赋尚未满足" })).toBeVisible();
  });

  test("reset clears the build", async ({ page }) => {
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化打击/ }).click();
    await page.getByRole("button", { name: "重置全部点数" }).click();
    await expect(page.getByText("已分配: 0/")).toBeVisible();
    await expect(page).not.toHaveURL(/b=/);
  });

  test("share link restores the build after reload", async ({ page }) => {
    await page.goto(WARRIOR);
    const strike = page.getByRole("button", { name: /^强化打击/ });
    await strike.click();
    await strike.click();
    await strike.click();
    // unlocked after 3 points in 强化打击
    await page.getByRole("button", { name: /^横扫/ }).click();
    const url = page.url();
    expect(url).toContain("b=");
    await page.goto(url);
    await expect(page.getByText("已分配: 4/")).toBeVisible();
  });

  test("refund removes a point", async ({ page }) => {
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化打击/ }).click();
    await page.getByRole("button", { name: "Refund 强化打击" }).click();
    await expect(page.getByText("已分配: 0/")).toBeVisible();
  });

  test("invalid share link does not crash and shows a notice", async ({ page }) => {
    await page.goto(`${WARRIOR}?b=corrupted-link-%%%`);
    await expect(page.locator("h1")).toContainText("战士");
    await expect(page.getByText("分享链接无效")).toBeVisible();
  });

  test("exclusive talents cannot both be taken", async ({ page }) => {
    await page.goto(WARRIOR);
    // Spend 8 in arms tree: 3x强化打击 + 3x坚韧体魄 + 2x精准
    const strike = page.getByRole("button", { name: /^强化打击/ });
    await strike.click(); await strike.click(); await strike.click();
    const tough = page.getByRole("button", { name: /^坚韧体魄/ });
    await tough.click(); await tough.click(); await tough.click();
    const prec = page.getByRole("button", { name: /^精准/ });
    await prec.click(); await prec.click();
    // Need致死打击 first for处决大师; take it then exclusive pick
    await page.getByRole("button", { name: /^致死打击/ }).click();
    await page.getByRole("button", { name: /^处决大师/ }).click();
    await page.getByRole("button", { name: /^利刃专精/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "互斥" })).toBeVisible();
  });

  test("mobile viewport can allocate talents", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only check");
    await page.goto(WARRIOR);
    await page.getByRole("button", { name: /^强化打击/ }).click();
    await expect(page.getByText("已分配: 1/")).toBeVisible();
  });
});
