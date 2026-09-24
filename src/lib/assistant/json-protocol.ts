// A strict JSON action protocol for models without reliable native tool calling (the small on-device
// model, and Claude or services where page tools are unavailable). Each reply is exactly one object:
//   {"tool": "<name>", "args": {...}}   to use a tool, or
//   {"answer": "<Markdown>"}            when ready to answer.
import { extractJson } from '../../platform/ai';
import type { AgentTool } from './types';
import { byteLength } from './format';

export type JsonAction = { kind: 'tool'; tool: string; args: Record<string, unknown> } | { kind: 'answer'; answer: string } | { kind: 'invalid'; error: string };

/** One line per tool: name(args) - description. */
export function toolListText(tools: AgentTool[]): string {
  return tools
    .map((t) => {
      const props = Object.entries(t.parameters.properties ?? {});
      const req = new Set(t.parameters.required ?? []);
      const args = props.map(([k, s]) => `${k}${req.has(k) ? '' : '?'}: ${s.type === 'array' ? `${s.items?.type ?? 'any'}[]` : s.enum ? s.enum.map((e) => `"${e}"`).join('|') : s.type}`).join(', ');
      const desc = t.description.split(/(?<=\.)\s/)[0];
      return `- ${t.name}(${args}): ${desc}`;
    })
    .join('\n');
}

export const PROTOCOL = `Reply with ONLY one JSON object and nothing else:
{"tool": "<tool name>", "args": {...}} to use one tool, or
{"answer": "<your answer to the user, in Markdown>"} when you have what you need.
Use a tool before stating any number about the data.`;

export interface TranscriptEntry {
  kind: 'user' | 'assistant' | 'call' | 'result';
  text: string;
}

/** The whole exchange as one prompt, dropping the oldest tool results first when over budget. */
export function buildJsonPrompt(system: string, tools: AgentTool[], transcript: TranscriptEntry[], maxBytes: number, finalNudge = ''): string {
  const head = `${system}\n\nTools:\n${toolListText(tools)}\n\n${PROTOCOL}`;
  const render = (entries: TranscriptEntry[]) =>
    entries
      .map((e) => (e.kind === 'user' ? `User: ${e.text}` : e.kind === 'assistant' ? `Assistant: ${e.text}` : e.kind === 'call' ? `Assistant (tool call): ${e.text}` : `Tool result: ${e.text}`))
      .join('\n\n');
  const entries = transcript.map((e) => ({ ...e }));
  const size = () => byteLength(head) + byteLength(render(entries)) + byteLength(finalNudge) + 40;
  // 1) shorten old tool results, 2) drop the oldest entries (never the last user message).
  for (let i = 0; i < entries.length && size() > maxBytes; i++) {
    if (entries[i].kind === 'result' && entries[i].text.length > 200) entries[i].text = entries[i].text.slice(0, 160) + ' ... [shortened]';
  }
  while (size() > maxBytes && entries.length > 1) {
    const lastUser = entries.map((e) => e.kind).lastIndexOf('user');
    if (lastUser <= 0) break;
    entries.shift();
  }
  if (size() > maxBytes) {
    // Still too long: cut the latest tool result.
    for (let i = entries.length - 1; i >= 0 && size() > maxBytes; i--) {
      if (entries[i].kind === 'result') entries[i].text = entries[i].text.slice(0, Math.max(200, entries[i].text.length - (size() - maxBytes) - 20)) + ' ...';
    }
  }
  return `${head}\n\nConversation:\n${render(entries)}${finalNudge ? `\n\n${finalNudge}` : ''}\n\nYour JSON reply:`;
}

/** Parse and validate one protocol reply. */
export function parseAction(text: string, tools: AgentTool[]): JsonAction {
  let v: unknown;
  try {
    v = extractJson(text);
  } catch {
    return { kind: 'invalid', error: 'The reply was not a JSON object.' };
  }
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { kind: 'invalid', error: 'The reply must be one JSON object.' };
  const o = v as Record<string, unknown>;
  if (typeof o.answer === 'string' && o.answer.trim()) return { kind: 'answer', answer: o.answer.trim() };
  const name = typeof o.tool === 'string' ? o.tool.trim() : typeof o.name === 'string' ? o.name.trim() : '';
  if (name) {
    if (!tools.some((t) => t.name === name)) return { kind: 'invalid', error: `There is no tool "${name}". Tools: ${tools.map((t) => t.name).join(', ')}.` };
    const args = (o.args ?? o.arguments ?? o.parameters ?? {}) as unknown;
    if (args && typeof args === 'object' && !Array.isArray(args)) return { kind: 'tool', tool: name, args: args as Record<string, unknown> };
    return { kind: 'invalid', error: '"args" must be a JSON object.' };
  }
  return { kind: 'invalid', error: 'Use either "tool" with "args", or "answer".' };
}

/** The answer text so far while a {"answer": "..."} reply streams in (for live display). */
export function partialAnswer(raw: string): string | null {
  const m = /^\s*(?:```(?:json)?\s*)?\{\s*"answer"\s*:\s*"/.exec(raw);
  if (!m) return null;
  let out = '';
  const s = raw.slice(m[0].length);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') break;
    if (ch === '\\') {
      const n = s[i + 1];
      if (n === undefined) break;
      i++;
      if (n === 'n') out += '\n';
      else if (n === 't') out += '\t';
      else if (n === 'u') {
        const hex = s.slice(i + 1, i + 5);
        if (hex.length < 4) break;
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
      } else out += n;
    } else out += ch;
  }
  return out;
}
