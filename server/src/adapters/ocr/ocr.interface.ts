export interface OcrTextBlock {
  text: string;
  confidence: number;
}

export interface OcrResult {
  rawText: string;
  blocks?: OcrTextBlock[];
}

export interface OcrAdapter {
  extractText(input: { buffer: Buffer; mimeType: string }): Promise<OcrResult>;
}
