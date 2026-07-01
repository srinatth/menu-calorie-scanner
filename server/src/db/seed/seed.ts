import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../../config/db';
import { logger } from '../../utils/logger';

interface SeedSynonym {
  synonym: string;
  synonymType: 'abbreviation' | 'misspelling' | 'regional_name' | 'alt_name';
}

interface SeedDish {
  slug: string;
  canonicalName: string;
  cuisineRegion: string;
  category: string;
  caloriesMin: number;
  caloriesMax: number;
  caloriesEstimate: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  servingSizeDesc: string;
  estimationDifficulty: 'easy' | 'medium' | 'hard';
  confidencePct: number;
  commonIngredients: string[];
  allergens: Array<{ type: string; certainty: string }>;
  healthScore: number;
  healthScoreReasons: string[];
  source: string;
  synonyms: SeedSynonym[];
}

interface SeedData {
  popularDishSlugs: string[];
  dishes: SeedDish[];
}

async function seed() {
  const dataPath = path.join(__dirname, 'data', 'indian-dishes-seed.json');
  const seedData: SeedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE detected_dishes, menu_scan_jobs, ai_estimation_cache, popular_dishes, dish_synonyms, dishes RESTART IDENTITY CASCADE');

    const slugToId = new Map<string, string>();

    for (const dish of seedData.dishes) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO dishes (
          canonical_name, slug, cuisine_region, category,
          calories_min, calories_max, calories_estimate,
          protein_g, carbs_g, fat_g, fiber_g,
          serving_size_desc, estimation_difficulty, confidence_pct,
          common_ingredients, allergens, health_score, health_score_reasons,
          is_seed_data, source
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,true,$19)
        RETURNING id`,
        [
          dish.canonicalName,
          dish.slug,
          dish.cuisineRegion,
          dish.category,
          dish.caloriesMin,
          dish.caloriesMax,
          dish.caloriesEstimate,
          dish.proteinG,
          dish.carbsG,
          dish.fatG,
          dish.fiberG,
          dish.servingSizeDesc,
          dish.estimationDifficulty,
          dish.confidencePct,
          dish.commonIngredients,
          JSON.stringify(dish.allergens),
          dish.healthScore,
          dish.healthScoreReasons,
          dish.source,
        ]
      );
      const dishId = rows[0].id;
      slugToId.set(dish.slug, dishId);

      for (const syn of dish.synonyms) {
        await client.query(
          `INSERT INTO dish_synonyms (dish_id, synonym, synonym_type) VALUES ($1, $2, $3)`,
          [dishId, syn.synonym, syn.synonymType]
        );
      }
    }

    let rank = 1;
    for (const slug of seedData.popularDishSlugs) {
      const dishId = slugToId.get(slug);
      if (!dishId) {
        logger.warn('Popular dish slug not found among seeded dishes', { slug });
        continue;
      }
      await client.query(
        `INSERT INTO popular_dishes (dish_id, rank_order, is_active) VALUES ($1, $2, true)`,
        [dishId, rank]
      );
      rank += 1;
    }

    await client.query('COMMIT');
    logger.info('Seed complete', { dishCount: seedData.dishes.length, popularCount: seedData.popularDishSlugs.length });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Seed failed', { error: (err as Error).message });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
