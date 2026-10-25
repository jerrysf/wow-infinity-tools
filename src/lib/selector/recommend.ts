import type { GameClass, SelectorConfig } from "@/lib/data/schema";

export type Answers = Record<string, string>;

export interface Recommendation {
  classId: string;
  slug: string;
  score: number;
  /** Question/option ids that contributed to the score, for "why" display. */
  matched: { questionId: string; optionId: string; weight: number }[];
}

/**
 * Pure preference-matching recommender. Scores come entirely from the
 * data-driven question weights; the result is a preference match, never a
 * power ranking.
 */
export function recommend(
  answers: Answers,
  config: SelectorConfig,
  classes: GameClass[],
): Recommendation[] {
  const byId = new Map(classes.map((c) => [c.id, c]));
  const scores = new Map<string, Recommendation>();

  for (const question of config.questions) {
    const optionId = answers[question.id];
    if (!optionId) continue;
    const option = question.options.find((o) => o.id === optionId);
    if (!option) continue;
    for (const [classId, weight] of Object.entries(option.weights)) {
      if (weight === 0 || !byId.has(classId)) continue;
      const rec = scores.get(classId) ?? {
        classId,
        slug: byId.get(classId)!.slug,
        score: 0,
        matched: [],
      };
      rec.score += weight;
      if (weight > 0) {
        rec.matched.push({ questionId: question.id, optionId, weight });
      }
      scores.set(classId, rec);
    }
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug))
    .slice(0, config.resultCount);
}
