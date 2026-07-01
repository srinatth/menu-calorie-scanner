import { getOcrAdapter } from '../adapters/ocr';
import { getMenuUnderstandingAdapter } from '../adapters/ai';
import { cleanMenuText } from '../utils/textCleaning';
import { logger } from '../utils/logger';
import { updateJobStatus, saveDetectedDishes } from './job.service';
import { estimateNutrition } from './nutritionEstimation.service';

/**
 * Orchestrates: raw file bytes -> OCR -> clean text -> AI dish-name detection
 * -> resolve each candidate against the `dishes` reference table -> persist.
 * Runs asynchronously; the job row is the source of truth for progress, polled
 * via GET /api/v1/menu-scans/:jobId.
 */
export async function processMenuScanFile(jobId: string, buffer: Buffer, mimeType: string): Promise<void> {
  try {
    await updateJobStatus(jobId, 'ocr_in_progress');
    const ocr = await getOcrAdapter().extractText({ buffer, mimeType });

    await updateJobStatus(jobId, 'ai_analysis_in_progress', { rawOcrText: ocr.rawText });
    await resolveAndSaveDishes(jobId, ocr.rawText);
  } catch (err) {
    logger.error('Menu scan pipeline failed', { jobId, error: (err as Error).message });
    await updateJobStatus(jobId, 'failed', { errorMessage: (err as Error).message });
  }
}

/**
 * Same pipeline but starting from already-extracted text (used by the QR/HTML
 * path, which skips OCR entirely since the source is already text).
 */
export async function processMenuScanText(jobId: string, rawText: string): Promise<void> {
  try {
    await updateJobStatus(jobId, 'ai_analysis_in_progress', { rawOcrText: rawText });
    await resolveAndSaveDishes(jobId, rawText);
  } catch (err) {
    logger.error('Menu scan pipeline failed', { jobId, error: (err as Error).message });
    await updateJobStatus(jobId, 'failed', { errorMessage: (err as Error).message });
  }
}

async function resolveAndSaveDishes(jobId: string, rawText: string): Promise<void> {
  const cleanedLines = cleanMenuText(rawText);
  const candidates = await getMenuUnderstandingAdapter().detectDishNames(cleanedLines);

  const detected = [];
  for (const candidate of candidates) {
    // Routed through the same cache-aside nutrition estimator used for direct
    // dish lookups, so repeated dish names (common on real menus, e.g. "Naan"
    // appearing in multiple sections) hit the cache instead of re-resolving.
    const result = await estimateNutrition(candidate.rawText);

    detected.push({
      rawText: candidate.rawText,
      positionInMenu: candidate.positionInMenu,
      matchedDishId: result.status === 'resolved' ? result.dish.id : null,
      matchConfidencePct: result.status === 'resolved' ? result.confidencePct : null,
    });
  }

  await saveDetectedDishes(jobId, detected);
  await updateJobStatus(jobId, 'completed', { detectedDishCount: detected.length });
}
