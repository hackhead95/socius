---
id: e2e/commands-smoke-analyze.spec.ts
type: e2e-spec
file: e2e/commands-smoke-analyze.spec.ts
area: e2e
---

# e2e/commands-smoke-analyze.spec.ts

*End-to-end spec* · area [[e2e]] · 183 lines

> Command smoke test, Analyze and Graphs: with the sample survey loaded, every procedure in these menus (read from the live menubar, so a new one is included automatically) is opened, its required boxes are filled with suitable sample variables chosen from the procedure's own slot definitions (types and measurement levels), and it is run. Each run must add one Output result with no "NaN", "undefi...

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[commands-smoke-helpers.ts]] · value
- [[e2e/helpers.ts]] · value
- [[node-fs|node:fs]] · value
- [[core/data.ts]] · value
- [[procedure.ts]] · type-only
- [[sav-reader.ts]] · value
- [[procedures/index.ts]] · value

## Calls
- [[commands-smoke-helpers.ts#errorLogErrors|errorLogErrors()]]
- [[commands-smoke-helpers.ts#invoke|invoke()]]
- [[core/data.ts#isMissingValue|isMissingValue()]]
- [[commands-smoke-helpers.ts#menuTree|menuTree()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]
- [[sav-reader.ts#readSav|readSav()]]
- [[commands-smoke-helpers.ts#settle|settle()]]
- [[commands-smoke-helpers.ts#watchErrors|watchErrors()]]

## Uses
- [[commands-smoke-helpers.ts#BAD_OUTPUT|BAD_OUTPUT]]
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Procedures/binomial|Binomial]] · procedure id
- [[core/data.ts]] · import
- [[procedure.ts]] · import
- [[sav-reader.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
DISTINCT (line 16) · dialogVars() (line 41) · AVOID (line 53) · candidates() (line 60) · howMany() (line 81) · addVar() (line 86) · fill() (line 98) · runProcedure() (line 119) · GROUPS (line 158)
