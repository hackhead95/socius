---
id: src/features/coding/hooks.ts
type: module
file: src/features/coding/hooks.ts
area: features/coding
---

# src/features/coding/hooks.ts

*Module* · area [[features - coding|features/coding]] · 83 lines

> Shared selectors and helpers for the coding UI.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[uiStore.ts]] · value
- [[importers.ts]] · value
- [[segments.ts]] · value
- [[tree.ts]] · value
- [[host.ts]] · value
- [[write-excel-file]] · dynamic

## Imported by
- [[AnalyseView.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[AutoCodeDialog.tsx]] · value
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[MemosView.tsx]] · value
- [[QuickCode.tsx]] · value
- [[Reader.tsx]] · value
- [[ReliabilityView.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[ui.tsx]] · value

## Symbols

### useVisibleSegments
*hook* · line 13 · exported · note: [[useVisibleSegments|useVisibleSegments()]]
> Segments shown in the UI: all coders, or only the active coder when "show all" is off.
- Calls: [[useCodingUi]], [[useStore]]
- Reads: [[showAllCoders|useCodingUi.showAllCoders]], [[useStore/coding|useStore.coding]]
- Used in: [[AnalyseView.tsx]], [[CodebookPanel.tsx]], [[RetrievalView.tsx]]

### useSegmentIndex
*hook* · line 20 · exported · note: [[useSegmentIndex|useSegmentIndex()]]
- Calls: [[segments.ts#indexByDoc|indexByDoc()]], [[useVisibleSegments|useVisibleSegments()]]
- Used in: [[Reader.tsx]], [[ResponsesView.tsx]], [[SourcesPanel.tsx]]

### useCodeMap
*hook* · line 25 · exported · note: [[useCodeMap|useCodeMap()]]
- Calls: [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[Reader.tsx]], [[ResponsesView.tsx]], [[AiDialogs.tsx]]

### useOrderedCodes
*hook* · line 30 · exported · note: [[useOrderedCodes|useOrderedCodes()]]
- Calls: [[tree.ts#buildCodeTree|buildCodeTree()]], [[tree.ts#flattenTree|flattenTree()]], [[useStore]]
- Reads: [[useStore/coding|useStore.coding]]
- Used in: [[AnalyseView.tsx]], [[CodebookPanel.tsx]], [[MemosView.tsx]], [[QuickCode.tsx]], [[ReliabilityView.tsx]], [[RetrievalView.tsx]], [[AutoCodeDialog.tsx]], [[ExportDialogs.tsx]], [[SmallDialogs.tsx]]

### useQuickKeyCodes
*hook* · line 36 · exported · note: [[useQuickKeyCodes|useQuickKeyCodes()]]
> Codes bound to number keys 1-9 in the responses view: the first nine codes in codebook order.
- Calls: [[useOrderedCodes|useOrderedCodes()]]
- Used in: [[ResponsesView.tsx]]

### fillOf
*function* · line 42 · exported
> Translucent highlighter fill derived from a code colour (strength from the theme's --cw-hl).
- Used in: [[Reader.tsx]], [[ui.tsx]]

### toast
*function* · line 46 · exported
- Uses: [[useStore]]
- Store actions: [[toast()|useStore.toast()]]
- Used in: [[CodebookPanel.tsx]], [[CodingWorkspace.tsx]], [[MemosView.tsx]], [[RetrievalView.tsx]], [[AiDialogs.tsx]], [[AutoCodeDialog.tsx]], [[ExportDialogs.tsx]], [[ImportDialog.tsx]], [[SmallDialogs.tsx]]

### saveAndReport
*function* · line 51 · exported
> Save a file and report the outcome in a toast.
- Calls: [[coding/hooks.ts#toast|toast()]], [[host.ts#saveFile|saveFile()]]
- Used in: [[MemosView.tsx]], [[ExportDialogs.tsx]]

### saveCsv
*function* · line 58 · exported
- Calls: [[coding/hooks.ts#saveAndReport|saveAndReport()]], [[importers.ts#toCsv|toCsv()]]
- Used in: [[AnalyseView.tsx]], [[RetrievalView.tsx]], [[ExportDialogs.tsx]]

### saveXlsx
*function* · line 62 · exported
- Calls: [[coding/hooks.ts#saveAndReport|saveAndReport()]]
- Used in: [[RetrievalView.tsx]], [[ExportDialogs.tsx]]

### safeFileName
*function* · line 76 · exported
- Used in: [[RetrievalView.tsx]]

### plural
*function* · line 80 · exported
- Used in: [[AnalyseView.tsx]], [[CodebookPanel.tsx]], [[CodingWorkspace.tsx]], [[Reader.tsx]], [[ReliabilityView.tsx]], [[ResponsesView.tsx]], [[RetrievalView.tsx]], [[SourcesPanel.tsx]], [[AiDialogs.tsx]], [[AutoCodeDialog.tsx]], [[ExportDialogs.tsx]], [[ImportDialog.tsx]], [[SmallDialogs.tsx]]
