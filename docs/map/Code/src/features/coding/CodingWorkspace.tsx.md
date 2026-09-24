---
id: src/features/coding/CodingWorkspace.tsx
type: module
file: src/features/coding/CodingWorkspace.tsx
area: features/coding
---

# src/features/coding/CodingWorkspace.tsx

*Module* · area [[features - coding|features/coding]] · 276 lines

> The Text coding tab: sources, reading view / responses table / analysis views, and the codebook.

## Imports
- [[react]] · value
- [[shortcuts.ts]] · value
- [[store.ts]] · value
- [[AiBits.tsx]] · value
- [[features.ts]] · value
- [[ai/hooks.ts]] · value
- [[coding/actions.ts]] · value
- [[AnalyseView.tsx]] · value
- [[CodebookPanel.tsx]] · value
- `src/features/coding/coding.css` · side-effect
- [[CodingDialog.tsx]] · value
- [[exampleGuide.ts]] · value
- [[coding/hooks.ts]] · value
- [[MemosView.tsx]] · value
- [[menu.ts]] · value
- [[Reader.tsx]] · value
- [[ReliabilityView.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[example.ts]] · value

## Calls
- [[example.ts#describeCodebookSize|describeCodebookSize()]]
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/hooks.ts#toast|toast()]]

## Tested by
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[ui-fixes.test.tsx]] · value

## Private helpers
exploreExample() (line 227)

## Symbols

### CODING_VIEWS
*const* · line 27 · exported

### CodingWorkspace
*component* · line 36 · exported · note: [[CodingWorkspace|<CodingWorkspace>]]
- Renders: [[AnalyseView|<AnalyseView>]], [[CodebookPanel|<CodebookPanel>]], [[CodingDialog|<CodingDialog>]], [[MemosView|<MemosView>]], [[MenuButton|<MenuButton>]], [[Reader|<Reader>]], [[ReliabilityView|<ReliabilityView>]], [[ResponsesView|<ResponsesView>]], [[RetrievalView|<RetrievalView>]], [[SourcesPanel|<SourcesPanel>]], [[Welcome (features-coding-CodingWorkspace)|<Welcome>]]
- Calls: [[ai/hooks.ts#openAiSettings|openAiSettings()]], [[coding/actions.ts#canUndo|canUndo()]], [[coding/actions.ts#setActiveCoder|setActiveCoder()]], [[coding/actions.ts#undoCoding|undoCoding()]], [[coding/hooks.ts#toast|toast()]], [[example.ts#canBuildWorkedExample|canBuildWorkedExample()]], [[features.ts#aiFeature|aiFeature()]], [[menu.ts#codingMenuLabel|codingMenuLabel()]], [[shortcuts.ts#modKey|modKey()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useAiStatus|useAiStatus()]], [[useCodingUi]], [[useScrollEdges (features-coding-ui)|useScrollEdges()]], [[useStore]]
- Uses: [[AiBits.tsx#SET_UP_AI|SET_UP_AI]], [[CodingWorkspace.tsx#CODING_VIEWS|CODING_VIEWS]], [[exampleGuide.ts#UNDO_CODING_LABEL|UNDO_CODING_LABEL]]
- Reads: [[activeDocId|useCodingUi.activeDocId]], [[dataset|useStore.dataset]], [[showAllCoders|useCodingUi.showAllCoders]], [[useCodingUi/dialog|useCodingUi.dialog]], [[useCodingUi/history|useCodingUi.history]], [[useCodingUi/view|useCodingUi.view]], [[useStore/coding|useStore.coding]], [[viewPicked|useCodingUi.viewPicked]]
- Writes: [[activeDocId|useCodingUi.activeDocId]], [[showAllCoders|useCodingUi.showAllCoders]], [[useCodingUi/dialog|useCodingUi.dialog]], [[useCodingUi/view|useCodingUi.view]], [[viewPicked|useCodingUi.viewPicked]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[ai-codebook|coding: ai-codebook]], [[ai-suggest|coding: ai-suggest]], [[auto-code|coding: auto-code]], [[coding/coders|coding: coders]], [[coding/import|coding: import]], [[export-dataset|coding: export-dataset]], [[export|coding: export]], [[load-samples|coding: load-samples]]
- Rendered by: [[Components/App|<App>]], [[ui-fixes.test.tsx]]

### Welcome
*component* · line 238 · note: [[Welcome (features-coding-CodingWorkspace)|<Welcome>]]
- Calls: [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- Uses: [[CodingWorkspace.tsx]]
- Opens: [[coding/import|coding: import]], [[load-samples|coding: load-samples]]
