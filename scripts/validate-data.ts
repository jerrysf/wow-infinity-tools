/**
 * Data validation: checks schema, duplicate ids, cross-references and
 * build allocations against the real talent engine. Run: pnpm validate:data
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  buildSchema,
  classSchema,
  classTalentsSchema,
  changelogSchema,
  communityLinkSchema,
  communityVideoSchema,
  gameVersionSchema,
  guideSchema,
  selectorConfigSchema,
  type Build,
  type ClassTalents,
  type GameClass,
  type GameVersion,
  type Guide,
} from "../src/lib/data/schema";
import { validateBuild, pointsAvailable, type BuildState } from "../src/lib/talents/engine";

const DATA_DIR = path.join(process.cwd(), "data");
const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}

function warn(msg: string) {
  warnings.push(msg);
}

function readJson(rel: string): unknown {
  const data: unknown = JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), "utf8"));
  checkEntities(data, rel);
  return data;
}

function dirFiles(dir: string): string[] {
  const abs = path.join(DATA_DIR, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter((f) => f.endsWith(".json"));
}

function parse<T>(schema: z.ZodType<T>, rel: string): T | null {
  try {
    return schema.parse(readJson(rel));
  } catch (err) {
    if (err instanceof z.ZodError) {
      for (const issue of err.issues) {
        fail(`${rel}: ${issue.path.join(".") || "(root)"} - ${issue.message}`);
      }
    } else {
      fail(`${rel}: ${(err as Error).message}`);
    }
    return null;
  }
}

function parseItem<T>(schema: z.ZodType<T>, value: unknown, where: string) {
  try {
    schema.parse(value);
  } catch (err) {
    if (err instanceof z.ZodError) {
      for (const issue of err.issues) {
        fail(`${where}: ${issue.path.join(".") || "(root)"} - ${issue.message}`);
      }
    } else {
      fail(`${where}: ${(err as Error).message}`);
    }
  }
}

const ENTITY_RE = /&(?:#[0-9]+|[a-zA-Z]+);/;

function checkEntities(value: unknown, where: string) {
  if (typeof value === "string") {
    if (ENTITY_RE.test(value)) fail(`${where}: unescaped HTML entity in "${value.slice(0, 60)}"`);
    return;
  }
  if (Array.isArray(value)) {
    for (const v of value) checkEntities(v, where);
    return;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) checkEntities(v, where);
  }
}

function checkDuplicates(ids: string[], where: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) fail(`${where}: duplicate id "${id}"`);
    seen.add(id);
  }
}

function checkTalentData(data: ClassTalents, file: string, versions: GameVersion[]) {
  const nodeIds = new Set<string>();
  for (const tree of data.trees) {
    checkDuplicates(tree.nodes.map((n) => n.id), `${file} tree ${tree.id}`);
    for (const node of tree.nodes) {
      nodeIds.add(node.id);
      if (node.minLevel && node.minLevel > data.rules.maxLevel) {
        fail(`${file}: node ${node.id} minLevel ${node.minLevel} > maxLevel`);
      }
    }
  }
  for (const tree of data.trees) {
    for (const node of tree.nodes) {
      for (const req of node.requires) {
        if (!nodeIds.has(req.nodeId)) {
          fail(`${file}: node ${node.id} requires unknown node ${req.nodeId}`);
        }
      }
      for (const ex of node.exclusiveWith) {
        if (!nodeIds.has(ex)) {
          fail(`${file}: node ${node.id} exclusiveWith unknown node ${ex}`);
        }
      }
    }
  }
  if (!versions.some((v) => v.id === data.gameVersion)) {
    warn(`${file}: gameVersion "${data.gameVersion}" is not a declared version`);
  }
}

function checkBuild(build: Build, file: string, talentsByClass: Map<string, ClassTalents>, versions: GameVersion[]) {
  const data = talentsByClass.get(build.classId);
  if (!data) {
    fail(`${file}: build references class "${build.classId}" with no talent data`);
    return;
  }
  const state: BuildState = {
    classId: build.classId,
    level: build.levelRange.max,
    points: build.allocation,
  };
  const violations = validateBuild(state, data);
  for (const v of violations) {
    fail(`${file}: allocation invalid - ${v.nodeId}: ${v.reason}`);
  }
  for (const step of build.levelingSteps) {
    for (const nodeId of Object.keys(step.spend)) {
      if (!data.trees.some((t) => t.nodes.some((n) => n.id === nodeId))) {
        fail(`${file}: leveling step "${step.levelRange}" references unknown node ${nodeId}`);
      }
    }
  }
  if (!versions.some((v) => v.id === build.gameVersion)) {
    warn(`${file}: gameVersion "${build.gameVersion}" is not a declared version`);
  }
  const available = pointsAvailable(data, build.levelRange.max);
  const spent = Object.values(build.allocation).reduce((s, p) => s + p, 0);
  if (spent > available) {
    fail(`${file}: build spends ${spent} points but only ${available} available at level ${build.levelRange.max}`);
  }
}

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fail("data/ directory does not exist");
    report();
  }

  const versions = (() => {
    const raw = readJson("game/versions.json");
    const parsed = z.array(gameVersionSchema).safeParse(raw);
    if (!parsed.success) {
      fail(`game/versions.json: ${parsed.error.issues.map((i) => i.message).join("; ")}`);
      return [] as GameVersion[];
    }
    if (!parsed.data.some((v) => v.isCurrent)) {
      fail("game/versions.json: no version marked isCurrent");
    }
    return parsed.data;
  })();

  const classes: GameClass[] = [];
  for (const f of dirFiles("classes")) {
    const c = parse(classSchema, `classes/${f}`);
    if (c) classes.push(c);
  }
  checkDuplicates(classes.map((c) => c.id), "classes");
  checkDuplicates(classes.map((c) => c.slug), "classes");

  const talentsByClass = new Map<string, ClassTalents>();
  for (const f of dirFiles("talents")) {
    const data = parse(classTalentsSchema, `talents/${f}`);
    if (!data) continue;
    checkTalentData(data, `talents/${f}`, versions);
    if (talentsByClass.has(data.classId)) {
      fail(`talents/${f}: duplicate talent data for class ${data.classId}`);
    }
    talentsByClass.set(data.classId, data);
    if (!classes.some((c) => c.id === data.classId)) {
      fail(`talents/${f}: no class definition for "${data.classId}"`);
    }
  }
  for (const c of classes) {
    if (c.hasTalentData && !talentsByClass.has(c.id)) {
      fail(`classes/${c.slug}: hasTalentData=true but no talents/${c.id}.json`);
    }
  }

  const builds: Build[] = [];
  for (const f of dirFiles("builds")) {
    const b = parse(buildSchema, `builds/${f}`);
    if (b) builds.push(b);
  }
  checkDuplicates(builds.map((b) => b.slug), "builds");
  for (const b of builds) {
    checkBuild(b, `builds/${b.slug}.json`, talentsByClass, versions);
  }

  const buildSlugs = new Set(builds.map((b) => b.slug));
  const guides: Guide[] = [];
  for (const f of dirFiles("guides")) {
    const g = parse(guideSchema, `guides/${f}`);
    if (g) guides.push(g);
  }
  checkDuplicates(guides.map((g) => g.slug), "guides");
  for (const g of guides) {
    for (const slug of g.relatedBuilds) {
      if (!buildSlugs.has(slug)) {
        fail(`guides/${g.slug}.json: relatedBuilds references unknown build "${slug}"`);
      }
    }
    if (g.classId && !classes.some((c) => c.id === g.classId)) {
      fail(`guides/${g.slug}.json: unknown classId "${g.classId}"`);
    }
  }

  for (const f of dirFiles("community")) {
    const rel = `community/${f}`;
    const raw = readJson(rel);
    const items = Array.isArray(raw) ? raw : [];
    const slugs = items.map((v) => (v as { slug?: string }).slug ?? "");
    checkDuplicates(slugs, rel);
    if (f === "videos.json")
      items.forEach((v, i) => {
        parseItem(communityVideoSchema, v, `${rel}[${i}]`);
        const video = communityVideoSchema.safeParse(v);
        if (video.success && video.data.youtubeId && !fs.existsSync(path.join(process.cwd(), "public/thumbs", `${video.data.youtubeId}.jpg`)))
          fail(`${rel}[${i}]: missing thumbnail public/thumbs/${video.data.youtubeId}.jpg`);
      });
    if (f === "links.json") items.forEach((v, i) => parseItem(communityLinkSchema, v, `${rel}[${i}]`));
  }

  for (const f of dirFiles("changelog")) {
    const raw = readJson(`changelog/${f}`);
    parseItem(changelogSchema, raw, `changelog/${f}`);
  }

  const selector = parse(selectorConfigSchema, "selector/questions.json");
  if (selector) {
    checkDuplicates(selector.questions.map((q) => q.id), "selector questions");
    for (const q of selector.questions) {
      checkDuplicates(q.options.map((o) => o.id), `selector question ${q.id}`);
      for (const o of q.options) {
        for (const classId of Object.keys(o.weights)) {
          if (!classes.some((c) => c.id === classId)) {
            fail(`selector/questions.json: option "${o.id}" weights unknown class "${classId}"`);
          }
        }
      }
    }
  }

  report();
}

function report(): never {
  for (const w of warnings) console.warn(`WARN  ${w}`);
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR ${e}`);
    console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
    process.exit(1);
  }
  console.log(`Data validation passed. ${warnings.length} warning(s).`);
  process.exit(0);
}

main();
