import fs from 'node:fs';
import path from 'node:path';
import { pool } from '../config/db';
import { logger } from '../utils/logger';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await pool.query<{ name: string }>('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

async function runMigrations() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      logger.info('Skipping already-applied migration', { file });
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info('Applied migration', { file });
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Migration failed', { file, error: (err as Error).message });
      throw err;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

runMigrations().catch((err) => {
  logger.error('Migration run aborted', { error: (err as Error).message });
  process.exit(1);
});
