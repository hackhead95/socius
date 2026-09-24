---
id: e2e/transform-dialogs.spec.ts
type: e2e-spec
file: e2e/transform-dialogs.spec.ts
area: e2e
---

# e2e/transform-dialogs.spec.ts

*End-to-end spec* · area [[e2e]] · 98 lines

> Smoke tests for the transform dialogs the map found untested (docs/map/GRAPH_REPORT.md): Automatic recode, Copy variable properties, Recode into same variables and Sort cases. Each one: open the dialog, run it on the sample survey, check the result and the Output log, then Edit > Undo (which names the step) restores the data.

## Test cases
  - Automatic recode: interviewer codes become 1..15 with labels, logged, and undone
  - Copy variable properties: trust1 labels go to yrs_nbhd, logged as syntax, and undone
  - Recode into same variables: ages 18 to 19 become 18 in place, logged, and undone
  - Sort cases: by age descending puts the oldest first, logged, and undone

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Copy variable properties|Data > Copy variable properties...]] · menu label
- [[Data/Sort cases|Data > Sort cases...]] · menu label
- [[Automatic recode|Transform > Automatic recode...]] · menu label
- [[Recode into same variables|Transform > Recode into same variables...]] · menu label
- [[Data View|View > Data View]] · menu label
- [[Variable View|View > Variable View]] · menu label

## Private helpers
menu() (line 8) · undoVia() (line 14) · cell() (line 20) · outputHas() (line 22)
