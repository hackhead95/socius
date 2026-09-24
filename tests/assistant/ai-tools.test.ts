// Tool-calling adapters: Gemini via the Interactions API (function tools, function_call steps, thought
// steps replayed verbatim with store: false) and the generateContent fallback (functionDeclarations /
// functionCall / functionResponse with thought signatures), OpenAI-compatible tools / tool_calls
// (streamed and not), rate-limit details, and the Claude `sample` tools path.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  askClaudeTools, askGeminiTools, askOpenAiTools, buildGeminiInteractionToolRequest, buildGeminiToolRequest, buildOpenAiToolRequest, claudeToolsAvailable, geminiContents, interactionSteps,
  isToolsUnsupported, openAiMessages, parseDelay, parseOpenAiTurn, toGeminiSchema, toolErrorFromResponse, type ChatMessage, type ToolSpec,
} from '../../src/platform/ai-tools';
import { __resetGeminiState, __setHttpRetryDelay } from '../../src/platform/ai-http';
import { __resetCapabilityCache } from '../../src/platform/claude';
import { jsonResponse, sseResponse } from '../platform/helpers';
import { G, interactionCalls, interactionStream } from '../platform/gemini-fixtures';

const gem = { apiKey: ' AIza-tools ', model: '' };
const oa = { baseUrl: 'https://api.groq.com/openai/v1', apiKey: 'gsk_x', model: 'llama-3.3-70b-versatile' };

const tools: ToolSpec[] = [
  { name: 'get_dataset_overview', description: 'Overview.', parameters: { type: 'object', properties: {} } },
  {
    name: 'describe_variables',
    description: 'Describe.',
    parameters: { type: 'object', properties: { names: { type: 'array', items: { type: 'string' } } }, required: ['names'] },
  },
];

beforeEach(() => {
  __resetGeminiState();
  __setHttpRetryDelay(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  __resetCapabilityCache();
  __setHttpRetryDelay(1500);
});

function mockFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (url: string, init: RequestInit) => respond(url, init));
  vi.stubGlobal('fetch', fn);
  return fn;
}

