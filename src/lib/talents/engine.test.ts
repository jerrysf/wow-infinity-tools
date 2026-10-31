import { describe, expect, it } from "vitest";
import type { ClassTalents } from "@/lib/data/schema";
import {
  allocate,
  canRefund,
  emptyBuild,
  isValidBuild,
  nodeAvailability,
  pointsAvailable,
  pointsSpent,
  refund,
  resetBuild,
  treeDistribution,
  treePointsSpent,
  validateBuild,
} from "./engine";

// Minimal fixture exercising every rule type. NOT shipped as game data.
const fixture: ClassTalents = {
  classId: "test",
  gameVersion: "test-1",
  demo: true,
  rules: { firstTalentLevel: 10, maxLevel: 30, pointsPerLevel: 1, maxPoints: 21 },
  provenance: {
    status: "unverified",
    gameVersion: "test-1",
    source: "unit test",
    importedAt: "2026-01-01",
    needsRevalidation: false,
  },
  trees: [
    {
      id: "t1",
      name: { zh: "树一", en: "Tree One" },
      nodes: [
        { id: "a1", name: { zh: "A1", en: "A1" }, description: { zh: "", en: "" }, maxPoints: 3, row: 0, col: 0, requires: [], requiresPointsInTree: 0, exclusiveWith: [] },
        { id: "a0", name: { zh: "A0", en: "A0" }, description: { zh: "", en: "" }, maxPoints: 2, row: 0, col: 1, requires: [], requiresPointsInTree: 0, exclusiveWith: [] },
        { id: "a2", name: { zh: "A2", en: "A2" }, description: { zh: "", en: "" }, maxPoints: 1, row: 1, col: 0, requires: [{ nodeId: "a1", points: 3 }], requiresPointsInTree: 0, exclusiveWith: [] },
        { id: "a3", name: { zh: "A3", en: "A3" }, description: { zh: "", en: "" }, maxPoints: 1, row: 2, col: 0, requires: [], requiresPointsInTree: 5, exclusiveWith: [], minLevel: 20 },
        { id: "a4", name: { zh: "A4", en: "A4" }, description: { zh: "", en: "" }, maxPoints: 1, row: 2, col: 1, requires: [], requiresPointsInTree: 5, exclusiveWith: ["a5"] },
        { id: "a5", name: { zh: "A5", en: "A5" }, description: { zh: "", en: "" }, maxPoints: 1, row: 2, col: 2, requires: [], requiresPointsInTree: 5, exclusiveWith: ["a4"] },
      ],
    },
    {
      id: "t2",
      name: { zh: "树二", en: "Tree Two" },
      nodes: [
        { id: "b1", name: { zh: "B1", en: "B1" }, description: { zh: "", en: "" }, maxPoints: 2, row: 0, col: 0, requires: [], requiresPointsInTree: 0, exclusiveWith: [] },
      ],
    },
  ],
};

function buildAt(level: number): ReturnType<typeof emptyBuild> {
  return emptyBuild("test", level);
}

describe("pointsAvailable", () => {
  it("grants points from firstTalentLevel", () => {
    expect(pointsAvailable(fixture, 9)).toBe(0);
    expect(pointsAvailable(fixture, 10)).toBe(1);
    expect(pointsAvailable(fixture, 15)).toBe(6);
  });
  it("caps at maxPoints and maxLevel", () => {
    expect(pointsAvailable(fixture, 30)).toBe(21);
    expect(pointsAvailable(fixture, 99)).toBe(21);
  });
});

