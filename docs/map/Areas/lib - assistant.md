---
id: "area:lib/assistant"
type: area
area: lib/assistant
---

# Area: lib/assistant

16 files, 2570 lines.

## Depends on (module imports)
- [[core]]: 19
- [[platform]]: 8
- [[lib - coding|lib/coding]]: 3
- [[lib - stats|lib/stats]]: 3
- [[features - analysis|features/analysis]]: 2
- [[lib - transform|lib/transform]]: 2
- [[procedures]]: 2
- [[Areas/app|app]]: 1
- [[features - coding|features/coding]]: 1
- [[features - output|features/output]]: 1

## Used by areas
- [[features - assistant|features/assistant]]: 9

## Files
- [[assistant/actions.ts]]: Applying what the assistant proposed, only ever from a user's click. Transforms go through the store's mutateDataset (so Edit > Undo reverse…
- [[agent.ts]]: The assistant's tool-calling loop, provider-agnostic. Three driver kinds: - native : the model returns tool calls (Gemini, OpenAI-compatible…
- [[drivers.ts]]: Picks the right driver for the AI provider the user set up (AI > AI assistant settings).
- [[assistant/format.ts]]: Text for the model: compact renderings of output items, numbers and variables, and size trimming.
- [[assistant/help.ts]]: Search over the beginner's guide (docs/guide/guide.md), so "how do I ... in Socius" answers follow the real steps and menu names. The guide …
- [[json-protocol.ts]]: A strict JSON action protocol for models without reliable native tool calling (the small on-device model, and Claude or services where page …
- [[prompt.ts]]: The specialist: system prompt and live context. The procedure catalogue and Text coding menu are generated from the running app, so the assi…
- [[rate-limit.ts]]: Client-side request pacing for free tiers (Google's free Gemini tier allows only a few requests a minute). Counts requests in a sliding one-…
- [[tools/analysis.ts]]: Analysis tools: the procedure catalogue (generated from the live registry), running a real procedure on the live dataset without touching th…
- [[coding.ts]]: Qualitative tools over the Text coding project: codebook with counts, coded segments (quotes), codes by a document attribute, and keyword-in…
- [[tools/data.ts]]: Read-only dataset tools: overview (dictionary + data-quality flags), variable summaries, and individual cases (only when the user allows it)…
- [[tools/help.ts]]: search_help: the beginner's guide sections that best match a "how do I ... in Socius" question.
- [[tools/index.ts]]: The assistant's tool set. Read tools only look; action tools only ever propose.
- [[transform.ts]]: propose_transform: compute, recode, reverse-code or build a scale into NEW variables, using the same transform engine as the Transform menu.…
- [[assistant/types.ts]]: Shared types for the Socius assistant: tools, the context they read, what they hand back to the UI.
- [[validate.ts]]: Check and gently coerce tool arguments against the tool's JSON schema before running it, so a model's small slips (a number sent as text, on…