const modelList = () =>
  jsonResponse({ models: ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.6-flash-lite', 'gemini-3.6-flash-image', 'gemini-3.6-pro'].map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) });

describe('Gemini function calling', () => {
  it('Interactions: function tools with JSON Schema, system instruction, no storage, tool choice', () => {
    const r = buildGeminiInteractionToolRequest({ apiKey: 'AQ.k', model: 'gemini-3.5-flash-lite' }, { system: 'You are...', messages: [{ role: 'user', text: 'Hi' }], tools, stream: true, maxTokens: 4096 });
    expect(r.url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    const body = JSON.parse(r.init.body);
    expect(body).toMatchObject({ model: 'gemini-3.5-flash-lite', system_instruction: 'You are...', store: false, stream: true, input: [{ type: 'user_input', content: [{ type: 'text', text: 'Hi' }] }] });
    expect(body.tools).toEqual([
      { type: 'function', name: 'get_dataset_overview', description: 'Overview.' },
      { type: 'function', name: 'describe_variables', description: 'Describe.', parameters: tools[1].parameters },
    ]);
    expect(body.generation_config).toEqual({ thinking_level: 'low', max_output_tokens: 5120 });
    expect(body.temperature).toBeUndefined();
    const none = JSON.parse(buildGeminiInteractionToolRequest({ apiKey: 'k', model: 'm' }, { system: '', messages: [], tools, toolChoice: 'none', stream: false }).init.body);
    expect(none.generation_config.tool_choice).toBe('none');
  });

  it('Interactions: a conversation with tool rounds becomes steps, replaying the model steps (thought signatures) verbatim', () => {
    const raw = { provider: 'gemini-interactions', parts: [{ type: 'thought', signature: 'SIG123' }, { type: 'function_call', id: 'fc_1', name: 'describe_variables', arguments: { names: ['trust5'] } }] };
    const msgs: ChatMessage[] = [
      { role: 'user', text: 'Describe trust5' },
      { role: 'assistant', text: '', toolCalls: [{ id: 'fc_1', name: 'describe_variables', args: { names: ['trust5'] } }], raw },
      { role: 'tool', results: [{ callId: 'fc_1', name: 'describe_variables', content: 'trust5: mean 3.01' }] },
      { role: 'assistant', text: 'Mean is 3.01.' },
      { role: 'user', text: 'Thanks' },
    ];
    expect(interactionSteps(msgs)).toEqual([
      { type: 'user_input', content: [{ type: 'text', text: 'Describe trust5' }] },
      ...raw.parts,
      { type: 'function_result', call_id: 'fc_1', name: 'describe_variables', result: 'trust5: mean 3.01' },
      { type: 'model_output', content: [{ type: 'text', text: 'Mean is 3.01.' }] },
      { type: 'user_input', content: [{ type: 'text', text: 'Thanks' }] },
    ]);
  });

  it('builds functionDeclarations with Gemini schema types, system instruction and tool config (generateContent fallback)', () => {
    const r = buildGeminiToolRequest({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: 'You are...', messages: [{ role: 'user', text: 'Hi' }], tools, stream: false });
    expect(r.url).toMatch(/models\/gemini-3\.6-flash:generateContent$/);
    const body = JSON.parse(r.init.body);
    expect(body.systemInstruction).toEqual({ parts: [{ text: 'You are...' }] });
    expect(body.tools[0].functionDeclarations).toEqual([
      { name: 'get_dataset_overview', description: 'Overview.' }, // no empty OBJECT schema
      { name: 'describe_variables', description: 'Describe.', parameters: { type: 'OBJECT', properties: { names: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['names'] } },
    ]);
    expect(body.toolConfig).toEqual({ functionCallingConfig: { mode: 'AUTO' } });
    const none = JSON.parse(buildGeminiToolRequest({ apiKey: 'k', model: 'm' }, { system: '', messages: [], tools, toolChoice: 'none', stream: true }).init.body);
    expect(none.toolConfig.functionCallingConfig.mode).toBe('NONE');
    expect(toGeminiSchema({ type: 'string', enum: ['a', 'b'] })).toEqual({ type: 'STRING', enum: ['a', 'b'] });
  });

  it('turns a conversation with tool rounds into contents, replaying the model parts verbatim', () => {
    const raw = { provider: 'gemini', parts: [{ functionCall: { name: 'describe_variables', args: { names: ['trust5'] } }, thoughtSignature: 'SIG123' }] };
    const msgs: ChatMessage[] = [
      { role: 'user', text: 'Describe trust5' },
      { role: 'assistant', text: '', toolCalls: [{ id: 'c1', name: 'describe_variables', args: { names: ['trust5'] } }], raw },
      { role: 'tool', results: [{ callId: 'c1', name: 'describe_variables', content: 'trust5: mean 3.01' }] },
      { role: 'assistant', text: 'Mean is 3.01.' },
    ];
    const c = geminiContents(msgs);
    expect(c[0]).toEqual({ role: 'user', parts: [{ text: 'Describe trust5' }] });
    expect(c[1]).toEqual({ role: 'model', parts: raw.parts }); // thought signature kept
    expect(c[2]).toEqual({ role: 'user', parts: [{ functionResponse: { name: 'describe_variables', response: { result: 'trust5: mean 3.01' } } }] });
    expect(c[3]).toEqual({ role: 'model', parts: [{ text: 'Mean is 3.01.' }] });
  });

  it('lists models once (Flash-Lite for tool loops), then reads several function_call steps from one turn', async () => {
    const f = mockFetch((url) => {
      if (url.includes('/models?')) return modelList();
      return interactionCalls(
        [
          { id: 'fc_a', name: 'get_dataset_overview', arguments: {} },
          { id: 'fc_b', name: 'describe_variables', arguments: { names: ['trust5', 'gender'] } },
        ],
        'Let me check.',
      );
    });
    const turn = await askGeminiTools(gem, { system: 'sys', messages: [{ role: 'user', text: 'Describe' }], tools });
    expect(f.mock.calls[0][0]).toContain('/models?');
    expect(f.mock.calls[1][0]).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    const init = f.mock.calls[1][1] as RequestInit & { headers: Record<string, string> };
    expect(init.headers['x-goog-api-key']).toBe('AIza-tools');
    expect(JSON.parse(init.body as string).model).toBe('gemini-3.6-flash-lite');
    expect(turn.text).toBe('Let me check.');
    expect(turn.toolCalls.map((c) => [c.id, c.name])).toEqual([['fc_a', 'get_dataset_overview'], ['fc_b', 'describe_variables']]);
    expect(turn.toolCalls[1].args).toEqual({ names: ['trust5', 'gender'] });
    expect(turn.raw).toMatchObject({ provider: 'gemini-interactions' });
    expect(turn.raw?.parts).toHaveLength(4); // thought (with signature), text, two calls
    // The model list is cached per key.
    await askGeminiTools(gem, { system: 'sys', messages: [{ role: 'user', text: 'Again' }], tools });
    expect(f.mock.calls.filter((c) => String(c[0]).includes('/models?'))).toHaveLength(1);
  });

  it('streams text, and function-call arguments sent in pieces', async () => {
    mockFetch((url) => (url.includes('/models?') ? modelList() : interactionStream(['Trust is ', 'moderate.'])));
    const seen: string[] = [];
    const turn = await askGeminiTools({ apiKey: 'AIza-stream', model: 'gemini-3.6-flash' }, { system: 's', messages: [{ role: 'user', text: 'q' }], tools, onText: (t) => seen.push(t) });
    expect(turn.text).toBe('Trust is moderate.');
    expect(turn.toolCalls).toEqual([]);
    expect(seen).toEqual(['Trust is ', 'Trust is moderate.']);
    expect(turn.raw?.parts[0]).toEqual({ type: 'thought', signature: 'EqEYsig' });
    mockFetch(() => interactionStream([], { calls: [{ id: 'fc_9', name: 'describe_variables', args: ['{"names":', '["age"]}'] }] }));
    const t2 = await askGeminiTools({ apiKey: 'AIza-stream', model: 'gemini-3.6-flash' }, { system: 's', messages: [{ role: 'user', text: 'q' }], tools, onText: () => undefined });
    expect(t2.toolCalls).toEqual([{ id: 'fc_9', name: 'describe_variables', args: { names: ['age'] } }]);
  });

  it('reports 429 with the retry delay and daily quota, MAX_TOKENS and MALFORMED_FUNCTION_CALL as their own codes', async () => {
    mockFetch(() => G.quotaPerMinute('gemini-3.6-flash'));
    await expect(askGeminiTools({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: '', messages: [{ role: 'user', text: 'q' }], tools })).rejects.toMatchObject({ code: 'rate_limited', retryAfterMs: 21_000, daily: false });
    // Daily allowance used up on every model: rate_limited, daily (the agent then stops instead of waiting).
    mockFetch((url) => (url.includes('/models?') ? modelList() : G.quotaPerDay('gemini-3.6-flash')));
    await expect(askGeminiTools({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: '', messages: [{ role: 'user', text: 'q' }], tools })).rejects.toMatchObject({ code: 'rate_limited', daily: true });
    __resetGeminiState();
    mockFetch(() => jsonResponse({ id: 'x', status: 'incomplete', steps: [{ type: 'thought', signature: 's' }] }));
    await expect(askGeminiTools({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: '', messages: [{ role: 'user', text: 'q' }], tools })).rejects.toMatchObject({ code: 'max_tokens' });
    // generateContent fallback (Interactions endpoint missing): MALFORMED_FUNCTION_CALL.
    mockFetch((url) => (url.endsWith('/interactions') ? G.endpointNotFound() : jsonResponse({ candidates: [{ content: { parts: [] }, finishReason: 'MALFORMED_FUNCTION_CALL' }] })));
    await expect(askGeminiTools({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: '', messages: [{ role: 'user', text: 'q' }], tools })).rejects.toMatchObject({ code: 'malformed_call' });
  });
});

describe('OpenAI-compatible tool calling', () => {
  it('builds tools, tool_choice, assistant tool_calls and tool messages', () => {
    const msgs: ChatMessage[] = [
      { role: 'user', text: 'q' },
      { role: 'assistant', text: '', toolCalls: [{ id: 'call_1', name: 'describe_variables', args: { names: ['age'] } }] },
      { role: 'tool', results: [{ callId: 'call_1', name: 'describe_variables', content: 'age ok' }] },
    ];
    expect(openAiMessages('sys', msgs)).toEqual([
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'q' },
      { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'describe_variables', arguments: '{"names":["age"]}' } }] },
      { role: 'tool', tool_call_id: 'call_1', content: 'age ok' },
    ]);
    const r = buildOpenAiToolRequest(oa, { system: 'sys', messages: msgs, tools, stream: false, toolChoice: 'none' });
    const body = JSON.parse(r.init.body);
    expect(r.url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(body.tools[0]).toEqual({ type: 'function', function: { name: 'get_dataset_overview', description: 'Overview.', parameters: { type: 'object', properties: {} } } });
    expect(body.tool_choice).toBe('none');
  });

  it('parses tool_calls, including arguments that are not valid JSON', () => {
    const t = parseOpenAiTurn({
      choices: [{ message: { content: null, tool_calls: [{ id: 'a', function: { name: 'describe_variables', arguments: '{"names":["x"]}' } }, { id: 'b', function: { name: 'describe_variables', arguments: '{bad' } }] }, finish_reason: 'tool_calls' }],
    });
    expect(t.toolCalls[0]).toEqual({ id: 'a', name: 'describe_variables', args: { names: ['x'] } });
    expect(t.toolCalls[1].argsError).toMatch(/not valid JSON/);
  });

  it('accumulates streamed tool-call fragments by index', async () => {
    const d = (delta: unknown, finish?: string) => `data: ${JSON.stringify({ choices: [{ delta, finish_reason: finish ?? null }] })}\n\n`;
    mockFetch(() =>
      sseResponse([
        d({ tool_calls: [{ index: 0, id: 'c0', function: { name: 'describe_', arguments: '' } }] }),
        d({ tool_calls: [{ index: 0, function: { name: 'variables', arguments: '{"names":' } }, { index: 1, id: 'c1', function: { name: 'get_dataset_overview', arguments: '{}' } }] }),
        d({ tool_calls: [{ index: 0, function: { arguments: '["age"]}' } }] }, 'tool_calls'),
        'data: [DONE]\n\n',
      ]),
    );
    const turn = await askOpenAiTools(oa, { system: 's', messages: [{ role: 'user', text: 'q' }], tools, onText: () => undefined });
    expect(turn.toolCalls).toEqual([
      { id: 'c0', name: 'describe_variables', args: { names: ['age'] } },
      { id: 'c1', name: 'get_dataset_overview', args: {} },
    ]);
    expect(turn.finishReason).toBe('tool_calls');
  });

  it('recognises services that cannot do tool calling, and Groq-style retry hints', async () => {
    expect(isToolsUnsupported({ code: 'bad_request', detail: 'registry.ollama.ai/library/gemma:2b does not support tools' })).toBe(true);
    expect(isToolsUnsupported({ code: 'bad_request', detail: 'Invalid model name' })).toBe(false);
    const err = await toolErrorFromResponse(new Response(JSON.stringify({ error: { message: 'Rate limit reached. Please try again in 7.5s.' } }), { status: 429 }));
    expect(err).toMatchObject({ code: 'rate_limited', retryAfterMs: 7500 });
    expect(parseDelay('300ms')).toBe(300);
    expect(parseDelay('2')).toBe(2000);
  });
});

describe('Claude sample with page tools', () => {
  it('checks limits().tools and passes tools with execute; errors keep their partial text', async () => {
    const seen: any[] = [];
    const sample: any = vi.fn(async (turns: any, opts: any) => {
      seen.push({ turns, opts });
      const r = await opts.tools[0].execute({ names: ['age'] }, { signal: new AbortController().signal });
      opts.onText?.({ text: `Result: ${r}`, delta: '' });
      return { text: `Result: ${r}`, truncated: false };
    });
    sample.limits = async () => ({ maxPromptBytes: 65536, tools: { maxCount: 20 } });
    vi.stubGlobal('claude', { use: async (n: string) => (n === 'sample' ? sample : null) });
    expect(await claudeToolsAvailable()).toBe(true);
    const out = await askClaudeTools([{ role: 'user', content: 'Instructions' }, { role: 'user', content: 'q' }], {
      tools: [{ name: 'describe_variables', description: 'd', execute: (i) => `ran with ${JSON.stringify(i)}` }],
    });
    expect(out.text).toBe('Result: ran with {"names":["age"]}');
    expect(seen[0].opts.cache).toBeUndefined(); // cache must not be passed with tools
    sample.mockImplementationOnce(async () => Promise.reject({ code: 'rate_limited', message: 'slow down', text: 'partial' }));
    await expect(askClaudeTools([{ role: 'user', content: 'q' }], { tools: [] })).rejects.toMatchObject({ code: 'rate_limited', partial: 'partial' });
  });
});
