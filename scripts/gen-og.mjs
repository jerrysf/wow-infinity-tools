// Generates localized Open Graph images (1200x630) via Playwright/Chromium.
// Usage: pnpm gen:og
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "og");
const iconDir = path.join(root, "public", "icons");
const dataDir = path.join(root, "data");

const loadJsonDir = (dir) =>
  fs.readdirSync(path.join(dataDir, dir)).filter((f) => f.endsWith(".json")).map((f) =>
    JSON.parse(fs.readFileSync(path.join(dataDir, dir, f), "utf8")),
  );

const classes = loadJsonDir("classes");
const talents = loadJsonDir("talents");
const builds = loadJsonDir("builds");
const classById = new Map(classes.map((c) => [c.id, c]));
const talentsByClass = new Map(talents.map((t) => [t.classId, t]));

const iconDataUri = (file) =>
  `data:image/jpeg;base64,${fs.readFileSync(path.join(iconDir, file)).toString("base64")}`;

const siteIcons = fs
  .readdirSync(iconDir)
  .filter((f) => f.endsWith(".jpg") && /ability_|spell_/.test(f))
  .sort()
  .filter((_, i) => i % 17 === 0)
  .slice(0, 8)
  .map(iconDataUri);

const locales = [
  {
    id: "zh-cn",
    eyebrow: "WOW: FOREVER 天赋模拟器与攻略",
    title: "开服之前，先想好你的天赋怎么点",
    sub: "9 大职业 · 3 系天赋树 · 逐级加点 · 一键分享",
    badge: "Beta 1.60.1.70425 已审核数据",
    level: "等级",
    points: "点",
    gameVersion: "版本",
  },
  {
    id: "en-us",
    eyebrow: "WOW: FOREVER TALENT CALCULATOR & BUILDS",
    title: "Plan your talents before launch day",
    sub: "9 classes · 3 talent trees · level-by-level · share links",
    badge: "Reviewed data · Beta 1.60.1.70425",
    level: "Level",
    points: "pts",
    gameVersion: "Version",
  },
];

const name = (l, obj) => (l.id === "zh-cn" ? obj.zh : obj.en);

const frame = (inner) => `<!doctype html><html><body style="margin:0">
<div style="width:1200px;height:630px;display:flex;flex-direction:column;justify-content:space-between;
  padding:64px 72px;box-sizing:border-box;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;
  background:radial-gradient(ellipse at 20% 0%,#1a2433 0%,#0c1219 55%,#070a0f 100%);color:#f0f4fa;position:relative;overflow:hidden">
  <div style="position:absolute;inset:18px;border:2px solid rgba(200,160,80,.45);border-radius:6px;pointer-events:none"></div>
  ${inner}
</div></body></html>`;

const topBar = (badge) => `
  <div style="display:flex;align-items:center;justify-content:space-between">
    <div style="font-size:26px;letter-spacing:6px;color:#f0bc4a;font-weight:700">INFINITY COMPENDIUM</div>
    <div style="font-size:20px;color:#7d8fa5;border:1px solid #3d5273;border-radius:999px;padding:8px 20px">${badge}</div>
  </div>`;

const iconRow = (icons) => `
  <div style="display:flex;gap:14px;align-items:center">
    ${icons
      .map(
        (src) =>
          `<img src="${src}" style="width:56px;height:56px;border-radius:6px;border:2px solid #4a5d7e;box-shadow:0 2px 8px rgba(0,0,0,.5)"/>`,
      )
      .join("")}
    <div style="margin-left:auto;font-size:18px;color:#75869c">wow-infinity-tools.vercel.app</div>
  </div>`;

const siteHtml = (l) =>
  frame(`
  ${topBar(l.badge)}
  <div>
    <div style="font-size:24px;letter-spacing:3px;color:#f0bc4a;margin-bottom:20px">${l.eyebrow}</div>
    <div style="font-size:64px;font-weight:800;line-height:1.2;text-shadow:0 2px 12px rgba(0,0,0,.6)">${l.title}</div>
    <div style="font-size:28px;color:#9aa8bc;margin-top:22px">${l.sub}</div>
  </div>
  ${iconRow(siteIcons)}`);

const buildHtml = (l, build) => {
  const gameClass = classById.get(build.classId);
  const classTalents = talentsByClass.get(build.classId);
  const treeMeta = (classTalents?.trees ?? []).map((t) => ({
    name: name(l, t.name),
    nodeIds: new Set(t.nodes.map((n) => n.id)),
    pts: 0,
  }));
  for (const [nodeId, pts] of Object.entries(build.allocation)) {
    const tree = treeMeta.find((t) => t.nodeIds.has(nodeId));
    if (tree) tree.pts += pts;
  }
  const maxPts = Math.max(1, ...treeMeta.map((t) => t.pts));
  const totalPts = Object.values(build.allocation).reduce((a, b) => a + b, 0);
  const icons = Object.keys(build.allocation)
    .map((id) => {
      for (const t of classTalents?.trees ?? []) {
        const node = t.nodes.find((n) => n.id === id);
        if (node?.icon) return iconDataUri(node.icon);
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 8);

  const bars = treeMeta
    .map(
      (t) => `
      <div style="display:flex;align-items:center;gap:18px;margin-top:14px">
        <div style="width:180px;font-size:24px;color:#9aa8bc">${t.name}</div>
        <div style="flex:1;height:22px;background:#1a2433;border:1px solid #3d5273;border-radius:4px;overflow:hidden">
          <div style="width:${Math.round((t.pts / maxPts) * 100)}%;height:100%;background:linear-gradient(90deg,#c99632,#f0bc4a)"></div>
        </div>
        <div style="width:110px;font-size:24px;color:#f0f4fa;text-align:right">${t.pts} ${l.points}</div>
      </div>`,
    )
    .join("");

  return frame(`
  ${topBar(`${l.gameVersion} ${build.gameVersion}`)}
  <div>
    <div style="font-size:26px;color:#f0bc4a;margin-bottom:14px">
      ${gameClass ? name(l, gameClass.name) : build.classId} · ${l.level} ${build.levelRange.min}-${build.levelRange.max} · ${totalPts} ${l.points}
    </div>
    <div style="font-size:60px;font-weight:800;line-height:1.2;text-shadow:0 2px 12px rgba(0,0,0,.6)">${name(l, build.name)}</div>
    <div style="margin-top:34px">${bars}</div>
  </div>
  ${iconRow(icons.length ? icons : siteIcons)}`);
};

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(outDir, "builds"), { recursive: true });

const browser = await chromium.launch();
async function shot(file, markup) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(markup, { waitUntil: "load" });
  await page.screenshot({ path: file });
  console.log("wrote", file);
  await page.close();
}

for (const l of locales) {
  await shot(path.join(outDir, `${l.id}.png`), siteHtml(l));
  for (const build of builds) {
    await shot(path.join(outDir, "builds", `${build.slug}.${l.id}.png`), buildHtml(l, build));
  }
}
await browser.close();
