import { test, expect } from "@playwright/test";

test.describe("class selector", () => {
  test("completing the quiz shows recommendations (zh)", async ({ page }) => {
    await page.goto("/zh-cn/tools/class-selector");
    await expect(page.locator("h1")).toContainText("找到适合你的职业");

    // Q1: melee
    await page.getByRole("button", { name: "近战" }).click();
    // Q2: solo leveling
    await page.getByRole("button", { name: "单人升级" }).click();
    // Q3: tank
    await page.getByRole("button", { name: "愿意当坦克" }).click();
    // Q4: simple
    await page.getByRole("button", { name: "简单直接" }).click();
    // Q5: survival
    await page.getByRole("button", { name: "生存能力" }).click();

    await expect(page.locator("h2", { hasText: "推荐结果" })).toBeVisible();
    // Warrior should be the top pick for this answer set
    const firstResult = page.locator("ol li h3").first();
    await expect(firstResult).toContainText("战士");
    // Preference-matching disclaimer must be shown
    await expect(page.getByText("偏好匹配").first()).toBeVisible();
    // Reasons section exists
    await expect(page.getByText("推荐理由").first()).toBeVisible();
  });

  test("back button returns to the previous question", async ({ page }) => {
    await page.goto("/zh-cn/tools/class-selector");
    await page.getByRole("button", { name: "近战" }).click();
    await page.getByRole("button", { name: "上一步" }).click();
    await expect(page.locator("h2")).toContainText("近战还是远程");
  });

  test("restart clears answers", async ({ page }) => {
    await page.goto("/zh-cn/tools/class-selector");
    await page.getByRole("button", { name: "近战" }).click();
    await page.getByRole("button", { name: "重新开始" }).click();
    await expect(page.getByText("第 1 / 5 题")).toBeVisible();
  });

  test("answers persist in the URL for sharing", async ({ page }) => {
    await page.goto("/en-us/tools/class-selector");
    await page.getByRole("button", { name: "Melee" }).click();
    await page.getByRole("button", { name: "Solo leveling" }).click();
    await page.getByRole("button", { name: "Happy to tank" }).click();
    await page.getByRole("button", { name: "Simple and direct" }).click();
    await page.getByRole("button", { name: "Survivability" }).click();
    await expect(page).toHaveURL(/\?.*a=/);
    // Reload: results are restored from the URL
    await page.reload();
    await expect(page.locator("h2", { hasText: "recommendations" })).toBeVisible();
  });
});
