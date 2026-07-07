import { pool } from '../config/db';
import { env } from '../config/env';
import { getNutritionEstimatorAdapter } from '../adapters/nutrition';
import { NutritionEstimateResult } from '../adapters/nutrition/nutritionEstimator.interface';

function buildCacheKey(dishName: string, restaurantContext?: string): string {
  const base = dishName.trim().toLowerCase();
  const ctx = restaurantContext?.trim().toLowerCase();
  return ctx ? `${base}::${ctx}` : base;
}

async function getCached(cacheKey: string): Promise<NutritionEstimateResult | null> {
  const { rows } = await pool.query<{ result_json: NutritionEstimateResult }>(
    `SELECT result_json FROM ai_estimation_cache WHERE cache_key = $1 LIMIT 1`,
    [cacheKey]
  );
  if (rows.length === 0) return null;

  await pool.query(
    `UPDATE ai_estimation_cache SET hit_count = hit_count + 1, last_accessed_at = now() WHERE cache_key = $1`,
    [cacheKey]
  );
  return rows[0].result_json;
}

async function setCached(
  cacheKey: string,
  dishNameRaw: string,
  restaurantContext: string | undefined,
  result: NutritionEstimateResult
): Promise<void> {
  const confidencePct = result.status === 'resolved' ? result.confidencePct : null;
  await pool.query(
    `INSERT INTO ai_estimation_cache (cache_key, dish_name_raw, restaurant_context, provider, result_json, confidence_pct)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (cache_key) DO UPDATE
       SET result_json = EXCLUDED.result_json,
           confidence_pct = EXCLUDED.confidence_pct,
           last_accessed_at = now(),
           hit_count = ai_estimation_cache.hit_count + 1`,
    [cacheKey, dishNameRaw, restaurantContext ?? null, env.NUTRITION_PROVIDER, JSON.stringify(result), confidencePct]
  );
}

export async function estimateNutrition(
  dishName: string,
  restaurantContext?: string
): Promise<NutritionEstimateResult> {
  const cacheKey = buildCacheKey(dishName, restaurantContext);

  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const adapter = getNutritionEstimatorAdapter();
  const result = await adapter.estimate({ dishName, restaurantContext });

  // Only cache confident resolutions. An 'unresolved' result can be transient
  // (e.g. a free-tier LLM 429 in the OpenRouter estimator), and caching it would
  // pin the failure so future scans never retry the dish.
  if (result.status === 'resolved') {
    await setCached(cacheKey, dishName, restaurantContext, result);
  }
  return result;
}
