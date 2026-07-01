import { SearchResult } from '@menu-scanner/shared';
import { pool } from '../config/db';
import { fuzzyMatchDishes } from '../utils/fuzzyMatch';
import { mapDishRow } from '../utils/mappers';

export async function searchDishes(query: string, limit = 20): Promise<SearchResult[]> {
  const matches = await fuzzyMatchDishes(pool, query, limit);
  return matches.map((m) => ({
    dish: mapDishRow(m.row),
    matchType: m.matchType,
    score: m.score,
  }));
}
