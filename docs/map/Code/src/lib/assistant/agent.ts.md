---
id: src/lib/assistant/agent.ts
type: module
file: src/lib/assistant/agent.ts
area: lib/assistant
---

# src/lib/assistant/agent.ts

*Module* · area [[lib - assistant|lib/assistant]] · 537 lines

> The assistant's tool-calling loop, provider-agnostic. Three driver kinds: - native : the model returns tool calls (Gemini, OpenAI-compatible); we run them (in parallel when several come in one turn) and send the results back, up to `maxRounds` rounds. - hosted : Claude's `sample` capability runs the rounds itself and calls our tools. - text : a strict JSON action protocol for models without rel...

## Imports
- [[assistant/format.ts]] · value
- [[json-protocol.ts]] · value
- [[rate-limit.ts]] · value
- [[assistant/types.ts]] · type-only
- [[validate.ts]] · value
- [[ai-timing.ts]] · value
- [[ai-tools.ts]] · type-only, value
- [[claude.ts]] · value

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[ai-tools.ts#isToolsUnsupported|isToolsUnsupported()]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Tested by
- [[scenarios.test.ts]] · import

## Imported by
- [[controller.ts]] · value
- [[drivers.ts]] · type-only
- [[scenarios.test.ts]] · value

## Types
AgentBudget (line 22) · NativeDriver (line 44) · HostedDriver (line 51) · TextDriver (line 56) · Driver (line 61) · AgentEvents (line 63) · RunInput (line 71) · ToolCallRecord (line 87) · RunResult (line 94)

## Private helpers
BATCH_NOTE (line 110) · LIMIT_NOTE (line 111) · stepSeq (line 114) · stepId() (line 115) · safeLabel() (line 253) · firstLine() (line 261) · REMOVED (line 268) · messagesBytes() (line 270) · lastExchangeStart() (line 281) · primeContext() (line 330) · transcriptFrom() (line 445) · runDriver() (line 523)

## Symbols

### MAX_ROUNDS
*const* · line 106 · exported

### PRIME_MAX_BYTES
*const* · line 108 · exported
> Largest primed tool result put in the system prompt.

### PRIME_HEADER
*const* · line 109 · exported

### cancelledError
*function* · line 117
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]]

### toolSpecs
*function* · line 122 · exported
> Tool specs for the provider (name, description, parameters).

### Runner
*class* · line 126
- Calls: [[agent.ts#cancelledError|cancelledError()]], [[agent.ts]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[rate-limit.ts#limiterFor|limiterFor()]], [[validate.ts#checkArgs|checkArgs()]]
- Uses: [[rate-limit.ts#abortableSleep|abortableSleep()]]

### fitMessages
*function* · line 290 · exported
> Make the conversation fit: shorten old tool results, then drop the oldest exchanges, then shorten the current exchange's earlier results. Never breaks call/result pairs.
- Calls: [[agent.ts]], [[assistant/format.ts#byteLength|byteLength()]], [[assistant/format.ts#trimToBytes|trimToBytes()]]
- Uses: [[agent.ts]]
- Used in: [[scenarios.test.ts]]

### runNative
*function* · line 345
- Calls: [[agent.ts#cancelledError|cancelledError()]], [[agent.ts#fitMessages|fitMessages()]], [[agent.ts#toolSpecs|toolSpecs()]], [[agent.ts]], [[assistant/format.ts#byteLength|byteLength()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[agent.ts#MAX_ROUNDS|MAX_ROUNDS]], [[agent.ts]]

### textTurns
*function* · line 409 · exported
> User/assistant text turns from the neutral history (tool rounds are not replayed).

### runHosted
*function* · line 418
- Calls: [[agent.ts#textTurns|textTurns()]], [[assistant/format.ts#byteLength|byteLength()]], [[claude.ts#AiUnavailableError|AiUnavailableError]]
- Uses: [[agent.ts#MAX_ROUNDS|MAX_ROUNDS]], [[agent.ts]]

### runText
*function* · line 449
- Calls: [[agent.ts#cancelledError|cancelledError()]], [[agent.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[json-protocol.ts#buildJsonPrompt|buildJsonPrompt()]], [[json-protocol.ts#parseAction|parseAction()]], [[json-protocol.ts#partialAnswer|partialAnswer()]]
- Uses: [[agent.ts#MAX_ROUNDS|MAX_ROUNDS]], [[agent.ts]]

### runAgent
*function* · line 506 · exported
> Answer one user message, using tools as needed. Rejects AiUnavailableError (code 'cancelled' on Stop).
- Calls: [[agent.ts#Runner|Runner]], [[agent.ts#cancelledError|cancelledError()]], [[agent.ts]], [[ai-timing.ts#startAiTiming|startAiTiming()]]
- Used in: [[controller.ts]], [[scenarios.test.ts]]
