import { test, expect } from "@playwright/test";

test.describe("locale switching", () => {
  test("switching languages keeps the current page", async ({ page }) => {
    await page.goto("/zh-cn/talents/warrior");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en-us\/talents\/warrior/);
    await expect(page.locator("h1")).toContainText("Warrior");
  });

  test("switching back to Chinese works", async ({ page }) => {
    await page.goto("/en-us/guides/how-to-choose-class");
    await page.getByRole("link", { name: "简体中文" }).click();
    await expect(page).toHaveURL(/\/zh-cn\/guides\/how-to-choose-class/);
  });

  test("locale switch preserves query params", async ({ page }) => {
    await page.goto("/zh-cn/builds?class=warrior");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en-us\/builds\?class=warrior/);
  });
});
