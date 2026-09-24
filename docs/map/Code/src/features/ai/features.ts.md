---
id: src/features/ai/features.ts
type: module
file: src/features/ai/features.ts
area: features/ai
---

# src/features/ai/features.ts

*Module* · area [[features - ai|features/ai]] · 226 lines

> The AI features offered app-wide (AI menu, the AI chip in the top bar, the "AI is ready. Try it" panel, the search palette): what each does, what it needs first, and how to start it. Starting a feature never sends anything by itself: it opens the dialog or panel where the user sees what will be sent and clicks to send.

## Imports
- [[ui-store.ts]] · value
- [[output.ts]] · type-only
- [[store.ts]] · value
- [[explainPrompt.ts]] · value
- [[explainStore.ts]] · value
- [[ai/hooks.ts]] · value
- [[open.ts]] · value
- [[uiStore.ts]] · value
- [[platform/ai.ts]] · value

## Calls
- [[platform/ai.ts#aiAvailable|aiAvailable()]]
- [[platform/ai.ts#getAiStatus|getAiStatus()]]

## Tested by
- [[features.test.ts]] · import
- [[navigation-audit.test.tsx]] · import

## Imported by
- [[menus.ts]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[AiSettingsDialog.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[features.test.ts]] · value
- [[navigation-audit.test.tsx]] · value

## Types
AiFeatureId (line 16) · AiFeatureInfo (line 18) · AiContext (line 71) · AiPrereqAction (line 83) · AiBlocker (line 85)

## Private helpers
aiReady() (line 160)

## Symbols

### AI_FEATURES
*const* · line 28 · exported
- Used in: [[menus.ts]], [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[features.test.ts]], [[navigation-audit.test.tsx]]

### aiFeature
*function* · line 61 · exported
- Uses: [[features.ts#AI_FEATURES|AI_FEATURES]]
- Used in: [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[CodebookPanel.tsx]], [[CodingWorkspace.tsx]]

### isAiFeatureId
*function* · line 65 · exported
- Uses: [[features.ts#AI_FEATURES|AI_FEATURES]]
- Used in: [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]]

### aiFeatureBlocker
*function* · line 92 · exported
> Why a feature cannot start yet (with what to do first), or null when it can.
- Used in: [[AiFeatureDialogs.tsx]], [[features.test.ts]]

### explainableOutputs
*function* · line 140 · exported
- Uses: [[explainPrompt.ts#isExplainable|isExplainable()]]
- Used in: [[AiFeatureDialogs.tsx]]

### currentAiContext
*function* · line 144 · exported
- Calls: [[features.ts#explainableOutputs|explainableOutputs()]]
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[useStore/coding|useStore.coding]]
- Used in: [[AiFeatureDialogs.tsx]]

### startExplain
*function* · line 170 · exported
> Open the Output tab at an item and show its "Explain with AI" panel (nothing is sent yet).
- Uses: [[useExplain]], [[useStore]], [[useUi]]
- Store actions: [[focusOutput()|useUi.focusOutput()]], [[open()|useExplain.open()]], [[setTab()|useStore.setTab()]]
- Used in: [[AiFeatureDialogs.tsx]]

### runAiFeature
*function* · line 181 · exported
> Start an AI feature: set-up help when AI is not ready (saying what the feature will do), a "do this first" dialog when its data is missing, otherwise the feature's own dialog or panel.
- Calls: [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[features.ts#aiFeatureBlocker|aiFeatureBlocker()]], [[features.ts#currentAiContext|currentAiContext()]], [[features.ts#explainableOutputs|explainableOutputs()]], [[features.ts#startExplain|startExplain()]], [[features.ts]], [[open.ts#openAssistant|openAssistant()]]
- Uses: [[useCodingUi]], [[useExplain]], [[useStore]]
- Reads: [[outputs|useStore.outputs]], [[pendingItemId|useExplain.pendingItemId]], [[selectedCodeId|useCodingUi.selectedCodeId]], [[useStore/coding|useStore.coding]]
- Writes: [[selectedCodeId|useCodingUi.selectedCodeId]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[openDialog()|useStore.openDialog()]], [[setPending()|useExplain.setPending()]], [[setTab()|useStore.setTab()]], [[toast()|useStore.toast()]], [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[ai-codebook|coding: ai-codebook]], [[ai-explain-pick|custom: ai-explain-pick]], [[ai-prereq|custom: ai-prereq]], [[ai-suggest|coding: ai-suggest]]
- Used in: [[menus.ts]], [[AiFeatureDialogs.tsx]], [[AiSettingsDialog.tsx]], [[features.test.ts]]
