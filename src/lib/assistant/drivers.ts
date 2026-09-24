// Picks the right driver for the AI provider the user set up (AI > AI assistant settings).
import { askAI, aiPromptBudget, effectiveProvider, getAiSettings, providerLabel, type AiProviderId } from '../../platform/ai';
import { geminiFlashHasRoom, geminiModelName, geminiPreference } from '../../platform/ai-http';
import { askClaudeTools, askGeminiTools, askOpenAiTools, claudeToolsAvailable, type ChatMessage, type ToolTurnOptions } from '../../platform/ai-tools';
import type { Driver, TextDriver } from './agent';

/**
 * Gemini is not paced here any more: Google's free per-minute limits differ by model (Flash about 5,
 * Flash-Lite about 15) and change, so the platform learns each model's real limit from its 429 replies
 * and spaces requests to fit (src/platform/ai-pace.ts). Kept for older imports.
 */
export const GEMINI_FREE_PER_MINUTE = 10;

/** Tool results already in this question (the model has looked something up). */
function hasToolResults(messages: ChatMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'tool') return true;
    if (messages[i].role === 'user') return false;
  }
  return false;
}

/**
 * One assistant turn with Gemini. Tool steps use Flash-Lite (fast, minimal thinking, many free
 * requests). When the user chose Flash, the turn after the tools ran (usually the answer) uses Flash if
 * its per-minute limit has room; if Flash cannot take the turn, Flash-Lite does.
 */
async function geminiTurn(o: ToolTurnOptions) {
  const g = getAiSettings().gemini;
  const cfg = { apiKey: g.apiKey, model: g.model };
  const wantFlash = !geminiModelName(g.model) && geminiPreference(g.model) === 'flash' && o.toolChoice !== 'none' ? hasToolResults(o.messages) : false;
  if (wantFlash && geminiFlashHasRoom(g.apiKey)) {
    try {
      return await askGeminiTools(cfg, { ...o, prefer: 'flash' });
    } catch (e: any) {
      if (o.signal?.aborted || !['bad_request', 'rate_limited', 'thinking_unsupported', 'field_unsupported', 'overloaded', 'unavailable'].includes(e?.code)) throw e;
      o.timing?.mark('fallback', { note: `Flash could not take the answer (${e?.code}); using Flash-Lite` });
    }
  }
  return askGeminiTools(cfg, { ...o, prefer: 'lite' });
}

function textDriver(name: string, budget: TextDriver['budget'], compact: boolean, perMinute?: number, rateKey?: string): TextDriver {
  return {
    kind: 'text',
    name,
    budget,
    compact,
    perMinute,
    rateKey,
    complete: (prompt, o) => askAI(prompt, { signal: o.signal, json: o.json, maxTokens: o.maxTokens, onText: o.onText, timing: o.timing, op: 'assistant' }),
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
        // Smaller requests are read faster; the dataset overview is looked up before the first request.
        budget: { maxPromptBytes: 60_000, maxToolResultBytes: 8_000, maxOutputTokens: 4_096 },
        prime: ['get_dataset_overview'],
        turn: geminiTurn,
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
