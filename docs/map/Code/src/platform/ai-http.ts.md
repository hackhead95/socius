---
id: src/platform/ai-http.ts
type: module
file: src/platform/ai-http.ts
area: platform
---

# src/platform/ai-http.ts

*Module* · area [[platform]] · 1616 lines

> AI over HTTP: Google Gemini and any OpenAI-compatible chat completions service (Groq, OpenRouter, a local Ollama or LM Studio, ...). Browser fetch only; the user's own key goes straight from this page to the service, never anywhere else. Gemini, as of 2026: - Google's primary API is the Interactions API (POST /v1beta/interactions), tried first; the older generateContent endpoint is a fallback w...

## Imports
- [[ai-pace.ts]] · value
- [[ai-timing.ts]] · type-only
- [[claude.ts]] · value

## Reads
- [[socius.ai.geminiModel]] · readJsonStore
- [[socius.ai.geminiModels]] · readJsonStore

## Writes
- [[socius.ai.geminiModel]] · writeJsonStore
- [[socius.ai.geminiModels]] · writeJsonStore

## Tested by
- [[ai-tools.test.ts]] · import
- [[ai-matrix.fuzz.test.ts]] · import
- [[ai-latency.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai-http.test.ts]] · import
- [[ai-pace.test.ts]] · import
- [[ai.test.ts]] · import

## Imported by
- [[AiSettingsDialog.tsx]] · value
- [[install.ts]] · value
- [[drivers.ts]] · value
- [[ai-diagnose.ts]] · value
- [[ai-local.ts]] · value
- [[ai-tools.ts]] · re-export, value
- [[platform/ai.ts]] · type-only, value
- [[ai-tools.test.ts]] · value
- [[ai-matrix.fuzz.test.ts]] · value
- [[ai-latency.test.ts]] · dynamic
- [[ai-diagnose.test.ts]] · value
- [[ai-http.test.ts]] · value
- [[ai-pace.test.ts]] · value
- [[ai.test.ts]] · value

## Implements provider
- [[Providers/gemini|gemini]]
- [[Providers/openai|openai]]

## Types
HttpAskOptions (line 35) · ThinkingEffort (line 57) · GeminiPreference (line 60) · GeminiConfig (line 62) · OpenAiConfig (line 67) · GeminiApi (line 75) · AiAttempt (line 87) · AiErrorInfo (line 108) · AiHttpError (line 132) · GeminiKeyKind (line 166) · ServiceError (line 212) · ErrorPlace (line 289) · BuiltRequest (line 443) · GeminiModelInfo (line 594) · ThinkingLevel (line 903) · InteractionOptions (line 938) · GeminiBuildOptions (line 1006) · GeminiCallSpec (line 1013) · GeminiRunOptions (line 1019) · GeminiRunResult (line 1031)

## Private helpers
decorate() (line 141) · hostOf() (line 365) · isLocalHost() (line 374) · displayUrl() (line 388) · browserOnline() (line 393) · timed() (line 412) · retryBaseMs (line 426) · sleep() (line 432) · SPECIAL_MODEL (line 599) · AUTO_MODEL (line 650) · MODELS_KEY (line 667) · MODELS_MAX_AGE_MS (line 668) · MEMORY_KEY (line 669) · listCache (line 679) · badModels (line 680) · modelStore (line 681) · memory (line 682) · readJsonStore() (line 693) · writeJsonStore() (line 702) · readModelStore() (line 710) · modelRecord() (line 727) · saveModelRecord() (line 731) · noteThinkingRefused() (line 741) · thinkingRefused() (line 755) · readMemory() (line 800) · remember() (line 812) · remembered() (line 823) · rememberedApi() (line 828) · limitSleep (line 845) · LIST_FATAL (line 852) · thinkingRoom() (line 931) · shortReason() (line 1097) · outputsToSteps() (line 1281) · stepText() (line 1305) · structuredCloneSafe() (line 1421) · readInteractionReply() (line 1429) · readGenerateContentReply() (line 1453) · isLocalUrl() (line 1537)

## Symbols

### GEMINI_BASE
*const* · line 73 · exported
- Used in: [[ai-tools.ts]]

### GEMINI_INTERACTIONS_URL
*const* · line 74 · exported
- Uses: [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]]

