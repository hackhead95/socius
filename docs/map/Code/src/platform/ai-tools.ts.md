---
id: src/platform/ai-tools.ts
type: module
file: src/platform/ai-tools.ts
area: platform
---

# src/platform/ai-tools.ts

*Module* · area [[platform]] · 554 lines

> Tool calling ("function calling") for the Socius assistant, next to the plain-text adapters. - Google Gemini: the Interactions API (POST /v1beta/interactions) with `tools` of type "function"; the conversation is sent as a list of steps (user_input, model_output, thought, function_call, function_result) with `store: false`, so nothing is kept on Google's servers. The model's own steps (including...

## Imports
- [[ai-http.ts]] · re-export, value
- [[ai-timing.ts]] · type-only
- [[claude.ts]] · value

## Tested by
- [[ai-tools.test.ts]] · import
- [[scenarios.test.ts]] · import

## Imported by
- [[chat-store.ts]] · type-only
- [[agent.ts]] · type-only, value
- [[drivers.ts]] · value
- [[tools/analysis.ts]] · type-only
- [[assistant/types.ts]] · type-only
- [[validate.ts]] · type-only
- [[ai-tools.test.ts]] · value
- [[scenarios.test.ts]] · type-only

## Implements provider
- [[claude]]
- [[Providers/gemini|gemini]]
- [[Providers/openai|openai]]

## Types
JsonSchema (line 29) · ToolSpec (line 38) · ToolCall (line 45) · ToolResultMsg (line 53) · ChatMessage (line 59) · ModelTurn (line 65) · ToolTurnOptions (line 72) · BuiltToolRequest (line 89) · RateLimitInfo (line 95) · ToolAiError (line 100) · ClaudeTool (line 509)

## Private helpers
isAbort() (line 104) · parseArgs() (line 171) · callSeq (line 183) · newCallId() (line 184) · geminiDeclarations() (line 207)

## Symbols

### cancelled
*function* · line 108
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### toolErrorFromResponse
*function* · line 111 · exported
> Error for a failed HTTP response, with the rate-limit details Gemini and OpenAI-style services send.
- Calls: [[ai-http.ts#errorFromResponse|errorFromResponse()]]
- Used in: [[ai-tools.test.ts]]

### sendRequest
*function* · line 115
- Calls: [[ai-tools.ts#cancelled|cancelled()]], [[ai-tools.ts#toolErrorFromResponse|toolErrorFromResponse()]], [[ai-tools.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### readJson
*function* · line 133
- Calls: [[ai-tools.ts#cancelled|cancelled()]], [[ai-tools.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### readJsonEvents
*function* · line 143
> Read an SSE body, handing each parsed JSON payload to `onData`.
- Calls: [[ai-http.ts#httpErrorCode|httpErrorCode()]], [[ai-http.ts#readSse|readSse()]], [[ai-tools.ts#cancelled|cancelled()]], [[ai-tools.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### toGeminiSchema
*function* · line 192 · exported
> Gemini's OpenAPI-style schema: upper-case types, no empty object schemas.
- Used in: [[ai-tools.test.ts]]

### geminiContents
*function* · line 215 · exported
> Gemini `contents` for a neutral conversation.
- Used in: [[ai-tools.test.ts]]

### buildGeminiToolRequest
*function* · line 237 · exported
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiThinkingConfig|geminiThinkingConfig()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-http.ts#thinkingLevelFor|thinkingLevelFor()]], [[ai-tools.ts#geminiContents|geminiContents()]], [[ai-tools.ts]]
- Uses: [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]]
- Used in: [[ai-tools.test.ts]]

### interactionSteps
*function* · line 260 · exported
> Interactions API `input` for a neutral conversation: a list of steps, replaying the model's own steps verbatim.
- Used in: [[ai-tools.test.ts]]

### interactionTools
*function* · line 276 · exported
> Function tools for the Interactions API (standard JSON Schema; no schema for tools without arguments).

### buildGeminiInteractionToolRequest
*function* · line 284 · exported
- Calls: [[ai-http.ts#buildInteractionRequest|buildInteractionRequest()]], [[ai-tools.ts#interactionSteps|interactionSteps()]], [[ai-tools.ts#interactionTools|interactionTools()]]
- Used in: [[ai-tools.test.ts]]

### interactionTurn
*function* · line 298 · exported
> A ModelTurn from an Interactions reply (function_call steps become tool calls).
- Calls: [[ai-tools.ts]]

### GeminiTurnAccumulator
*class* · line 311 · exported
> Collects Gemini parts from one reply or from streamed chunks into a ModelTurn.
- Calls: [[ai-http.ts#geminiBlocked|geminiBlocked()]], [[ai-tools.ts]]

### askGeminiTools
*function* · line 338 · exported
> One Gemini turn with tools. Picks the model automatically, with the same fallbacks as plain requests.
- Calls: [[ai-http.ts#InteractionAccumulator|InteractionAccumulator]], [[ai-http.ts#geminiEmptyError|geminiEmptyError()]], [[ai-http.ts#geminiRun|geminiRun()]], [[ai-http.ts#readJsonEvents|readJsonEvents()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-tools.ts#GeminiTurnAccumulator|GeminiTurnAccumulator]], [[ai-tools.ts#buildGeminiInteractionToolRequest|buildGeminiInteractionToolRequest()]], [[ai-tools.ts#buildGeminiToolRequest|buildGeminiToolRequest()]], [[ai-tools.ts#interactionTurn|interactionTurn()]], [[ai-tools.ts#readJson|readJson()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]

### openAiMessages
*function* · line 401 · exported
> ---------- OpenAI-compatible ----------
- Used in: [[ai-tools.test.ts]]

### buildOpenAiToolRequest
*function* · line 415 · exported
- Calls: [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-tools.ts#openAiMessages|openAiMessages()]]
- Used in: [[ai-tools.test.ts]]

### parseOpenAiTurn
*function* · line 433 · exported
> Parse a non-streamed chat completion into a ModelTurn.
- Calls: [[ai-tools.ts]]
- Used in: [[ai-tools.test.ts]]

### OpenAiStreamAccumulator
*class* · line 448 · exported
> Accumulates streamed chat-completion deltas (text and tool-call fragments, keyed by index).
- Calls: [[ai-tools.ts]]

### askOpenAiTools
*function* · line 479 · exported
- Calls: [[ai-tools.ts#OpenAiStreamAccumulator|OpenAiStreamAccumulator]], [[ai-tools.ts#buildOpenAiToolRequest|buildOpenAiToolRequest()]], [[ai-tools.ts#parseOpenAiTurn|parseOpenAiTurn()]], [[ai-tools.ts#readJsonEvents|readJsonEvents()]], [[ai-tools.ts#readJson|readJson()]], [[ai-tools.ts#sendRequest|sendRequest()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]

### isToolsUnsupported
*function* · line 501 · exported
> Did an OpenAI-compatible service refuse because the model or server cannot do tool calling?
- Used in: [[agent.ts]], [[ai-tools.test.ts]]

### claudeToolsAvailable
*function* · line 517 · exported
> True when this viewer lets the page offer tools to Claude.
- Calls: [[useCapability|useCapability()]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]

### askClaudeTools
*function* · line 533 · exported
> Ask Claude with page tools. `turns` must start and end on a user turn; standing instructions go in the first user turn (there is no system role). Claude runs the tool rounds; the promise resolves with the text of every round.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[useCapability|useCapability()]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]
