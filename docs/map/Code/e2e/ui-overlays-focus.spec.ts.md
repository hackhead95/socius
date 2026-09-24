---
id: e2e/ui-overlays-focus.spec.ts
type: e2e-spec
file: e2e/ui-overlays-focus.spec.ts
area: e2e
---

# e2e/ui-overlays-focus.spec.ts

*End-to-end spec* · area [[e2e]] · 401 lines

> Regression tests for the QA crawl of September 2026 (docs/qa/UI-BUGS.md), shell side: toasts that covered dialog buttons, focus after dialogs, the nested Error log dialog, the assistant panel over the top bar, the assistant button over content, menubar hover intent, search on a command that needs data, focus rings, contrast, truncated text, the start screen tab, backdrop clicks, the tablet stat...

## Test cases
  - UI-001: a toast shown while a dialog is open sits beside it, and clicks reach the Run button
  - UI-001 (phone): with a full-screen dialog the toast lets every click through
  - UI-007: the assistant panel opens below the top bar and tabs; Undo, theme and the menus stay usable
  - UI-009: the assistant button is docked in the tab bar instead of floating over content
  - UI-005: dialogs chosen from a menu give focus back to the menu button, never the body or the assistant button
  - UI-006: the Error log opened from About takes focus and keeps Tab inside
  - UI-028: Select Cases opens with focus on the chosen option, so Space does not change it
  - UI-022: a click on the dimmed area keeps a dialog with choices open, and closes an information dialog
  - UI-004: after the arrow keys, pointing at an item leaves exactly one item highlighted
  - UI-011: moving diagonally from a menu title to its items does not switch menus; resting on the next title does
  - UI-012: Enter on a command that needs data explains why and offers a way forward
  - UI-013: the variable search boxes show focus
  - UI-014: secondary text colours pass 4.5:1 in both themes
  - UI-015: a Data View cell cut short shows its full text on hover
  - UI-017: on the start screen no view tab is marked as current
  - UI-024 and UI-025: at tablet width the status shortens with a tooltip, and View > Variable list opens a drawer
  - UI-027: deleting a result says so with Undo, the same step as Edit > Undo
  - Recode and Compute: the toast offers "Show" for the new variable
  - first visit: the welcome screen still loads the sample

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Select cases|Data > Select cases...]] · menu label
- [[Data/Sort cases|Data > Sort cases...]] · menu label
- [[Undo|Edit > Undo]] · menu label
- [[Load sample survey|File > Load sample survey]] · menu label
- [[Open data file|File > Open data file...]] · menu label
- [[Recent projects|File > Recent projects...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[About Socius|Help > About Socius]] · menu label
- [[Error log|Help > Error log...]] · menu label
- [[Keyboard shortcuts|Help > Keyboard shortcuts]] · menu label

## Private helpers
centre() (line 12) · overlaps() (line 17) · hitAt() (line 20) · focused() (line 29) · chooseFromMenu() (line 37)
