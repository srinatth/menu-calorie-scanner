import crypto from 'node:crypto';
import { OcrAdapter, OcrResult } from './ocr.interface';

/**
 * Deterministic stand-in for a real OCR provider. Rather than performing image
 * recognition, it returns a canned block of realistic (noisy) menu text so the
 * downstream cleaning + dish-detection pipeline has real content to exercise
 * without needing OCR credentials. The specific canned menu is chosen
 * deterministically from a hash of the input bytes, so re-uploading the same
 * image always yields the same result.
 */
const CANNED_MENUS: string[] = [
  `STARTERS
Paneer Tikka                         Rs. 220
Samosa (2 pcs)                       120/-
Chicken Tikka                        260

MAIN COURSE
Paneer Butter Masala                 280
Butter Chicken                       340
Dal Tadka                            180
Chicken Biryani                      320

BREADS
Butter Naan                          60
Roti                                 30

*** GST 5% extra ***
Service Charge 10% (optional)
Terms and conditions apply`,
  `SOUPS & STARTERS
Veg Fried Rice                       Rs 210
Chicken 65                           240

MAIN COURSE
Palak Paneer                         260
Chole Bhature                        200
Rajma Chawal                         190
Chicken Tikka Masala                 310

DESSERTS
Gulab Jamun (2 pcs)                  90

All prices are inclusive of taxes. GST as applicable.
------------------------------------`,
];

export class StubOcrAdapter implements OcrAdapter {
  async extractText(input: { buffer: Buffer; mimeType: string }): Promise<OcrResult> {
    const hash = crypto.createHash('sha256').update(input.buffer).digest();
    const index = hash[0] % CANNED_MENUS.length;
    return { rawText: CANNED_MENUS[index] };
  }
}
