import type { ClassTalents, TalentNode, TalentTree } from "@/lib/data/schema";

/** Runtime build state: nodeId -> allocated points. */
export interface BuildState {
  classId: string;
  level: number;
  points: Record<string, number>;
}

export type AllocError =
  | "max-rank"
  | "no-points"
  | "requires"
  | "tree-points"
  | "exclusivity"
  | "level"
  | "unknown";

export type RefundError = "no-allocation" | "would-invalidate";

export type NodeAvailability =
  | "maxed"
  | "allocated"
  | "available"
  | "locked-requires"
  | "locked-tree-points"
  | "locked-exclusivity"
  | "locked-level"
  | "locked-points";

export interface BuildViolation {
  nodeId: string;
  reason: AllocError | "unknown-node" | "invalid-points";
}

export function emptyBuild(classId: string, level: number): BuildState {
  return { classId, level, points: {} };
}

export function findNode(
  data: ClassTalents,
  nodeId: string,
): { node: TalentNode; tree: TalentTree } | null {
  for (const tree of data.trees) {
    const node = tree.nodes.find((n) => n.id === nodeId);
    if (node) return { node, tree };
  }
  return null;
}

export function pointsAvailable(data: ClassTalents, level: number): number {
  const { firstTalentLevel, maxLevel, pointsPerLevel, maxPoints } = data.rules;
  const lvl = Math.min(Math.max(level, 1), maxLevel);
  const earned = Math.max(0, (lvl - firstTalentLevel + 1) * pointsPerLevel);
  return Math.min(earned, maxPoints);
}

export function pointsSpent(state: BuildState): number {
  return Object.values(state.points).reduce((sum, p) => sum + p, 0);
}

export function treePointsSpent(state: BuildState, data: ClassTalents, treeId: string): number {
  const tree = data.trees.find((t) => t.id === treeId);
  if (!tree) return 0;
  return tree.nodes.reduce((sum, n) => sum + (state.points[n.id] ?? 0), 0);
}

/** Classic community notation for an allocation, e.g. "11/0/0". */
export function treeDistribution(points: Record<string, number>, data: ClassTalents): string {
  return data.trees
    .map((tree) => tree.nodes.reduce((sum, n) => sum + (points[n.id] ?? 0), 0))
    .join("/");
}

function requiresMet(state: BuildState, node: TalentNode): boolean {
  return node.requires.every((req) => {
    const found = state.points[req.nodeId] ?? 0;
    return found >= (req.points ?? 1);
  });
}

export function nodeAvailability(
  state: BuildState,
  data: ClassTalents,
  nodeId: string,
): NodeAvailability {
  const found = findNode(data, nodeId);
  if (!found) return "locked-requires";
  const { node, tree } = found;
  const allocated = state.points[nodeId] ?? 0;
  if (allocated >= node.maxPoints) return "maxed";
  if (state.level < (node.minLevel ?? 1)) return "locked-level";
  if (allocated > 0) return "allocated";
  if (node.exclusiveWith.some((id) => (state.points[id] ?? 0) > 0)) {
    return "locked-exclusivity";
  }
  if (!requiresMet(state, node)) return "locked-requires";
  if (treePointsSpent(state, data, tree.id) < node.requiresPointsInTree) {
    return "locked-tree-points";
  }
  if (pointsSpent(state) >= pointsAvailable(data, state.level)) return "locked-points";
  return "available";
}

export function canAllocate(
  state: BuildState,
  data: ClassTalents,
  nodeId: string,
): { ok: true } | { ok: false; reason: AllocError } {
  const found = findNode(data, nodeId);
  if (!found) return { ok: false, reason: "unknown" };
  const { node, tree } = found;
  const allocated = state.points[nodeId] ?? 0;
  if (allocated >= node.maxPoints) return { ok: false, reason: "max-rank" };
  if (state.level < (node.minLevel ?? 1)) return { ok: false, reason: "level" };
  if (node.exclusiveWith.some((id) => (state.points[id] ?? 0) > 0)) {
    return { ok: false, reason: "exclusivity" };
  }
  if (!requiresMet(state, node)) return { ok: false, reason: "requires" };
  if (treePointsSpent(state, data, tree.id) < node.requiresPointsInTree) {
    return { ok: false, reason: "tree-points" };
  }
  if (pointsSpent(state) >= pointsAvailable(data, state.level)) {
    return { ok: false, reason: "no-points" };
  }
  return { ok: true };
}

