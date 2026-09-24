---
id: tests/ai/features.test.ts
type: test
file: tests/ai/features.test.ts
area: tests
---

# tests/ai/features.test.ts

*Test file* · area [[tests]] · 101 lines

> App-wide AI features: what each needs first, and where starting one leads (set-up, "do this first", the feature itself). No request is sent to any AI service here.

## Test cases
- **what each AI feature needs first**
  - Explain a result needs a result; the fix depends on whether data is open
  - coding features ask for text, answers, a codebook or coded passages
  - describes every feature in plain words, without em-dashes
- **starting a feature**
  - opens the assistant for Ask the Socius assistant
  - opens AI settings with the feature named when AI is not set up
  - with AI ready: "do this first" when data is missing, else the feature

## Imports
- [[ui-store.ts]] · value
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[explainStore.ts]] · value
- [[features.ts]] · value
- [[ai/hooks.ts]] · value
- [[open.ts]] · value
- [[ai-webllm.ts]] · value
- [[platform/ai.ts]] · value
- [[claude.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[claude.ts#__resetCapabilityCache|__resetCapabilityCache()]]
- [[ai-webllm.ts#__setWebLlmLoader|__setWebLlmLoader()]]
- [[features.ts#aiFeatureBlocker|aiFeatureBlocker()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[platform/ai.ts#refreshAiStatus|refreshAiStatus()]]
- [[features.ts#runAiFeature|runAiFeature()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]

## Uses
- [[features.ts#AI_FEATURES|AI_FEATURES]]
- [[useAiSettingsDialog]] · whole-state
- [[useAssistantUi]]
- [[useExplain]]
- [[useStore]]
- [[useUi]]

## Reads
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · getState
- [[useAssistantUi/open|useAssistantUi.open]] · getState
- [[panels|useExplain.panels]] · getState
- [[pendingItemId|useExplain.pendingItemId]] · getState
- [[useStore/dialog|useStore.dialog]] · getState
- [[useStore/tab|useStore.tab]] · getState
- [[outputTarget|useUi.outputTarget]] · getState

## Writes
- [[aiSettings/gemini|aiSettings.gemini]] · setter
- [[provider|aiSettings.provider]] · setter
- [[intent|useAiSettingsDialog.intent]] · setState
- [[useAiSettingsDialog/open|useAiSettingsDialog.open]] · setState
- [[useAssistantUi/open|useAssistantUi.open]] · setState
- [[request|useAssistantUi.request]] · setState
- [[panels|useExplain.panels]] · setState
- [[pendingItemId|useExplain.pendingItemId]] · setState
- [[useStore/coding|useStore.coding]] · setState
- [[dataset|useStore.dataset]] · setState
- [[useStore/dialog|useStore.dialog]] · setState
- [[outputs|useStore.outputs]] · setState
- [[useStore/tab|useStore.tab]] · setState

## Tests
- [[Ask the Socius assistant|AI > Ask the Socius assistant...]] · menu label
- [[Explain a result|AI > Explain a result...]] · menu label
- [[Suggest a codebook|AI > Suggest a codebook...]] · menu label
- [[Suggest codes for open-ended answers|AI > Suggest codes for open-ended answers...]] · menu label
- [[Summarise a code|AI > Summarise a code...]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label
- [[ui-store.ts]] · import
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[explainStore.ts]] · import
- [[features.ts]] · import
- [[ai/hooks.ts]] · import
- [[open.ts]] · import
- [[ai-webllm.ts]] · import
- [[platform/ai.ts]] · import
- [[claude.ts]] · import

## Private helpers
none (line 17)
