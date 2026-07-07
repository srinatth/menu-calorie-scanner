import { Allergen, AllergenCertainty, AllergenType, Dish, EstimationDifficulty } from '@menu-scanner/shared';
import { pool } from '../../config/db';
import { mapDishRow, DishRow } from '../../utils/mappers';
import { openrouterChat } from '../../utils/openrouter';
import { logger } from '../../utils/logger';
import { resolveFromSeed } from './seedResolution';
import { NutritionEstimateInput, NutritionEstimateResult, NutritionEstimatorAdapter } from './nutritionEstimator.interface';

// LLM estimates are inherently less certain than curated seed data, so they
// carry a fixed modest confidence rather than a fabricated high one.
const ESTIMATE_CONFIDENCE_PCT = 55;

const SYSTEM_INSTRUCTION = [
  'You are a nutrition estimator for Indian restaurant dishes.',
  'Given a dish name, estimate the nutrition for ONE typical restaurant serving.',
  'Respond with ONLY a JSON object (no prose, no code fences) with exactly these keys:',
  'caloriesEstimate (integer), caloriesMin (integer), caloriesMax (integer),',
  'proteinG (number), carbsG (number), fatG (number), fiberG (number),',
  'servingSizeDesc (string), estimationDifficulty (one of "easy","medium","hard"),',
  'commonIngredients (array of strings), ingredientsNote (string),',
  'allergens (array of objects {type: one of "dairy","gluten","nuts","soy","egg","shellfish", certainty: "definite" or "possible"}),',
  'healthScore (number 1-10), healthScoreReasons (array of strings),',
  'cuisineRegion (string), category (string). All values are estimates.',
].join(' ');

const ALLERGEN_TYPES: AllergenType[] = ['dairy', 'gluten', 'nuts', 'soy', 'egg', 'shellfish'];
const DIFFICULTIES: EstimationDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * AI nutrition estimator (RAG-lite): first tries the seed `dishes` table via the
 * shared fuzzy matcher — a confident hit returns curated, real nutrition data
 * for free. Only on a miss does it ask an LLM (via OpenRouter) to estimate the
 * dish from its name, then persists that estimate as a real `dishes` row
 * (source='ai_estimate', distinct from seed-curated 'llm_estimate' rows) so it
 * satisfies the detected_dishes -> dishes foreign key, dedupes across scans by
 * slug, and works everywhere a seed dish does.
 *
 * Any LLM/parse/DB failure degrades to a graceful "unresolved" result rather
 * than throwing, so a single problem dish (e.g. a transient free-tier 429) never
 * fails the whole menu-scan pipeline.
 */
export class OpenRouterNutritionEstimatorAdapter implements NutritionEstimatorAdapter {
  async estimate(input: NutritionEstimateInput): Promise<NutritionEstimateResult> {
    const seed = await resolveFromSeed(input.dishName);
    if (seed.resolved) {
      return { status: 'resolved', dish: seed.resolved.dish, confidencePct: seed.resolved.confidencePct };
    }

    try {
      const text = await openrouterChat([
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: input.restaurantContext ? `${input.dishName} (at ${input.restaurantContext})` : input.dishName },
      ]);
      const dish = await this.persistEstimate(input.dishName, parseEstimate(text));
      return { status: 'resolved', dish, confidencePct: ESTIMATE_CONFIDENCE_PCT };
    } catch (err) {
      logger.error('OpenRouter nutrition estimate failed', { dishName: input.dishName, error: (err as Error).message });
      return {
        status: 'unresolved',
        message: "We couldn't confidently identify this dish. Please try another spelling or choose from similar matches.",
        suggestions: seed.suggestions,
      };
    }
  }

  private async persistEstimate(dishName: string, est: ParsedEstimate): Promise<Dish> {
    const slug = slugify(dishName);
    const { rows } = await pool.query<DishRow>(
      `
      INSERT INTO dishes (
        canonical_name, slug, cuisine_region, category,
        calories_min, calories_max, calories_estimate,
        protein_g, carbs_g, fat_g, fiber_g,
        serving_size_desc, estimation_difficulty, confidence_pct,
        common_ingredients, ingredients_note, allergens,
        health_score, health_score_reasons, is_seed_data, source
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14,
        $15, $16, $17::jsonb,
        $18, $19, false, 'ai_estimate'
      )
      ON CONFLICT (slug) DO UPDATE SET
        cuisine_region = EXCLUDED.cuisine_region,
        category = EXCLUDED.category,
        calories_min = EXCLUDED.calories_min,
        calories_max = EXCLUDED.calories_max,
        calories_estimate = EXCLUDED.calories_estimate,
        protein_g = EXCLUDED.protein_g,
        carbs_g = EXCLUDED.carbs_g,
        fat_g = EXCLUDED.fat_g,
        fiber_g = EXCLUDED.fiber_g,
        serving_size_desc = EXCLUDED.serving_size_desc,
        estimation_difficulty = EXCLUDED.estimation_difficulty,
        confidence_pct = EXCLUDED.confidence_pct,
        common_ingredients = EXCLUDED.common_ingredients,
        ingredients_note = EXCLUDED.ingredients_note,
        allergens = EXCLUDED.allergens,
        health_score = EXCLUDED.health_score,
        health_score_reasons = EXCLUDED.health_score_reasons,
        updated_at = now()
      RETURNING *
      `,
      [
        dishName,
        slug,
        est.cuisineRegion,
        est.category,
        est.caloriesMin,
        est.caloriesMax,
        est.caloriesEstimate,
        est.proteinG,
        est.carbsG,
        est.fatG,
        est.fiberG,
        est.servingSizeDesc,
        est.estimationDifficulty,
        ESTIMATE_CONFIDENCE_PCT,
        est.commonIngredients,
        est.ingredientsNote,
        JSON.stringify(est.allergens),
        est.healthScore,
        est.healthScoreReasons,
      ]
    );

    return mapDishRow(rows[0]);
  }
}

