---
id: e2e/shell.spec.ts
type: e2e-spec
file: e2e/shell.spec.ts
area: e2e
---

# e2e/shell.spec.ts

*End-to-end spec* · area [[e2e]] · 113 lines

> App shell end-to-end checks: sample data, Data View editing, transforms, undo, projects, theme, narrow layout.

## Test cases
  - first run shows the welcome screen; loading the sample shows its banner
  - edits cells with validation and undo
  - compute and select cases are logged and undoable
  - restores the session after a reload
  - saves a project and opens it again
  - theme toggle and narrow layout

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Select cases|Data > Select cases...]] · menu label
- [[Close data and start fresh|File > Close data and start fresh...]] · menu label
- [[Compute variable|Transform > Compute variable...]] · menu label

## Private helpers
ready() (line 5) · menu() (line 9)
