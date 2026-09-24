// Realistic Gemini API and OpenAI-compatible replies, shaped like the real services' JSON (the Google
// error bodies below follow what generativelanguage.googleapis.com returns, including the array wrapper
// the Interactions endpoint uses; the Interactions success shapes follow @google/genai 2.24's types).
import { jsonResponse, sseResponse } from './helpers';

// ---------- Google errors ----------

const errorInfo = (reason: string, metadata: Record<string, string> = { service: 'generativelanguage.googleapis.com' }) => ({ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason, domain: 'googleapis.com', metadata });

/** A Google error body. `wrap` puts it in an array, as the Interactions endpoint does. */
export function googleError(code: number, status: string, message: string, details: unknown[] = [], wrap = false): Response {
  const body = { error: { code, message, status, ...(details.length ? { details } : {}) } };
  return jsonResponse(wrap ? [body] : body, code);
}

export const G = {
  apiKeyInvalid: (wrap = true) =>
    googleError(400, 'INVALID_ARGUMENT', 'API key not valid. Please pass a valid API key.', [errorInfo('API_KEY_INVALID'), { '@type': 'type.googleapis.com/google.rpc.LocalizedMessage', locale: 'en-US', message: 'API key not valid. Please pass a valid API key.' }], wrap),
  apiKeyExpired: () => googleError(400, 'INVALID_ARGUMENT', 'API key expired. Please renew the API key.', [errorInfo('API_KEY_INVALID')]),
  accessTokenTypeUnsupported: (method = 'google.learning.gemini.api.interactions.v1beta.InteractionsService.CreateInteractionHttp') =>
    googleError(
      401,
      'UNAUTHENTICATED',
      'Request had invalid authentication credentials. Expected OAuth 2 access token, login cookie or other valid authentication credential. See https://developers.google.com/identity/sign-in/web/devconsole-project.',
      [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'ACCESS_TOKEN_TYPE_UNSUPPORTED', metadata: { service: 'generativelanguage.googleapis.com', method } }],
      true,
    ),
  referrerBlocked: () =>
    googleError(403, 'PERMISSION_DENIED', 'Requests from referer https://hackhead95.github.io/ are blocked.', [errorInfo('API_KEY_HTTP_REFERRER_BLOCKED', { service: 'generativelanguage.googleapis.com', consumer: 'projects/123456789' })]),
  serviceDisabled: () =>
    googleError(
      403,
      'PERMISSION_DENIED',
      'Generative Language API has not been used in project 123456789 before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=123456789 then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.',
      [errorInfo('SERVICE_DISABLED', { consumer: 'projects/123456789', service: 'generativelanguage.googleapis.com' })],
    ),
  keyServiceBlocked: () =>
    googleError(403, 'PERMISSION_DENIED', 'Requests to this API generativelanguage.googleapis.com method google.ai.generativelanguage.v1beta.ModelService.ListModels are blocked.', [errorInfo('API_KEY_SERVICE_BLOCKED')]),
  consumerSuspended: () => googleError(403, 'PERMISSION_DENIED', "Permission denied: Consumer 'api_key:xyz' has been suspended.", [errorInfo('CONSUMER_SUSPENDED')]),
  locationUnsupported: () => googleError(400, 'FAILED_PRECONDITION', 'User location is not supported for the API use.'),
  notForNewUsers: (model: string) =>
    googleError(404, 'NOT_FOUND', `This model models/${model} is no longer available to new users. Please update your code to use a newer model for the latest features and improvements. We recommend you to use the Interactions API (https://ai.google.dev/gemini-api/docs/get-started).`),
  modelNotFound: (model: string) => googleError(404, 'NOT_FOUND', `models/${model} is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.`),
  endpointNotFound: () => new Response('<!DOCTYPE html><html><title>Error 404 (Not Found)!!1</title><p>The requested URL <code>/v1beta/interactions</code> was not found on this server.</p></html>', { status: 404, headers: { 'Content-Type': 'text/html' } }),
  modelPermission: (model: string) => googleError(403, 'PERMISSION_DENIED', `You do not have permission to access the model models/${model}.`),
  quotaZero: (model: string) =>
    googleError(
      429,
      'RESOURCE_EXHAUSTED',
      `You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits.\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: ${model}\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 0, model: ${model}`,
      [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [
            { quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaDimensions: { location: 'global', model }, quotaValue: '0' },
            { quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_input_token_count', quotaId: 'GenerateContentInputTokensPerModelPerMinute-FreeTier', quotaDimensions: { location: 'global', model }, quotaValue: '0' },
          ],
        },
        { '@type': 'type.googleapis.com/google.rpc.Help', links: [{ description: 'Learn more about Gemini API quotas', url: 'https://ai.google.dev/gemini-api/docs/rate-limits' }] },
        { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '43s' },
      ],
    ),
  quotaPerMinute: (model: string) =>
    googleError(
      429,
      'RESOURCE_EXHAUSTED',
      `You exceeded your current quota, please check your plan and billing details.\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 10, model: ${model}\nPlease retry in 21.5s.`,
      [
        { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier', quotaDimensions: { location: 'global', model }, quotaValue: '10' }] },
        { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '21s' },
      ],
    ),
  quotaPerDay: (model: string) =>
    googleError(
      429,
      'RESOURCE_EXHAUSTED',
      `You exceeded your current quota, please check your plan and billing details.\n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 250, model: ${model}`,
      [{ '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [{ quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier', quotaDimensions: { location: 'global', model }, quotaValue: '250' }] }],
    ),
  overloaded: () => googleError(503, 'UNAVAILABLE', 'The model is overloaded. Please try again later.'),
  internal: () => googleError(500, 'INTERNAL', 'An internal error has occurred. Please retry or report in https://developers.generativeai.google/guide/troubleshooting'),
  thinkingBudgetInvalid: () => googleError(400, 'INVALID_ARGUMENT', 'Budget 0 is invalid. This model only works in thinking mode.'),
  thinkingLevelUnsupported: () => googleError(400, 'INVALID_ARGUMENT', 'Thinking level is not supported for this model.', [], true),
  unknownStoreField: () => googleError(400, 'INVALID_ARGUMENT', 'Invalid JSON payload received. Unknown name "store": Cannot find field.', [{ '@type': 'type.googleapis.com/google.rpc.BadRequest', fieldViolations: [{ description: 'Invalid JSON payload received. Unknown name "store": Cannot find field.' }] }], true),
  /** A (made-up) error whose message repeats the key, to prove reports remove it. */
  googleEcho: (key: string) => googleError(400, 'INVALID_ARGUMENT', `Request contains an invalid argument for key ${key}.`, [], true),
  noKey: () => googleError(403, 'PERMISSION_DENIED', "Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API.", [], true),
};

