import { Allergen, Dish } from '@menu-scanner/shared';

export interface DishRow {
  id: string;
  canonical_name: string;
  slug: string;
  cuisine_region: string | null;
  category: string | null;
  calories_min: number;
  calories_max: number;
  calories_estimate: number;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fiber_g: string;
  serving_size_desc: string;
  estimation_difficulty: 'easy' | 'medium' | 'hard';
  confidence_pct: number;
  common_ingredients: string[];
  ingredients_note: string;
  allergens: Allergen[];
  health_score: string;
  health_score_reasons: string[];
  is_seed_data: boolean;
  source: string;
}

export function mapDishRow(row: DishRow): Dish {
  return {
    id: row.id,
    canonicalName: row.canonical_name,
    slug: row.slug,
    cuisineRegion: row.cuisine_region,
    category: row.category,
    nutrition: {
      caloriesEstimate: row.calories_estimate,
      caloriesMin: row.calories_min,
      caloriesMax: row.calories_max,
      proteinG: Number(row.protein_g),
      carbsG: Number(row.carbs_g),
      fatG: Number(row.fat_g),
      fiberG: Number(row.fiber_g),
      servingSizeDesc: row.serving_size_desc,
      estimationDifficulty: row.estimation_difficulty,
      confidencePct: row.confidence_pct,
    },
    commonIngredients: row.common_ingredients,
    ingredientsNote: row.ingredients_note,
    allergens: row.allergens,
    healthRating: {
      score: Number(row.health_score),
      reasons: row.health_score_reasons,
    },
    isSeedData: row.is_seed_data,
    source: row.source,
  };
}
