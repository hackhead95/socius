---
id: src/features/coding/CodingDialog.tsx
type: module
file: src/features/coding/CodingDialog.tsx
area: features/coding
---

# src/features/coding/CodingDialog.tsx

*Module* · area [[features - coding|features/coding]] · 121 lines

> Dialog router for the "Text coding" menu (and the coding AI features started from the AI menu) (rendered by the app shell's DialogHost for store dialogs of kind 'coding') and for dialogs opened inside the workspace.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[AiBits.tsx]] · value
- [[ai/hooks.ts]] · value
- [[AiDialogs.tsx]] · value
- [[AutoCodeDialog.tsx]] · value
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[uiStore.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[DialogHost.tsx]] · value
- [[CodingWorkspace.tsx]] · value

## Private helpers
ANALYSE (line 16)

## Symbols

### ViewSwitch
*function* · line 25
> Switches the workspace view, then closes (for menu items that are views, not dialogs).
- Uses: [[CodingDialog.tsx]], [[useCodingUi]], [[useStore]]
- Writes: [[analyseTab|useCodingUi.analyseTab]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[setTab()|useStore.setTab()]], [[useCodingUi/set()|useCodingUi.set()]]

### AiGate
*component* · line 37 · note: [[AiGate|<AiGate>]]
> AI dialogs open when an AI provider is ready; otherwise explain the free options and offer set-up.
- Renders: [[AiSetupButton|<AiSetupButton>]], [[Modal|<Modal>]]
- Calls: [[useAiStatus|useAiStatus()]]

### CodingDialog
*component* · line 73 · exported · note: [[CodingDialog|<CodingDialog>]]
- Renders: [[AiCodebookDialog|<AiCodebookDialog>]], [[AiGate|<AiGate>]], [[AiSuggestDialog|<AiSuggestDialog>]], [[AutoCodeDialog|<AutoCodeDialog>]], [[CodeEditDialog|<CodeEditDialog>]], [[CodersDialog|<CodersDialog>]], [[CodingDialog.tsx#ViewSwitch|ViewSwitch()]], [[DocEditDialog|<DocEditDialog>]], [[ExportDialog|<ExportDialog>]], [[ExportToDatasetDialog|<ExportToDatasetDialog>]], [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]], [[MergeCodeDialog|<MergeCodeDialog>]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]], [[DialogHost|<DialogHost>]]
