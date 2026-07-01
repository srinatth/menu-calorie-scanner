import { env } from '../../config/env';
import { NutritionEstimatorAdapter } from './nutritionEstimator.interface';
import { StubNutritionEstimatorAdapter } from './stubNutritionEstimator.adapter';
import { ClaudeNutritionEstimatorAdapter } from './claudeNutritionEstimator.adapter';

let instance: NutritionEstimatorAdapter | null = null;

export function getNutritionEstimatorAdapter(): NutritionEstimatorAdapter {
  if (!instance) {
    instance = env.NUTRITION_PROVIDER === 'claude' ? new ClaudeNutritionEstimatorAdapter() : new StubNutritionEstimatorAdapter();
  }
  return instance;
}

export type { NutritionEstimatorAdapter, NutritionEstimateInput, NutritionEstimateResult } from './nutritionEstimator.interface';
