---
id: src/features/ai/AiFeatureDialogs.tsx
type: module
file: src/features/ai/AiFeatureDialogs.tsx
area: features/ai
---

# src/features/ai/AiFeatureDialogs.tsx

*Module* · area [[features - ai|features/ai]] · 257 lines

> App-wide AI entry points: the "do this first" dialog, the result picker for Explain a result, and the AI chip in the top bar with its popover.

## Imports
- [[react]] · value
- [[store.ts]] · value
- `src/features/ai/ai.css` · side-effect
- [[AiBits.tsx]] · value
- [[features.ts]] · value
- [[ai/hooks.ts]] · value
- [[uiStore.ts]] · value
- [[reportHtml.ts]] · value
- [[fileActions.ts]] · value
- [[platform/ai.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[DialogHost.tsx]] · value
- [[TopBar.tsx]] · value

## Private helpers
ACTION_LABEL (line 15)

## Symbols

### doAction
*function* · line 26
- Calls: [[features.ts#runAiFeature|runAiFeature()]], [[fileActions.ts#loadSample|loadSample()]]
- Uses: [[useCodingUi]], [[useStore]]
- Writes: [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[closeDialog()|useStore.closeDialog()]], [[openDialog()|useStore.openDialog()]], [[setTab()|useStore.setTab()]], [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[coding/import|coding: import]], [[import-survey|coding: import-survey]], [[load-samples|coding: load-samples]], [[procedure/crosstabs|procedure: crosstabs]]

### AiPrereqDialog
*component* · line 64 · exported · note: [[AiPrereqDialog|<AiPrereqDialog>]]
> "Explain a result needs a result first" and similar: what to do before an AI feature can start.
- Renders: [[Modal|<Modal>]]
- Calls: [[AiFeatureDialogs.tsx#doAction|doAction()]], [[features.ts#aiFeatureBlocker|aiFeatureBlocker()]], [[features.ts#aiFeature|aiFeature()]], [[features.ts#currentAiContext|currentAiContext()]], [[features.ts#isAiFeatureId|isAiFeatureId()]], [[features.ts#runAiFeature|runAiFeature()]], [[useStore]]
- Uses: [[AiFeatureDialogs.tsx]]
- Reads: [[outputs|useStore.outputs]], [[useStore/coding|useStore.coding]]
- Rendered by: [[DialogHost|<DialogHost>]]

### ExplainPickDialog
*component* · line 98 · exported · note: [[ExplainPickDialog|<ExplainPickDialog>]]
> Choose which Output result to explain (newest first).
- Renders: [[Modal|<Modal>]]
- Calls: [[features.ts#explainableOutputs|explainableOutputs()]], [[features.ts#startExplain|startExplain()]], [[reportHtml.ts#formatItemTime|formatItemTime()]], [[useStore]]
- Reads: [[outputs|useStore.outputs]]
- Rendered by: [[DialogHost|<DialogHost>]]

### shortProviderName
*function* · line 129 · exported
> Short provider name for the chip ("Gemini", "Groq", "On device").
- Calls: [[platform/ai.ts#getAiSettings|getAiSettings()]]
- Uses: [[platform/ai.ts#OPENAI_PRESETS|OPENAI_PRESETS]]
- Reads: [[aiSettings/openai|aiSettings.openai]]

### FeatureButtons
*component* · line 147 · note: [[FeatureButtons|<FeatureButtons>]]
> The AI features as a list of buttons (chip popover).
- Calls: [[features.ts#runAiFeature|runAiFeature()]]
- Uses: [[features.ts#AI_FEATURES|AI_FEATURES]]

### AiChip
*component* · line 170 · exported · note: [[AiChip|<AiChip>]]
> Top-bar chip: AI ready (provider) or not set up; opens a popover with what AI can do.
- Renders: [[FeatureButtons|<FeatureButtons>]]
- Calls: [[AiFeatureDialogs.tsx#shortProviderName|shortProviderName()]], [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[useAiStatus|useAiStatus()]]
- Uses: [[AiBits.tsx#AI_SETTINGS_LABEL|AI_SETTINGS_LABEL]], [[AiBits.tsx#SET_UP_AI|SET_UP_AI]]
- Rendered by: [[TopBar|<TopBar>]]
