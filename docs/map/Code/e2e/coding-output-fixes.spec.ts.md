---
id: e2e/coding-output-fixes.spec.ts
type: e2e-spec
file: e2e/coding-output-fixes.spec.ts
area: e2e
---

# e2e/coding-output-fixes.spec.ts

*End-to-end spec* · area [[e2e]] · 151 lines

> Regression checks for the Text coding, Output and chart bugs from the QA crawl (docs/qa/UI-BUGS.md): UI-002, UI-008, UI-016, UI-018/029, UI-019, UI-023, UI-026 and UI-030.

## Test cases
  - UI-002: the Documents tab opens in a responses-only project and says how to add documents
  - UI-023: on a phone the Text coding view tabs show that they scroll
  - UI-019: Code frequencies shows theme totals including sub-codes
  - UI-030: memo dates use the same format as the Output
  - UI-026: charts are numbered APA figures with the title once, in Output and in the HTML export
  - narrow screens: the stacked Sources and Codebook panels keep their contents clickable

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value
- [[node-fs|node:fs]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Procedures/graph-bar|Bar Chart]] · menu label
- [[Bar Chart|Graphs > Bar Chart...]] · menu label
- [[Code frequencies|Text coding > Code frequencies]] · menu label
- [[Import documents|Text coding > Import documents...]] · menu label
- [[Memos|Text coding > Memos]] · menu label
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
workedExample() (line 7) · menu() (line 14) · DATE_TIME (line 20)
