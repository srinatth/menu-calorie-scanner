import { Dish } from '@menu-scanner/shared';
import { pool } from '../../config/db';
import { fuzzyMatchDishes } from '../../utils/fuzzyMatch';
import { mapDishRow } from '../../utils/mappers';

// word_similarity rewards partial overlap, so distinct dishes that merely share
// or contain a word score deceptively high — "Avakai Paneer Tikka" -> "Paneer
// Tikka" (0.65), "French Fries" -> "Idli Fries" (0.55), "Kothu Parotta" ->
// "Malabar Paratha" (0.57). On real menus these produce both wrong matches and
// *duplicates* (several distinct menu items collapsing onto one seed dish).
// Measured on a real 30-dish menu, genuine matches (same dish, OCR noise) scored
// 0.85-1.0 while every false collapse scored <=0.79, so 0.8 is the clean cut. It
// can be this aggressive because a rejected match no longer means "wrong dish":
// under NUTRITION_PROVIDER=openrouter it falls through to a per-dish LLM estimate
// (its own correct entry), and exact synonym matches always resolve regardless.
export const CONFIDENT_MATCH_THRESHOLD = 0.8;

export interface SeedResolution {
  resolved: { dish: Dish; confidencePct: number } | null;
  suggestions: Dish[];
}

/**
 * Resolves a dish name against the seed `dishes` table via the shared trigram/
 * synonym fuzzy matcher. Returns a confident match (exact synonym, or fuzzy
 * score over the threshold) plus the top fuzzy candidates as suggestions.
 * Shared by the stub and OpenRouter nutrition estimators so seed data stays the
 * authoritative, free first pass before any AI fallback.
 */
export async function resolveFromSeed(dishName: string): Promise<SeedResolution> {
  const matches = await fuzzyMatchDishes(pool, dishName, 5);
  const best = matches[0];

  const isConfident = best && (best.matchType === 'exact_synonym' || best.score >= CONFIDENT_MATCH_THRESHOLD);

  return {
    resolved: isConfident
      ? {
          dish: mapDishRow(best.row),
          confidencePct: best.matchType === 'exact_synonym' ? best.row.confidence_pct : Math.round(best.score * 100),
        }
      : null,
    suggestions: matches.slice(0, 3).map((m) => mapDishRow(m.row)),
  };
}
