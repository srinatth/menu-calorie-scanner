import { env } from '../../config/env';
import { OcrAdapter } from './ocr.interface';
import { StubOcrAdapter } from './stubOcr.adapter';
import { GoogleVisionOcrAdapter } from './googleVisionOcr.adapter';

let instance: OcrAdapter | null = null;

export function getOcrAdapter(): OcrAdapter {
  if (!instance) {
    instance = env.OCR_PROVIDER === 'google-vision' ? new GoogleVisionOcrAdapter() : new StubOcrAdapter();
  }
  return instance;
}

export type { OcrAdapter, OcrResult, OcrTextBlock } from './ocr.interface';
