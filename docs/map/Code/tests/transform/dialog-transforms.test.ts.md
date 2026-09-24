---
id: tests/transform/dialog-transforms.test.ts
type: test
file: tests/transform/dialog-transforms.test.ts
area: tests
---

# tests/transform/dialog-transforms.test.ts

*Test file* · area [[tests]] · 113 lines

> Logic behind the Automatic recode, Recode into same variables and Sort cases dialogs, run on the bundled sample survey and checked against pandas (Python oracle, skipped without Python) and a plain reference. The dialogs themselves are covered end to end in e2e/transform-dialogs.spec.ts.

## Test cases
- **Automatic recode**
  - codes a string variable 1..k in sorted order, with the old values as labels
  - descending order and a labelled numeric source keep its labels
  - refuses a name that is taken
- **Recode into same variables**
  - reverses a Likert item in place, leaving other values alone
  - an IF condition limits the recode to some cases
- **Sort cases**
  - sorts by several keys, stable, system-missing first when ascending
  - sorts text by its trimmed value and moves every column together
  - asks for a variable

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[core/types.ts]] · type-only
- [[io/index.ts]] · value
- [[transform/index.ts]] · value
- [[io/helpers.ts]] · value
- [[transform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[recode.ts#autoRecode|autoRecode()]]
- [[transform/helpers.ts#col|col()]]
- [[io/index.ts#importFile|importFile()]]
- [[recode.ts#recodeSame|recodeSame()]]
- [[cases.ts#sortCases|sortCases()]]
- [[cases.ts#sortOrder|sortOrder()]]
- [[transform/helpers.ts#vid|vid()]]

## Uses
- [[io/helpers.ts#HAS_ORACLE|HAS_ORACLE]]
- [[io/helpers.ts#PYTHON|PYTHON]]

## Tests
- [[Data/Sort cases|Data > Sort cases...]] · menu label
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[transform/index.ts]] · import
- [[Automatic recode|Transform > Automatic recode...]] · menu label
- [[Recode into same variables|Transform > Recode into same variables...]] · menu label

## Private helpers
SAV (line 14) · survey (line 15) · pandas() (line 21)
