---
id: src/platform/ai-http.ts
type: module
file: src/platform/ai-http.ts
area: platform
---

# src/platform/ai-http.ts

*Module* · area [[platform]] · 1353 lines

> AI over HTTP: Google Gemini and any OpenAI-compatible chat completions service (Groq, OpenRouter, a local Ollama or LM Studio, ...). Browser fetch only; the user's own key goes straight from this page to the service, never anywhere else. Gemini, as of 2026: - Google's primary API is the Interactions API (POST /v1beta/interactions), tried first; the older generateContent endpoint is a fallback w...

## Imports
- [[claude.ts]] · value

## Reads
- [[socius.ai.geminiModel]]

## Writes
- [[socius.ai.geminiModel]]

## Tested by
- [[ai-tools.test.ts]] · import
- [[ai-matrix.fuzz.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai-http.test.ts]] · import
- [[ai.test.ts]] · import

## Imported by
- [[AiSettingsDialog.tsx]] · value
- [[install.ts]] · value
- [[ai-diagnose.ts]] · value
- [[ai-local.ts]] · value
- [[ai-tools.ts]] · re-export, value
- [[platform/ai.ts]] · value
- [[ai-tools.test.ts]] · value
- [[ai-matrix.fuzz.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai-http.test.ts]] · value
- [[ai.test.ts]] · value

## Implements provider
- [[Providers/gemini|gemini]]
- [[Providers/openai|openai]]

## Types
HttpAskOptions (line 28) · GeminiPreference (line 46) · GeminiConfig (line 48) · OpenAiConfig (line 53) · GeminiApi (line 61) · AiAttempt (line 73) · AiErrorInfo (line 94) · AiHttpError (line 114) · GeminiKeyKind (line 148) · ServiceError (line 194) · ErrorPlace (line 265) · BuiltRequest (line 418) · GeminiModelInfo (line 559) · InteractionOptions (line 765) · GeminiCallSpec (line 829) · GeminiRunOptions (line 835) · GeminiRunResult (line 843)

## Private helpers
decorate() (line 123) · hostOf() (line 340) · isLocalHost() (line 349) · displayUrl() (line 363) · browserOnline() (line 368) · timed() (line 387) · retryBaseMs (line 401) · sleep() (line 407) · SPECIAL_MODEL (line 564) · AUTO_MODEL (line 615) · listCache (line 628) · MEMORY_KEY (line 652) · badModels (line 653) · noThinking (line 654) · memory (line 655) · keyHash() (line 657) · readMemory() (line 666) · remember() (line 679) · remembered() (line 691) · LIST_FATAL (line 704) · thinkingRoom() (line 759) · shortReason() (line 893) · outputsToSteps() (line 1018) · stepText() (line 1042) · structuredCloneSafe() (line 1158) · readInteractionReply() (line 1166) · readGenerateContentReply() (line 1190) · isLocalUrl() (line 1274)

## Symbols

### GEMINI_BASE
*const* · line 59 · exported
- Used in: [[ai-tools.ts]]

### GEMINI_INTERACTIONS_URL
*const* · line 60 · exported
- Uses: [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]]

### DEFAULT_TIMEOUT_MS
*const* · line 64 · exported
> Default wait for a service to start answering.

### CHECK_TIMEOUT_MS
*const* · line 66 · exported
> Wait used by the connection check and the model list.
- Used in: [[ai-diagnose.ts]]

### MAX_MODEL_TRIES
*const* · line 68 · exported
> Models tried at most for one request (the chosen one plus fallbacks).

