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
    await page.getByRole("link", { name: "Chinese" }).click();
    await expect(page).toHaveURL(/\/zh-cn\/guides\/how-to-choose-class/);
  });

  test("locale switch preserves query params", async ({ page }) => {
    await page.goto("/zh-cn/builds?class=warrior");
    await page.getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en-us\/builds\?class=warrior/);
  });

  test("English pages show no Chinese text", async ({ page }) => {
    for (const path of ["", "talents", "talents/druid", "builds", "builds/druid-balance-dps", "guides/druid-leveling-guide", "faq", "changelog"]) {
      await page.goto(`/en-us/${path}`);
      const text = await page.locator("body").innerText();
      expect(text, `/en-us/${path} contains Chinese`).not.toMatch(/[一-鿿]/);
    }
  });
});
