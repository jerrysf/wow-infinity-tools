# Infinity Compendium

WoW: Infinity（魔兽世界：无限）中英双语攻略与玩家工具站：职业选择问答、可交互天赋模拟器、可分享方案链接、分等级加点指南。所有游戏数据带版本与验证状态标记。

技术栈：Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Zod · Vitest · Playwright · pnpm · Vercel

## 项目结构

```
data/                    # 结构化游戏数据（JSON，Git 可 diff 审查）
  game/versions.json     #   游戏版本清单（isCurrent 标记当前版本）
  classes/<class>.json   #   职业定义（名称/职责/偏好标签/provenance）
  talents/<class>.json   #   每职业的天赋树、节点与规则
  talents/snapshots/     #   历史版本天赋快照（供 diff 对比）
  changelog/*.json       #   版本间天赋变更（diff:talents 生成）
  builds/<slug>.json     #   推荐方案（含分等级加点顺序）
  guides/<slug>.json     #   攻略文章（分节正文，双语字段）
  selector/questions.json#   职业选择器题库与权重
scripts/validate-data.ts # 数据校验脚本（schema + 交叉引用 + 引擎回放）
src/
  app/[locale]/          # 全部页面（zh-cn / en-us 双语言段）
  app/sitemap.ts         # sitemap.xml（含 hreflang alternates）
  app/robots.ts          # robots.txt
  app/global-not-found.tsx
  components/            # site/ selector/ talents/ builds/
  i18n/                  # locale 配置 + 双语字典
  lib/
    data/                # Zod schema + 数据加载器
    talents/engine.ts    # 天赋引擎（纯函数，独立可测）
    talents/serialize.ts # 方案 URL 编解码（base64url + Zod 校验）
    selector/recommend.ts# 职业选择器推荐逻辑
    seo.ts               # 每页 metadata/canonical/hreflang 生成
    site.ts              # 站点名、URL、路径工具
  proxy.ts               # 语言前缀重定向（/ → Accept-Language 检测）
tests/e2e/               # Playwright 端到端测试（desktop + Pixel 7）
```

## 本地开发

```bash
pnpm install
pnpm dev            # http://localhost:3000 （/ 自动重定向到 /zh-cn 或 /en-us）
```

## 常用命令

```bash
pnpm dev             # 开发服务器
pnpm build           # 生产构建
pnpm start           # 启动生产服务
pnpm typecheck       # tsc --noEmit
pnpm lint            # eslint
pnpm test            # vitest 单元测试（引擎/序列化/推荐/i18n）
pnpm validate:data   # 校验 data/ 全部数据
pnpm diff:talents    # 对比快照与当前天赋，生成 changelog（见 runbook）
pnpm test:e2e        # Playwright（默认对生产构建运行；E2E_DEV=1 改用 dev server）
pnpm verify          # validate:data + typecheck + lint + test + build
```

## 数据模型与导入

所有游戏数据放在 `data/` 下的 JSON 文件中，字段由 `src/lib/data/schema.ts` 的 Zod schema 定义，加载时校验。

每条数据必须带 `provenance` 块：

```json
"provenance": {
  "status": "unverified | reviewed | tested | outdated",
  "gameVersion": "1.60.1.70425",
  "source": "数据来源说明",
  "importedAt": "2026-10-25",
  "reviewedBy": "可选",
  "lastVerifiedAt": "可选 YYYY-MM-DD",
  "needsRevalidation": true
}
```

- `reviewed` = 资料已审核；`tested` = 已在对应版本游戏内实测。两者不可混用。
- 未验证数据不要标 reviewed/tested。演示数据加 `"demo": true`，页面会显示“演示数据”横幅。
- 本地化文本统一为 `{ "zh": "...", "en": "..." }`。

### 从公开数据源导入

当前真实数据来自 wowhandbook.com 发布的 Beta 客户端数据页（中英双语 HTML 内嵌 JSON）。导入脚本：

```bash
# 1) 抓取九个职业的中英页面
for c in warrior paladin hunter rogue priest shaman mage warlock druid; do
  curl -sL "https://wowhandbook.com/zh/classes/$c/" -o /tmp/wowhandbook/zh/$c.html
  curl -sL "https://wowhandbook.com/classes/$c/"   -o /tmp/wowhandbook/en/$c.html
done

# 2) 转换天赋树 -> data/talents/*.json
python3 scripts/import-wowhandbook.py /tmp/wowhandbook

# 3) 转换推荐方案/职业/练级攻略 -> data/builds,classes,guides
python3 scripts/import-builds.py

pnpm validate:data
```

注意：该来源的再发布许可未明确，数据页面已标注来源与 `needsRevalidation`；正式上线前应复核数据使用条款并优先改用游戏内实测数据。

运行 `pnpm validate:data` 会检查：schema、重复 id/slug、天赋节点引用（requires/exclusiveWith）、方案 allocation 用真实引擎回放是否合法、levelingSteps 节点存在性、攻略 relatedBuilds 引用、选择器权重引用的职业是否存在、版本表是否有 isCurrent。

### 新增职业与天赋节点

