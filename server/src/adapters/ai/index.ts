import { env } from '../../config/env';
import { MenuUnderstandingAdapter } from './menuUnderstanding.interface';
import { StubMenuUnderstandingAdapter } from './stubMenuUnderstanding.adapter';
import { ClaudeMenuUnderstandingAdapter } from './claudeMenuUnderstanding.adapter';
import { OpenRouterMenuUnderstandingAdapter } from './openrouterMenuUnderstanding.adapter';

let instance: MenuUnderstandingAdapter | null = null;

export function getMenuUnderstandingAdapter(): MenuUnderstandingAdapter {
  if (!instance) {
    switch (env.AI_PROVIDER) {
      case 'claude':
        instance = new ClaudeMenuUnderstandingAdapter();
        break;
      case 'openrouter':
        instance = new OpenRouterMenuUnderstandingAdapter();
        break;
      default:
        instance = new StubMenuUnderstandingAdapter();
    }
  }
  return instance;
}

export type { MenuUnderstandingAdapter, DetectedDishCandidate } from './menuUnderstanding.interface';
