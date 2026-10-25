import { describe, expect, it } from "vitest";
import type { GameClass, SelectorConfig } from "@/lib/data/schema";
import { recommend } from "./recommend";

const prov = {
  status: "unverified" as const,
  gameVersion: "test",
  source: "test",
  importedAt: "2026-01-01",
  needsRevalidation: false,
};

const classes: GameClass[] = [
  { id: "warrior", slug: "warrior", name: { zh: "战士", en: "Warrior" }, roles: ["melee-dps"], preferenceTags: [], hasTalentData: false, demo: true, provenance: prov },
  { id: "mage", slug: "mage", name: { zh: "法师", en: "Mage" }, roles: ["ranged-dps"], preferenceTags: [], hasTalentData: false, demo: true, provenance: prov },
  { id: "priest", slug: "priest", name: { zh: "牧师", en: "Priest" }, roles: ["healer"], preferenceTags: [], hasTalentData: false, demo: true, provenance: prov },
];

const config: SelectorConfig = {
  resultCount: 2,
  questions: [
    {
      id: "range",
      text: { zh: "近战远程？", en: "Melee or ranged?" },
      options: [
        { id: "melee", text: { zh: "近战", en: "Melee" }, weights: { warrior: 3, priest: 1 } },
        { id: "ranged", text: { zh: "远程", en: "Ranged" }, weights: { mage: 3 } },
      ],
    },
    {
      "id": "role",
      "text": { "zh": "职责？", "en": "Role?" },
      "options": [
        { "id": "dps", "text": { "zh": "输出", "en": "DPS" }, "weights": { "warrior": 1, "mage": 1 } },
        { "id": "heal", "text": { "zh": "治疗", "en": "Heal" }, "weights": { "priest": 3 } },
      ],
    },
  ],
};

describe("recommend", () => {
  it("ranks by summed weights", () => {
    const results = recommend({ range: "melee", role: "dps" }, config, classes);
    expect(results[0].classId).toBe("warrior");
    expect(results[0].score).toBe(4);
    expect(results).toHaveLength(2);
  });
  it("returns reasons for the match", () => {
    const results = recommend({ range: "melee", role: "dps" }, config, classes);
    expect(results[0].matched.length).toBe(2);
    expect(results[0].matched[0].questionId).toBe("range");
  });
  it("ignores unknown options and classes", () => {
    const results = recommend({ range: "nonsense", role: "heal" }, config, classes);
    expect(results[0].classId).toBe("priest");
  });
  it("returns empty when nothing matches", () => {
    expect(recommend({}, config, classes)).toHaveLength(0);
  });
  it("does not score weights for classes not in the list", () => {
    const subset = classes.filter((c) => c.id !== "warrior");
    const results = recommend({ range: "melee", role: "dps" }, config, subset);
    expect(results.every((r) => r.classId !== "warrior")).toBe(true);
  });
});
