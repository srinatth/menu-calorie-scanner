import { env } from '../../config/env';
import { MenuUnderstandingAdapter } from './menuUnderstanding.interface';
import { StubMenuUnderstandingAdapter } from './stubMenuUnderstanding.adapter';
import { ClaudeMenuUnderstandingAdapter } from './claudeMenuUnderstanding.adapter';

let instance: MenuUnderstandingAdapter | null = null;

export function getMenuUnderstandingAdapter(): MenuUnderstandingAdapter {
  if (!instance) {
    instance = env.AI_PROVIDER === 'claude' ? new ClaudeMenuUnderstandingAdapter() : new StubMenuUnderstandingAdapter();
  }
  return instance;
}

export type { MenuUnderstandingAdapter, DetectedDishCandidate } from './menuUnderstanding.interface';
