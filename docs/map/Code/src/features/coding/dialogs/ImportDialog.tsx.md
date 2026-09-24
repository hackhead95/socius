---
id: src/features/coding/dialogs/ImportDialog.tsx
type: module
file: src/features/coding/dialogs/ImportDialog.tsx
area: features/coding
---

# src/features/coding/dialogs/ImportDialog.tsx

*Module* · area [[features - coding|features/coding]] · 539 lines

> Import sources: files (.txt .md .docx .csv .xlsx), pasted text, sample interviews, and open-ended answers from a string variable of the active dataset.

## Imports
- [[react]] · value
- [[read-excel-file]] · dynamic
- [[coding-types.ts]] · type-only
- [[core/data.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[importers.ts]] · value
- [[survey.ts]] · value
- [[errorlog.ts]] · value
- [[samples/index.ts]] · value
- [[Modal.tsx]] · value

## Calls
- [[coding/actions.ts#addDocs|addDocs()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/hooks.ts#toast|toast()]]

## Uses
- [[useCodingUi]]

## Writes
- [[activeDocId|useCodingUi.activeDocId]] · alias.set, set()
- [[useCodingUi/view|useCodingUi.view]] · alias.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · alias

## Tested by
- [[shell-fixes.test.ts]] · import

## Imported by
- [[CodingDialog.tsx]] · value
- [[shell-fixes.test.ts]] · value

## Private helpers
finish() (line 55)

## Symbols

### ImportDialog
*component* · line 27 · exported · note: [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]]
- Renders: [[FilesTab|<FilesTab>]], [[Modal|<Modal>]], [[PasteTab|<PasteTab>]], [[SamplesTab|<SamplesTab>]], [[Segmented|<Segmented>]], [[SurveyTab|<SurveyTab>]]
- Calls: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Rendered by: [[CodingDialog|<CodingDialog>]]

### FilesTab
*component* · line 68 · note: [[FilesTab|<FilesTab>]]
- Renders: [[TableImport|<TableImport>]]
- Calls: [[ImportDialog.tsx]], [[coding/hooks.ts#plural|plural()]], [[core/types.ts#newId|newId()]], [[errorlog.ts#logFailure|logFailure()]], [[importers.ts#decodeText|decodeText()]], [[importers.ts#extractDocxText|extractDocxText()]], [[importers.ts#normaliseText|normaliseText()]], [[importers.ts#parseCsv|parseCsv()]]

### TableImport
*component* · line 192 · note: [[TableImport|<TableImport>]]
- Calls: [[ImportDialog.tsx]], [[coding/hooks.ts#plural|plural()]], [[core/types.ts#newId|newId()]], [[importers.ts#normaliseText|normaliseText()]]

### PasteTab
*component* · line 317 · note: [[PasteTab|<PasteTab>]]
- Calls: [[ImportDialog.tsx]], [[coding/hooks.ts#plural|plural()]], [[core/types.ts#newId|newId()]], [[importers.ts#normaliseText|normaliseText()]]

### samplesToTick
*function* · line 357 · exported
> Sample interviews not loaded yet (by name): ticked when the chooser opens.
- Uses: [[samples/index.ts#sampleTranscripts|sampleTranscripts]]
- Used in: [[shell-fixes.test.ts]]

### SamplesTab
*component* · line 362 · note: [[SamplesTab|<SamplesTab>]]
- Calls: [[ImportDialog.tsx#samplesToTick|samplesToTick()]], [[ImportDialog.tsx]], [[coding/hooks.ts#plural|plural()]], [[core/types.ts#newId|newId()]], [[importers.ts#normaliseText|normaliseText()]], [[useStore]]
- Uses: [[samples/index.ts#sampleTranscripts|sampleTranscripts]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]

### SurveyTab
*component* · line 423 · note: [[SurveyTab|<SurveyTab>]]
- Calls: [[ImportDialog.tsx]], [[coding/hooks.ts#plural|plural()]], [[core/data.ts#varDisplayName|varDisplayName()]], [[survey.ts#buildResponseDocs|buildResponseDocs()]], [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]
