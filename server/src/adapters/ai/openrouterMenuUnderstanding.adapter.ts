import { openrouterChat } from '../../utils/openrouter';
import { DetectedDishCandidate, MenuUnderstandingAdapter } from './menuUnderstanding.interface';

const SYSTEM_INSTRUCTION = [
  'You are a menu parser. You receive numbered lines of OCR text from a restaurant menu.',
  'Identify which lines are DISH NAMES — an individually orderable food or drink item.',
  'A dish name is short (usually 1-6 words) and names the item itself (e.g. "Murgh Tikka", "Palak Paneer", "Mango Lassi").',
  'EXCLUDE: dish descriptions (full sentences describing how a dish is made, e.g. "Chicken cooked in a creamy marinade..."),',
  'section headers ("Veg", "Starters", "Beverages"), prices, restaurant name/branding, and any tax/footer text.',
  'Respond with ONLY a JSON array of the integer line numbers that are dish names, in ascending order. No prose, no code fences.',
].join(' ');

/**
 * Uses an LLM via OpenRouter to semantically separate dish names from
 * descriptions, headers, and other non-dish text — robust to menu layout in a
 * way the regex/length heuristics in the stub adapter can't be.
 *
 * The model is asked to return the *indices* of dish-name lines (not the text
 * itself), so candidates are reconstructed from the original array — this makes
 * the returned rawText impossible to hallucinate and keeps positionInMenu exact.
 */
export class OpenRouterMenuUnderstandingAdapter implements MenuUnderstandingAdapter {
  async detectDishNames(cleanedLines: string[]): Promise<DetectedDishCandidate[]> {
    if (cleanedLines.length === 0) {
      return [];
    }

    const numbered = cleanedLines.map((line, i) => `${i}: ${line}`).join('\n');

    const text = await openrouterChat([
      { role: 'system', content: SYSTEM_INSTRUCTION },
      { role: 'user', content: numbered },
    ]);

    const indices = parseIndexArray(text);
    const seen = new Set<number>();
    const candidates: DetectedDishCandidate[] = [];
    let position = 0;

    for (const raw of indices) {
      const index = Number(raw);
      // Defensively ignore out-of-range or duplicated indices the model might emit.
      if (!Number.isInteger(index) || index < 0 || index >= cleanedLines.length || seen.has(index)) {
        continue;
      }
      seen.add(index);
      candidates.push({ rawText: cleanedLines[index].trim(), positionInMenu: position });
      position += 1;
    }

    return candidates;
  }
}

/**
 * Free-tier models don't reliably honor a strict JSON response format — they may
 * return a proper `[1,3,4]` array, a bare comma-separated list `1,3,4`, wrap the
 * output in markdown code fences, or add stray prose. Since the payload is only
 * ever a list of line-number integers, pull every integer token out of the reply
 * in order; downstream code range-checks and dedupes them anyway.
 */
function parseIndexArray(text: string): number[] {
  const numbers = text.match(/\d+/g);
  if (!numbers) {
    throw new Error(`OpenRouter returned no parseable line indices: ${text.slice(0, 200)}`);
  }
  return numbers.map(Number);
}