/** Returns a new state with one point added, or the error. State is never mutated. */
export function allocate(
  state: BuildState,
  data: ClassTalents,
  nodeId: string,
): { state: BuildState } | { error: AllocError } {
  const check = canAllocate(state, data, nodeId);
  if (!check.ok) return { error: check.reason };
  return {
    state: {
      ...state,
      points: { ...state.points, [nodeId]: (state.points[nodeId] ?? 0) + 1 },
    },
  };
}

/**
 * A point can be refunded only if every other allocated node would still be
 * valid afterwards (prerequisites, tree-point gates and level requirements).
 */
export function canRefund(
  state: BuildState,
  data: ClassTalents,
  nodeId: string,
): { ok: true } | { ok: false; reason: RefundError } {
  const allocated = state.points[nodeId] ?? 0;
  if (allocated <= 0) return { ok: false, reason: "no-allocation" };
  const remaining = { ...state.points };
  if (allocated === 1) delete remaining[nodeId];
  else remaining[nodeId] = allocated - 1;
  const simulated: BuildState = { ...state, points: remaining };
  for (const [id, pts] of Object.entries(remaining)) {
    if (pts <= 0) continue;
    const found = findNode(data, id);
    if (!found) return { ok: false, reason: "would-invalidate" };
    const { node, tree } = found;
    if (state.level < (node.minLevel ?? 1)) return { ok: false, reason: "would-invalidate" };
    if (!requiresMet(simulated, node)) return { ok: false, reason: "would-invalidate" };
    if (treePointsSpent(simulated, data, tree.id) < node.requiresPointsInTree) {
      return { ok: false, reason: "would-invalidate" };
    }
  }
  return { ok: true };
}

export function refund(
  state: BuildState,
  data: ClassTalents,
  nodeId: string,
): { state: BuildState } | { error: RefundError } {
  const check = canRefund(state, data, nodeId);
  if (!check.ok) return { error: check.reason };
  const points = { ...state.points };
  const next = (points[nodeId] ?? 0) - 1;
  if (next <= 0) delete points[nodeId];
  else points[nodeId] = next;
  return { state: { ...state, points } };
}

export function resetBuild(state: BuildState): BuildState {
  return { ...state, points: {} };
}

/** Full validation for decoded share links or imported data. */
export function validateBuild(state: BuildState, data: ClassTalents): BuildViolation[] {
  const violations: BuildViolation[] = [];
  if (state.classId !== data.classId) {
    violations.push({ nodeId: "*", reason: "unknown-node" });
    return violations;
  }
  if (state.level < 1 || state.level > data.rules.maxLevel) {
    violations.push({ nodeId: "*", reason: "level" });
  }
  // Allocation must be replayed node-by-node so ordering cannot smuggle
  // invalid prerequisites in via a crafted link.
  let working = emptyBuild(data.classId, Math.min(Math.max(state.level, 1), data.rules.maxLevel));
  for (const [nodeId, pts] of Object.entries(state.points)) {
    if (!Number.isInteger(pts) || pts <= 0) {
      violations.push({ nodeId, reason: "invalid-points" });
      continue;
    }
    const found = findNode(data, nodeId);
    if (!found) {
      violations.push({ nodeId, reason: "unknown-node" });
      continue;
    }
    for (let i = 0; i < pts; i++) {
      const check = canAllocate(working, data, nodeId);
      if (!check.ok) {
        violations.push({ nodeId, reason: check.reason });
        break;
      }
      working = (allocate(working, data, nodeId) as { state: BuildState }).state;
    }
  }
  return violations;
}

export function isValidBuild(state: BuildState, data: ClassTalents): boolean {
  return validateBuild(state, data).length === 0;
}
