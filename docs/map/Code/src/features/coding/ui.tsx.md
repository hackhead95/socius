---
id: src/features/coding/ui.tsx
type: module
file: src/features/coding/ui.tsx
area: features/coding
---

# src/features/coding/ui.tsx

*Module* · area [[features - coding|features/coding]] · 204 lines

> Small UI pieces shared by the coding workspace.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[coding/hooks.ts]] · value

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

## Types
MenuItem (line 7)

## Symbols

### MenuButton
*component* · line 17 · exported · note: [[MenuButton (features-coding-ui)|<MenuButton>]]
> A button that opens a small dropdown menu (keyboard: arrows, Enter, Escape).
- Rendered by: [[CodebookPanel|<CodebookPanel>]], [[CodingWorkspace|<CodingWorkspace>]], [[SourcesPanel|<SourcesPanel>]]

### Swatch
*component* · line 95 · exported · note: [[Swatch|<Swatch>]]
- Rendered by: [[AutoCodeDialog|<AutoCodeDialog>]], [[ByAttribute|<ByAttribute>]], [[Components/Frequencies|<Frequencies>]], [[Cooccurrence|<Cooccurrence>]], [[ExportToDatasetDialog|<ExportToDatasetDialog>]], [[MemosView|<MemosView>]], [[QuickCode|<QuickCode>]], [[Reader|<Reader>]], [[ReliabilityView|<ReliabilityView>]], [[RetrievalView|<RetrievalView>]]

### CodeChip
*component* · line 100 · exported · note: [[CodeChip|<CodeChip>]]
> Code chip: translucent fill and solid left edge in the code colour.
- Calls: [[coding/hooks.ts#fillOf|fillOf()]]
- Rendered by: [[AiSuggestDialog|<AiSuggestDialog>]], [[Reader|<Reader>]], [[ResponseRow|<ResponseRow>]], [[ResponsesView|<ResponsesView>]]

### Segmented
*component* · line 126 · exported · note: [[Segmented|<Segmented>]]
- Rendered by: [[ExportDialog|<ExportDialog>]], [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]]

### Floating
*component* · line 142 · exported · note: [[Floating|<Floating>]]
> Fixed-position floating panel anchored to a viewport rectangle; flips above when there is no room below and stays inside the viewport horizontally.
- Rendered by: [[CodebookPanel|<CodebookPanel>]], [[Reader|<Reader>]], [[ResponsesView|<ResponsesView>]]

### Bar
*component* · line 197 · exported · note: [[Components/Bar|<Bar>]]
> Horizontal percentage bar used in frequency tables.
- Rendered by: [[Components/Frequencies|<Frequencies>]], [[WordTable|<WordTable>]]