1. `data/classes/<new>.json`：新增职业（id、slug、name、roles、preferenceTags、provenance）。先把 `hasTalentData` 设为 `false` —— 页面会显示“资料整理中”，不会虚构天赋树。
2. `data/talents/<classId>.json`：按 `classTalentsSchema` 编写天赋树。节点字段：`id`（kebab-case）、`name`/`description`（双语）、`maxPoints`、`row`/`col`（网格坐标）、`requires`（前置节点+所需点数）、`requiresPointsInTree`（树内点数门槛）、`exclusiveWith`（互斥）、`minLevel`。
3. `rules`：`firstTalentLevel`、`maxLevel`、`pointsPerLevel`、`maxPoints` —— 每职业可不同，引擎完全由数据驱动。
4. `data/selector/questions.json`：为该职业补充各选项的权重（未配权重的职业不会被推荐）。
5. `pnpm validate:data` 必须通过；`pnpm build` 会自动为新 slug 生成静态页面。

### 新增方案 / 攻略

- 方案：`data/builds/<slug>.json` 按 `buildSchema` 填写。`allocation` 会由校验脚本用引擎逐点回放验证；`levelingSteps` 驱动攻略页的分等级展示。详情页自动生成“在模拟器中载入”链接。
- 攻略：`data/guides/<slug>.json` 按 `guideSchema` 填写，`relatedBuilds` 关联方案 slug，`classId` 可选。

### 更新游戏版本（开服 / 补丁日 runbook）

1. **先快照基线**：`cp data/talents/*.json data/talents/snapshots/<旧版本号>/`（已提交的快照不要改）。
2. 抓取并导入新数据（见上节），覆盖 `data/talents/*.json`，更新脚本中的 `GAME_VERSION`/`importedAt`/`source`。
3. 在 `data/game/versions.json` 添加新版本并把 `isCurrent` 移过去。
4. **生成变更日志**：`pnpm diff:talents <旧版本号> <新版本号>` —— 对比快照与当前数据，有变更时写入 `data/changelog/<旧>-to-<新>.json`，`/changelog` 页面自动展示；无变更时不会生成文件。
5. 不要静默覆盖旧方案：把受影响数据的 `provenance.status` 改为 `"outdated"` 或置 `"needsRevalidation": true`，页面会显示“需要重新验证”。方案 allocation 若因天赋变更失效，`pnpm validate:data` 会用引擎回放报错。
6. `pnpm verify` 全绿后部署；数据变化后重跑 `pnpm gen:og` 重新生成 OG 图。
7. 验证完成后更新 `lastVerifiedAt` 与 `status`。
8. 分享链接带 `gv`（游戏版本）字段：版本不一致时模拟器会提示“版本不匹配”而不是静默加载错误方案。

## 国际化

- 路由：`/zh-cn/*`、`/en-us/*`，UI 文案在 `src/i18n/dictionaries/{zh-cn,en-us}.ts`（类型对齐，缺 key 会编译报错）。
- 游戏数据文本走 `{zh,en}` 字段；无英文时回退中文。
- 语言切换保留当前路径与 query（已选天赋、分享链接、筛选状态不丢失）。
- `pageMetadata()` 自动生成 canonical、hreflang（zh-CN / en-US / x-default）与 Open Graph。

## SEO

每页独立 title/description、canonical、hreflang、`/sitemap.xml`（双语 URL + alternates）、`/robots.txt`、面包屑、自定义 404（locale 内 + global-not-found）。`/` 按 Accept-Language 302 跳转；其他未加前缀路径 308 到默认语言。无实质内容的组合筛选页不产生独立 URL。

结构化数据（JSON-LD）：首页 `WebSite` + `WebApplication`、全站 `BreadcrumbList`（随面包屑组件输出）、方案详情页 `HowTo`（分级加点步骤）、`/faq` 页 `FAQPage`。

社交分享图：`public/og/{zh-cn,en-us}.png` 与 `public/og/builds/<slug>.<locale>.png`（1200×630，方案图含三系点数分布与天赋图标），由 `pnpm gen:og` 用 Playwright 重新生成（依赖系统字体渲染中文）。方案或天赋数据变更后需重新运行。

## 环境变量

见 `.env.example`。生产环境必须设置 `NEXT_PUBLIC_SITE_URL`（用于 canonical、sitemap、OG）。

变现：`NEXT_PUBLIC_ADS_ENABLED` + `NEXT_PUBLIC_ADSENSE_CLIENT` 同时设置后，页面底部的 `AdSlot` 位才会渲染 AdSense 自适应广告并加载 adsbygoogle 脚本；`public/ads.txt` 需替换为真实发布商 ID。分析数据由 `@vercel/analytics` 采集，Vercel 后台开启即可。

## Vercel 部署

1. 将仓库推送到 GitHub，在 Vercel 中 Import Project（自动识别 Next.js）。
2. Build Command `pnpm build`，Install Command `pnpm install`（默认即可）。
3. 环境变量添加 `NEXT_PUBLIC_SITE_URL=https://<你的域名>`。
4. 部署后检查：`/sitemap.xml`、`/robots.txt`、`/zh-cn`、`/en-us`、分享链接在新浏览器可还原。
5. 上线后在 Vercel/Search Console 配置域名与分析。

## 已知限制

- 当前天赋与方案数据整理自 wowhandbook.com 发布的 Beta 客户端 1.60.1.70425 数据（status: `reviewed`，`needsRevalidation: true`）；正式版本上线后必须重新验证，不得标为 `tested` 直到在游戏内实测。
- 模拟器暂不支持逐步撤销（有重置与单点返还）；天赋布局为固定列网格（数据内 `row/col` 控制）。
- 攻略为结构化 JSON（无 MDX）；联系页邮箱尚未公布。
- 无数据库：分享完全依赖 URL 编码（上限 2000 字符，结构经 Zod 校验）。
- 移动 e2e 使用 Pixel 7（Chromium）；如需 Safari/WebKit 覆盖需额外安装 `playwright install webkit`。
```
