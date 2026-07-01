import { Dish } from '@menu-scanner/shared';

export interface NutritionEstimateInput {
  dishName: string;
  restaurantContext?: string;
  detectedIngredients?: string[];
}

export type NutritionEstimateResult =
  | { status: 'resolved'; dish: Dish; confidencePct: number }
  | { status: 'unresolved'; message: string; suggestions: Dish[] };

export interface NutritionEstimatorAdapter {
  estimate(input: NutritionEstimateInput): Promise<NutritionEstimateResult>;
}
