import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("root redirects to a localized home", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(zh-cn|en-us)\/?$/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("zh-cn home renders and has SEO tags", async ({ page }) => {
    await page.goto("/zh-cn");
    await expect(page.locator("h1")).toContainText("开服之前，先想好你的天赋");
    await expect(page).toHaveTitle(/Infinity Compendium/);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", /\/zh-cn\/?$/);
    const alternates = page.locator('link[rel="alternate"][hreflang]');
    await expect(alternates).toHaveCount(3); // zh-CN, en-US, x-default
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "zh-CN");
  });

  test("en-us home renders English", async ({ page }) => {
    await page.goto("/en-us");
    await expect(page.locator("h1")).toContainText("Theorycraft your build before launch day");
    await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  });

  test("unprefixed path redirects with locale prefix", async ({ page }) => {
    const resp = await page.goto("/builds");
    await expect(page).toHaveURL(/\/zh-cn\/builds/);
    expect(resp?.status()).toBe(200);
  });

  test("404 page works", async ({ page }) => {
    const resp = await page.goto("/zh-cn/no-such-page");
    expect(resp?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText("页面不存在");
  });

  test("home shows video cards linking to video platforms", async ({ page }) => {
    await page.goto("/zh-cn");
    const section = page.locator("section", { hasText: "官方与社区视频" });
    const links = section.locator('a[href*="bilibili.com"], a[href*="youtube.com"]');
    await expect(links).toHaveCount(5);
    await expect(links.first()).toHaveAttribute("target", "_blank");
    await expect(links.first()).toHaveAttribute("rel", /noopener/);
  });

  test("en-us home video cards link to YouTube", async ({ page }) => {
    await page.goto("/en-us");
    const section = page.locator("section", { hasText: "Official & community videos" });
    const links = section.locator('a[href*="youtube.com"]');
    await expect(links).toHaveCount(4);
  });

  test("no fatal console errors on home", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/zh-cn");
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test("sitemap and robots are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const body = await sitemap.text();
    expect(body).toContain("/zh-cn/");
    expect(body).toContain("/en-us/");
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("sitemap");
  });
});
