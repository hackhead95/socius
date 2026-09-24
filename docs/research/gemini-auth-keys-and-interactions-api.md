# Gemini auth keys (`AQ.`) and the Interactions API: research brief (24 Sep 2026)

## What to do (for implementers)

1. **Send every Gemini key, `AQ.` or `AIza`, only in the `x-goog-api-key` header.** On the native endpoints, never put it in `Authorization: Bearer` (that gives 401 `API_KEY_SERVICE_BLOCKED`) and never put it in `?key=`. On the OpenAI-compatible endpoint, send it **only** as `Authorization: Bearer`. Never send both.
2. **Treat `401 UNAUTHENTICATED` with reason `ACCESS_TOKEN_TYPE_UNSUPPORTED` as "Google did not accept this `AQ.` key".** It is not a sign that one endpoint rejects the key type. A made-up or truncated `AQ.` key gets this exact reply from `models.list`, `generateContent`, `streamGenerateContent` **and** `/v1beta/interactions` (we verified this live). Falling back from Interactions to generateContent on this error does not help. Tell the user to re-copy the key, check it has not been deleted, or create a new key.
3. **Never send an `Api-Revision` header from the browser.** The CORS preflight for it returns 403 on every Gemini endpoint (verified live), so `fetch` fails with a network TypeError. Since 8 June 2026 the server ignores the header anyway.
4. **Interactions API (`POST https://generativelanguage.googleapis.com/v1beta/interactions`)** uses the `steps` schema: output is in `steps[]`, text is in `model_output.content[].text`, and tool calls are `function_call` steps. Streaming uses `stream: true` and sends SSE `data:` JSON events with an `event_type` field (`interaction.created`, `step.start`, `step.delta`, `step.stop`, `interaction.completed`, `error`), then `data: [DONE]`. Non-streaming error bodies are wrapped in an **array**: `[{"error": {...}}]`.
5. **Privacy:** interactions are stored by default (1 day on the free tier, 55 days on paid). Send `store: false` and resend the full step history, including `thought` steps and signatures exactly as received. Do not send `temperature` to Gemini 3.x (it has no Interactions field and is ignored or deprecated). Use `generation_config.thinking_level` instead.

