---
id: src/lib/assistant/types.ts
type: module
file: src/lib/assistant/types.ts
area: lib/assistant
---

# src/lib/assistant/types.ts

*Module* · area [[lib - assistant|lib/assistant]] · 110 lines

> Shared types for the Socius assistant: tools, the context they read, what they hand back to the UI.

## Imports
- [[coding-types.ts]] · type-only
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[store.ts]] · type-only
- [[core/types.ts]] · type-only
- [[ai-tools.ts]] · type-only

## Tested by
- [[scenarios.test.ts]] · import
- [[units.test.ts]] · import

## Imported by
- [[AssistantPanel.tsx]] · type-only
- [[chat-store.ts]] · value
- [[controller.ts]] · type-only
- [[starters.ts]] · type-only
- [[assistant/actions.ts]] · type-only
- [[agent.ts]] · type-only
- [[json-protocol.ts]] · type-only
- [[prompt.ts]] · type-only
- [[tools/analysis.ts]] · type-only
- [[coding.ts]] · type-only
- [[tools/data.ts]] · type-only
- [[tools/help.ts]] · type-only
- [[tools/index.ts]] · type-only
- [[transform.ts]] · type-only
- [[scenarios.test.ts]] · value
- [[units.test.ts]] · value

## Types
AssistantPermissions (line 10) · AppSnapshot (line 22) · ToolContext (line 29) · Proposal (line 38) · TransformSpec (line 62) · Artifact (line 76) · ToolOutput (line 78) · AgentTool (line 87) · TraceStep (line 101)

## Symbols

### DEFAULT_PERMISSIONS
*const* · line 19 · exported
- Used in: [[chat-store.ts]], [[scenarios.test.ts]], [[units.test.ts]]
