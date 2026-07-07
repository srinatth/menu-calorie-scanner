import { resolveFromSeed } from './seedResolution';
import { NutritionEstimateInput, NutritionEstimateResult, NutritionEstimatorAdapter } from './nutritionEstimator.interface';

/**
 * Deterministic stand-in for an AI nutrition-estimation call. Resolves the
 * dish name against the seed `dishes` table via the shared trigram/synonym
 * fuzzy match — on a confident hit it returns that seed row's real nutrition
 * data; otherwise it returns a graceful "unresolved" result with fuzzy-match
 * suggestions, exactly like a real AI estimator would when it can't confidently
 * identify a restaurant-specific dish.
 */
export class StubNutritionEstimatorAdapter implements NutritionEstimatorAdapter {
  async estimate(input: NutritionEstimateInput): Promise<NutritionEstimateResult> {
    const { resolved, suggestions } = await resolveFromSeed(input.dishName);

    if (resolved) {
      return { status: 'resolved', dish: resolved.dish, confidencePct: resolved.confidencePct };
    }

    return {
      status: 'unresolved',
      message: "We couldn't confidently identify this dish. Please try another spelling or choose from similar matches.",
      suggestions,
    };
  }
}
