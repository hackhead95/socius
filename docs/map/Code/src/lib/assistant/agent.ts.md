---
id: src/lib/assistant/agent.ts
type: module
file: src/lib/assistant/agent.ts
area: lib/assistant
---

# src/lib/assistant/agent.ts

*Module* · area [[lib - assistant|lib/assistant]] · 481 lines

> The assistant's tool-calling loop, provider-agnostic. Three driver kinds: - native : the model returns tool calls (Gemini, OpenAI-compatible); we run them (in parallel when several come in one turn) and send the results back, up to `maxRounds` rounds. - hosted : Claude's `sample` capability runs the rounds itself and calls our tools. - text : a strict JSON action protocol for models without rel...

## Imports
- [[assistant/format.ts]] · value
- [[json-protocol.ts]] · value
- [[rate-limit.ts]] · value
- [[assistant/types.ts]] · type-only
- [[validate.ts]] · value
- [[ai-tools.ts]] · type-only, value
- [[claude.ts]] · value

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]

## Tested by
- [[scenarios.test.ts]] · import

## Imported by
- [[controller.ts]] · value
- [[drivers.ts]] · type-only
- [[scenarios.test.ts]] · value

## Types
AgentBudget (line 17) · NativeDriver (line 37) · HostedDriver (line 44) · TextDriver (line 49) · Driver (line 54) · AgentEvents (line 56) · RunInput (line 64) · ToolCallRecord (line 78) · RunResult (line 85)

## Private helpers
LIMIT_NOTE (line 98) · stepSeq (line 101) · stepId() (line 102) · safeLabel() (line 232) · firstLine() (line 240) · REMOVED (line 247) · messagesBytes() (line 249) · lastExchangeStart() (line 260) · transcriptFrom() (line 399)

## Symbols

### MAX_ROUNDS
*const* · line 97 · exported

### cancelledError
*function* · line 104
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### toolSpecs
*function* · line 109 · exported
> Tool specs for the provider (name, description, parameters).

### Runner
*class* · line 113
- Calls: [[agent.ts#cancelledError|cancelledError()]], [[agent.ts]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[rate-limit.ts#limiterFor|limiterFor()]], [[validate.ts#checkArgs|checkArgs()]]
- Uses: [[rate-limit.ts#abortableSleep|abortableSleep()]]

### fitMessages
*function* · line 269 · exported
> Make the conversation fit: shorten old tool results, then drop the oldest exchanges, then shorten the current exchange's earlier results. Never breaks call/result pairs.
- Calls: [[agent.ts]], [[assistant/format.ts#byteLength|byteLength()]], [[assistant/format.ts#trimToBytes|trimToBytes()]]
- Uses: [[agent.ts]]
- Used in: [[scenarios.test.ts]]

### runNative
*function* · line 305
> ---------- native loop ----------
- Calls: [[agent.ts#cancelledError|cancelledError()]], [[agent.ts#fitMessages|fitMessages()]], [[agent.ts#toolSpecs|toolSpecs()]], [[assistant/format.ts#byteLength|byteLength()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[agent.ts#MAX_ROUNDS|MAX_ROUNDS]], [[agent.ts]]

### textTurns
*function* · line 363 · exported
> User/assistant text turns from the neutral history (tool rounds are not replayed).

### runHosted
*function* · line 372
- Calls: [[agent.ts#textTurns|textTurns()]], [[assistant/format.ts#byteLength|byteLength()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[agent.ts#MAX_ROUNDS|MAX_ROUNDS]], [[agent.ts]]

### runText
*function* · line 403
- Calls: [[agent.ts#cancelledError|cancelledError()]], [[agent.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[json-protocol.ts#buildJsonPrompt|buildJsonPrompt()]], [[json-protocol.ts#parseAction|parseAction()]], [[json-protocol.ts#partialAnswer|partialAnswer()]]
- Uses: [[agent.ts#MAX_ROUNDS|MAX_ROUNDS]], [[agent.ts]]

### runAgent
*function* · line 459 · exported
> Answer one user message, using tools as needed. Rejects AiUnavailableError (code 'cancelled' on Stop).
- Calls: [[agent.ts#Runner|Runner]], [[agent.ts#cancelledError|cancelledError()]], [[agent.ts#runHosted|runHosted()]], [[agent.ts#runNative|runNative()]], [[agent.ts#runText|runText()]], [[ai-tools.ts#isToolsUnsupported|isToolsUnsupported()]]
- Used in: [[controller.ts]], [[scenarios.test.ts]]
