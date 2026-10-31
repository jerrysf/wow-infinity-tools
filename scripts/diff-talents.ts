/**
 * Diff a snapshot of talent data against the current data/talents/ files and
 * emit a structured changelog entry into data/changelog/.
 *
 * Usage:
 *   pnpm tsx scripts/diff-talents.ts <fromVersion> <toVersion>
 * e.g. pnpm tsx scripts/diff-talents.ts 1.60.1.70425 1.61.0.71000
 *
 * The baseline lives in data/talents/snapshots/<fromVersion>/ and is created
 * by copying data/talents/*.json before re-importing a new game version.
 */
import fs from "node:fs";
import path from "node:path";
import { classTalentsSchema, type TalentNode, type ClassTalents } from "../src/lib/data/schema";

const DATA_DIR = path.join(process.cwd(), "data");

type NodeChange = {
  nodeId: string;
  name: { zh: string; en: string };
  fields: Partial<Record<"maxPoints" | "row" | "col" | "requiresPointsInTree" | "minLevel", [unknown, unknown]>> & {
    requires?: boolean;
    exclusiveWith?: boolean;
    name?: boolean;
    description?: boolean;
  };
};

type TreeChange = {
  treeId: string;
  treeName: { zh: string; en: string };
  added: TalentNode[];
  removed: TalentNode[];
  changed: NodeChange[];
};

function loadVersionTalents(dir: string): Map<string, ClassTalents> {
  const map = new Map<string, ClassTalents>();
  if (!fs.existsSync(dir)) return map;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const parsed = classTalentsSchema.parse(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
    map.set(parsed.classId, parsed);
  }
  return map;
}

function diffNode(prev: TalentNode, next: TalentNode): NodeChange | null {
  const fields: NodeChange["fields"] = {};
  for (const key of ["maxPoints", "row", "col", "requiresPointsInTree", "minLevel"] as const) {
    if (prev[key] !== next[key]) fields[key] = [prev[key] ?? null, next[key] ?? null];
  }
  if (JSON.stringify(prev.requires) !== JSON.stringify(next.requires)) fields.requires = true;
  if (JSON.stringify(prev.exclusiveWith) !== JSON.stringify(next.exclusiveWith)) fields.exclusiveWith = true;
  if (prev.name.zh !== next.name.zh || prev.name.en !== next.name.en) fields.name = true;
  if (prev.description.zh !== next.description.zh || prev.description.en !== next.description.en)
    fields.description = true;
  return Object.keys(fields).length > 0 ? { nodeId: next.id, name: next.name, fields } : null;
}

function main() {
  const [fromVersion, toVersion] = process.argv.slice(2);
  if (!fromVersion || !toVersion) {
    console.error("Usage: pnpm tsx scripts/diff-talents.ts <fromVersion> <toVersion>");
    process.exit(1);
  }

  const prevMap = loadVersionTalents(path.join(DATA_DIR, "talents", "snapshots", fromVersion));
  const nextMap = loadVersionTalents(path.join(DATA_DIR, "talents"));
  if (prevMap.size === 0) {
    console.error(`No snapshot found at data/talents/snapshots/${fromVersion}/`);
    process.exit(1);
  }

  const classes: { classId: string; trees: TreeChange[] }[] = [];
  let totalChanges = 0;

  for (const [classId, next] of nextMap) {
    const prev = prevMap.get(classId);
    if (!prev) {
      continue;
    }
    const trees: TreeChange[] = [];
    for (const nextTree of next.trees) {
      const prevTree = prev.trees.find((t) => t.id === nextTree.id);
      const added: TalentNode[] = [];
      const removed: TalentNode[] = [];
      const changed: NodeChange[] = [];
      for (const node of nextTree.nodes) {
        const old = prevTree?.nodes.find((n) => n.id === node.id);
        if (!old) added.push(node);
        else {
          const diff = diffNode(old, node);
          if (diff) changed.push(diff);
        }
      }
      for (const node of prevTree?.nodes ?? []) {
        if (!nextTree.nodes.some((n) => n.id === node.id)) removed.push(node);
      }
      if (added.length + removed.length + changed.length > 0) {
        trees.push({ treeId: nextTree.id, treeName: nextTree.name, added, removed, changed });
        totalChanges += added.length + removed.length + changed.length;
      }
    }
    if (trees.length > 0) {
      classes.push({ classId, trees });
    }
  }

  if (totalChanges === 0) {
    console.log(`No talent changes between ${fromVersion} and ${toVersion}; no changelog entry written.`);
    return;
  }

  const out = {
    fromVersion,
    toVersion,
    generatedAt: new Date().toISOString().slice(0, 10),
    classes,
  };
  const outDir = path.join(DATA_DIR, "changelog");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${fromVersion}-to-${toVersion}.json`);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 2) + "\n");
  console.log(`Wrote ${outFile}: ${totalChanges} change(s) across ${classes.length} class(es).`);
}

main();
