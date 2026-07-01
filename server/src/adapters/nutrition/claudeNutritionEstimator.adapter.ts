import { NutritionEstimateInput, NutritionEstimateResult, NutritionEstimatorAdapter } from './nutritionEstimator.interface';

/**
 * Scaffolded for later use — not wired to a real Claude API call yet.
 * Fill in with an Anthropic SDK call when NUTRITION_PROVIDER=claude is selected.
 * Suggested approach (RAG-lite): first try the same seed-data fuzzy match as the
 * stub; if confident, ground the AI response in that reference row. If no
 * confident match, ask Claude to estimate from the dish name/ingredients alone
 * and mark the result as AI-estimated with a lower confidence score. Return the
 * same NutritionEstimateResult shape as the stub.
 */
export class ClaudeNutritionEstimatorAdapter implements NutritionEstimatorAdapter {
  async estimate(_input: NutritionEstimateInput): Promise<NutritionEstimateResult> {
    throw new Error('ClaudeNutritionEstimatorAdapter is not configured. Set ANTHROPIC_API_KEY and implement estimate().');
  }
}
