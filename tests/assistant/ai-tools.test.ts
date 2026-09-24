// Tool-calling adapters: Gemini functionDeclarations / functionCall / functionResponse (with thought
// signatures replayed), OpenAI-compatible tools / tool_calls (streamed and not), rate-limit details,
// and the Claude `sample` tools path.
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  askClaudeTools, askGeminiTools, askOpenAiTools, buildGeminiToolRequest, buildOpenAiToolRequest, claudeToolsAvailable, geminiContents, isToolsUnsupported, openAiMessages,
  parseDelay, parseOpenAiTurn, toGeminiSchema, toolErrorFromResponse, type ChatMessage, type ToolSpec,
} from '../../src/platform/ai-tools';
import { __resetCapabilityCache } from '../../src/platform/claude';
import { jsonResponse, sseResponse } from '../platform/helpers';

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

afterEach(() => {
  vi.unstubAllGlobals();
  __resetCapabilityCache();
});

function mockFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const fn = vi.fn(async (url: string, init: RequestInit) => respond(url, init));
  vi.stubGlobal('fetch', fn);
  return fn;
}

const modelList = () =>
  jsonResponse({ models: ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.6-flash-image', 'gemini-3.6-pro'].map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) });

describe('Gemini function calling', () => {
  it('builds functionDeclarations with Gemini schema types, system instruction and tool config', () => {
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

  it('lists models once, then reads several functionCall parts from one turn', async () => {
    const f = mockFetch((url) => {
      if (url.includes('/models?')) return modelList();
      return jsonResponse({
        candidates: [
          {
            content: { role: 'model', parts: [{ text: 'Let me check.' }, { functionCall: { name: 'get_dataset_overview', args: {} }, thoughtSignature: 'S1' }, { functionCall: { name: 'describe_variables', args: { names: ['trust5', 'gender'] } } }] },
            finishReason: 'STOP',
          },
        ],
      });
    });
    const turn = await askGeminiTools(gem, { system: 'sys', messages: [{ role: 'user', text: 'Describe' }], tools });
    expect(f.mock.calls[0][0]).toContain('/models?');
    expect(f.mock.calls[1][0]).toContain('/models/gemini-3.6-flash:generateContent');
    expect((f.mock.calls[1][1] as RequestInit & { headers: Record<string, string> }).headers['x-goog-api-key']).toBe('AIza-tools');
    expect(turn.text).toBe('Let me check.');
    expect(turn.toolCalls.map((c) => c.name)).toEqual(['get_dataset_overview', 'describe_variables']);
    expect(turn.toolCalls[1].args).toEqual({ names: ['trust5', 'gender'] });
    expect(new Set(turn.toolCalls.map((c) => c.id)).size).toBe(2);
    expect(turn.raw?.parts).toHaveLength(3);
    // The model list is cached per key.
    await askGeminiTools(gem, { system: 'sys', messages: [{ role: 'user', text: 'Again' }], tools });
    expect(f.mock.calls.filter((c) => String(c[0]).includes('/models?'))).toHaveLength(1);
  });

  it('streams the final answer text over SSE', async () => {
    const ev = (parts: unknown[]) => `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts } }] })}\r\n\r\n`;
    mockFetch((url) => (url.includes('/models?') ? modelList() : sseResponse([ev([{ text: 'Trust is ' }]), ev([{ text: 'moderate.' }])])));
    const seen: string[] = [];
    const turn = await askGeminiTools({ apiKey: 'AIza-stream', model: 'gemini-3.6-flash' }, { system: 's', messages: [{ role: 'user', text: 'q' }], tools, onText: (t) => seen.push(t) });
    expect(turn.text).toBe('Trust is moderate.');
    expect(turn.toolCalls).toEqual([]);
    expect(seen).toEqual(['Trust is ', 'Trust is moderate.']);
  });

  it('reports 429 with the retry delay and daily quota, and MALFORMED_FUNCTION_CALL as its own code', async () => {
    mockFetch(() =>
      jsonResponse(
        {
          error: {
            code: 429,
            message: 'You exceeded your current quota.',
            status: 'RESOURCE_EXHAUSTED',
            details: [
              { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }] },
              { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '21s' },
            ],
          },
        },
        429,
      ),
    );
    await expect(askGeminiTools({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: '', messages: [{ role: 'user', text: 'q' }], tools })).rejects.toMatchObject({ code: 'rate_limited', retryAfterMs: 21_000, daily: false });
    mockFetch(() => jsonResponse({ error: { code: 429, message: 'Quota exceeded', details: [{ violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }] }] } }, 429));
    await expect(askGeminiTools({ apiKey: 'k', model: 'gemini-3.6-flash' }, { system: '', messages: [{ role: 'user', text: 'q' }], tools })).rejects.toMatchObject({ code: 'rate_limited', daily: true });
    mockFetch(() => jsonResponse({ candidates: [{ content: { parts: [] }, finishReason: 'MALFORMED_FUNCTION_CALL' }] }));
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