// ---------- Gemini successes ----------

export function modelList(names: string[], methods: string[] = ['generateContent', 'countTokens']): Response {
  return jsonResponse({ models: names.map((n) => ({ name: `models/${n}`, version: '001', displayName: n, supportedGenerationMethods: methods })) });
}

/** A completed Interaction: a thought step (with its signature) and the model's text. */
export function interaction(text: string, model = 'gemini-3.8-flash'): Response {
  return jsonResponse({
    id: 'v1_ChdpbnRlcmFjdGlvbl9leGFtcGxl',
    status: 'completed',
    model,
    created: '2026-09-24T10:00:00Z',
    updated: '2026-09-24T10:00:02Z',
    steps: [
      { type: 'thought', signature: 'EqEYCp4YAQw51sfXzKat7/dBpK2Q1tap++zDf4FXDuECj2q6sWbvPTnYRRxyuEnVJldAvn6AUbBLQnIaxI1NE4Kyg' },
      { type: 'model_output', content: [{ type: 'text', text }] },
    ],
    usage: { total_input_tokens: 9, total_output_tokens: 1, total_thought_tokens: 38, total_tokens: 48 },
  });
}

/** An Interaction that ran out of output tokens while thinking: no text at all. */
export function interactionIncomplete(): Response {
  return jsonResponse({ id: 'v1_x', status: 'incomplete', model: 'gemini-3.8-flash', steps: [{ type: 'thought', signature: 'EqEYsig' }], usage: { total_input_tokens: 9, total_output_tokens: 0, total_thought_tokens: 1024 } });
}

/** An Interaction asking for function calls. */
export function interactionCalls(calls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>, text = ''): Response {
  return jsonResponse({
    id: 'v1_calls',
    status: 'requires_action',
    steps: [{ type: 'thought', signature: 'SIG-T' }, ...(text ? [{ type: 'model_output', content: [{ type: 'text', text }] }] : []), ...calls.map((c) => ({ type: 'function_call', ...c }))],
  });
}

const sse = (o: unknown) => `event: message\ndata: ${JSON.stringify(o)}\n\n`;

