import { pool } from '../../config/db';
import { fuzzyMatchDishes } from '../../utils/fuzzyMatch';
import { mapDishRow } from '../../utils/mappers';
import { NutritionEstimateInput, NutritionEstimateResult, NutritionEstimatorAdapter } from './nutritionEstimator.interface';

const CONFIDENT_MATCH_THRESHOLD = 0.35;

/**
 * Deterministic stand-in for an AI nutrition-estimation call. Resolves the
 * dish name against the seed `dishes` table via the same trigram/synonym
 * fuzzy match used by search — on a confident hit it returns that seed row's
 * real nutrition data; otherwise it returns a graceful "unresolved" result
 * with fuzzy-match suggestions, exactly like a real AI estimator would when
 * it can't confidently identify a restaurant-specific dish.
 */
export class StubNutritionEstimatorAdapter implements NutritionEstimatorAdapter {
  async estimate(input: NutritionEstimateInput): Promise<NutritionEstimateResult> {
    const matches = await fuzzyMatchDishes(pool, input.dishName, 5);

    const best = matches[0];
    if (best && (best.matchType === 'exact_synonym' || best.score >= CONFIDENT_MATCH_THRESHOLD)) {
      return {
        status: 'resolved',
        dish: mapDishRow(best.row),
        confidencePct: best.matchType === 'exact_synonym' ? best.row.confidence_pct : Math.round(best.score * 100),
      };
    }

    return {
      status: 'unresolved',
      message: "We couldn't confidently identify this dish. Please try another spelling or choose from similar matches.",
      suggestions: matches.slice(0, 3).map((m) => mapDishRow(m.row)),
    };
  }
}
