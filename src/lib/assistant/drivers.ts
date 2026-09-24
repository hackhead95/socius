// Picks the right driver for the AI provider the user set up (AI > AI assistant settings).
import { askAI, aiPromptBudget, effectiveProvider, getAiSettings, providerLabel, type AiProviderId } from '../../platform/ai';
import { askClaudeTools, askGeminiTools, askOpenAiTools, claudeToolsAvailable } from '../../platform/ai-tools';
import type { Driver, TextDriver } from './agent';

/** Free-tier pacing for Gemini: Google's free tier allows roughly 10 requests a minute for Flash models. */
export const GEMINI_FREE_PER_MINUTE = 10;

function textDriver(name: string, budget: TextDriver['budget'], compact: boolean, perMinute?: number, rateKey?: string): TextDriver {
  return {
    kind: 'text',
    name,
    budget,
    compact,
    perMinute,
    rateKey,
    complete: (prompt, o) => askAI(prompt, { signal: o.signal, json: o.json, maxTokens: o.maxTokens, onText: o.onText }),
  };
}

/** The driver for the current provider, or null when AI is not set up. */
export async function createDriver(provider: AiProviderId | null = effectiveProvider()): Promise<Driver | null> {
  const s = getAiSettings();
  switch (provider) {
    case 'gemini':
      return {
        kind: 'native',
        name: 'gemini',
        rateKey: `gemini:${s.gemini.apiKey.trim().slice(-6)}`,
        perMinute: GEMINI_FREE_PER_MINUTE,
        budget: { maxPromptBytes: 90_000, maxToolResultBytes: 9_000, maxOutputTokens: 4_096 },
        turn: (o) => askGeminiTools({ apiKey: getAiSettings().gemini.apiKey, model: getAiSettings().gemini.model }, o),
      };
    case 'openai': {
      const budget = aiPromptBudget(s);
      const b = { maxPromptBytes: Math.max(10_000, budget), maxToolResultBytes: Math.max(2_000, Math.floor(budget / 5)), maxOutputTokens: 2_048 };
      return {
        kind: 'native',
        name: 'openai',
        budget: b,
        turn: (o) => {
          const cur = getAiSettings().openai;
          return askOpenAiTools({ baseUrl: cur.baseUrl, apiKey: cur.apiKey, model: cur.model }, o);
        },
        fallback: () => textDriver('openai-json', b, false),
      };
    }
    case 'claude': {
      const budget = { maxPromptBytes: 56_000, maxToolResultBytes: 12_000 };
      if (await claudeToolsAvailable())
        return { kind: 'hosted', name: 'claude', budget, run: (o) => askClaudeTools(o.turns, { tools: o.tools, signal: o.signal, onText: o.onText }) };
      return textDriver('claude-json', budget, false);
    }
    case 'webllm':
      return textDriver('webllm', { maxPromptBytes: 6_500, maxToolResultBytes: 1_200, maxOutputTokens: 700 }, true);
    default:
      return null;
  }
}

export function currentProviderLabel(): string {
  return providerLabel(effectiveProvider());
}
