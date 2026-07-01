import { DetectedDishCandidate, MenuUnderstandingAdapter } from './menuUnderstanding.interface';

/**
 * Deterministic rule-based stand-in for an LLM menu-understanding call.
 * textCleaning.ts has already stripped prices/GST/headings, so this stub's
 * job mirrors what a real prompt ("extract dish names, ignore anything that
 * isn't food") would do: drop lines that are too short/long to be a dish name
 * and pass the rest through as candidates, in menu order.
 */
export class StubMenuUnderstandingAdapter implements MenuUnderstandingAdapter {
  async detectDishNames(cleanedLines: string[]): Promise<DetectedDishCandidate[]> {
    const candidates: DetectedDishCandidate[] = [];
    let position = 0;

    for (const line of cleanedLines) {
      const trimmed = line.trim();
      if (trimmed.length < 3 || trimmed.length > 60) continue;
      candidates.push({ rawText: trimmed, positionInMenu: position });
      position += 1;
    }

    return candidates;
  }
}
