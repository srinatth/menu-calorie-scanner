import { env } from '../config/env';

// Default free-tier model; override per-project via OPENROUTER_MODEL. Free model
// availability churns — see https://openrouter.ai/models?max_price=0.
const DEFAULT_MODEL = 'tencent/hy3:free';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

/**
 * Minimal OpenRouter chat-completions call (OpenAI-compatible endpoint, bearer
 * key). Shared by the menu-understanding and nutrition-estimation adapters so
 * the request/auth/error handling lives in one place. Returns the assistant
 * message text; throws on transport/provider errors (including free-tier 429s).
 */
export async function openrouterChat(messages: ChatMessage[]): Promise<string> {
  if (!env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      // Optional attribution header OpenRouter uses for its rankings.
      'X-Title': 'Menu Calorie Scanner',
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL || DEFAULT_MODEL,
      temperature: 0,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed: ${response.status} ${await response.text()}`);
  }

  const body = (await response.json()) as OpenRouterResponse;
  if (body.error) {
    throw new Error(`OpenRouter error: ${body.error.message ?? 'unknown error'}`);
  }
  const text = body.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error('OpenRouter returned no content');
  }
  return text;
}
