---
id: tests/assistant/ai-tools.test.ts
type: test
file: tests/assistant/ai-tools.test.ts
area: tests
---

# tests/assistant/ai-tools.test.ts

*Test file* · area [[tests]] · 243 lines

> Tool-calling adapters: Gemini via the Interactions API (function tools, function_call steps, thought steps replayed verbatim with store: false) and the generateContent fallback (functionDeclarations / functionCall / functionResponse with thought signatures), OpenAI-compatible tools / tool_calls (streamed and not), rate-limit details, and the Claude `sample` tools path.

## Test cases
- **Gemini function calling**
  - Interactions: function tools with JSON Schema, system instruction, no storage, tool choice
  - Interactions: a conversation with tool rounds becomes steps, replaying the model steps (thought signatures) verbatim
  - builds functionDeclarations with Gemini schema types, system instruction and tool config (generateContent fallback)
  - turns a conversation with tool rounds into contents, replaying the model parts verbatim
  - lists models once (Flash-Lite for tool loops), then reads several function_call steps from one turn
  - streams text, and function-call arguments sent in pieces
  - reports 429 with the retry delay and daily quota, MAX_TOKENS and MALFORMED_FUNCTION_CALL as their own codes
- **OpenAI-compatible tool calling**
  - builds tools, tool_choice, assistant tool_calls and tool messages
  - parses tool_calls, including arguments that are not valid JSON
  - accumulates streamed tool-call fragments by index
  - recognises services that cannot do tool calling, and Groq-style retry hints
- **Claude sample with page tools**
  - checks limits().tools and passes tools with execute; errors keep their partial text

## Imports
- [[ai-http.ts]] · value
- [[ai-tools.ts]] · value
- [[claude.ts]] · value
- [[gemini-fixtures.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[claude.ts#__resetCapabilityCache|__resetCapabilityCache()]]
- [[ai-http.ts#__resetGeminiState|__resetGeminiState()]]
- [[ai-http.ts#__setHttpRetryDelay|__setHttpRetryDelay()]]
- [[ai-tools.ts#askClaudeTools|askClaudeTools()]]
- [[ai-tools.ts#askGeminiTools|askGeminiTools()]]
- [[ai-tools.ts#askOpenAiTools|askOpenAiTools()]]
- [[ai-tools.ts#buildGeminiInteractionToolRequest|buildGeminiInteractionToolRequest()]]
- [[ai-tools.ts#buildGeminiToolRequest|buildGeminiToolRequest()]]
- [[ai-tools.ts#buildOpenAiToolRequest|buildOpenAiToolRequest()]]
- [[ai-tools.ts#claudeToolsAvailable|claudeToolsAvailable()]]
- [[ai-tools.ts#geminiContents|geminiContents()]]
- [[gemini-fixtures.ts#interactionCalls|interactionCalls()]]
- [[ai-tools.ts#interactionSteps|interactionSteps()]]
- [[gemini-fixtures.ts#interactionStream|interactionStream()]]
- [[ai-tools.ts#isToolsUnsupported|isToolsUnsupported()]]
- [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- [[ai-tools.ts#openAiMessages|openAiMessages()]]
- [[ai-http.ts#parseDelay|parseDelay()]]
- [[ai-tools.ts#parseOpenAiTurn|parseOpenAiTurn()]]
- [[platform/helpers.ts#sseResponse|sseResponse()]]
- [[ai-tools.ts#toGeminiSchema|toGeminiSchema()]]
- [[ai-tools.ts#toolErrorFromResponse|toolErrorFromResponse()]]

## Uses
- [[gemini-fixtures.ts#G|G]]

## Tests
- [[describe_variables]] · tool name
- [[get_dataset_overview]] · tool name
- [[ai-http.ts]] · import
- [[ai-tools.ts]] · import
- [[claude.ts]] · import

## Private helpers
gem (line 15) · oa (line 16) · tools (line 18) · mockFetch() (line 38) · modelList() (line 44)