### aiHttpError
*function* · line 116 · exported
- Calls: [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### cancelled
*function* · line 130
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### sanitizeApiKey
*function* · line 139 · exported
> Clean a pasted key: drop spaces, line breaks and invisible characters, surrounding quotes, and prefixes such as `GEMINI_API_KEY=` or `Bearer `. Keys are plain ASCII, so anything else is removed (it would otherwise make the browser refuse...
- Used in: [[AiSettingsDialog.tsx]], [[ai-diagnose.ts]], [[ai-tools.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### geminiKeyKind
*function* · line 151 · exported
> "AIza..." (classic Google API key), "AQ." (AI Studio auth key, 2026) or something else.
- Calls: [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[ai-http.test.ts]]

### geminiKeyWarning
*function* · line 159 · exported
> A gentle warning when a pasted Gemini key does not look like one (testing is still allowed).
- Calls: [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-http.test.ts]]

### describeKey
*function* · line 173 · exported
> A short, safe description of a key for reports: never the key itself.
- Calls: [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### parseDelay
*function* · line 185 · exported
> "21s", "1.5s", "300ms", "30" -> milliseconds.
- Used in: [[ai-tools.test.ts]]

### parseServiceError
*function* · line 209 · exported
- Calls: [[ai-http.ts#parseDelay|parseDelay()]]
- Used in: [[ai-http.test.ts]]

### classifyServiceError
*function* · line 268 · exported
> A stable AI error code for a refused request (see aiErrorMessage in ./ai).
- Used in: [[ai-http.test.ts]]

### httpErrorCode
*function* · line 299 · exported
> Map an HTTP error status (and the service's message) to a stable AI error code.
- Calls: [[ai-http.ts#classifyServiceError|classifyServiceError()]], [[ai-http.ts#parseServiceError|parseServiceError()]]
- Used in: [[ai-tools.ts]], [[ai-http.test.ts]]

### errorFromService
*function* · line 304 · exported
> An AiError for a refused request, carrying the service's own words and status.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#classifyServiceError|classifyServiceError()]]

### errorFromPayload
*function* · line 321 · exported
> An error reported inside a response body or a stream event (`{error: {...}}`).
- Calls: [[ai-http.ts#errorFromService|errorFromService()]], [[ai-http.ts#parseServiceError|parseServiceError()]]

### errorFromResponse
*function* · line 328 · exported
- Calls: [[ai-http.ts#errorFromService|errorFromService()]], [[ai-http.ts#parseServiceError|parseServiceError()]]
- Used in: [[ai-tools.ts]]

### loopbackFetchInit
*function* · line 358 · exported
> Extra fetch options for an address on this computer: Chrome's Local Network Access (142+) asks the user's permission for requests marked `targetAddressSpace: 'loopback'`; other browsers ignore the field. (ai-local.ts marks its probes the...
- Calls: [[ai-http.ts]]

### networkError
*function* · line 377
> A fetch that failed before any answer: offline, blocked, or a key the browser refused to send.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts]]

### __setHttpRetryDelay
*function* · line 403 · exported
> Test hook: the wait before retrying a busy service.
- Uses: [[ai-http.ts]]
- Used in: [[ai-tools.test.ts]], [[ai-diagnose.test.ts]], [[ai-http.test.ts]]

### httpSend
*function* · line 433
> Send one request. Rejects an AiHttpError for no answer, a timeout, or an HTTP error status.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#cancelled|cancelled()]], [[ai-http.ts#errorFromService|errorFromService()]], [[ai-http.ts#loopbackFetchInit|loopbackFetchInit()]], [[ai-http.ts#networkError|networkError()]], [[ai-http.ts#parseServiceError|parseServiceError()]], [[ai-http.ts]]

### readJsonBody
*function* · line 481
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#cancelled|cancelled()]]

### readSse
*function* · line 491 · exported
> Read a server-sent-events body, calling onData for each `data:` payload (joined across lines).
- Used in: [[ai-tools.ts]], [[ai-http.test.ts]]

### readJsonEvents
*function* · line 529 · exported
> Read an SSE body of JSON payloads. An `{error}` payload (or an Interactions "error" event) rejects. Resolves to the number of payloads that were valid JSON.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#cancelled|cancelled()]], [[ai-http.ts#errorFromPayload|errorFromPayload()]], [[ai-http.ts#readSse|readSse()]]
- Uses: [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[ai-tools.ts]]

### geminiModelVersion
*function* · line 567 · exported
> Version number in a model id ("gemini-3.6-flash" -> 3.6), or 0 for aliases such as gemini-flash-latest.

### rankGeminiModels
*function* · line 577 · exported
> Rank the models a key may use for text: newest stable general-purpose Flash first (or Flash-Lite first with prefer 'lite'), then the other, Pro last (it has no free tier); previews after stable releases of the same version. Google's "-la...
- Calls: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]]
- Uses: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]], [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### pickGeminiModel
*function* · line 605 · exported
> The best model id for text, or '' when none fits.
- Calls: [[ai-http.ts#rankGeminiModels|rankGeminiModels()]]
- Used in: [[ai-http.test.ts]]

### defaultGeminiModels
*function* · line 610 · exported
> Used when the model list cannot be read (the aliases are maintained by Google).

### geminiModelName
*function* · line 618 · exported
> Model id without a "models/" prefix; '' means: pick automatically.
- Uses: [[ai-http.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-diagnose.ts]], [[ai-tools.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### geminiPreference
*function* · line 624 · exported
> What the automatic choice favours for a model setting: Flash only when the setting says "auto-flash".
- Used in: [[AiSettingsDialog.tsx]], [[platform/ai.ts]]

### listGeminiModels
*function* · line 631 · exported
> The models this key may use (GET /v1beta/models), cached per key for this visit.
- Calls: [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#readJsonBody|readJsonBody()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-http.ts#CHECK_TIMEOUT_MS|CHECK_TIMEOUT_MS]], [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]], [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]]

### __resetGeminiState
*function* · line 696 · exported
> Test hook: forget model lists, remembered models and failures.
- Uses: [[ai-http.ts]]
- Used in: [[ai-tools.test.ts]], [[ai-diagnose.test.ts]], [[ai-http.test.ts]], [[ai.test.ts]]

### geminiCandidates
*function* · line 707 · exported
> Candidate models for this key, best first: the one that answered last time, then the ranked list.
- Calls: [[ai-http.ts#defaultGeminiModels|defaultGeminiModels()]], [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#listGeminiModels|listGeminiModels()]], [[ai-http.ts#rankGeminiModels|rankGeminiModels()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]]
- Uses: [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]]

### resolveGeminiModel
*function* · line 726 · exported
> The model to use for this key: the user's explicit choice, else the best candidate.
- Calls: [[ai-http.ts#geminiCandidates|geminiCandidates()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]]

### lastResolvedGeminiModel
*function* · line 733 · exported
> The model that last answered for this key, or the best one listed (for display); '' if unknown.
- Calls: [[ai-http.ts#rankGeminiModels|rankGeminiModels()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]]
- Uses: [[ai-http.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[install.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### interactionThinkingLevel
*function* · line 745 · exported
> Thinking level for the Interactions API: 'low' for Gemini 3 and newer and for aliases; none for 2.x.
- Calls: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]]

### geminiThinkingConfig
*function* · line 751 · exported
> generateContent `thinkingConfig`: Gemini 3 takes a level, 2.5 Flash a zero budget, 2.5 Pro its minimum.
- Calls: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]]
- Used in: [[ai-tools.ts]]

### buildInteractionRequest
*function* · line 779 · exported
> POST /v1beta/interactions. `input` is a prompt string or a list of steps (a whole conversation).
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#interactionThinkingLevel|interactionThinkingLevel()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]]
- Uses: [[ai-http.ts#GEMINI_INTERACTIONS_URL|GEMINI_INTERACTIONS_URL]]
- Used in: [[ai-tools.ts]], [[ai-http.test.ts]]

### buildGeminiRequest
*function* · line 807 · exported
> The older generateContent endpoint (still used for "AIza" keys when Interactions is not usable).
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiModelVersion|geminiModelVersion()]], [[ai-http.ts#geminiThinkingConfig|geminiThinkingConfig()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]]
- Uses: [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]]
- Used in: [[ai-http.test.ts]]

### modelLevel
*function* · line 851
> Errors where another model may work.

### apiLevel
*function* · line 858
> Errors where the other Gemini API may work (for keys that generateContent accepts).

### sendGemini
*function* · line 863
- Calls: [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts]]
- Uses: [[ai-http.ts]]

### summarise
*function* · line 899
> One error for "every model tried failed".
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]]
- Uses: [[ai-http.ts]]

### geminiRun
*function* · line 928 · exported
> Send a Gemini request, choosing the model and API: the typed model (or the best listed one), then up to MAX_MODEL_TRIES models in all; Interactions first, generateContent as a fallback for keys it accepts. Resolves with the successful re...
- Calls: [[ai-http.ts#apiLevel|apiLevel()]], [[ai-http.ts#geminiCandidates|geminiCandidates()]], [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-http.ts#modelLevel|modelLevel()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts#sendGemini|sendGemini()]], [[ai-http.ts#summarise|summarise()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-http.ts#DEFAULT_TIMEOUT_MS|DEFAULT_TIMEOUT_MS]], [[ai-http.ts#MAX_MODEL_TRIES|MAX_MODEL_TRIES]], [[ai-http.ts]]
- Used in: [[ai-tools.ts]]

### geminiText
*function* · line 983 · exported
> Text of a generateContent response (or one streamed chunk). Thought parts are skipped.
- Used in: [[ai-http.test.ts]]

### geminiBlocked
*function* · line 990 · exported
> generateContent returns 200 with no text when a request is blocked by its safety filter.
- Used in: [[ai-tools.ts]]

### geminiEmptyError
*function* · line 997 · exported
> Why a generateContent reply had no text, as an AiError.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]]
- Used in: [[ai-tools.ts]]

### interactionOutputSteps
*function* · line 1031 · exported
> Steps produced by the model in this interaction (after the last input step the response may echo).
- Calls: [[ai-http.ts]]

### InteractionAccumulator
*class* · line 1052 · exported
> Collects an Interactions reply, whole or streamed (step.start / step.delta / step.stop events).
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#errorFromPayload|errorFromPayload()]], [[ai-http.ts#interactionOutputSteps|interactionOutputSteps()]], [[ai-http.ts]]
- Used in: [[ai-tools.ts]]

### askGemini
*function* · line 1222 · exported
- Calls: [[ai-http.ts#buildGeminiRequest|buildGeminiRequest()]], [[ai-http.ts#buildInteractionRequest|buildInteractionRequest()]], [[ai-http.ts#geminiRun|geminiRun()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[ai-diagnose.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### normaliseBaseUrl
*function* · line 1244 · exported
> Base URL without a trailing slash or a pasted "/chat/completions".
- Used in: [[AiSettingsDialog.tsx]], [[ai-diagnose.ts]], [[ai-local.ts]], [[ai-tools.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### buildOpenAiRequest
*function* · line 1248 · exported
- Calls: [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[ai-http.test.ts]]

### openAiText
*function* · line 1263 · exported

### openAiDelta
*function* · line 1269 · exported

### listOpenAiModels
*function* · line 1279 · exported
> Model ids an OpenAI-compatible service offers (GET {base}/models), or null when it has no such list.
- Calls: [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#readJsonBody|readJsonBody()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Uses: [[ai-http.ts#CHECK_TIMEOUT_MS|CHECK_TIMEOUT_MS]]
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### suggestOpenAiModels
*function* · line 1296 · exported
> Models worth offering in a picker: chat models only, free ones first (OpenRouter's ":free").
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### streamOpenAi
*function* · line 1302
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#openAiDelta|openAiDelta()]], [[ai-http.ts#readJsonEvents|readJsonEvents()]]

### askOpenAiCompatible
*function* · line 1323 · exported
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#buildOpenAiRequest|buildOpenAiRequest()]], [[ai-http.ts#errorFromPayload|errorFromPayload()]], [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#openAiText|openAiText()]], [[ai-http.ts#readJsonBody|readJsonBody()]], [[ai-http.ts#streamOpenAi|streamOpenAi()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-http.ts#DEFAULT_TIMEOUT_MS|DEFAULT_TIMEOUT_MS]], [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]], [[ai-local.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]
