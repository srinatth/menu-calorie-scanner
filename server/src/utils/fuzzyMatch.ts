import { Pool } from 'pg';
import { DishRow } from './mappers';

const SIMILARITY_THRESHOLD = 0.4;

export interface FuzzyMatch {
  row: DishRow;
  score: number;
  matchType: 'exact_synonym' | 'fuzzy';
}

/**
 * Trigram (pg_trgm) fuzzy + synonym search against the `dishes` reference table.
 * Shared by search.service.ts (user-facing search) and the stub nutrition
 * estimator adapter (resolving detected/typed dish names against seed data),
 * so both paths behave identically.
 */
export async function fuzzyMatchDishes(pool: Pool, query: string, limit = 20): Promise<FuzzyMatch[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const { rows } = await pool.query(
    `
    WITH matches AS (
      SELECT d.id AS dish_id,
             word_similarity($1, d.canonical_name) AS score,
             (lower(d.canonical_name) = $1) AS is_exact
      FROM dishes d
      WHERE word_similarity($1, d.canonical_name) > $3 OR lower(d.canonical_name) = $1
      UNION ALL
      SELECT ds.dish_id AS dish_id,
             word_similarity($1, ds.synonym) AS score,
             (lower(ds.synonym) = $1) AS is_exact
      FROM dish_synonyms ds
      WHERE word_similarity($1, ds.synonym) > $3 OR lower(ds.synonym) = $1
    ),
    ranked AS (
      SELECT dish_id,
             MAX(score) AS score,
             BOOL_OR(is_exact) AS is_exact
      FROM matches
      GROUP BY dish_id
    )
    SELECT d.*, r.score AS match_score, r.is_exact AS is_exact_match
    FROM ranked r
    JOIN dishes d ON d.id = r.dish_id
    ORDER BY r.is_exact DESC, r.score DESC
    LIMIT $2
    `,
    [normalized, limit, SIMILARITY_THRESHOLD]
  );

  return rows.map((row) => ({
    row: row as DishRow,
    score: Number(row.match_score),
    matchType: row.is_exact_match ? 'exact_synonym' : 'fuzzy',
  }));
}
