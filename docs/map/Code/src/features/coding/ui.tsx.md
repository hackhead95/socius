---
id: src/features/coding/ui.tsx
type: module
file: src/features/coding/ui.tsx
area: features/coding
---

# src/features/coding/ui.tsx

*Module* · area [[features - coding|features/coding]] · 311 lines

> Small UI pieces shared by the coding workspace.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[coding/hooks.ts]] · value

## Tested by
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[AnalyseView.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[AutoCodeDialog.tsx]] · value
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[MemosView.tsx]] · value
- [[QuickCode.tsx]] · value
- [[Reader.tsx]] · value
- [[ReliabilityView.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[ui-fixes.test.tsx]] · value

## Types
MenuItem (line 7) · MenuPlacement (line 18)

## Private helpers
EDGE (line 30) · GAP (line 31)

## Symbols

### placeMenu
*function* · line 40 · exported
> Where to put a dropdown so it stays on screen. It prefers `prefer` alignment ('right': the menu's right edge on the trigger's right edge, as in a toolbar at the right; 'left': left edges aligned), uses the other alignment when the prefer...
- Uses: [[ui.tsx]]
- Used in: [[ui-fixes.test.tsx]]

### MenuButton
*component* · line 65 · exported · note: [[MenuButton|<MenuButton>]]
> A button that opens a small dropdown menu (keyboard: arrows, Enter, Escape).
- Calls: [[ui.tsx#placeMenu|placeMenu()]]
- Rendered by: [[CodebookPanel|<CodebookPanel>]], [[CodingWorkspace|<CodingWorkspace>]], [[SourcesPanel|<SourcesPanel>]], [[ui-fixes.test.tsx]]

### useScrollEdges
*hook* · line 177 · exported · note: [[useScrollEdges (features-coding-ui)|useScrollEdges()]]
> Which sides of a horizontal scroller have content out of view (updates on scroll and resize).
- Used in: [[CodingWorkspace.tsx]]

### Swatch
*component* · line 202 · exported · note: [[Swatch|<Swatch>]]
- Rendered by: [[AutoCodeDialog|<AutoCodeDialog>]], [[ByAttribute|<ByAttribute>]], [[Components/Frequencies|<Frequencies>]], [[Cooccurrence|<Cooccurrence>]], [[ExportToDatasetDialog|<ExportToDatasetDialog>]], [[MemosView|<MemosView>]], [[QuickCode|<QuickCode>]], [[Reader|<Reader>]], [[ReliabilityView|<ReliabilityView>]], [[RetrievalView|<RetrievalView>]]

### CodeChip
*component* · line 207 · exported · note: [[CodeChip|<CodeChip>]]
> Code chip: translucent fill and solid left edge in the code colour.
- Calls: [[coding/hooks.ts#fillOf|fillOf()]]
- Rendered by: [[AiSuggestDialog|<AiSuggestDialog>]], [[Reader|<Reader>]], [[ResponseRow|<ResponseRow>]], [[ResponsesView|<ResponsesView>]]

### Segmented
*component* · line 233 · exported · note: [[Segmented|<Segmented>]]
- Rendered by: [[ExportDialog|<ExportDialog>]], [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]]

### Floating
*component* · line 249 · exported · note: [[Floating|<Floating>]]
> Fixed-position floating panel anchored to a viewport rectangle; flips above when there is no room below and stays inside the viewport horizontally.
- Rendered by: [[CodebookPanel|<CodebookPanel>]], [[Reader|<Reader>]], [[ResponsesView|<ResponsesView>]]

### Bar
*component* · line 304 · exported · note: [[Components/Bar|<Bar>]]
> Horizontal percentage bar used in frequency tables.
- Rendered by: [[Components/Frequencies|<Frequencies>]], [[WordTable|<WordTable>]]
