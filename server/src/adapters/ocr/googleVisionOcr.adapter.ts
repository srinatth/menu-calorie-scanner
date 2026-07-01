import { OcrAdapter, OcrResult } from './ocr.interface';

/**
 * Scaffolded for later use — not wired to a real Google Cloud Vision call yet.
 * Fill in with @google-cloud/vision's textDetection() when OCR_PROVIDER=google-vision
 * is selected, returning the same OcrResult shape as the stub.
 */
export class GoogleVisionOcrAdapter implements OcrAdapter {
  async extractText(): Promise<OcrResult> {
    throw new Error('GoogleVisionOcrAdapter is not configured. Set GOOGLE_VISION_API_KEY and implement extractText().');
  }
}
