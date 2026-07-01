import { pool } from '../config/db';
import { MenuScanSourceType, MenuScanJobStatus, DetectedDish } from '@menu-scanner/shared';
import { DishRow, mapDishRow } from '../utils/mappers';

interface JobRow {
  id: string;
  source_type: MenuScanSourceType;
  source_uri: string | null;
  status: MenuScanJobStatus;
  error_message: string | null;
  raw_ocr_text: string | null;
  detected_dish_count: number;
  created_at: string;
}

export async function createJob(sourceType: MenuScanSourceType, sourceUri?: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO menu_scan_jobs (source_type, source_uri) VALUES ($1, $2) RETURNING id`,
    [sourceType, sourceUri ?? null]
  );
  return rows[0].id;
}

export async function updateJobStatus(
  jobId: string,
  status: MenuScanJobStatus,
  fields?: { errorMessage?: string; rawOcrText?: string; detectedDishCount?: number }
): Promise<void> {
  const completedAt = status === 'completed' || status === 'failed' ? new Date() : null;
  await pool.query(
    `UPDATE menu_scan_jobs
     SET status = $2, error_message = $3, raw_ocr_text = COALESCE($4, raw_ocr_text),
         detected_dish_count = COALESCE($5, detected_dish_count), updated_at = now(),
         completed_at = COALESCE($6, completed_at)
     WHERE id = $1`,
    [jobId, status, fields?.errorMessage ?? null, fields?.rawOcrText ?? null, fields?.detectedDishCount ?? null, completedAt]
  );
}

export async function saveDetectedDishes(
  jobId: string,
  detected: Array<{ rawText: string; positionInMenu: number; matchedDishId: string | null; matchConfidencePct: number | null }>
): Promise<void> {
  for (const d of detected) {
    await pool.query(
      `INSERT INTO detected_dishes (job_id, raw_detected_text, matched_dish_id, match_confidence_pct, position_in_menu)
       VALUES ($1, $2, $3, $4, $5)`,
      [jobId, d.rawText, d.matchedDishId, d.matchConfidencePct, d.positionInMenu]
    );
  }
}

export async function getJob(jobId: string): Promise<{
  jobId: string;
  status: MenuScanJobStatus;
  sourceType: MenuScanSourceType;
  detectedDishCount: number;
  errorMessage: string | null;
  createdAt: string;
  detectedDishes: DetectedDish[];
} | null> {
  const { rows } = await pool.query<JobRow>(`SELECT * FROM menu_scan_jobs WHERE id = $1 LIMIT 1`, [jobId]);
  if (rows.length === 0) return null;
  const job = rows[0];

  const { rows: detectedRows } = await pool.query<{
    id: string;
    raw_detected_text: string;
    position_in_menu: number;
    match_confidence_pct: number | null;
    dish: DishRow | null;
  }>(
    `SELECT dd.id, dd.raw_detected_text, dd.position_in_menu, dd.match_confidence_pct,
            row_to_json(d.*) AS dish
     FROM detected_dishes dd
     LEFT JOIN dishes d ON d.id = dd.matched_dish_id
     WHERE dd.job_id = $1
     ORDER BY dd.position_in_menu ASC`,
    [jobId]
  );

  const detectedDishes: DetectedDish[] = detectedRows.map((row) => ({
    id: row.id,
    rawDetectedText: row.raw_detected_text,
    matchedDish: row.dish ? mapDishRow(row.dish) : null,
    matchConfidencePct: row.match_confidence_pct,
    positionInMenu: row.position_in_menu,
    unresolved: row.dish === null,
  }));

  return {
    jobId: job.id,
    status: job.status,
    sourceType: job.source_type,
    detectedDishCount: job.detected_dish_count,
    errorMessage: job.error_message,
    createdAt: job.created_at,
    detectedDishes,
  };
}
