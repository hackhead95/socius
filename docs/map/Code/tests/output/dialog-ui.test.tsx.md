---
id: tests/output/dialog-ui.test.tsx
type: test
file: tests/output/dialog-ui.test.tsx
area: tests
---

# tests/output/dialog-ui.test.tsx

*Test file* · area [[tests]] · 117 lines

> @vitest-environment jsdom

## Test cases
- **ProcedureDialog**
  - validates, fills slots, picks groups, runs and closes
  - remembers the last choices for the session and shows the last syntax
  - explains when no data is open

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[procedure.ts]] · type-only
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[ProcedureDialog.tsx]] · value
- [[procedures/index.ts]] · value
- [[vitest]] · value

## Calls
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]

## Renders
- [[ProcedureDialog|<ProcedureDialog>]]

## Uses
- [[procedures/index.ts#procedures|procedures]]
- [[useStore]]

## Reads
- [[outputs|useStore.outputs]] · getState

## Writes
- [[dataset|useStore.dataset]] · setState
- [[outputs|useStore.outputs]] · setState

## Tests
- [[Compare Means|Analyze > Compare Means]] · menu label
- [[procedure.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[ProcedureDialog.tsx]] · import
- [[procedures/index.ts]] · import

## Private helpers
seen (line 10) · fake (line 11) · setup() (line 42) · wait() (line 55)