describe("allocate", () => {
  it("allocates a free node", () => {
    const result = allocate(buildAt(30), fixture, "a1");
    expect("state" in result && result.state.points.a1).toBe(1);
  });
  it("rejects unknown nodes", () => {
    const result = allocate(buildAt(30), fixture, "nope");
    expect("error" in result && result.error).toBe("unknown");
  });
  it("enforces max rank", () => {
    let s = buildAt(30);
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    const result = allocate(s, fixture, "a1");
    expect("error" in result && result.error).toBe("max-rank");
  });
  it("enforces point cap", () => {
    // level 10 -> 1 point available
    const s = buildAt(10);
    const first = allocate(s, fixture, "a1");
    expect("state" in first).toBe(true);
    const second = allocate((first as { state: typeof s }).state, fixture, "a1");
    expect("error" in second && second.error).toBe("no-points");
  });
  it("enforces prerequisites", () => {
    const result = allocate(buildAt(30), fixture, "a2");
    expect("error" in result && result.error).toBe("requires");
  });
  it("accepts after prerequisites met", () => {
    let s = buildAt(30);
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    const result = allocate(s, fixture, "a2");
    expect("state" in result).toBe(true);
  });
  it("enforces tree-point gates", () => {
    const s = buildAt(30);
    const result = allocate(s, fixture, "a4");
    expect("error" in result && result.error).toBe("tree-points");
  });
  it("enforces minLevel", () => {
    // a3 requires 5 points in t1 and level 20
    let s = buildAt(19);
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    for (let i = 0; i < 2; i++) s = (allocate(s, fixture, "a0") as { state: typeof s }).state;
    expect(treePointsSpent(s, fixture, "t1")).toBe(5);
    const blocked = allocate(s, fixture, "a3");
    expect("error" in blocked && blocked.error).toBe("level");
    const allowed = allocate({ ...s, level: 20 }, fixture, "a3");
    expect("state" in allowed).toBe(true);
  });
  it("enforces exclusivity both ways", () => {
    let s = buildAt(30);
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    for (let i = 0; i < 2; i++) s = (allocate(s, fixture, "a0") as { state: typeof s }).state;
    expect(treePointsSpent(s, fixture, "t1")).toBe(5);
    const first = allocate(s, fixture, "a4");
    expect("state" in first).toBe(true);
    s = (first as { state: typeof s }).state;
    const blocked = allocate(s, fixture, "a5");
    expect("error" in blocked && blocked.error).toBe("exclusivity");
  });
});

describe("refund", () => {
  function baseBuild() {
    let s = buildAt(30);
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    s = (allocate(s, fixture, "a2") as { state: typeof s }).state;
    return s;
  }
  it("refunds an independent point", () => {
    const s = baseBuild();
    const result = refund(s, fixture, "a1");
    // a2 requires a1:3; removing the third point would break it
    expect("error" in result && result.error).toBe("would-invalidate");
  });
  it("refunds a leaf node", () => {
    const s = baseBuild();
    const result = refund(s, fixture, "a2");
    expect("state" in result && result.state.points.a2).toBeUndefined();
  });
  it("rejects refunding an unallocated node", () => {
    const result = refund(buildAt(30), fixture, "a1");
    expect("error" in result && result.error).toBe("no-allocation");
  });
  it("canRefund mirrors refund", () => {
    const s = baseBuild();
    expect(canRefund(s, fixture, "a2").ok).toBe(true);
    expect(canRefund(s, fixture, "a1").ok).toBe(false);
  });
});

describe("resetBuild", () => {
  it("clears all points", () => {
    let s = buildAt(30);
    s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    const cleared = resetBuild(s);
    expect(pointsSpent(cleared)).toBe(0);
    expect(cleared.level).toBe(30);
  });
});

describe("validateBuild", () => {
  it("accepts a legal build", () => {
    let s = buildAt(30);
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    s = (allocate(s, fixture, "a2") as { state: typeof s }).state;
    expect(isValidBuild(s, fixture)).toBe(true);
  });
  it("rejects unknown nodes", () => {
    const s = { classId: "test", level: 30, points: { ghost: 1 } };
    const v = validateBuild(s, fixture);
    expect(v.some((x) => x.reason === "unknown-node")).toBe(true);
  });
  it("rejects overspent builds", () => {
    const s = { classId: "test", level: 10, points: { a1: 2 } };
    const v = validateBuild(s, fixture);
    expect(v.length).toBeGreaterThan(0);
  });
  it("rejects smuggled prerequisites", () => {
    const s = { classId: "test", level: 30, points: { a2: 1 } };
    const v = validateBuild(s, fixture);
    expect(v.some((x) => x.reason === "requires")).toBe(true);
  });
  it("rejects mismatched class", () => {
    const s = { classId: "other", level: 30, points: {} };
    expect(validateBuild(s, fixture).length).toBeGreaterThan(0);
  });
});

describe("treeDistribution", () => {
  it("renders classic x/y/z notation per tree order", () => {
    expect(treeDistribution({ a1: 3, a2: 1, b1: 2 }, fixture)).toBe("4/2");
    expect(treeDistribution({}, fixture)).toBe("0/0");
    expect(treeDistribution({ ghost: 9, b1: 1 }, fixture)).toBe("0/1");
  });
});

describe("nodeAvailability", () => {
  it("reports available/maxed/locked states", () => {
    let s = buildAt(30);
    expect(nodeAvailability(s, fixture, "a1")).toBe("available");
    for (let i = 0; i < 3; i++) s = (allocate(s, fixture, "a1") as { state: typeof s }).state;
    expect(nodeAvailability(s, fixture, "a1")).toBe("maxed");
    expect(nodeAvailability(s, fixture, "a2")).toBe("available");
    expect(nodeAvailability(s, fixture, "a4")).toBe("locked-tree-points");
  });
});
