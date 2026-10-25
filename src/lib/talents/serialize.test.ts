import { describe, expect, it } from "vitest";
import { buildSummaryText, decodeBuild, encodeBuild, MAX_SHARE_LENGTH } from "./serialize";

const state = {
  classId: "warrior",
  level: 30,
  points: { "w-arms-1": 3, "w-arms-5": 1 },
};

describe("encode/decode roundtrip", () => {
  it("restores the same build", () => {
    const encoded = encodeBuild(state, "demo-2026-10");
    const decoded = decodeBuild(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.state).toEqual(state);
    expect(decoded!.gameVersion).toBe("demo-2026-10");
  });
  it("produces a url-safe string", () => {
    const encoded = encodeBuild(state, "demo-2026-10");
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("decodeBuild rejects bad input", () => {
  it.each([
    ["empty", ""],
    ["undefined", undefined],
    ["null", null],
    ["garbage", "!!!not-base64!!!"],
    ["valid base64 but not json", "aGVsbG8gd29ybGQ"],
    ["wrong schema", Buffer.from(JSON.stringify({ v: 99 })).toString("base64url")],
    ["bad node id", Buffer.from(JSON.stringify({ v: 1, gv: "x", c: "warrior", l: 30, p: [["BAD NODE", 1]] })).toString("base64url")],
    ["duplicate nodes", Buffer.from(JSON.stringify({ v: 1, gv: "x", c: "warrior", l: 30, p: [["a", 1], ["a", 1]] })).toString("base64url")],
    ["level too high", Buffer.from(JSON.stringify({ v: 1, gv: "x", c: "warrior", l: 999, p: [] })).toString("base64url")],
    ["too-long string", "a".repeat(MAX_SHARE_LENGTH + 1)],
  ])("returns null for %s", (_name, input) => {
    expect(decodeBuild(input as string)).toBeNull();
  });
});

describe("buildSummaryText", () => {
  it("formats a readable summary", () => {
    const text = buildSummaryText(state, (id) => (id === "w-arms-1" ? "强化打击" : undefined));
    expect(text).toContain("warrior");
    expect(text).toContain("Lv30");
    expect(text).toContain("强化打击 3");
  });
});