Evidence labels: **[verified]** = official source (Google SDK source code, Google cookbook, or our own live HTTP probe against Google's servers); **[reported]** = forum, blog, or GitHub issue; **[inferred]** = our reasoning.

---

## 1. Auth keys vs standard keys

| | Standard key | Auth (authorization) key |
|---|---|---|
| Prefix | `AIza…` (39 chars) | `AQ.…` (longer, variable) |
| Bound to | a Cloud project | a Cloud **service account** (requests run as that SA) |
| Default API restriction | none (unless you add one) | restricted to Generative Language API ("Gemini API") |
| Created by AI Studio | before 28 May 2026 | all new keys since 28 May 2026 |
| Status in Sept 2026 | unrestricted keys rejected since 19 Jun 2026; **all standard keys being rejected "in September 2026"** | the supported type |

- New AI Studio keys have been auth keys since 28 May 2026. Unrestricted standard keys were rejected from 19 June 2026, and all standard keys are rejected from September 2026. **[reported: summaries of the official page ai.google.dev/gemini-api/docs/api-key shown in search results; could not fetch the page directly]** Sources: [Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key), [byteiota migration summary](https://byteiota.com/gemini-api-key-migration/), [Cybernews](https://cybernews.com/security/google-gemini-reject-unrestricted-standard-keys/), [Google email quoted in python-genai #2391](https://github.com/googleapis/python-genai/issues/2391).
  - What this means for Socius **[inferred]**: users with old `AIza` keys will start failing this month even if nothing changed on our side. The UI should say "Create a new key in AI Studio" when an `AIza` key fails with 401/403.
- Auth keys are bound to a service account and restricted to the Gemini API by default, with "fast-acting leaked key enforcement". Binding a key to an SA "doesn't require any IAM role grants" when the API restriction is set to the Gemini API. **[reported: official docs text quoted in search snippets and in the Google email in python-genai #2391]**
- The org policy `constraints/iam.managed.disableServiceAccountApiKeyCreation` can block creation of SA-bound keys. Google says keys restricted only to the Gemini API are allowed by default. **[reported]** This only matters for Workspace or organization accounts (for example, a university Google account).

### How the key must be sent (verified from SDK source and a live probe)

- `@google/genai` 2.24.0 (npm latest, published 22 Sep 2026), web build `WebAuth.addAuthHeaders`: `headers.append('x-goog-api-key', apiKey)` for **any** key string. There is no special handling for `AQ.` keys. **[verified: `dist/web/index.mjs`, class `WebAuth`, constant `GOOGLE_API_KEY_HEADER = 'x-goog-api-key'`]** The Interactions sub-client uses the same auth hook (`getAuthHeaders` → `x-goog-api-key`); only an explicit `access_token` is sent as `Authorization: Bearer`. **[verified: `dist/index.mjs`, `applyAuth`]**
- On 24 Sep 2026 we probed with an obviously **fake** key `AQ.Ab8RN6L…fake` (no real secret was used). Results for `generativelanguage.googleapis.com/v1beta` **[verified: live probe]**:

| Endpoint | `x-goog-api-key: AQ.fake` | `?key=AQ.fake` | `Authorization: Bearer AQ.fake` |
|---|---|---|---|
| `GET /models` | 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` | 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` | 401 `API_KEY_SERVICE_BLOCKED` |
| `POST /models/{m}:generateContent` | 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` | (same) | (n/a) |
| `POST /models/{m}:streamGenerateContent?alt=sse` | 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` | | |
| `POST /interactions` | 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` (body is an **array**) | 401 same | 401 `API_KEY_SERVICE_BLOCKED` |
| `POST /openai/chat/completions` | 400 "Missing or invalid Authorization header." | | 400 "Invalid Auth key." |
| `POST /openai/chat/completions` with both headers | 400 "Invalid Auth key." | | |
| No key at all, `/interactions` | 403 `PERMISSION_DENIED` "Method doesn't allow unregistered callers" | | |
| Fake `AIza` key, header | 400 `INVALID_ARGUMENT` `API_KEY_INVALID` "API key not valid" | | |
| Garbage key `notakey` | 400 `API_KEY_INVALID` | | |

  **Conclusion [inferred from the probe]:** the server recognises `AQ.` strings as auth keys on every native endpoint. When it cannot validate one (wrong or truncated key, deleted key or service account, or an account-side problem), it answers `401 ACCESS_TOKEN_TYPE_UNSUPPORTED` with the misleading message "Expected OAuth 2 access token…". The reason does not mean "this endpoint does not support auth keys".
- **Valid** `AQ.` keys work on the legacy endpoints too:
  - A user in [hermes-agent #117147](https://github.com/NousResearch/hermes-agent/issues/117147) (20 Sep 2026) got **200** from `…:generateContent?key=AQ…` and `…:streamGenerateContent?key=AQ…` with an AI Studio key restricted to "Gemini API". The same issue confirms that `Authorization: Bearer <key>` on the native surface gives `401 ACCESS_TOKEN_TYPE_UNSUPPORTED`. **[reported]**
  - [hermes-agent #117291](https://github.com/NousResearch/hermes-agent/issues/117291) reports **200** on `/v1beta/openai/chat/completions` with `Authorization: Bearer AQ…` and model `gemini-3.5-flash-lite`. **[reported]**
  - Do **not** reroute `AQ.` keys to Vertex (`aiplatform.googleapis.com`). That gives 403 (billing or API not enabled) for AI Studio keys. **[reported, same issues]**
- Several apps (bazarr #3590, lingarr #532, Sep 2026) report a **404** with `?key=AQ…` and "fixed" it by moving to the header. Their URL used the retired `gemini-2.0-flash`, so the 404 was probably the model, not the key. Either way the header is the safe choice. **[reported / inferred]**

### Known failure reports and what fixes them

| Symptom | Likely cause | Fix |
|---|---|---|
| 401 `ACCESS_TOKEN_TYPE_UNSUPPORTED` on all calls, key looks right | key truncated or mangled on paste (whitespace, a missing tail), deleted key, or a disabled bound service account | re-copy with AI Studio's copy button, or create a new key. A key's SA must be active ("A 401 needs a valid or re-enabled service account" [reported, search snippet]). |
| same, and brand-new keys in new projects also fail | account-level rollout bug; many forum threads Jun–Sep 2026 ask for "AIza restoration" (for example [184612](https://discuss.ai.google.dev/t/aq-auth-key-returns-401-access-token-type-unsupported-on-generative-language-api-a-standard-aiza-keys-on-same-account-still-work/184612), [175673](https://discuss.ai.google.dev/t/account-only-issues-aq-prefix-keys-all-return-401-access-token-type-unsupported-requesting-aiza-key-restoration/175673), [178923](https://discuss.ai.google.dev/t/aq-prefix-key-returns-401-unauthenticated-via-key-on-generatecontent-key-confirmed-valid-in-ai-studio/178923)). No Google staff fix was found in search results. [python-genai #2391](https://github.com/googleapis/python-genai/issues/2391) (same error, May 2026) was closed as "completed" 15 minutes later, probably a server-side fix at that time. | nothing the app can do. Suggest: wait, try another Google account or project, or use a local or on-device model. Show the raw reason in "Copy details". |
| 401 `API_KEY_SERVICE_BLOCKED` with an `AQ.` key | app sent the key as `Authorization: Bearer` to a native endpoint | send `x-goog-api-key` |
| 400 "Multiple authentication credentials received" / "Invalid Auth key." on `/openai/` | key sent twice (Bearer plus header or `?key=`) ([forum 140545](https://discuss.ai.google.dev/t/new-aq-prefix-api-keys-fail-on-openai-compatible-endpoints-with-multiple-authentication-credentials-received/140545)) | send Bearer only |
| App rejects key before sending | client-side regex expects `^AIza` / 39 chars ([OpenNutriTracker #1253](https://github.com/simonoppowa/OpenNutriTracker/issues/1253)) | accept `AQ.` too. The length is not fixed, so check for at least 40 chars [inferred]. |

**Socius-specific notes [inferred, from reading `src/platform/ai-http.ts` as of today]:**
- The header comment says `AQ.` keys "are refused by the older generateContent endpoint (401 … ACCESS_TOKEN_TYPE_UNSUPPORTED), so Interactions is always tried first". The probe and the hermes reports contradict this. Keep Interactions first because it is Google's primary API, but:
  - `apiLevel()` treats `key_type_unsupported` as "try the other API". That just doubles the failed calls. Classify `ACCESS_TOKEN_TYPE_UNSUPPORTED` as a key problem on every endpoint ("Google did not accept this AQ. key…").
  - `geminiKeyWarning` accepts `AQ.` keys of 20 or more chars. Real auth keys are far longer (about 50+), so a warning below about 40 would catch truncated pastes. Treat that threshold as inferred and keep it soft.
- `errorlog.ts` already redacts `AQ\.[0-9A-Za-z._-]{20,}` and `AIza…`. hermes-agent #66920 uses `AQ\.[A-Za-z0-9_-]{40,}`. Ours is broader, which is good.

### CORS (browser calls) [verified: live preflight probe, Origin `https://hackhead95.github.io`]

- The preflight (`OPTIONS`) returns 200 with `access-control-allow-origin: https://hackhead95.github.io` and echoes the allowed request headers for `/v1beta/interactions`, `/v1beta/models…:streamGenerateContent`, `/v1beta/models` and `/v1beta/openai/chat/completions`. Allowed request headers that we tested: `content-type`, `x-goog-api-key`, `authorization`, `x-goog-api-client`.
- **`api-revision` makes the preflight fail (HTTP 403 with no CORS headers) on every endpoint.** Never send it from the browser.
- Error responses (401/400) **carry** `access-control-allow-origin`, so JS can read the error JSON. `retry-after` is **not** in `access-control-expose-headers`. Use the `RetryInfo.retryDelay` in the error body instead.
- So a GitHub Pages site can call Gemini directly from the browser with the user's own key. Google's general advice is still that keys should not live in client code, and a server proxy is "the only secure way" [reported, search snippet]. For a bring-your-own-key tool that keeps the key in the user's own localStorage this is acceptable, as long as the UI says so.

### Key restrictions and the GitHub Pages referrer

- **API restriction:** auth keys come restricted to "Gemini API" (generativelanguage.googleapis.com). Keep it that way. **[reported: official docs text in snippets]**
- **Application restriction (Websites / HTTP referrers):** optional. Pattern syntax [reported: [Adding restrictions to API keys](https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys) snippets]: the scheme is required, and `*` is allowed only for a leading subdomain or a trailing path, for example `https://example.com/*` or `*.example.com`. Only one application-restriction type is allowed per key ([Google Cloud blog, May 2026](https://cloud.google.com/blog/topics/developers-practitioners/api-keys-are-open-secrets), verified fetch).
  - We found **no source that confirms or rules out HTTP-referrer restrictions on SA-bound auth keys.** Treat referrer restriction as optional advice, not a requirement.
- **What to tell Socius users to add [inferred]:** `https://hackhead95.github.io/*`, **not** `https://hackhead95.github.io/socius/*`. Browsers use the default `Referrer-Policy: strict-origin-when-cross-origin`, so a cross-origin `fetch` sends only `Referer: https://hackhead95.github.io/`, and a path-scoped pattern would never match. The code does not set any referrer policy (grep for `referrer` in `src/` and `index.html` finds none). A referrer mismatch shows up as 403 `API_KEY_HTTP_REFERRER_BLOCKED`, which `classifyServiceError` already maps to `referrer_blocked`.

---

## 2. Interactions API in detail

Sources: `@google/genai@2.24.0` `dist/genai.d.ts` and `dist/index.mjs` (npm pack, **[verified]**); google-gemini cookbook notebooks `Streaming.ipynb`, `Function_calling.ipynb`, `JSON_mode.ipynb`, `Authentication.ipynb` on `main` (raw.githubusercontent.com, **[verified]**); [breaking-changes guide (May 2026)](https://ai.google.dev/gemini-api/docs/interactions-breaking-changes-may-2026), [Interactions overview](https://ai.google.dev/gemini-api/docs/interactions-overview), [GA blog post](https://blog.google/innovation-and-ai/technology/developers-tools/interactions-api-general-availability/) (**[reported]**: snippets only).

### Status and versioning

- GA, and "the primary interface for Gemini models and agents" since June 2026. The docs now label generateContent as "Legacy" but it is still supported. **[reported]**
- Schema change: `outputs` plus roles was replaced by **`steps`**. The new schema has been the default since 26 May 2026, and the legacy schema was **removed 8 June 2026**, after which the `Api-Revision` header is ignored. **[reported: breaking-changes guide snippets and multiple secondary sources]** The SDK 2.24 source contains no `Api-Revision` header. **[verified]** The npm README still shows `interaction.outputs` and is **stale**. Follow `genai.d.ts` and the cookbook, which use `steps`.
- Endpoint: `POST https://generativelanguage.googleapis.com/v1beta/interactions`. The SDK builds the path `/{api_version}/interactions` with default `api_version = 'v1beta'`. **[verified]** Also: `GET /v1beta/interactions/{id}` (query `stream`, `last_event_id`, `include_input`), `DELETE /v1beta/interactions/{id}`, `POST /v1beta/interactions/{id}/cancel` (background only). **[verified: SDK paths]**

### Request (`CreateModelInteraction`) [verified: genai.d.ts]

```ts
{
  model: string;                       // e.g. "gemini-3.8-flash", "gemini-flash-latest"
  input?: string | Content | Content[] | Step[];
  system_instruction?: string;         // plain string, not parts
  generation_config?: {
    max_output_tokens?: number;
    thinking_level?: 'minimal' | 'low' | 'medium' | 'high';
    thinking_summaries?: 'auto' | 'none';
    tool_choice?: 'auto' | 'any' | 'none' | 'validated' | { allowed_tools: { mode?, tools?: string[] } };
    seed?: number;
    stop_sequences?: string[];
    // (image/speech/video/transcription configs omitted)
  };
  response_format?: { type: 'text'; mime_type?: 'application/json' | 'text/plain'; schema?: JSONSchema } | [...];
  tools?: Array<{ type: 'function'; name: string; description?: string; parameters?: JSONSchema }
               | { type: 'google_search' } | { type: 'code_execution' } | { type: 'url_context' } | ...>;
  previous_interaction_id?: string;
  store?: boolean;                      // default true
  stream?: boolean;
  background?: boolean;                 // needs store=true
  safety_settings?: [...]; service_tier?: 'flex'|'standard'|'priority'|'deferred'; labels?: {...};
  // deprecated: response_mime_type, response_modalities, cached_content
}
```

- **There is no `temperature`, `top_p` or `top_k` in the Interactions `GenerationConfig`** **[verified: genai.d.ts]**. For Gemini 3.x, Google says to remove them: they are unsupported or ignored, and from `gemini-3.7-flash` frequency/presence penalty and candidate count give **400**. **[reported: "What's new in Gemini 3.5 Flash" and Gemini 3 guide snippets]** Unknown fields probably give 400 "Unknown name" **[inferred]**.
- Content item shapes: `{type:'text', text}`, `{type:'image', data: base64, mime_type}` (also audio, document, video). **[verified]**
- JSON output: `response_format: {type:'text', mime_type:'application/json', schema?: {...JSON Schema...}}`, then parse `output_text` (SDK convenience) or the last `model_output` text. **[verified: cookbook JSON_mode]**
- Thinking: `thinking_level` is the only dial for Gemini 3.x. Gemini 3.5 Flash's default effort is **medium**. **[reported]** For short JSON tasks, `low` or `minimal` saves tokens and latency **[inferred]**. 2.5 models use budgets on generateContent. It is not verified whether they accept `thinking_level` in Interactions, so keep the retry-without-thinking fallback.

### Response (`Interaction`) [verified: genai.d.ts]

```ts
{
  id: string; status: 'in_progress'|'requires_action'|'completed'|'failed'|'cancelled'|'incomplete'|'budget_exceeded'|'queued';
  model?: string; created?: string; updated?: string;
  steps?: Step[];          // POST returns only the output steps; GET returns the full timeline incl. user_input
  usage?: { total_input_tokens, total_output_tokens, total_thought_tokens, total_cached_tokens,
            total_tool_use_tokens, total_tokens, ...by_modality };
  errors?: { code?: string; message?: string }[];
}
Step =
  | { type: 'user_input'; content?: Content[] }
  | { type: 'model_output'; content?: Content[]; error?: { code?: number; message?: string; details? } }
  | { type: 'thought'; signature?: string; summary?: Content[] }
  | { type: 'function_call'; id: string; name: string; arguments: Record<string, any> }
  | { type: 'function_result'; call_id: string; name?: string; result: string | Content[] | object; is_error?: boolean }
  | google_search_call/result, code_execution_call/result, url_context_call/result, mcp_server_tool_call/result, ...
```

- Text: take the text items of the **last run of `model_output` steps**. The SDK's `output_text` walks steps backwards, stops at `user_input`, and concatenates `type:'text'` items. **[verified: `addOutputProperties` in index.mjs]** The cookbook uses `interaction.steps[-1].content[0].text`. **[verified]**
- `status: 'requires_action'` probably accompanies pending function calls **[inferred from the enum; not seen in samples]**. The cookbook loops while any step has `type === 'function_call'`. **[verified]**
- Output steps can include a leading `thought` step (the cookbook shows `Type: thought` then `Type: function_call`). **[verified]**

### Errors

- Non-streaming error body: **`[{"error": {"code": 401, "message": "...", "status": "UNAUTHENTICATED", "details": [{"@type": "type.googleapis.com/google.rpc.ErrorInfo", "reason": "...", "metadata": {"method": "google.learning.gemini.api.interactions.v1beta.InteractionsService.CreateInteractionHttp", "service": "generativelanguage.googleapis.com"}}]}}]`**. It is a JSON **array** with `content-type: application/json`, even when `stream: true` was requested. **[verified: live probe]** `generateContent` errors are a plain object. `streamGenerateContent?alt=sse` errors are a plain JSON object sent with `content-type: text/event-stream`, not SSE-framed. **[verified]** `parseServiceError` in Socius already unwraps arrays.
- Mid-stream error event: `{event_type: 'error', error?: {code?: string, message?: string}, event_id?}`. **[verified: genai.d.ts `ErrorEvent`]**
- A failed model step can carry `model_output.error` (a google.rpc.Status). **[verified]**
- 429 `RESOURCE_EXHAUSTED` carries `QuotaFailure.violations[].quotaId` and `RetryInfo.retryDelay`, the same as generateContent **[inferred: same Google API frontend; not probed with a real key]**. The SDK's retry codes for create are 408, 409, 429 and 5XX, with backoff from 0.5 s to 8 s for up to 30 s. **[verified]**

### Streaming (SSE) [verified: SDK + cookbook; reported: event order from docs snippets]

- Request: `stream: true` in the body. The SDK sends `Accept: text/event-stream` to the same URL. Others use `?alt=sse`, which also works: the server replied with `text/event-stream` in our probe **[verified]**.
- Wire format: SSE blocks whose `data:` holds JSON with an `event_type` field. The SDK's parser is data-only ("flattened") and stops at the sentinel **`data: [DONE]`**. **[verified: `sse(200,{sentinel:"[DONE]",flattened:true})`]** Docs show `event:` lines too. Ignore them and dispatch on `event_type`.
- Order: `interaction.created` → for each step: `step.start` (`{index, step}`, where the step object is the initial shape, for example `{type:'model_output'}`, `{type:'thought'}`, or `{type:'function_call', id, name, arguments}`) → `step.delta` × n (`{index, delta}`) → `step.stop` (`{index, usage?, step_usage?}`) → `interaction.completed` (`{interaction: {id, status, model, usage, steps?}}`). `interaction.status_update` (`{interaction_id, status}`) may appear. Each event can carry `event_id`, used to resume with `GET /interactions/{id}?stream=true&last_event_id=…` (needs `store: true`).
- `delta.type` values that matter: `text` (`{text}`), `arguments_delta` (`{arguments?: string}`, a partial JSON string for function-call args; concatenate per `index` and `JSON.parse` at `step.stop`), `thought_summary` (`{content}`), `thought_signature` (`{signature}`), `text_annotation`, plus image, audio and tool deltas. **[verified: `StepDeltaData` union]**
- Minimal client loop **[inferred from the types]**: keep `steps[index]`. On `step.start` store a copy of `step`. On `step.delta` append `text` into that step's content (or its args string, or its signature). On `step.stop` finalize. On `interaction.completed` read `usage` and `id`. On `error` throw.

### Function calling [verified: cookbook Function_calling.ipynb, SDK README, genai.d.ts]

```jsonc
// declare
"tools": [{ "type": "function", "name": "run_frequencies", "description": "…",
            "parameters": { "type": "object", "properties": { "variable": { "type": "string" } }, "required": ["variable"] } }]
// model asks (in steps):
{ "type": "function_call", "id": "call_abc", "name": "run_frequencies", "arguments": { "variable": "age" } }
// you answer (stateful): new create() with
{ "model": "…", "previous_interaction_id": "<id>", "tools": [ …same tools… ],
  "input": [ { "type": "function_result", "call_id": "call_abc", "name": "run_frequencies", "result": "…string or content…" } ] }
```

- Parallel calls: several `function_call` steps in one turn. Return one `function_result` per call in a single `input` array. **[verified: cookbook "party" example]**
- The cookbook **re-sends `tools` on every follow-up** call. Do the same, because tools do not persist across interactions **[inferred from the cookbook pattern]**.
- There is no automatic function calling in `interactions.create`; the client runs the tool loop. **[verified: cookbook note]**
- `tool_choice: 'none'` in `generation_config` forces a text answer. `'any'` forces a call. **[verified: types]**
- Legacy generateContent schema (`functionDeclarations`, `functionCall`/`functionResponse` parts) differs. Do not mix the two.

### Multi-turn state, `store`, retention

- `store` defaults to **true**. Interaction objects are kept **55 days (paid) / 1 day (free tier)**. `store: false` opts out, and then **`previous_interaction_id` cannot be used** and `background` is not allowed. **[reported: Interactions overview quoted in snippets and in agentdock #165]**
- Stateless multi-turn (`store: false`): send `input` as the **full step list**: the original `user_input` step, **all model steps exactly as received (including `thought` steps with `signature`, and `function_call` steps)**, then your `function_result` steps. "You MUST always resend all thought blocks exactly as they were received". Signatures exist on thought and tool-call/result steps for Gemini 3+. **[reported: docs snippets for thinking / function calling]** The SDK 2.24 `FunctionCallStep` type has no `signature` field, so keep **unknown fields** when echoing steps back (store the raw JSON objects) **[inferred]**.
- For a research tool that handles survey data, `store: false` plus client-side history is the privacy-preserving default. The Socius code already sends `store: false` (it retries without it if refused). Good.

### Models (Sept 2026)

- Cookbook model picker (main branch, Sept 2026): `gemini-3.8-flash` (default), `gemini-3.7-flash`, `gemini-3.6-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-pro-preview`, `gemini-2.5-pro`. **[verified]**
- The SDK `Model` enum also lists `gemini-flash-latest`, `gemini-flash-lite-latest`, `gemini-pro-latest`, `gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, and Gemma 4 (`gemma-4-26b-a4b-it`, `gemma-4-31b-it`). **[verified]** The enum is open (`string & {}`).
- Gemini 3.8 Flash was released 2 Sep 2026. `gemini-flash-latest` points to it. It is on the free tier. **[reported]**
- **Free tier [reported, not stable]:** Flash-only (Pro moved behind billing in April 2026). Measured limits are about **20 requests/day** for current Flash models and about **500/day for Flash-Lite** (3.5 / 3.1 Flash-Lite), with around 10–15 RPM. Google no longer publishes fixed numbers, and AI Studio shows each project's live limits. RPD resets at midnight Pacific. Sources: [dev.to measurement](https://dev.to/romeroyang/geminis-free-tier-measured-20-requests-a-day-and-google-no-longer-publishes-the-number-4gf2), [scriptbyai](https://www.scriptbyai.com/gemini-api-free-tier-limits/), [rate-limits doc](https://ai.google.dev/gemini-api/docs/rate-limits).
  - What this means for Socius **[inferred]**: for an assistant that makes several tool-loop calls per question, **default to a Flash-Lite model** (for example `gemini-flash-lite-latest` or the newest `*-flash-lite` from `models.list`). Fall back to Flash when quality matters. Keep the "limit: 0 → try next model" logic. Every tool-loop turn counts as one request.
- `GET /v1beta/models` is still the live catalog. `supportedGenerationMethods` includes `generateContent` but there is no documented "supportsInteractions" flag, so do not filter on it for Interactions **[reported: agentdock #165, which checked the docs 24 Sep 2026]**.

### OpenAI-compatible endpoint

- `POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` with `Authorization: Bearer <AQ or AIza key>` only. Header-only (`x-goog-api-key`) gives 400 "Missing or invalid Authorization header". **[verified: probe]** It works with valid `AQ.` keys **[reported: hermes #117291]**. CORS is OK **[verified]**.

---

## 3. Minimal examples

```bash
# Non-streaming, stateless, JSON output
curl -sS -X POST "https://generativelanguage.googleapis.com/v1beta/interactions" \
  -H "x-goog-api-key: $GEMINI_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"gemini-flash-lite-latest","store":false,
       "system_instruction":"You are a statistics tutor.",
       "input":"Give two tips for reading a crosstab as JSON {\"tips\": string[]}",
       "response_format":{"type":"text","mime_type":"application/json"},
       "generation_config":{"max_output_tokens":800,"thinking_level":"low"}}'

# Streaming
curl -N -sS -X POST "https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse" \
  -H "x-goog-api-key: $GEMINI_API_KEY" -H "Content-Type: application/json" -H "Accept: text/event-stream" \
  -d '{"model":"gemini-flash-latest","input":"Explain Cramer V in one line","stream":true,"store":false}'
```

```ts
// Browser fetch (no SDK). Do NOT add an Api-Revision header (CORS preflight fails).
const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, Accept: 'text/event-stream' },
  body: JSON.stringify({ model, input, system_instruction, tools, store: false, stream: true,
                         generation_config: { max_output_tokens: 2048, thinking_level: 'low' } }),
  signal,
});
if (!res.ok) { const j = await res.json().catch(() => null); const err = Array.isArray(j) ? j[0]?.error : j?.error; /* classify err.details[].reason */ }
// Read SSE: for each `data:` payload: if '[DONE]' stop; else ev = JSON.parse(payload) and switch(ev.event_type):
//  'step.start'  -> steps[ev.index] = structuredClone(ev.step)
//  'step.delta'  -> ev.delta.type === 'text' ? append text / 'arguments_delta' ? argsBuf[ev.index] += ev.delta.arguments
//                   / 'thought_signature' ? steps[ev.index].signature = ev.delta.signature
//  'step.stop'   -> if function_call and argsBuf: steps[i].arguments = JSON.parse(argsBuf[i])
//  'interaction.completed' -> id = ev.interaction.id; usage = ev.interaction.usage
//  'error'       -> throw ev.error
```

## 4. Open questions (not resolvable without a real key)

- Whether auth keys accept an HTTP-referrer application restriction. Not found in any source.
- The exact 429 body on `/interactions` (assumed to be the same as generateContent).
- Whether 2.5-series models accept `thinking_level` on Interactions.
- Whether `function_call` steps carry a `signature` field on the wire. Docs say yes for Gemini 3+; SDK types omit it. Echo raw objects to be safe.
