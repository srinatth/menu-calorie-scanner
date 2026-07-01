import { Dish } from '@menu-scanner/shared';
import { pool } from '../config/db';
import { DishRow, mapDishRow } from '../utils/mappers';

export async function getPopularDishes(): Promise<Dish[]> {
  const { rows } = await pool.query<DishRow>(
    `SELECT d.* FROM popular_dishes p
     JOIN dishes d ON d.id = p.dish_id
     WHERE p.is_active = true
     ORDER BY p.rank_order ASC`
  );
  return rows.map(mapDishRow);
}
