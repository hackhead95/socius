---
id: src/platform/claude.ts
type: module
file: src/platform/claude.ts
area: platform
---

# src/platform/claude.ts

*Module* · area [[platform]] · 76 lines

> The claude.ai Artifact runtime: the `claude` global and its capabilities (`downloads`, `sample`). Only present when the app is opened as a Claude artifact. Everything here is a no-op elsewhere.

## Tested by
- [[features.test.ts]] · import
- [[ai-tools.test.ts]] · import
- [[scenarios.test.ts]] · import
- [[ai-matrix.fuzz.test.ts]] · import
- [[ai-diagnose.test.ts]] · import
- [[ai.test.ts]] · import
- [[errorlog.test.ts]] · import

## Imported by
- [[install.ts]] · value
- [[agent.ts]] · value
- [[ai-http.ts]] · value
- [[ai-local.ts]] · value
- [[ai-tools.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · re-export, value
- [[host.ts]] · re-export, value
- [[features.test.ts]] · value
- [[ai-tools.test.ts]] · value
- [[scenarios.test.ts]] · value
- [[ai-matrix.fuzz.test.ts]] · value
- [[ai-diagnose.test.ts]] · value
- [[ai.test.ts]] · value
- [[errorlog.test.ts]] · value

## Implements provider
- [[claude]]

## Types
ClaudeAskOptions (line 39)

## Private helpers
capCache (line 11)

## Symbols

### claudeGlobal
*function* · line 6 · exported
- Used in: [[platform/ai.ts]]

### useCapability
*hook* · line 12 · exported · note: [[useCapability|useCapability()]]
- Calls: [[claude.ts#claudeGlobal|claudeGlobal()]]
- Uses: [[claude.ts]]
- Used in: [[ai-tools.ts]], [[host.ts]]

### __resetCapabilityCache
*function* · line 20 · exported
> Test hook: forget cached capability lookups.
- Uses: [[claude.ts]]
- Used in: [[features.test.ts]], [[ai-tools.test.ts]], [[ai-diagnose.test.ts]], [[ai.test.ts]]

### isInArtifactViewer
*function* · line 24 · exported
- Calls: [[claude.ts#claudeGlobal|claudeGlobal()]]
- Used in: [[host.ts]]

### AiUnavailableError
*class* · line 29 · exported
> An AI request failed. `code` is stable (see aiErrorMessage in ./ai); `detail` is the service's own words.
- Used in: [[install.ts]], [[agent.ts]], [[ai-http.ts]], [[ai-local.ts]], [[ai-tools.ts]], [[ai-webllm.ts]], [[platform/ai.ts]], [[scenarios.test.ts]], [[ai-matrix.fuzz.test.ts]], [[errorlog.test.ts]]

### claudeSampleAvailable
*function* · line 46 · exported
> True when the `sample` capability (ask Claude) is granted in this view.
- Calls: [[useCapability|useCapability()]]
- Used in: [[platform/ai.ts]]

### askClaude
*function* · line 51 · exported
> Ask Claude for text. Rejects AiUnavailableError (code: not_granted, rate_limited, unavailable, cancelled, ...).
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[useCapability|useCapability()]]
- Used in: [[platform/ai.ts]], [[ai.test.ts]]

### askClaudeJson
*function* · line 67 · exported
> Ask Claude for JSON. Describe the exact shape in the prompt; validate the fields you use.
- Calls: [[claude.ts#AiUnavailableError|AiUnavailableError]], [[useCapability|useCapability()]]
- Used in: [[platform/ai.ts]], [[ai.test.ts]]