interface ParsedEstimate {
  caloriesEstimate: number;
  caloriesMin: number;
  caloriesMax: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingSizeDesc: string;
  estimationDifficulty: EstimationDifficulty;
  commonIngredients: string[];
  ingredientsNote: string;
  allergens: Allergen[];
  healthScore: number;
  healthScoreReasons: string[];
  cuisineRegion: string | null;
  category: string | null;
}

/**
 * Free-tier models don't reliably honor a strict JSON response, so pull the
 * first JSON object out of the reply and coerce every field with a safe default
 * — a partial or oddly-typed field never breaks the estimate.
 */
function parseEstimate(text: string): ParsedEstimate {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`OpenRouter did not return a JSON object: ${text.slice(0, 200)}`);
  }
  const raw = JSON.parse(match[0]) as Record<string, unknown>;

  const caloriesEstimate = int(raw.caloriesEstimate, 250);
  return {
    caloriesEstimate,
    caloriesMin: int(raw.caloriesMin, Math.round(caloriesEstimate * 0.85)),
    caloriesMax: int(raw.caloriesMax, Math.round(caloriesEstimate * 1.15)),
    proteinG: num(raw.proteinG, 0),
    carbsG: num(raw.carbsG, 0),
    fatG: num(raw.fatG, 0),
    fiberG: num(raw.fiberG, 0),
    servingSizeDesc: str(raw.servingSizeDesc, 'Typical restaurant serving'),
    estimationDifficulty: DIFFICULTIES.includes(raw.estimationDifficulty as EstimationDifficulty)
      ? (raw.estimationDifficulty as EstimationDifficulty)
      : 'hard',
    commonIngredients: strArray(raw.commonIngredients),
    ingredientsNote: str(raw.ingredientsNote, 'AI-estimated; actual ingredients vary by restaurant.'),
    allergens: parseAllergens(raw.allergens),
    healthScore: clamp(num(raw.healthScore, 5), 1, 10),
    healthScoreReasons: strArray(raw.healthScoreReasons),
    cuisineRegion: optionalStr(raw.cuisineRegion),
    category: optionalStr(raw.category),
  };
}

function parseAllergens(value: unknown): Allergen[] {
  if (!Array.isArray(value)) return [];
  const result: Allergen[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const type = (entry as Record<string, unknown>).type;
    const certainty = (entry as Record<string, unknown>).certainty;
    if (ALLERGEN_TYPES.includes(type as AllergenType)) {
      result.push({
        type: type as AllergenType,
        certainty: (certainty === 'definite' || certainty === 'possible' ? certainty : 'possible') as AllergenCertainty,
      });
    }
  }
  return result;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function int(v: unknown, fallback: number): number {
  return Math.round(num(v, fallback));
}
function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}
function optionalStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}
function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'dish';
}
