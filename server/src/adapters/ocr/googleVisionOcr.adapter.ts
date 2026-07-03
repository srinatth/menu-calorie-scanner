import { env } from '../../config/env';
import { OcrAdapter, OcrResult } from './ocr.interface';

const VISION_ENDPOINT = 'https://vision.googleapis.com/v1/images:annotate';

interface VisionAnnotateResponse {
  responses?: Array<{
    fullTextAnnotation?: { text: string };
    error?: { message: string };
  }>;
}

/**
 * Calls the Google Cloud Vision REST API directly with a plain API key
 * (rather than the @google-cloud/vision SDK, which expects a service-account
 * credential) — matches the GOOGLE_VISION_API_KEY env var already scaffolded
 * for this project. DOCUMENT_TEXT_DETECTION is used over TEXT_DETECTION
 * because it's tuned for dense, structured text like a menu rather than
 * sparse text in a photo.
 */
export class GoogleVisionOcrAdapter implements OcrAdapter {
  async extractText(input: { buffer: Buffer; mimeType: string }): Promise<OcrResult> {
    if (!env.GOOGLE_VISION_API_KEY) {
      throw new Error('GOOGLE_VISION_API_KEY is not set');
    }
    if (input.mimeType === 'application/pdf') {
      throw new Error(
        'GoogleVisionOcrAdapter does not support PDF input — the synchronous images:annotate endpoint only accepts image/jpeg, image/png, and image/webp'
      );
    }

    const response = await fetch(`${VISION_ENDPOINT}?key=${env.GOOGLE_VISION_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: input.buffer.toString('base64') },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Google Vision request failed: ${response.status} ${await response.text()}`);
    }

    const body = (await response.json()) as VisionAnnotateResponse;
    const result = body.responses?.[0];
    if (result?.error) {
      throw new Error(`Google Vision error: ${result.error.message}`);
    }

    return { rawText: result?.fullTextAnnotation?.text ?? '' };
  }
}