### DEFAULT_TIMEOUT_MS
*const* · line 78 · exported
> Default wait for a service to start answering.

### CHECK_TIMEOUT_MS
*const* · line 80 · exported
> Wait used by the connection check and the model list.
- Used in: [[ai-diagnose.ts]]

### MAX_MODEL_TRIES
*const* · line 82 · exported
> Models tried at most for one request (the chosen one plus fallbacks).

### aiHttpError
*function* · line 134 · exported
- Calls: [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### cancelled
*function* · line 148
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### sanitizeApiKey
*function* · line 157 · exported
> Clean a pasted key: drop spaces, line breaks and invisible characters, surrounding quotes, and prefixes such as `GEMINI_API_KEY=` or `Bearer `. Keys are plain ASCII, so anything else is removed (it would otherwise make the browser refuse...
- Used in: [[AiSettingsDialog.tsx]], [[ai-diagnose.ts]], [[ai-tools.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### geminiKeyKind
*function* · line 169 · exported
> "AIza..." (classic Google API key), "AQ." (AI Studio auth key, 2026) or something else.
- Calls: [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[ai-http.test.ts]]

### geminiKeyWarning
*function* · line 177 · exported
> A gentle warning when a pasted Gemini key does not look like one (testing is still allowed).
- Calls: [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-http.test.ts]]

### describeKey
*function* · line 191 · exported
> A short, safe description of a key for reports: never the key itself.
- Calls: [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### parseDelay
*function* · line 203 · exported
> "21s", "1.5s", "300ms", "30" -> milliseconds.
- Used in: [[ai-tools.test.ts]]

### parseServiceError
*function* · line 229 · exported
- Calls: [[ai-http.ts#parseDelay|parseDelay()]], [[ai-pace.ts#parseRateLimit|parseRateLimit()]]
- Used in: [[ai-http.test.ts]], [[ai-pace.test.ts]]

### classifyServiceError
*function* · line 292 · exported
> A stable AI error code for a refused request (see aiErrorMessage in ./ai).
- Used in: [[ai-http.test.ts]]

### httpErrorCode
*function* · line 323 · exported
> Map an HTTP error status (and the service's message) to a stable AI error code.
- Calls: [[ai-http.ts#classifyServiceError|classifyServiceError()]], [[ai-http.ts#parseServiceError|parseServiceError()]]
- Used in: [[ai-tools.ts]], [[ai-http.test.ts]]

### errorFromService
*function* · line 328 · exported
> An AiError for a refused request, carrying the service's own words and status.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#classifyServiceError|classifyServiceError()]]

### errorFromPayload
*function* · line 346 · exported
> An error reported inside a response body or a stream event (`{error: {...}}`).
- Calls: [[ai-http.ts#errorFromService|errorFromService()]], [[ai-http.ts#parseServiceError|parseServiceError()]]

### errorFromResponse
*function* · line 353 · exported
- Calls: [[ai-http.ts#errorFromService|errorFromService()]], [[ai-http.ts#parseServiceError|parseServiceError()]]
- Used in: [[ai-tools.ts]]

### loopbackFetchInit
*function* · line 383 · exported
> Extra fetch options for an address on this computer: Chrome's Local Network Access (142+) asks the user's permission for requests marked `targetAddressSpace: 'loopback'`; other browsers ignore the field. (ai-local.ts marks its probes the...
- Calls: [[ai-http.ts]]

### networkError
*function* · line 402
> A fetch that failed before any answer: offline, blocked, or a key the browser refused to send.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts]]

### __setHttpRetryDelay
*function* · line 428 · exported
> Test hook: the wait before retrying a busy service.
- Uses: [[ai-http.ts]]
- Used in: [[ai-tools.test.ts]], [[ai-diagnose.test.ts]], [[ai-http.test.ts]], [[ai-pace.test.ts]]

### httpSend
*function* · line 461
> Send one request. Rejects an AiHttpError for no answer, a timeout, or an HTTP error status.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#cancelled|cancelled()]], [[ai-http.ts#errorFromService|errorFromService()]], [[ai-http.ts#loopbackFetchInit|loopbackFetchInit()]], [[ai-http.ts#networkError|networkError()]], [[ai-http.ts#parseServiceError|parseServiceError()]], [[ai-http.ts]]

### readJsonBody
*function* · line 516
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#cancelled|cancelled()]]

### readSse
*function* · line 526 · exported
> Read a server-sent-events body, calling onData for each `data:` payload (joined across lines).
- Used in: [[ai-tools.ts]], [[ai-http.test.ts]]

### readJsonEvents
*function* · line 564 · exported
> Read an SSE body of JSON payloads. An `{error}` payload (or an Interactions "error" event) rejects. Resolves to the number of payloads that were valid JSON.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#cancelled|cancelled()]], [[ai-http.ts#errorFromPayload|errorFromPayload()]], [[ai-http.ts#readSse|readSse()]]
- Uses: [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[ai-tools.ts]]

### geminiModelVersion
*function* · line 602 · exported
> Version number in a model id ("gemini-3.6-flash" -> 3.6), or 0 for aliases such as gemini-flash-latest.

### rankGeminiModels
*function* · line 612 · exported
> Rank the models a key may use for text: newest stable general-purpose Flash first (or Flash-Lite first with prefer 'lite'), then the other, Pro last (it has no free tier); previews after stable releases of the same version. Google's "-la...
- Calls: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]]
- Uses: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]], [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### pickGeminiModel
*function* · line 640 · exported
> The best model id for text, or '' when none fits.
- Calls: [[ai-http.ts#rankGeminiModels|rankGeminiModels()]]
- Used in: [[ai-http.test.ts]]

### defaultGeminiModels
*function* · line 645 · exported
> Used when the model list cannot be read (the aliases are maintained by Google).

### geminiModelName
*function* · line 653 · exported
> Model id without a "models/" prefix; '' means: pick automatically.
- Uses: [[ai-http.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[drivers.ts]], [[ai-diagnose.ts]], [[ai-tools.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### geminiPreference
*function* · line 659 · exported
> What the automatic choice favours for a model setting: Flash only when the setting says "auto-flash".
- Used in: [[AiSettingsDialog.tsx]], [[drivers.ts]], [[ai-diagnose.ts]], [[platform/ai.ts]]

### keyHash
*function* · line 684 · exported
- Used in: [[platform/ai.ts]], [[ai-pace.test.ts]]

### listGeminiModels
*function* · line 766 · exported
> The models this key may use (GET /v1beta/models). Cached per key in memory and, for a day, in localStorage (as a hash of the key). `force` asks Google again (Test connection).
- Calls: [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#readJsonBody|readJsonBody()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-http.ts#CHECK_TIMEOUT_MS|CHECK_TIMEOUT_MS]], [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]], [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]], [[ai-pace.test.ts]]

### __resetGeminiState
*function* · line 837 · exported
> Test hook: forget model lists, remembered models and failures. `reload: true` acts like a new page load instead (what is in localStorage is read again).
- Calls: [[ai-pace.ts#__resetPace|__resetPace()]]
- Uses: [[ai-http.ts]]
- Used in: [[ai-tools.test.ts]], [[ai-diagnose.test.ts]], [[ai-http.test.ts]], [[ai-pace.test.ts]], [[ai.test.ts]]

### __setRateLimitSleep
*function* · line 847 · exported
> Test hook: how geminiRun waits for a rate limit (null: really wait).
- Uses: [[ai-http.ts]]
- Used in: [[ai-tools.test.ts]], [[ai-http.test.ts]], [[ai-pace.test.ts]]

### geminiCandidates
*function* · line 855 · exported
> Candidate models for this key, best first: the one that answered last time, then the ranked list.
- Calls: [[ai-http.ts#defaultGeminiModels|defaultGeminiModels()]], [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#listGeminiModels|listGeminiModels()]], [[ai-http.ts#rankGeminiModels|rankGeminiModels()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]]
- Uses: [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]]

### resolveGeminiModel
*function* · line 877 · exported
> The model to use for this key: the user's explicit choice, else the best candidate.
- Calls: [[ai-http.ts#geminiCandidates|geminiCandidates()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]]

### geminiFlashHasRoom
*function* · line 884 · exported
> Can a Flash request go out now without waiting for its learned per-minute limit?
- Calls: [[ai-http.ts#keyHash|keyHash()]], [[ai-http.ts#lastResolvedGeminiModel|lastResolvedGeminiModel()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-pace.ts#paceWaitMs|paceWaitMs()]]
- Used in: [[drivers.ts]]

### lastResolvedGeminiModel
*function* · line 891 · exported
> The model that last answered for this key, or the best one listed (for display); '' if unknown.
- Calls: [[ai-http.ts#rankGeminiModels|rankGeminiModels()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]]
- Uses: [[ai-http.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[install.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### thinkingLevelFor
*function* · line 909 · exported
> Thinking level for a model and effort: none for Gemini 2.x; for Gemini 3 and newer (and aliases) 'minimal' when asked, or with 'auto' on Flash-Lite (fastest; these tasks need little reasoning), else 'low'.
- Calls: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]]
- Used in: [[ai-tools.ts]], [[ai-pace.test.ts]]

### interactionThinkingLevel
*function* · line 918 · exported
> Thinking level for the Interactions API: 'low' for Gemini 3 and newer and for aliases; none for 2.x.
- Calls: [[ai-http.ts#thinkingLevelFor|thinkingLevelFor()]]

### geminiThinkingConfig
*function* · line 923 · exported
> generateContent `thinkingConfig`: Gemini 3 takes a level, 2.5 Flash a zero budget, 2.5 Pro its minimum.
- Calls: [[ai-http.ts#geminiModelVersion|geminiModelVersion()]]
- Used in: [[ai-tools.ts]]

### buildInteractionRequest
*function* · line 954 · exported
> POST /v1beta/interactions. `input` is a prompt string or a list of steps (a whole conversation).
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#interactionThinkingLevel|interactionThinkingLevel()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts#thinkingLevelFor|thinkingLevelFor()]], [[ai-http.ts]]
- Uses: [[ai-http.ts#GEMINI_INTERACTIONS_URL|GEMINI_INTERACTIONS_URL]]
- Used in: [[ai-tools.ts]], [[ai-http.test.ts]], [[ai-pace.test.ts]]

### buildGeminiRequest
*function* · line 982 · exported
> The older generateContent endpoint (still used for "AIza" keys when Interactions is not usable).
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiModelVersion|geminiModelVersion()]], [[ai-http.ts#geminiThinkingConfig|geminiThinkingConfig()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts#thinkingLevelFor|thinkingLevelFor()]], [[ai-http.ts]]
- Uses: [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]]
- Used in: [[ai-http.test.ts]]

### modelLevel
*function* · line 1039
> Errors where another model may work.

### apiLevel
*function* · line 1046
> Errors where the other Gemini API may work (for keys that generateContent accepts).

### MAX_LIMIT_WAIT_MS
*const* · line 1052 · exported
> Longest wait for a per-minute limit before a request (longer waits are not free-tier minute limits).

### sendGemini
*function* · line 1054
- Calls: [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#keyHash|keyHash()]], [[ai-http.ts#thinkingLevelFor|thinkingLevelFor()]], [[ai-http.ts]], [[ai-pace.ts#noteRequest|noteRequest()]]
- Uses: [[ai-http.ts]]

### summarise
*function* · line 1103
> One error for "every model tried failed".
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]]
- Uses: [[ai-http.ts]]

### minuteLimit
*function* · line 1134
> A per-minute limit (not a daily one, not "no free allowance") where the service said how long to wait or that it is a per-minute limit: waiting helps. (A bare 429 fails at once.)

### geminiRun
*function* · line 1144 · exported
> Send a Gemini request, choosing the model and API: the typed model (or the best listed one), then up to MAX_MODEL_TRIES models in all; Interactions first, generateContent as a fallback for keys it accepts. Requests are spaced to each mod...
- Calls: [[ai-http.ts#apiLevel|apiLevel()]], [[ai-http.ts#geminiCandidates|geminiCandidates()]], [[ai-http.ts#geminiKeyKind|geminiKeyKind()]], [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiPreference|geminiPreference()]], [[ai-http.ts#keyHash|keyHash()]], [[ai-http.ts#minuteLimit|minuteLimit()]], [[ai-http.ts#modelLevel|modelLevel()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts#sendGemini|sendGemini()]], [[ai-http.ts#summarise|summarise()]], [[ai-http.ts]], [[ai-pace.ts#clearBlock|clearBlock()]], [[ai-pace.ts#learnLimit|learnLimit()]], [[ai-pace.ts#paceWaitMs|paceWaitMs()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-http.ts#DEFAULT_TIMEOUT_MS|DEFAULT_TIMEOUT_MS]], [[ai-http.ts#MAX_LIMIT_WAIT_MS|MAX_LIMIT_WAIT_MS]], [[ai-http.ts#MAX_MODEL_TRIES|MAX_MODEL_TRIES]], [[ai-http.ts]]
- Used in: [[ai-tools.ts]], [[ai-pace.test.ts]]

### geminiText
*function* · line 1246 · exported
> Text of a generateContent response (or one streamed chunk). Thought parts are skipped.
- Used in: [[ai-http.test.ts]]

### geminiBlocked
*function* · line 1253 · exported
> generateContent returns 200 with no text when a request is blocked by its safety filter.
- Used in: [[ai-tools.ts]]

### geminiEmptyError
*function* · line 1260 · exported
> Why a generateContent reply had no text, as an AiError.
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]]
- Used in: [[ai-tools.ts]]

### interactionOutputSteps
*function* · line 1294 · exported
> Steps produced by the model in this interaction (after the last input step the response may echo).
- Calls: [[ai-http.ts]]

### InteractionAccumulator
*class* · line 1315 · exported
> Collects an Interactions reply, whole or streamed (step.start / step.delta / step.stop events).
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#errorFromPayload|errorFromPayload()]], [[ai-http.ts#interactionOutputSteps|interactionOutputSteps()]], [[ai-http.ts]]
- Used in: [[ai-tools.ts]]

### askGemini
*function* · line 1485 · exported
- Calls: [[ai-http.ts#buildGeminiRequest|buildGeminiRequest()]], [[ai-http.ts#buildInteractionRequest|buildInteractionRequest()]], [[ai-http.ts#geminiRun|geminiRun()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[ai-diagnose.ts]], [[platform/ai.ts]], [[ai-http.test.ts]], [[ai-pace.test.ts]]

### normaliseBaseUrl
*function* · line 1507 · exported
> Base URL without a trailing slash or a pasted "/chat/completions".
- Used in: [[AiSettingsDialog.tsx]], [[ai-diagnose.ts]], [[ai-local.ts]], [[ai-tools.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]

### buildOpenAiRequest
*function* · line 1511 · exported
- Calls: [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Used in: [[ai-http.test.ts]]

### openAiText
*function* · line 1526 · exported

### openAiDelta
*function* · line 1532 · exported

### listOpenAiModels
*function* · line 1542 · exported
> Model ids an OpenAI-compatible service offers (GET {base}/models), or null when it has no such list.
- Calls: [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-http.ts#readJsonBody|readJsonBody()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]]
- Uses: [[ai-http.ts#CHECK_TIMEOUT_MS|CHECK_TIMEOUT_MS]]
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### suggestOpenAiModels
*function* · line 1559 · exported
> Models worth offering in a picker: chat models only, free ones first (OpenRouter's ":free").
- Used in: [[ai-diagnose.ts]], [[ai-http.test.ts]]

### streamOpenAi
*function* · line 1565
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#openAiDelta|openAiDelta()]], [[ai-http.ts#readJsonEvents|readJsonEvents()]]

### askOpenAiCompatible
*function* · line 1586 · exported
- Calls: [[ai-http.ts#aiHttpError|aiHttpError()]], [[ai-http.ts#buildOpenAiRequest|buildOpenAiRequest()]], [[ai-http.ts#errorFromPayload|errorFromPayload()]], [[ai-http.ts#httpSend|httpSend()]], [[ai-http.ts#openAiText|openAiText()]], [[ai-http.ts#readJsonBody|readJsonBody()]], [[ai-http.ts#streamOpenAi|streamOpenAi()]], [[ai-http.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[ai-http.ts#DEFAULT_TIMEOUT_MS|DEFAULT_TIMEOUT_MS]], [[ai-http.ts]]
- Used in: [[ai-diagnose.ts]], [[ai-local.ts]], [[platform/ai.ts]], [[ai-http.test.ts]]
