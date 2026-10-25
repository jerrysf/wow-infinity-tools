// Generates localized Open Graph images (1200x630) via Playwright/Chromium.
// Usage: pnpm gen:og
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "og");
const iconDir = path.join(root, "public", "icons");

const iconPool = fs
  .readdirSync(iconDir)
  .filter((f) => f.endsWith(".jpg") && /ability_|spell_/.test(f))
  .sort()
  .filter((_, i) => i % 17 === 0)
  .slice(0, 8)
  .map((f) => `data:image/jpeg;base64,${fs.readFileSync(path.join(iconDir, f)).toString("base64")}`);

const locales = [
  {
    id: "zh-cn",
    eyebrow: "WOW: FOREVER 天赋模拟器与攻略",
    title: "开服之前，先想好你的天赋怎么点",
    sub: "9 大职业 · 3 系天赋树 · 逐级加点 · 一键分享",
    badge: "Beta 1.60.1.70425 已审核数据",
  },
  {
    id: "en-us",
    eyebrow: "WOW: FOREVER TALENT CALCULATOR & BUILDS",
    title: "Plan your talents before launch day",
    sub: "9 classes · 3 talent trees · level-by-level · share links",
    badge: "Reviewed data · Beta 1.60.1.70425",
  },
];

const html = (l, icons) => `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;
  padding:64px 72px;box-sizing:border-box;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;
  background:radial-gradient(ellipse at 20% 0%,#2b2418 0%,#14100a 55%,#0a0806 100%);color:#f4e9d0;position:relative;overflow:hidden">
  <div style="position:absolute;inset:18px;border:2px solid rgba(200,160,80,.45);border-radius:6px;pointer-events:none"></div>
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:26px;letter-spacing:6px;color:#c8a050;font-weight:700">INFINITY COMPENDIUM</div>
    <div style="font-size:20px;color:#8a7a58;border:1px solid #5a4a28;border-radius:999px;padding:8px 20px">${l.badge}</div>
  </div>
  <div>
    <div style="font-size:24px;letter-spacing:3px;color:#c8a050;margin-bottom:20px">${l.eyebrow}</div>
    <div style="font-size:64px;font-weight:800;line-height:1.2;text-shadow:0 2px 12px rgba(0,0,0,.6)">${l.title}</div>
    <div style="font-size:28px;color:#b0a284;margin-top:22px">${l.sub}</div>
  </div>
  <div style="display:flex;gap:14px;align-items:center">
    ${icons
      .map(
        (src) =>
          `<img src="${src}" style="width:56px;height:56px;border-radius:6px;border:2px solid #6a5830;box-shadow:0 2px 8px rgba(0,0,0,.5)"/>`,
      )
      .join("")}
    <div style="margin-left:auto;font-size:18px;color:#6a5c40">wow-infinity-tools.vercel.app</div>
  </div>
</div></body></html>`;

fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const l of locales) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html(l, iconPool), { waitUntil: "load" });
  const file = path.join(outDir, `${l.id}.png`);
  await page.screenshot({ path: file });
  console.log("wrote", file);
  await page.close();
}
await browser.close();
