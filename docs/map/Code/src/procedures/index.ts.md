---
id: src/procedures/index.ts
type: module
file: src/procedures/index.ts
area: procedures
---

# src/procedures/index.ts

*Module* · area [[procedures]] · 12 lines

> Procedure registry. Each team owns its own sub-index; this file only concatenates them.

## Imports
- [[procedure.ts]] · type-only
- [[core/index.ts]] · value
- [[graphs/index.ts]] · value
- [[models/index.ts]] · value

## Tested by
- [[commands-smoke-analyze.spec.ts]] · import
- [[menu-knowledge.test.ts]] · import
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import
- [[search.test.ts]] · import
- [[scenarios.test.ts]] · import
- [[units.test.ts]] · import
- [[findings-repro.test.ts]] · import
- [[procedures-oracle.fuzz.test.ts]] · import
- [[procedures-perf.fuzz.test.ts]] · import
- [[procedures-text.fuzz.test.ts]] · import
- [[procedures.fuzz.test.ts]] · import
- [[replay.test.ts]] · import
- [[dialog-ui.test.tsx]] · import
- [[dialog.test.ts]] · import
- [[fuzz-fixes.test.ts]] · import
- [[sample-survey.test.ts]] · import
- [[stats-models/procedures.test.ts]] · import
- [[separation.test.ts]] · import

## Imported by
- [[commands-smoke-analyze.spec.ts]] · value
- [[CommandPalette.tsx]] · value
- [[menuKnowledge.ts]] · value
- [[menus.ts]] · value
- [[ProcedureDialog.tsx]] · value
- [[runProcedure.ts]] · value
- [[exampleGuide.ts]] · value
- [[OutputViewer.tsx]] · value
- [[prompt.ts]] · value
- [[tools/analysis.ts]] · value
- [[menu-knowledge.test.ts]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value
- [[search.test.ts]] · value
- [[scenarios.test.ts]] · value
- [[units.test.ts]] · value
- [[findings-repro.test.ts]] · value
- [[procedures-oracle.fuzz.test.ts]] · value
- [[procedures-perf.fuzz.test.ts]] · value
- [[procedures-text.fuzz.test.ts]] · value
- [[procedures.fuzz.test.ts]] · value
- [[replay.test.ts]] · value
- [[dialog-ui.test.tsx]] · value
- [[dialog.test.ts]] · dynamic
- [[fuzz-fixes.test.ts]] · value
- [[sample-survey.test.ts]] · value
- [[stats-models/procedures.test.ts]] · value
- [[separation.test.ts]] · value

## Symbols

### procedures
*const* · line 7 · exported
- Uses: [[core/index.ts#coreProcedures|coreProcedures]], [[graphs/index.ts#graphProcedures|graphProcedures]], [[models/index.ts#modelProcedures|modelProcedures]]
- Used in: [[commands-smoke-analyze.spec.ts]], [[CommandPalette.tsx]], [[menuKnowledge.ts]], [[menus.ts]], [[runProcedure.ts]], [[prompt.ts]], [[tools/analysis.ts]], [[menu-knowledge.test.ts]], [[navigation-audit.test.tsx]], [[search.test.ts]], [[scenarios.test.ts]], [[units.test.ts]], [[procedures-perf.fuzz.test.ts]], [[procedures-text.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[dialog-ui.test.tsx]], [[fuzz-fixes.test.ts]], [[sample-survey.test.ts]], [[stats-models/procedures.test.ts]], [[separation.test.ts]]

### getProcedure
*function* · line 9 · exported
- Uses: [[procedures/index.ts#procedures|procedures]]
- Used in: [[CommandPalette.tsx]], [[ProcedureDialog.tsx]], [[runProcedure.ts]], [[exampleGuide.ts]], [[OutputViewer.tsx]], [[tools/analysis.ts]], [[palette.test.tsx]], [[findings-repro.test.ts]], [[procedures-oracle.fuzz.test.ts]], [[replay.test.ts]], [[fuzz-fixes.test.ts]]
