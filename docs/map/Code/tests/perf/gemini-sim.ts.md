---
id: tests/perf/gemini-sim.ts
type: test-helper
file: tests/perf/gemini-sim.ts
area: tests
---

# tests/perf/gemini-sim.ts

*Test helper* · area [[tests]] · 202 lines

> A simulated Google Gemini API with realistic latencies and free-tier limits, for the AI timing harness (tests/perf/ai-latency.test.ts). Runs on vitest's fake clock, so "seconds" cost nothing. What it models (from the owner's logs and docs/research/gemini-auth-keys-and-interactions-api.md): - GET /v1beta/models: one round trip plus a large JSON body. - POST /v1beta/interactions: a round trip, th...

## Imported by
- [[ai-latency.test.ts]] · value

## Types
Family (line 14) · SimReply (line 17) · SimRequest (line 22) · SimOptions (line 35)

## Private helpers
DEFAULT_THINK (line 48) · wait() (line 57)

## Symbols

### familyOf
*function* · line 15 · exported

### now
*function* · line 53 · exported

### geminiSim
*function* · line 61 · exported
- Calls: [[gemini-sim.ts#familyOf|familyOf()]], [[gemini-sim.ts#now|now()]], [[gemini-sim.ts]]
- Uses: [[gemini-sim.ts]]
- Used in: [[ai-latency.test.ts]]
