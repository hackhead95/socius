---
id: src/features/project/fileActions.ts
type: module
file: src/features/project/fileActions.ts
area: features/project
---

# src/features/project/fileActions.ts

*Module* · area [[features - project|features/project]] · 430 lines

> File menu actions: open data / projects, save, export, sample data, new dataset. UI-facing but component-free, so menus, shortcuts, drag-and-drop and the welcome screen share them.

## Imports
- [[ui-store.ts]] · value
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only, value
- [[persistence.ts]] · value
- [[projectFile.ts]] · value
- [[io/index.ts]] · value
- [[errorlog.ts]] · value
- [[host.ts]] · value
- [[samples/index.ts]] · value
- [[write-excel-file]] · dynamic

## Calls
- [[persistence.ts#addRecent|addRecent()]]
- [[errorlog.ts#logFailure|logFailure()]]
- [[errorlog.ts#logWarn|logWarn()]]
- [[projectFile.ts#parseProject|parseProject()]]

## Uses
- [[useStore]]

## Reads
- [[dataset|useStore.dataset]] · getState

## Calls store actions
- [[toast()|useStore.toast()]] · alias, getState

## Imported by
- [[App.tsx]] · value
- [[menus.ts]] · value
- [[Overlays.tsx]] · value
- [[shortcuts.ts]] · value
- [[TopBar.tsx]] · value
- [[Welcome.tsx]] · value
- [[AiFeatureDialogs.tsx]] · value
- [[FileDialogs.tsx]] · value
- [[MergeDialogs.tsx]] · value

## Private helpers
TEXT_EXT (line 19) · stripExt() (line 51) · plural() (line 84) · readBytes() (line 88) · openProjectText() (line 235) · reportSave() (line 261) · requireData() (line 295) · baseName() (line 301) · csvField() (line 351)

## Symbols

### DATA_ACCEPT
*const* · line 16 · exported
- Used in: [[MergeDialogs.tsx]]

### PROJECT_ACCEPT
*const* · line 17 · exported

### isProjectFileName
*function* · line 21 · exported

### isDataFileName
*function* · line 25 · exported

### pickFile
*function* · line 30 · exported
> Open the browser file chooser. Resolves null if the user cancels.
- Used in: [[MergeDialogs.tsx]]

### isModified
*function* · line 55 · exported
- Uses: [[useStore]], [[useUi]]
- Reads: [[cleanDataset|useUi.cleanDataset]], [[dataset|useStore.dataset]]
- Used in: [[App.tsx]], [[TopBar.tsx]]

### confirmReplace
*function* · line 62 · exported
> Ask before replacing unsaved changes. Resolves true when it is fine to go ahead.
- Calls: [[fileActions.ts#isModified|isModified()]]
- Uses: [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[confirm()|useUi.confirm()]]
- Used in: [[FileDialogs.tsx]]

### activateDataset
*function* · line 74 · exported
> Make `ds` the active dataset (clears undo history).
- Uses: [[useStore]], [[useUi]]
- Reads: [[useStore/tab|useStore.tab]]
- Store actions: [[markClean()|useUi.markClean()]], [[setDataset()|useStore.setDataset()]], [[setSampleBanner()|useUi.setSampleBanner()]], [[setTab()|useStore.setTab()]], [[toast()|useStore.toast()]]

### importBytes
*function* · line 93 · exported
> Import bytes as the active dataset (after the caller confirmed replacing). Resolves the import warnings, or null on failure.
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[errorlog.ts#logSlow|logSlow()]], [[fileActions.ts#activateDataset|activateDataset()]], [[fileActions.ts]], [[io/index.ts#importFile|importFile()]]
- Uses: [[useStore]], [[useUi]]
- Store actions: [[setBusy()|useUi.setBusy()]], [[toast()|useStore.toast()]]
- Used in: [[FileDialogs.tsx]]

### isEncodingGuess
*function* · line 119 · exported
> The SPSS reader's note when a file does not say which text encoding it uses.

### openDataFile
*function* · line 124 · exported
> File > Open data file (or a dropped file). CSV/TSV and multi-sheet Excel files get an options dialog.
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[errorlog.ts#logWarn|logWarn()]], [[fileActions.ts#confirmReplace|confirmReplace()]], [[fileActions.ts#importBytes|importBytes()]], [[fileActions.ts#isProjectFileName|isProjectFileName()]], [[fileActions.ts#pickFile|pickFile()]], [[fileActions.ts]], [[io/index.ts#isPlainZip|isPlainZip()]], [[io/index.ts#listXlsxSheets|listXlsxSheets()]], [[io/index.ts#unopenableReason|unopenableReason()]], [[io/index.ts#unwrapZip|unwrapZip()]]
- Uses: [[fileActions.ts#DATA_ACCEPT|DATA_ACCEPT]], [[fileActions.ts#isEncodingGuess|isEncodingGuess()]], [[fileActions.ts]], [[useStore]]
- Store actions: [[openDialog()|useStore.openDialog()]], [[toast()|useStore.toast()]]
- Opens: [[file/import|file: import]]
- Used in: [[Welcome.tsx]], [[menus.ts]], [[shortcuts.ts]]

### currentProjectState
*function* · line 180 · exported
- Uses: [[useStore]]
- Reads: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[showValueLabels|useStore.showValueLabels]], [[useStore/coding|useStore.coding]], [[useStore/tab|useStore.tab]]
- Used in: [[App.tsx]]

### applyProject
*function* · line 191 · exported
> Replace the whole working state with a project.
- Uses: [[useStore]], [[useUi]]
- Writes: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[past|useStore.past]], [[showValueLabels|useStore.showValueLabels]], [[useStore/coding|useStore.coding]], [[useStore/dialog|useStore.dialog]], [[useStore/focusOutputId|useStore.focusOutputId]], [[useStore/future|useStore.future]], [[useStore/tab|useStore.tab]]
- Store actions: [[markClean()|useUi.markClean()]], [[setSampleBanner()|useUi.setSampleBanner()]], [[toast()|useStore.toast()]]
- Used in: [[App.tsx]]

### openProjectFile
*function* · line 209 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts#isProjectFileName|isProjectFileName()]], [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#pickFile|pickFile()]], [[fileActions.ts]], [[io/index.ts#isPlainZip|isPlainZip()]], [[io/index.ts#unwrapZip|unwrapZip()]]
- Uses: [[fileActions.ts#PROJECT_ACCEPT|PROJECT_ACCEPT]], [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[Welcome.tsx]], [[menus.ts]]

### openRecentProject
*function* · line 250 · exported
- Calls: [[fileActions.ts#applyProject|applyProject()]], [[fileActions.ts#confirmReplace|confirmReplace()]], [[persistence.ts#loadRecent|loadRecent()]]
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[Welcome.tsx]], [[FileDialogs.tsx]]

### saveProject
*function* · line 275 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts#currentProjectState|currentProjectState()]], [[fileActions.ts]], [[host.ts#saveFile|saveFile()]], [[persistence.ts#addRecent|addRecent()]], [[projectFile.ts#projectFileName|projectFileName()]], [[projectFile.ts#serializeProject|serializeProject()]]
- Uses: [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[markClean()|useUi.markClean()]], [[toast()|useStore.toast()]]
- Used in: [[menus.ts]], [[shortcuts.ts]]

### exportSavFile
*function* · line 305 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts]], [[host.ts#saveFile|saveFile()]], [[io/index.ts#exportSavWithReport|exportSavWithReport()]]
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[menus.ts]]

### exportCsvFile
*function* · line 321 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts]], [[host.ts#saveFile|saveFile()]], [[io/index.ts#exportCsv|exportCsv()]]
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[menus.ts]]

### exportXlsxFile
*function* · line 334 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts]], [[host.ts#saveFile|saveFile()]], [[io/index.ts#exportXlsx|exportXlsx()]]
- Uses: [[useStore]], [[useUi]]
- Store actions: [[setBusy()|useUi.setBusy()]], [[toast()|useStore.toast()]]
- Used in: [[menus.ts]]

### exportCodebook
*function* · line 355 · exported
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts]], [[host.ts#saveFile|saveFile()]], [[io/index.ts#codebookRows|codebookRows()]]
- Uses: [[fileActions.ts]], [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[menus.ts]]

### loadSample
*function* · line 383 · exported
> Load the bundled sample survey. Returns false if there is none or it fails.
- Calls: [[errorlog.ts#logFailure|logFailure()]], [[fileActions.ts#activateDataset|activateDataset()]], [[fileActions.ts#confirmReplace|confirmReplace()]], [[samples/index.ts#loadSampleDataset|loadSampleDataset()]]
- Uses: [[samples/index.ts#samples|samples]], [[useStore]], [[useUi]]
- Store actions: [[setBusy()|useUi.setBusy()]], [[toast()|useStore.toast()]]
- Used in: [[Welcome.tsx]], [[menus.ts]], [[AiFeatureDialogs.tsx]]

### newDataset
*function* · line 404 · exported
- Calls: [[core/types.ts#makeDataset|makeDataset()]], [[fileActions.ts#activateDataset|activateDataset()]], [[fileActions.ts#confirmReplace|confirmReplace()]]
- Used in: [[Welcome.tsx]], [[menus.ts]]

### startFresh
*function* · line 411 · exported
> Close the data and output, back to the welcome screen.
- Calls: [[coding-types.ts#emptyCodingProject|emptyCodingProject()]], [[persistence.ts#clearSession|clearSession()]]
- Uses: [[useStore]], [[useUi]]
- Writes: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[past|useStore.past]], [[useStore/dialog|useStore.dialog]], [[useStore/focusOutputId|useStore.focusOutputId]], [[useStore/future|useStore.future]], [[useStore/tab|useStore.tab]]
- Store actions: [[markClean()|useUi.markClean()]], [[setCoding()|useStore.setCoding()]], [[setSampleBanner()|useUi.setSampleBanner()]]
- Used in: [[Overlays.tsx]], [[menus.ts]]

### openDroppedFile
*function* · line 420 · exported
> Handle any dropped file: data files open, project files open as projects.
- Calls: [[fileActions.ts#isDataFileName|isDataFileName()]], [[fileActions.ts#isProjectFileName|isProjectFileName()]], [[fileActions.ts#openDataFile|openDataFile()]], [[fileActions.ts#openProjectFile|openProjectFile()]], [[io/index.ts#unopenableReason|unopenableReason()]]
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[Overlays.tsx]]
