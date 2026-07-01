import { createJob } from './job.service';
import { updateJobStatus } from './job.service';
import { processMenuScanFile, processMenuScanText } from './menuParsing.service';
import { logger } from '../utils/logger';

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|p|div|li|tr|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Given a decoded QR payload (expected to be a URL), fetches it, sniffs
 * content-type, and hands off to the same menu-analysis pipeline used for
 * direct uploads. HTML menus skip OCR entirely (text is already text);
 * PDF/image menus reuse the file pipeline (OCR stub/real).
 */
export async function resolveQrMenu(qrPayload: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(qrPayload);
  } catch {
    throw new Error('QR payload is not a valid URL');
  }

  const jobId = await createJob('qr_url', url.toString());

  void processQrJob(jobId, url).catch((err) => {
    logger.error('QR menu resolution failed', { jobId, error: (err as Error).message });
  });

  return jobId;
}

async function processQrJob(jobId: string, url: URL): Promise<void> {
  const response = await fetch(url.toString());
  if (!response.ok) {
    await updateJobStatus(jobId, 'failed', { errorMessage: `Failed to fetch QR menu URL (status ${response.status})` });
    return;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const buffer = Buffer.from(await response.arrayBuffer());

  if (contentType.includes('text/html')) {
    const text = stripHtmlToText(buffer.toString('utf-8'));
    await processMenuScanText(jobId, text);
  } else if (contentType.includes('application/pdf')) {
    await processMenuScanFile(jobId, buffer, 'application/pdf');
  } else if (contentType.startsWith('image/')) {
    await processMenuScanFile(jobId, buffer, contentType);
  } else {
    // Unknown content type — best effort, treat as HTML/text.
    const text = stripHtmlToText(buffer.toString('utf-8'));
    await processMenuScanText(jobId, text);
  }
}
