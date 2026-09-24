---
id: tests/coding/ui-fixes.test.tsx
type: test
file: tests/coding/ui-fixes.test.tsx
area: tests
---

# tests/coding/ui-fixes.test.tsx

*Test file* · area [[tests]] · 270 lines

> @vitest-environment jsdom Regression tests for the Text coding bugs from the QA crawl (docs/qa/UI-BUGS.md): UI-002, UI-008, UI-015, UI-016, UI-018, UI-019, UI-023, UI-029 and UI-030.

## Test cases
- **UI-002: the Documents tab in a responses-only project**
  - opens on the first visit to Responses, but stays on Documents once the tab is clicked
- **UI-008: dropdowns stay on screen**
  - right-aligns when there is room on the left
  - left-aligns a button near the left edge instead of opening off-screen (the old x = -113)
  - shifts a menu that fits neither way and never goes past either edge
  - opens upwards when there is no room below, and limits the height to the screen
- **UI-016: disabled menu items say why**
  - puts the reason on a disabled item as its tooltip
  - every disabled item of the coding toolbar menus has a reason
- **UI-015: Auto-code shows the full code name on hover**
  - gives each code in the list a tooltip
- **UI-023: the view tabs show that they scroll**
  - marks the side with more tabs when the row is wider than the screen
  - the Reliability tab says it needs two coders while there is one
- **UI-019: Code frequencies shows theme totals**
  - shows a theme with the total of its sub-codes, not 0 / 0.0%
- **Codebook panel counts match Code frequencies**
  - shows a theme with its sub-codes included, not 0 · 0
- **UI-018 / UI-029: the worked example is short in the toast and matches the app**
  - names real menu items, and counts codes the way the codebook does
  - loads with a short toast; the next steps are in the note, which stays
- **UI-030: memo dates use the shared format**
  - shows the same date and time in the memo list and the footer
- **UI-014 (co-occurrence part): heat map cells keep readable text**
  - caps the accent share at 70% and marks strong cells for the per-theme text colour

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[menus.ts]] · value
- [[coding-types.ts]] · value
- [[format-date.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[coding/actions.ts]] · value
- [[AnalyseView.tsx]] · dynamic, value
- [[CodebookPanel.tsx]] · value
- [[CodingDialog.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- [[exampleGuide.ts]] · value
- [[MemosView.tsx]] · value
- [[menu.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[example.ts]] · value
- [[io/index.ts]] · value
- [[samples/index.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/actions.ts#addCoder|addCoder()]]
- [[coding/actions.ts#addDocs|addDocs()]]
- [[menus.ts#allMenus|allMenus()]]
- [[example.ts#buildWorkedExample|buildWorkedExample()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[example.ts#describeCodebookSize|describeCodebookSize()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[format-date.ts#formatDateTime|formatDateTime()]]
- [[io/index.ts#importFile|importFile()]]
- [[ui.tsx#placeMenu|placeMenu()]]
- [[coding/actions.ts#setWholeResponseCode|setWholeResponseCode()]]
- [[exampleGuide.ts#workedExampleGuide|workedExampleGuide()]]

## Renders
- [[AnalyseView|<AnalyseView>]]
- [[CodebookPanel|<CodebookPanel>]]
- [[CodingDialog|<CodingDialog>]]
- [[CodingWorkspace|<CodingWorkspace>]]
- [[MemosView|<MemosView>]]
- [[MenuButton|<MenuButton>]]

## Uses
- [[menu.ts#codingMenuItems|codingMenuItems]]
- [[exampleGuide.ts#NOT_CODED_FILTER_LABEL|NOT_CODED_FILTER_LABEL]]
- [[samples/index.ts#SAMPLE_SURVEY_FILE|SAMPLE_SURVEY_FILE]]
- [[exampleGuide.ts#UNDO_CODING_LABEL|UNDO_CODING_LABEL]]
- [[useCodingUi]]
- [[useStore]]

## Reads
- [[useCodingUi/view|useCodingUi.view]] · getState
- [[useStore/coding|useStore.coding]] · getState
- [[useStore/toasts|useStore.toasts]] · getState

## Writes
- [[activeDocId|useCodingUi.activeDocId]] · setState
- [[analyseTab|useCodingUi.analyseTab]] · setState
- [[useCodingUi/dialog|useCodingUi.dialog]] · setState
- [[exampleNote|useCodingUi.exampleNote]] · setState
- [[useCodingUi/future|useCodingUi.future]] · setState
- [[useCodingUi/history|useCodingUi.history]] · setState
- [[showAllCoders|useCodingUi.showAllCoders]] · setState
- [[useCodingUi/view|useCodingUi.view]] · setState
- [[viewPicked|useCodingUi.viewPicked]] · setState
- [[dataset|useStore.dataset]] · setState
- [[useStore/tab|useStore.tab]] · setState
- [[useStore/toasts|useStore.toasts]] · setState

## Calls store actions
- [[setCoding()|useStore.setCoding()]] · getState

## Tests
- [[menus.ts]] · import
- [[coding-types.ts]] · import
- [[format-date.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[coding/actions.ts]] · import
- [[AnalyseView.tsx]] · import
- [[CodebookPanel.tsx]] · import
- [[CodingDialog.tsx]] · import
- [[CodingWorkspace.tsx]] · import
- [[exampleGuide.ts]] · import
- [[MemosView.tsx]] · import
- [[menu.ts]] · import
- [[ui.tsx]] · import
- [[uiStore.ts]] · import
- [[example.ts]] · import
- [[io/index.ts]] · import
- [[samples/index.ts]] · import
- [[Import documents|Text coding > Import documents...]] · menu label

## Private helpers
SAV (line 27) · sample (line 28) · responses() (line 49)
