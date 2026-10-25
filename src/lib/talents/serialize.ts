import { z } from "zod";
import type { BuildState } from "./engine";

const SHARE_VERSION = 1;
/** Hard cap on encoded share strings to bound URLs and decoding cost. */
export const MAX_SHARE_LENGTH = 2000;

const payloadSchema = z.object({
  v: z.literal(SHARE_VERSION),
  gv: z.string().min(1).max(64),
  c: z.string().regex(/^[a-z0-9-]+$/).max(64),
  l: z.number().int().min(1).max(255),
  p: z
    .array(z.tuple([z.string().regex(/^[a-z0-9-]+$/).max(64), z.number().int().min(1).max(10)]))
    .max(200),
});

type SharePayload = z.infer<typeof payloadSchema>;

export interface ShareResult {
  state: BuildState;
  gameVersion: string;
}

function toBase64Url(text: string): string {
  const b64 =
    typeof btoa === "function"
      ? btoa(text)
      : Buffer.from(text, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): string {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  if (typeof atob === "function") return atob(padded);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function encodeBuild(state: BuildState, gameVersion: string): string {
  const payload: SharePayload = {
    v: SHARE_VERSION,
    gv: gameVersion,
    c: state.classId,
    l: state.level,
    p: Object.entries(state.points)
      .filter(([, pts]) => pts > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, pts]) => [id, pts]),
  };
  return toBase64Url(JSON.stringify(payload));
}

/**
 * Decode a share string. Returns null for ANY malformed input so callers can
 * fall back to an empty build - never throws, never executes input.
 */
export function decodeBuild(encoded: string | null | undefined): ShareResult | null {
  if (!encoded || encoded.length > MAX_SHARE_LENGTH) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  let json: unknown;
  try {
    json = JSON.parse(fromBase64Url(encoded));
  } catch {
    return null;
  }
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) return null;
  const { c, l, p, gv } = parsed.data;
  const points: Record<string, number> = {};
  for (const [id, pts] of p) {
    if (points[id] !== undefined) return null; // duplicate node ids are invalid
    points[id] = pts;
  }
  return { state: { classId: c, level: l, points }, gameVersion: gv };
}

/** Human-readable single-line summary for "copy summary". */
export function buildSummaryText(
  state: BuildState,
  nodeNames: (nodeId: string) => string | undefined,
): string {
  const parts = Object.entries(state.points)
    .filter(([, pts]) => pts > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, pts]) => `${nodeNames(id) ?? id} ${pts}`);
  return `${state.classId} Lv${state.level}: ${parts.join(", ") || "-"}`;
}
