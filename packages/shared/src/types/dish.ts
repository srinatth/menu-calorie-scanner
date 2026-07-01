export type EstimationDifficulty = 'easy' | 'medium' | 'hard';

export type AllergenType = 'dairy' | 'gluten' | 'nuts' | 'soy' | 'egg' | 'shellfish';
export type AllergenCertainty = 'definite' | 'possible';

export interface Allergen {
  type: AllergenType;
  certainty: AllergenCertainty;
}

export interface NutritionEstimate {
  caloriesEstimate: number;
  caloriesMin: number;
  caloriesMax: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingSizeDesc: string;
  estimationDifficulty: EstimationDifficulty;
  confidencePct: number;
}

export interface HealthRating {
  score: number; // 1-10
  reasons: string[];
}

export interface Alternative {
  dish: Dish;
  estimatedCaloriesSaved: number;
}

export interface Dish {
  id: string;
  canonicalName: string;
  slug: string;
  cuisineRegion: string | null;
  category: string | null;
  nutrition: NutritionEstimate;
  commonIngredients: string[];
  ingredientsNote: string;
  allergens: Allergen[];
  healthRating: HealthRating;
  isSeedData: boolean;
  source: string;
}

export interface DishDetail extends Dish {
  alternatives: Alternative[];
}

export interface UnresolvedDish {
  status: 'unresolved';
  rawQuery: string;
  message: string;
  suggestions: Dish[];
}
