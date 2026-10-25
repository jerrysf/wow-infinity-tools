import { z } from "zod";

/** Bilingual text stored with game data. Keys mirror the locale list. */
export const localizedTextSchema = z.object({
  zh: z.string(),
  en: z.string().default(""),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Verification status for every piece of game data. */
export const dataStatusSchema = z.enum([
  "unverified",
  "reviewed",
  "tested",
  "outdated",
]);
export type DataStatus = z.infer<typeof dataStatusSchema>;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

/** Provenance block required on all game data. */
export const provenanceSchema = z.object({
  status: dataStatusSchema,
  gameVersion: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.url().optional(),
  importedAt: isoDate,
  reviewedBy: z.string().optional(),
  lastVerifiedAt: isoDate.optional(),
  needsRevalidation: z.boolean().default(false),
  notes: z.string().optional(),
});
export type Provenance = z.infer<typeof provenanceSchema>;

export const gameVersionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  isCurrent: z.boolean().default(false),
  releasedAt: isoDate.optional(),
});
export type GameVersion = z.infer<typeof gameVersionSchema>;

export const playstyleSchema = z.enum([
  "leveling",
  "dungeon",
  "raid",
  "pvp",
  "solo",
]);
export type Playstyle = z.infer<typeof playstyleSchema>;

export const roleSchema = z.enum(["tank", "healer", "melee-dps", "ranged-dps", "support"]);
export type Role = z.infer<typeof roleSchema>;

export const classSchema = z.object({
  id: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase kebab-case"),
  name: localizedTextSchema,
  tagline: localizedTextSchema.optional(),
  roles: z.array(roleSchema).min(1),
  /** Free-form preference tags used by the class-selector rules. */
  preferenceTags: z.array(z.string()).default([]),
  /** Known strengths/weaknesses surfaced by the selector result card. */
  strengths: localizedTextSchema.optional(),
  drawbacks: localizedTextSchema.optional(),
  hasTalentData: z.boolean().default(false),
  /** Demo entries power the tools during development and must be clearly labelled. */
  demo: z.boolean().default(false),
  provenance: provenanceSchema,
});
export type GameClass = z.infer<typeof classSchema>;

export const talentNodeSchema = z.object({
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/, "node id must be lowercase kebab-case"),
  name: localizedTextSchema,
  description: localizedTextSchema,
  maxPoints: z.number().int().min(1).max(10).default(1),
  /** Grid coordinates used by the UI layout. Row 0 is the top of the tree. */
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  /** Other nodes that must be fully ranked before this node can be taken. */
  requires: z
    .array(z.object({ nodeId: z.string(), points: z.number().int().min(1).optional() }))
    .default([]),
  /** Minimum points already spent *in this tree* before the node unlocks. */
  requiresPointsInTree: z.number().int().min(0).default(0),
  /** Nodes that cannot be taken together with this one. */
  exclusiveWith: z.array(z.string()).default([]),
  minLevel: z.number().int().min(1).optional(),
});
export type TalentNode = z.infer<typeof talentNodeSchema>;

export const talentTreeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedTextSchema,
  nodes: z.array(talentNodeSchema).min(1),
});
export type TalentTree = z.infer<typeof talentTreeSchema>;

/** Level -> points rule. available(level) = clamp(0, (level - firstTalentLevel + 1) * pointsPerLevel, maxPoints). */
export const talentRulesSchema = z.object({
  firstTalentLevel: z.number().int().min(1),
  maxLevel: z.number().int().min(1),
  pointsPerLevel: z.number().int().min(1).default(1),
  maxPoints: z.number().int().min(1),
});
export type TalentRules = z.infer<typeof talentRulesSchema>;

export const classTalentsSchema = z.object({
  classId: z.string().min(1),
  gameVersion: z.string().min(1),
  rules: talentRulesSchema,
  trees: z.array(talentTreeSchema).min(1),
  demo: z.boolean().default(false),
  provenance: provenanceSchema,
});
export type ClassTalents = z.infer<typeof classTalentsSchema>;

export const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const buildSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: localizedTextSchema,
  summary: localizedTextSchema,
  classId: z.string().min(1),
  playstyle: playstyleSchema,
  difficulty: difficultySchema.default("beginner"),
  gameVersion: z.string().min(1),
  levelRange: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  scenario: localizedTextSchema.optional(),
  pros: z.array(localizedTextSchema).default([]),
  cons: z.array(localizedTextSchema).default([]),
  requirements: z.array(localizedTextSchema).default([]),
  /** nodeId -> points. Validated against the class talent data at load time. */
  allocation: z.record(z.string(), z.number().int().min(1)),
  /** Level-by-level spending order for the guide view. */
  levelingSteps: z
    .array(
      z.object({
        levelRange: z.string().min(1),
        spend: z.record(z.string(), z.number().int().min(1)),
        note: localizedTextSchema.optional(),
      }),
    )
    .default([]),
  updatedAt: isoDate,
  provenance: provenanceSchema,
});
export type Build = z.infer<typeof buildSchema>;

export const guideSectionSchema = z.object({
  heading: localizedTextSchema,
  body: localizedTextSchema,
});

export const guideSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: localizedTextSchema,
  description: localizedTextSchema,
  kind: z.enum(["starter", "leveling", "playstyle", "faq"]),
  classId: z.string().optional(),
  relatedBuilds: z.array(z.string()).default([]),
  sections: z.array(guideSectionSchema).min(1),
  updatedAt: isoDate,
  provenance: provenanceSchema,
});
export type Guide = z.infer<typeof guideSchema>;

export const selectorQuestionSchema = z.object({
  id: z.string().min(1),
  text: localizedTextSchema,
  options: z
    .array(
      z.object({
        id: z.string().min(1),
        text: localizedTextSchema,
        /** Weights keyed by class id; missing keys score 0. */
        weights: z.record(z.string(), z.number()),
      }),
    )
    .min(2),
});
export type SelectorQuestion = z.infer<typeof selectorQuestionSchema>;

export const selectorConfigSchema = z.object({
  questions: z.array(selectorQuestionSchema).min(1),
  /** How many recommendations to show. */
  resultCount: z.number().int().min(1).max(5).default(3),
});
export type SelectorConfig = z.infer<typeof selectorConfigSchema>;
