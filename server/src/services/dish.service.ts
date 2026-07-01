import { DishDetail } from '@menu-scanner/shared';
import { pool } from '../config/db';
import { DishRow, mapDishRow } from '../utils/mappers';
import { getAlternatives } from './healthScore.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getDishByIdOrSlug(idOrSlug: string): Promise<DishDetail | null> {
  const column = UUID_RE.test(idOrSlug) ? 'id' : 'slug';
  const { rows } = await pool.query<DishRow>(`SELECT * FROM dishes WHERE ${column} = $1 LIMIT 1`, [idOrSlug]);

  if (rows.length === 0) return null;

  const dish = mapDishRow(rows[0]);
  const alternatives = await getAlternatives(dish);

  return { ...dish, alternatives };
}
