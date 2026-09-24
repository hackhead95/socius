---
id: src/platform/ai-timing.ts
type: module
file: src/platform/ai-timing.ts
area: platform
---

# src/platform/ai-timing.ts

*Module* · area [[platform]] · 297 lines

> Timing for AI requests: where the time goes (model list, waiting for the service, thinking, writing, waits for free-tier limits, retries), for three uses: - the progress line shown while waiting ("Waiting for Google · 3 s", "Waiting 11 s for Google's free limit..."), through getAiActivity / subscribeAiActivity; - an info entry in Help > Error log (area `ai`) when a request finishes: stages and ...

## Imports
- [[errorlog.ts]] · value

## Tested by
- [[ai-latency.test.ts]] · import
- [[ai-pace.test.ts]] · import

## Imported by
- [[AiBits.tsx]] · value
- [[agent.ts]] · value
- [[ai-diagnose.ts]] · value
- [[ai-http.ts]] · type-only
- [[ai-tools.ts]] · type-only
- [[platform/ai.ts]] · value
- [[ai-latency.test.ts]] · dynamic
- [[ai-pace.test.ts]] · value

## Types
AiStage (line 14) · TimingEventKind (line 16) · TimingEvent (line 18) · AiActivity (line 31)

## Private helpers
clock() (line 46) · serviceName() (line 55) · cap() (line 90) · seq (line 92) · active (line 93) · recent (line 94) · listeners (line 95) · snapshot (line 96) · byOp (line 97) · publish() (line 99)

## Symbols

### stageLabel
*function* · line 62 · exported
- Calls: [[ai-timing.ts]]
- Used in: [[AiBits.tsx]]

### AiTiming
*class* · line 114 · exported
- Calls: [[ai-timing.ts#stageLabel|stageLabel()]], [[ai-timing.ts]], [[errorlog.ts#logInfo|logInfo()]]
- Uses: [[ai-timing.ts#defaultSleep|defaultSleep()]], [[ai-timing.ts]]

### defaultSleep
*function* · line 241

### startAiTiming
*function* · line 257 · exported
> Start timing a user action. Shown as the current AI activity until finish().
- Calls: [[ai-timing.ts#AiTiming|AiTiming]], [[ai-timing.ts]]
- Uses: [[ai-timing.ts]]
- Used in: [[agent.ts]], [[ai-diagnose.ts]], [[platform/ai.ts]], [[ai-pace.test.ts]]

### getAiActivity
*function* · line 268 · exported
> The newest unfinished AI action (for progress lines), or null; with `op`, the newest of that kind ("assistant", "explain"...). Same object until something changes.
- Uses: [[ai-timing.ts]]
- Used in: [[AiBits.tsx]], [[ai-pace.test.ts]]

### getAiActivityById
*function* · line 273 · exported
> The progress of one action by id (or null once finished).
- Uses: [[ai-timing.ts]]

### subscribeAiActivity
*function* · line 278 · exported
- Uses: [[ai-timing.ts]]
- Used in: [[AiBits.tsx]], [[ai-pace.test.ts]]

### recentAiTimings
*function* · line 286 · exported
> Finished actions, newest last (for Copy details).
- Uses: [[ai-timing.ts]]
- Used in: [[ai-diagnose.ts]], [[ai-pace.test.ts]]

### __resetAiTimings
*function* · line 291 · exported
> Test hook.
- Uses: [[ai-timing.ts]]
- Used in: [[ai-pace.test.ts]]
