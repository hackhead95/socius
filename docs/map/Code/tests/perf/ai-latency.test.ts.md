---
id: tests/perf/ai-latency.test.ts
type: test
file: tests/perf/ai-latency.test.ts
area: tests
---

# tests/perf/ai-latency.test.ts

*Test file* · area [[tests]] · 299 lines

> AI timing harness: where does the time go in Test connection, Explain with AI, the Socius assistant and coding suggestions? Runs the real code (settings, model choice, pacing, the agent loop, real assistant tools on the sample survey) against a simulated Gemini with realistic latencies and the free tier's per-minute limits (tests/perf/gemini-sim.ts), on vitest's fake clock. Prints a table (set ...

## Test cases
- **Test connection**
  - owner's case: Automatic Flash, Flash already used 5 times this minute
  - default setting, cold page
  - explicit Flash chosen, at its limit: waits with a countdown, then connects
- **Explain with AI**
- **Socius assistant**
  - Assistant: 4 questions in a row with Flash chosen (5/min free limit)
- **Coding suggestions (JSON batches)**
  - Coding: 20 batches of suggestions (more than 15 a minute)

## Imports
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[store.ts]] · dynamic
- [[core/types.ts]] · type-only
- [[chat-store.ts]] · dynamic
- [[controller.ts]] · dynamic
- [[io/index.ts]] · dynamic
- [[ai-diagnose.ts]] · dynamic
- [[ai-http.ts]] · dynamic
- [[ai-pace.ts]] · dynamic
- [[ai-timing.ts]] · dynamic
- [[platform/ai.ts]] · dynamic
- [[gemini-sim.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[gemini-sim.ts#geminiSim|geminiSim()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]

## Tests
- [[describe_variables]] · tool name
- [[get_dataset_overview]] · tool name
- [[run_analysis]] · tool name
- [[socius.ai]] · storage key
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[chat-store.ts]] · import
- [[controller.ts]] · import
- [[io/index.ts]] · import
- [[ai-diagnose.ts]] · import
- [[ai-http.ts]] · import
- [[ai-pace.ts]] · import
- [[ai-timing.ts]] · import
- [[platform/ai.ts]] · import

## Private helpers
SAV (line 15) · KEY (line 16) · base (line 18) · store (line 19) · rows (line 31) · settle() (line 61) · fresh() (line 84) · install() (line 95) · record() (line 101) · EXPLAIN_PROMPT (line 117) · EXPLANATION (line 118) · explainAnswer() (line 120) · NEEDS (line 205) · assistantAnswer() (line 217) · askAssistant() (line 227)
