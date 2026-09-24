---
id: e2e/ai.spec.ts
type: e2e-spec
file: e2e/ai.spec.ts
area: e2e
---

# e2e/ai.spec.ts

*End-to-end spec* · area [[e2e]] · 268 lines

> AI assistant on the independent site: settings dialog, Gemini with a mocked network, AI coding end to end against the mocked Gemini API, and the Help menu / feedback links. (The on-device model needs WebGPU and a model download, neither of which exists in this headless browser: only its "not supported" path is exercised here.)

## Test cases
  - AI settings: open from Help, Gemini key guide, privacy notice, test connection success and failures
  - AI coding end to end against a mocked Gemini: suggest a codebook, suggest codes, streamed summary
  - AI errors from Gemini show a friendly message in the coding dialog
  - Help menu and top bar: user guide, feedback and About links

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[gemini-mock.ts]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[gemini-mock.ts#googleErrorReply|googleErrorReply()]]
- [[gemini-mock.ts#interactionReply|interactionReply()]]
- [[gemini-mock.ts#modelsReply|modelsReply()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]
- [[gemini-mock.ts#promptOf|promptOf()]]

## Uses
- [[gemini-mock.ts#GEMINI|GEMINI]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Suggest a codebook|AI > Suggest a codebook...]] · menu label
- [[Suggest codes for open-ended answers|AI > Suggest codes for open-ended answers...]] · menu label
- [[About Socius|Help > About Socius]] · menu label
- [[Getting started|Help > Getting started]] · menu label
- [[Send feedback or report a problem|Help > Send feedback or report a problem]] · menu label
- [[User guide|Help > User guide]] · menu label
- [[socius.ai]] · storage key
- [[socius.ai.keys]] · storage key
- [[Import open-ended answers from dataset|Text coding > Import open-ended answers from dataset...]] · menu label
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
ready() (line 9) · openSettingsFromAiMenu() (line 14) · noWebGpu() (line 24) · importChallenge() (line 125)
