// Prompt builders and response validators for AI-assisted coding. No network calls here: the
// feature layer sends prompts through platform/ai (askAI / askAIJson) on user action.

import type { CodeDef } from '../../core/coding-types';

/**
 * Default prompt size: well under the 64 KB limit of the Claude sample capability. Smaller models
 * (on-device, free tiers) pass a smaller `budgetBytes`; fewer excerpts are then included.
 */
export const PROMPT_BUDGET_BYTES = 40_000;
const enc = new TextEncoder();
export const byteLength = (s: string) => enc.encode(s).length;

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max) + ' ...' : t;
}

export interface CodebookSuggestion {
  name: string;
  description: string;
  inclusion: string;
  exclusion: string;
  examples: string[];
  parent: string | null;
}

/** Evenly spaced sample of up to `n` items (deterministic, keeps variety across the list). */
export function spreadSample<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items.slice();
  const out: T[] = [];
  const step = items.length / n;
  for (let i = 0; i < n; i++) out.push(items[Math.floor(i * step)]);
  return out;
}

export function buildCodebookPrompt(texts: string[], opts: { researchQuestion?: string; existing?: string[]; maxCodes?: number; budgetBytes?: number } = {}): { prompt: string; used: number } {
  const budget = opts.budgetBytes ?? PROMPT_BUDGET_BYTES;
  const head = [
    'You are helping a sociologist do inductive thematic analysis (Braun and Clarke style) of qualitative data.',
    opts.researchQuestion?.trim() ? `Research question or focus: ${opts.researchQuestion.trim()}` : '',
    'Read the excerpts below and propose a codebook of distinct, analytically useful codes grounded in the data.',
    `Propose between 5 and ${opts.maxCodes ?? 15} codes. Group related codes under a broader theme where that helps by giving them the same "parent" (the theme name, which must also appear as its own code); otherwise use null.`,
    opts.existing?.length ? `The codebook already has these codes, do not repeat them: ${opts.existing.join('; ')}.` : '',
    'For each code give: a short name (2 to 5 words), a one or two sentence description, inclusion criteria, exclusion criteria, and 1 to 3 short verbatim example quotes copied exactly from the excerpts.',
    'Reply with JSON only, in exactly this shape:',
    '{"codes":[{"name":"...","parent":null,"description":"...","inclusion":"...","exclusion":"...","examples":["..."]}]}',
    '',
    'Excerpts:',
  ].filter(Boolean).join('\n');
  let prompt = head;
  let used = 0;
  const per = Math.max(200, Math.floor((budget - byteLength(head)) / Math.max(1, texts.length)) - 20);
  for (const t of texts) {
    const line = `\n[${used + 1}] ${clip(t, per)}`;
    if (byteLength(prompt + line) > budget) break;
    prompt += line;
    used++;
  }
  return { prompt, used };
}

export function parseCodebookSuggestions(raw: unknown): CodebookSuggestion[] {
  const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.codes) ? (raw as any).codes : [];
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const out: CodebookSuggestion[] = [];
  const seen = new Set<string>();
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const name = s(o.name).slice(0, 80);
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({
      name,
      description: s(o.description),
      inclusion: s(o.inclusion),
      exclusion: s(o.exclusion),
      examples: Array.isArray(o.examples) ? o.examples.map(s).filter(Boolean).slice(0, 3) : s(o.example) ? [s(o.example)] : [],
      parent: s(o.parent) && s(o.parent).toLowerCase() !== name.toLowerCase() ? s(o.parent) : null,
    });
  }
  return out;
}

export interface SuggestItem {
  id: string;
  text: string;
}

function codebookBlock(codes: CodeDef[]): string {
  return codes
    .map((c) => `- ${c.name}${c.description ? `: ${clip(c.description, 200)}` : ''}${c.inclusion ? ` (include: ${clip(c.inclusion, 120)})` : ''}${c.exclusion ? ` (exclude: ${clip(c.exclusion, 120)})` : ''}`)
    .join('\n');
}

/**
 * Split responses into prompts that each stay under the budget. Each response text is clipped to
 * `maxChars` characters. Returns one prompt per batch with the ids it contains.
 */
export function buildSuggestBatches(codes: CodeDef[], items: SuggestItem[], opts: { batchSize?: number; maxChars?: number; budgetBytes?: number } = {}): Array<{ prompt: string; ids: string[] }> {
  const budget = opts.budgetBytes ?? PROMPT_BUDGET_BYTES;
  const head = [
    'You are a careful qualitative coder applying an existing codebook to open-ended survey responses.',
    'Apply only codes from this codebook, using their exact names. A response may get several codes or none.',
    'Apply a code only when the response clearly fits its description. Do not invent new codes.',
    '',
    'Codebook:',
    codebookBlock(codes),
    '',
    'Reply with JSON only: an array with one object per response, in exactly this shape:',
    '[{"id":"r1","codes":["Code name"]}]',
    '',
    'Responses:',
  ].join('\n');
  const batchSize = opts.batchSize ?? 40;
  const maxChars = opts.maxChars ?? 1200;
  const batches: Array<{ prompt: string; ids: string[] }> = [];
  let cur = head;
  let ids: string[] = [];
  for (const it of items) {
    const line = `\n${JSON.stringify({ id: it.id, text: clip(it.text, maxChars) })}`;
    if (ids.length && (ids.length >= batchSize || byteLength(cur + line) > budget)) {
      batches.push({ prompt: cur, ids });
      cur = head;
      ids = [];
    }
    cur += line;
    ids.push(it.id);
  }
  if (ids.length) batches.push({ prompt: cur, ids });
  return batches;
}

/** Validate a suggestion reply: only known ids, only codebook names (case-insensitive). Returns id -> code ids. */
export function parseCodeSuggestions(raw: unknown, ids: string[], codes: CodeDef[]): Map<string, string[]> {
  const valid = new Set(ids);
  const byName = new Map(codes.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const arr: unknown[] = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.responses) ? (raw as any).responses : Array.isArray((raw as any)?.results) ? (raw as any).results : [];
  const out = new Map<string, string[]>();
  for (const x of arr) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const id = String(o.id ?? '');
    if (!valid.has(id)) continue;
    const names = Array.isArray(o.codes) ? o.codes : [];
    const codeIds = [...new Set(names.map((n) => byName.get(String(n).trim().toLowerCase())).filter((v): v is string => !!v))];
    out.set(id, codeIds);
  }
  return out;
}

export function buildSummaryPrompt(code: CodeDef, quotes: Array<{ source: string; text: string }>, opts: { budgetBytes?: number } = {}): { prompt: string; used: number } {
  const budget = opts.budgetBytes ?? PROMPT_BUDGET_BYTES;
  const head = [
    'You are helping a sociologist write up a theme from qualitative data.',
    `Code: ${code.name}`,
    code.description ? `Definition: ${code.description}` : '',
    `Below are ${quotes.length} coded segments.`,
    'Write a short thematic summary (120 to 200 words) in plain academic English: what people say, the main variations or tensions, and who says it when the source labels show that.',
    'Then give 2 or 3 representative quotes copied exactly from the segments, each on its own line starting with "> " and followed by the source label in brackets.',
    'Do not use headings or bullet lists. Do not overstate: describe patterns in these segments only.',
    '',
    'Segments:',
  ].filter(Boolean).join('\n');
  let prompt = head;
  let used = 0;
  for (const q of quotes) {
    const line = `\n[${q.source}] ${clip(q.text, budget < PROMPT_BUDGET_BYTES ? 400 : 900)}`;
    if (byteLength(prompt + line) > budget) break;
    prompt += line;
    used++;
  }
  return { prompt, used };
}
