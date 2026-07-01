import { Alternative, Dish } from '@menu-scanner/shared';
import { pool } from '../config/db';
import { DishRow, mapDishRow } from '../utils/mappers';

const MIN_ALTERNATIVES = 3;
const MAX_ALTERNATIVES = 5;
const MIN_CALORIE_SAVINGS = 50;

/**
 * Alternatives are pure DB logic (no AI adapter needed, real or stub):
 * lower-calorie dishes from the same category, ranked by savings.
 */
export async function getAlternatives(dish: Dish): Promise<Alternative[]> {
  if (!dish.category) return [];

  const { rows } = await pool.query<DishRow>(
    `SELECT * FROM dishes
     WHERE category = $1 AND id != $2 AND calories_estimate < $3
     ORDER BY calories_estimate ASC
     LIMIT $4`,
    [dish.category, dish.id, dish.nutrition.caloriesEstimate, MAX_ALTERNATIVES]
  );

  return rows
    .map((row) => {
      const altDish = mapDishRow(row);
      return {
        dish: altDish,
        estimatedCaloriesSaved: dish.nutrition.caloriesEstimate - altDish.nutrition.caloriesEstimate,
      };
    })
    .filter((alt) => alt.estimatedCaloriesSaved >= MIN_CALORIE_SAVINGS)
    .slice(0, Math.max(MIN_ALTERNATIVES, MAX_ALTERNATIVES));
}
