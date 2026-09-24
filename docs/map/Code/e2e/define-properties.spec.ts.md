---
id: e2e/define-properties.spec.ts
type: e2e-spec
file: e2e/define-properties.spec.ts
area: e2e
---

# e2e/define-properties.spec.ts

*End-to-end spec* · area [[e2e]] · 164 lines

> Data > Define variable properties...: scan, spot missing codes, label, mark missing, set the level, apply to a battery, Apply as one change (logged with SPSS syntax), and undo it in one step.

## Test cases
  - define variable properties: scan, flag, label, mark missing, set measure, apply to a battery, undo in one step
  - define variable properties: suggestions are a preview, and closing with edits asks first
  - define variable properties: search finds it by its words

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Analyze/Scale|Analyze > Scale]] · menu label
- [[Define variable properties|Data > Define variable properties...]] · menu label
- [[Data View|View > Data View]] · menu label
- [[Variable View|View > Variable View]] · menu label

## Private helpers
dialog() (line 6) · row() (line 7) · vvRow() (line 8) · pickVariables() (line 10)
