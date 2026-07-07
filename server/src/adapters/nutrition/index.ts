import { env } from '../../config/env';
import { NutritionEstimatorAdapter } from './nutritionEstimator.interface';
import { StubNutritionEstimatorAdapter } from './stubNutritionEstimator.adapter';
import { ClaudeNutritionEstimatorAdapter } from './claudeNutritionEstimator.adapter';
import { OpenRouterNutritionEstimatorAdapter } from './openrouterNutritionEstimator.adapter';

let instance: NutritionEstimatorAdapter | null = null;

export function getNutritionEstimatorAdapter(): NutritionEstimatorAdapter {
  if (!instance) {
    switch (env.NUTRITION_PROVIDER) {
      case 'claude':
        instance = new ClaudeNutritionEstimatorAdapter();
        break;
      case 'openrouter':
        instance = new OpenRouterNutritionEstimatorAdapter();
        break;
      default:
        instance = new StubNutritionEstimatorAdapter();
    }
  }
  return instance;
}

export type { NutritionEstimatorAdapter, NutritionEstimateInput, NutritionEstimateResult } from './nutritionEstimator.interface';
