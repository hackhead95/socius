---
id: e2e/ai-features.spec.ts
type: e2e-spec
file: e2e/ai-features.spec.ts
area: e2e
---

# e2e/ai-features.spec.ts

*End-to-end spec* · area [[e2e]] · 179 lines

> App-wide AI features against a mocked Gemini API: the AI menu and the AI chip, set-up help that names the feature, the "AI is ready. Try it" panel, "do this first" dialogs, and Explain with AI on an Output item (preview of what will be sent, streamed answer, Add to output).

## Test cases
  - AI not set up: the AI menu, the chip and Text coding lead to set-up that names the feature
  - set up Gemini, "AI is ready. Try it", run Crosstabs, Explain with AI (streamed), Add to output
  - AI ready but data missing: "do this first" with a button
  - phone width: the AI menu in the menu sheet and the AI chip popover fit the screen

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[gemini-mock.ts]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[gemini-mock.ts#interactionReply|interactionReply()]]
- [[gemini-mock.ts#modelsReply|modelsReply()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]
- [[gemini-mock.ts#promptOf|promptOf()]]

## Uses
- [[gemini-mock.ts#GEMINI|GEMINI]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Ask the Socius assistant|AI > Ask the Socius assistant...]] · menu label
- [[Explain a result|AI > Explain a result...]] · menu label
- [[Suggest a codebook|AI > Suggest a codebook...]] · menu label
- [[Suggest codes for open-ended answers|AI > Suggest codes for open-ended answers...]] · menu label
- [[Summarise a code|AI > Summarise a code...]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[socius.ai]] · storage key
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
mockGemini() (line 9) · menu() (line 23) · addVar() (line 28)
