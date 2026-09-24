---
id: "area:features/coding"
type: area
area: features/coding
---

# Area: features/coding

22 files, 5589 lines.

## Depends on (module imports)
- [[lib - coding|lib/coding]]: 45
- [[core]]: 35
- [[features - ai|features/ai]]: 10
- [[ui]]: 9
- [[platform]]: 7
- [[Areas/app|app]]: 1
- [[procedures]]: 1
- [[samples]]: 1

## Used by areas
- [[Areas/app|app]]: 6
- [[features - ai|features/ai]]: 2
- [[lib - assistant|lib/assistant]]: 1

## Files
- [[coding/actions.ts]]: Coding actions: every change to the coding project goes through `commit`, which records an undo entry (Text coding has its own undo, separat…
- [[AnalyseView.tsx]]: Analysis of the coding: frequencies, co-occurrence, codes by attribute, word frequencies, KWIC.
- [[CodebookPanel.tsx]]: Codebook panel: hierarchical codes with counts, drag to reparent/reorder, quick actions.
- [[CodingDialog.tsx]]: Dialog router for the "Text coding" menu (and the coding AI features started from the AI menu) (rendered by the app shell's DialogHost for s…
- [[CodingWorkspace.tsx]]: The Text coding tab: sources, reading view / responses table / analysis views, and the codebook.
- [[AiDialogs.tsx]]: AI-assisted coding through the provider the user set up (src/platform/ai: Claude inside the artifact, a model on this computer, Gemini, or a…
- [[AutoCodeDialog.tsx]]: Auto-coding with keyword / regex rules: edit rules per code, preview matches in context, apply.
- [[ExportDialogs.tsx]]: Export coded segments, the qualitative report and the codebook; import a codebook; export codes to the dataset as 0/1 variables (mixed-metho…
- [[ImportDialog.tsx]]: Import sources: files (.txt .md .docx .csv .xlsx), pasted text, sample interviews, and open-ended answers from a string variable of the acti…
- [[SmallDialogs.tsx]]: Code editor, merge, source editor and coder management dialogs.
- [[exampleGuide.ts]]: Names the worked example's toast, note and memo use for places in the app, taken from the real menu model (the Text coding menu, the procedu…
- [[coding/hooks.ts]]: Shared selectors and helpers for the coding UI.
- [[MemosView.tsx]]: Memos: project memos and memos linked to a code or a source.
- [[menu.ts]]: The "Text coding" menu. The app shell renders these; selecting one switches to the coding tab and calls openDialog({ kind: 'coding', id }). …
- [[QuickCode.tsx]]: Quick-code picker: search codes, create a code inline, number keys 1-9 for recent codes.
- [[Reader.tsx]]: Reading view: a transcript with coded passages as highlighter marks, coding stripes in the margin, a quick-code popover on selection, and a …
- [[ReliabilityView.tsx]]: Intercoder reliability: compare two coders over the sources both coded.
- [[ResponsesView.tsx]]: Response mode: one open-ended answer per row, virtualised for thousands of rows. Keyboard: j/k or arrows move, x or Space selects, 1-9 toggl…
- [[RetrievalView.tsx]]: Code retrieval: every segment coded with a code, with source, attributes and context.
- [[SourcesPanel.tsx]]: Source list: documents with search, coded/uncoded and attribute filters, segment counts.
- [[ui.tsx]]: Small UI pieces shared by the coding workspace.
- [[uiStore.ts]]: UI state for the Text coding workspace (not saved with the project).

## Components
[[AiCodebookDialog|<AiCodebookDialog>]] · [[AiGate|<AiGate>]] · [[AiSuggestDialog|<AiSuggestDialog>]] · [[AnalyseView|<AnalyseView>]] · [[AutoCodeDialog|<AutoCodeDialog>]] · [[Components/Bar|<Bar>]] · [[ByAttribute|<ByAttribute>]] · [[CodebookPanel|<CodebookPanel>]] · [[CodeChip|<CodeChip>]] · [[CodeEditDialog|<CodeEditDialog>]] · [[CodersDialog|<CodersDialog>]] · [[CodingDialog|<CodingDialog>]] · [[CodingWorkspace|<CodingWorkspace>]] · [[Cooccurrence|<Cooccurrence>]] · [[DocEditDialog|<DocEditDialog>]] · [[ExampleNextSteps|<ExampleNextSteps>]] · [[ExportDialog|<ExportDialog>]] · [[ExportToDatasetDialog|<ExportToDatasetDialog>]] · [[FilesTab|<FilesTab>]] · [[Floating|<Floating>]] · [[Components/Frequencies|<Frequencies>]] · [[ImportDialog (features-coding-dialogs-ImportDialog)|<ImportDialog>]] · [[Kwic|<Kwic>]] · [[MemosView|<MemosView>]] · [[MenuButton|<MenuButton>]] · [[MergeCodeDialog|<MergeCodeDialog>]] · [[OneSidedNote|<OneSidedNote>]] · [[Para|<Para>]] · [[PasteTab|<PasteTab>]] · [[QuickCode|<QuickCode>]] · [[Reader|<Reader>]] · [[ReliabilityView|<ReliabilityView>]] · [[ResponseRow|<ResponseRow>]] · [[ResponsesView|<ResponsesView>]] · [[RetrievalView|<RetrievalView>]] · [[SamplesTab|<SamplesTab>]] · [[Segmented|<Segmented>]] · [[SendButton|<SendButton>]] · [[SourcesPanel|<SourcesPanel>]] · [[SurveyTab|<SurveyTab>]] · [[Swatch|<Swatch>]] · [[TableImport|<TableImport>]] · [[Welcome (features-coding-CodingWorkspace)|<Welcome>]] · [[Words|<Words>]] · [[WordTable|<WordTable>]]

## Hooks
[[useCodeMap|useCodeMap()]] · [[useOrderedCodes|useOrderedCodes()]] · [[useQuickKeyCodes|useQuickKeyCodes()]] · [[useScrollEdges (features-coding-ui)|useScrollEdges()]] · [[useSegmentIndex|useSegmentIndex()]] · [[useVisibleSegments|useVisibleSegments()]]

## Stores
[[useCodingUi]]
