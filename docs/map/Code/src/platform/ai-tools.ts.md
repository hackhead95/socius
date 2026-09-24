---
id: src/platform/ai-tools.ts
type: module
file: src/platform/ai-tools.ts
area: platform
---

# src/platform/ai-tools.ts

*Module* · area [[platform]] · 542 lines

> Tool calling ("function calling") for the Socius assistant, next to the plain-text adapters. - Google Gemini: the Interactions API (POST /v1beta/interactions) with `tools` of type "function"; the conversation is sent as a list of steps (user_input, model_output, thought, function_call, function_result) with `store: false`, so nothing is kept on Google's servers. The model's own steps (including...

## Imports
- [[ai-http.ts]] · re-export, value
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
JsonSchema (line 28) · ToolSpec (line 37) · ToolCall (line 44) · ToolResultMsg (line 52) · ChatMessage (line 58) · ModelTurn (line 64) · ToolTurnOptions (line 71) · BuiltToolRequest (line 84) · RateLimitInfo (line 90) · ToolAiError (line 95) · ClaudeTool (line 497)

## Private helpers
isAbort() (line 99) · parseArgs() (line 161) · callSeq (line 173) · newCallId() (line 174) · geminiDeclarations() (line 197)

## Symbols

### cancelled
*function* · line 103
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### toolErrorFromResponse
*function* · line 106 · exported
> Error for a failed HTTP response, with the rate-limit details Gemini and OpenAI-style services send.
- Calls: [[ai-http.ts#errorFromResponse|errorFromResponse()]]
- Used in: [[ai-tools.test.ts]]

### sendRequest
*function* · line 110
- Calls: [[ai-tools.ts#cancelled|cancelled()]], [[ai-tools.ts#toolErrorFromResponse|toolErrorFromResponse()]], [[ai-tools.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### readJson
*function* · line 123
- Calls: [[ai-tools.ts#cancelled|cancelled()]], [[ai-tools.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### readJsonEvents
*function* · line 133
> Read an SSE body, handing each parsed JSON payload to `onData`.
- Calls: [[ai-http.ts#httpErrorCode|httpErrorCode()]], [[ai-http.ts#readSse|readSse()]], [[ai-tools.ts#cancelled|cancelled()]], [[ai-tools.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### toGeminiSchema
*function* · line 182 · exported
> Gemini's OpenAPI-style schema: upper-case types, no empty object schemas.
- Used in: [[ai-tools.test.ts]]

### geminiContents
*function* · line 205 · exported
> Gemini `contents` for a neutral conversation.
- Used in: [[ai-tools.test.ts]]

### buildGeminiToolRequest
*function* · line 227 · exported
- Calls: [[ai-http.ts#geminiModelName|geminiModelName()]], [[ai-http.ts#geminiThinkingConfig|geminiThinkingConfig()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-tools.ts#geminiContents|geminiContents()]], [[ai-tools.ts]]
- Uses: [[ai-http.ts#GEMINI_BASE|GEMINI_BASE]]
- Used in: [[ai-tools.test.ts]]

### interactionSteps
*function* · line 250 · exported
> Interactions API `input` for a neutral conversation: a list of steps, replaying the model's own steps verbatim.
- Used in: [[ai-tools.test.ts]]

### interactionTools
*function* · line 266 · exported
> Function tools for the Interactions API (standard JSON Schema; no schema for tools without arguments).

### buildGeminiInteractionToolRequest
*function* · line 274 · exported
- Calls: [[ai-http.ts#buildInteractionRequest|buildInteractionRequest()]], [[ai-tools.ts#interactionSteps|interactionSteps()]], [[ai-tools.ts#interactionTools|interactionTools()]]
- Used in: [[ai-tools.test.ts]]

### interactionTurn
*function* · line 287 · exported
> A ModelTurn from an Interactions reply (function_call steps become tool calls).
- Calls: [[ai-tools.ts]]

### GeminiTurnAccumulator
*class* · line 300 · exported
> Collects Gemini parts from one reply or from streamed chunks into a ModelTurn.
- Calls: [[ai-http.ts#geminiBlocked|geminiBlocked()]], [[ai-tools.ts]]

### askGeminiTools
*function* · line 327 · exported
> One Gemini turn with tools. Picks the model automatically, with the same fallbacks as plain requests.
- Calls: [[ai-http.ts#InteractionAccumulator|InteractionAccumulator]], [[ai-http.ts#geminiEmptyError|geminiEmptyError()]], [[ai-http.ts#geminiRun|geminiRun()]], [[ai-http.ts#readJsonEvents|readJsonEvents()]], [[ai-http.ts#sanitizeApiKey|sanitizeApiKey()]], [[ai-tools.ts#GeminiTurnAccumulator|GeminiTurnAccumulator]], [[ai-tools.ts#buildGeminiInteractionToolRequest|buildGeminiInteractionToolRequest()]], [[ai-tools.ts#buildGeminiToolRequest|buildGeminiToolRequest()]], [[ai-tools.ts#interactionTurn|interactionTurn()]], [[ai-tools.ts#readJson|readJson()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]

### openAiMessages
*function* · line 389 · exported
> ---------- OpenAI-compatible ----------
- Used in: [[ai-tools.test.ts]]

### buildOpenAiToolRequest
*function* · line 403 · exported
- Calls: [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-tools.ts#openAiMessages|openAiMessages()]]
- Used in: [[ai-tools.test.ts]]

### parseOpenAiTurn
*function* · line 421 · exported
> Parse a non-streamed chat completion into a ModelTurn.
- Calls: [[ai-tools.ts]]
- Used in: [[ai-tools.test.ts]]

### OpenAiStreamAccumulator
*class* · line 436 · exported
> Accumulates streamed chat-completion deltas (text and tool-call fragments, keyed by index).
- Calls: [[ai-tools.ts]]

### askOpenAiTools
*function* · line 467 · exported
- Calls: [[ai-tools.ts#OpenAiStreamAccumulator|OpenAiStreamAccumulator]], [[ai-tools.ts#buildOpenAiToolRequest|buildOpenAiToolRequest()]], [[ai-tools.ts#parseOpenAiTurn|parseOpenAiTurn()]], [[ai-tools.ts#readJsonEvents|readJsonEvents()]], [[ai-tools.ts#readJson|readJson()]], [[ai-tools.ts#sendRequest|sendRequest()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]

### isToolsUnsupported
*function* · line 489 · exported
> Did an OpenAI-compatible service refuse because the model or server cannot do tool calling?
- Used in: [[agent.ts]], [[ai-tools.test.ts]]

### claudeToolsAvailable
*function* · line 505 · exported
> True when this viewer lets the page offer tools to Claude.
- Calls: [[useCapability|useCapability()]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]

### askClaudeTools
*function* · line 521 · exported
> Ask Claude with page tools. `turns` must start and end on a user turn; standing instructions go in the first user turn (there is no system role). Claude runs the tool rounds; the promise resolves with the text of every round.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[useCapability|useCapability()]]
- Used in: [[drivers.ts]], [[ai-tools.test.ts]]
