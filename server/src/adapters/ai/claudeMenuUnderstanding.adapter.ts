import { DetectedDishCandidate, MenuUnderstandingAdapter } from './menuUnderstanding.interface';

/**
 * Scaffolded for later use — not wired to a real Claude API call yet.
 * Fill in with an Anthropic SDK call when AI_PROVIDER=claude is selected.
 * Suggested prompt: "Extract dish names from this menu text. Ignore prices,
 * section headings, and tax/service-charge lines." Return the same
 * DetectedDishCandidate[] shape as the stub, preserving menu order.
 */
export class ClaudeMenuUnderstandingAdapter implements MenuUnderstandingAdapter {
  async detectDishNames(): Promise<DetectedDishCandidate[]> {
    throw new Error('ClaudeMenuUnderstandingAdapter is not configured. Set ANTHROPIC_API_KEY and implement detectDishNames().');
  }
}