/** A streamed Interaction (SSE): created, a thought step with a signature delta, text deltas, completed. */
export function interactionStream(pieces: string[], opts: { calls?: Array<{ id: string; name: string; args: string[] }> } = {}): Response {
  const ev: string[] = [
    sse({ event_type: 'interaction.created', interaction: { id: 'v1_stream', status: 'in_progress', model: 'gemini-3.8-flash' } }),
    sse({ event_type: 'step.start', index: 0, step: { type: 'thought' } }),
    sse({ event_type: 'step.delta', index: 0, delta: { type: 'thought_signature', signature: 'Eq' } }),
    sse({ event_type: 'step.delta', index: 0, delta: { type: 'thought_signature', signature: 'EYsig' } }),
    sse({ event_type: 'step.stop', index: 0 }),
  ];
  let idx = 1;
  if (pieces.length) {
    ev.push(sse({ event_type: 'step.start', index: idx, step: { type: 'model_output', content: [] } }));
    for (const p of pieces) ev.push(sse({ event_type: 'step.delta', index: idx, delta: { type: 'text', text: p } }));
    ev.push(sse({ event_type: 'step.stop', index: idx }));
    idx++;
  }
  for (const c of opts.calls ?? []) {
    ev.push(sse({ event_type: 'step.start', index: idx, step: { type: 'function_call', id: c.id, name: c.name, arguments: {} } }));
    for (const a of c.args) ev.push(sse({ event_type: 'step.delta', index: idx, delta: { type: 'arguments_delta', arguments: a } }));
    ev.push(sse({ event_type: 'step.stop', index: idx, usage: { total_output_tokens: 12 } }));
    idx++;
  }
  ev.push(sse({ event_type: 'interaction.completed', interaction: { id: 'v1_stream', status: opts.calls?.length ? 'requires_action' : 'completed', usage: { total_output_tokens: 5 } } }));
  ev.push('data: [DONE]\n\n');
  // Split events awkwardly across network chunks.
  const all = ev.join('');
  return sseResponse([all.slice(0, 37), all.slice(37, 200), all.slice(200)]);
}

/** generateContent: a thought part, then text carrying a thought signature (Gemini 3 style). */
export function generateContent(text: string): Response {
  return jsonResponse({
    candidates: [{ content: { role: 'model', parts: [{ text: 'Thinking about the request…', thought: true }, { text, thoughtSignature: 'CqoBAdHtim9' }] }, finishReason: 'STOP', index: 0 }],
    usageMetadata: { promptTokenCount: 9, candidatesTokenCount: 1, thoughtsTokenCount: 31, totalTokenCount: 41 },
    modelVersion: 'gemini-2.5-flash',
  });
}

/** generateContent: thinking used every output token, so there is no text. */
export function generateContentMaxTokens(): Response {
  return jsonResponse({ candidates: [{ content: { role: 'model' }, finishReason: 'MAX_TOKENS', index: 0 }], usageMetadata: { promptTokenCount: 9, totalTokenCount: 1033, thoughtsTokenCount: 1024 } });
}

// ---------- OpenAI-compatible services ----------

export const O = {
  groqInvalidKey: () => jsonResponse({ error: { message: 'Invalid API Key', type: 'invalid_request_error', code: 'invalid_api_key' } }, 401),
  groqModelMissing: (m: string) => jsonResponse({ error: { message: `The model \`${m}\` does not exist or you do not have access to it.`, type: 'invalid_request_error', code: 'model_not_found' } }, 404),
  groqDecommissioned: (m: string) =>
    jsonResponse({ error: { message: `The model \`${m}\` has been decommissioned and is no longer supported. Please refer to https://console.groq.com/docs/deprecations for a recommendation on which model to use instead.`, type: 'invalid_request_error', code: 'model_decommissioned' } }, 400),
  groqRateLimit: () =>
    jsonResponse({ error: { message: 'Rate limit reached for model `llama-3.3-70b-versatile` in organization `org_01` service tier `on_demand` on tokens per minute (TPM): Limit 12000, Used 11500, Requested 1800. Please try again in 6.5s.', type: 'tokens', code: 'rate_limit_exceeded' } }, 429),
  groqModels: () => jsonResponse({ object: 'list', data: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'whisper-large-v3', 'openai/gpt-oss-120b'].map((id) => ({ id, object: 'model', owned_by: 'x', active: true })) }),
  openrouterNoAuth: () => jsonResponse({ error: { message: 'No auth credentials found', code: 401 } }, 401),
  openrouterNoEndpoints: (m: string) => jsonResponse({ error: { message: `No endpoints found for ${m}.`, code: 404 } }, 404),
  openrouterCredits: () => jsonResponse({ error: { message: 'This request requires more credits, or fewer max_tokens. You requested up to 4096 tokens, but can only afford 1000.', code: 402 } }, 402),
  openrouterDaily: () => jsonResponse({ error: { message: 'Rate limit exceeded: free-models-per-day. Add 10 credits to unlock 1000 free model requests per day', code: 429, metadata: { headers: { 'X-RateLimit-Limit': '50' } } } }, 429),
  openrouter200Error: () => jsonResponse({ error: { message: 'Provider returned error', code: 502, metadata: { raw: 'upstream timed out', provider_name: 'Chutes' } }, user_id: 'user_x' }),
  openrouterModels: () => jsonResponse({ data: [{ id: 'meta-llama/llama-3.3-70b-instruct' }, { id: 'deepseek/deepseek-chat-v3.1:free' }, { id: 'qwen/qwen3-235b-a22b:free' }, { id: 'openai/text-embedding-3-small' }] }),
  chat: (text: string) => jsonResponse({ id: 'chatcmpl-1', object: 'chat.completion', choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }] }),
};
