---
id: src/features/analysis/varUtils.ts
type: module
file: src/features/analysis/varUtils.ts
area: features/analysis
---

# src/features/analysis/varUtils.ts

*Module* · area [[features - analysis|features/analysis]] · 210 lines

> Pure helpers for the procedure dialog: slot suitability, placement, validation, remembered state.

## Imports
- [[procedure.ts]] · type-only, value
- [[core/types.ts]] · type-only

## Tested by
- [[palette.test.tsx]] · import
- [[findings-repro.test.ts]] · import
- [[proc-harness.ts]] · import
- [[dialog.test.ts]] · import
- [[fuzz-fixes.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[ProcedureDialog.tsx]] · value
- [[assistant/actions.ts]] · value
- [[tools/analysis.ts]] · value
- [[palette.test.tsx]] · value
- [[findings-repro.test.ts]] · value
- [[proc-harness.ts]] · value
- [[dialog.test.ts]] · dynamic, value
- [[fuzz-fixes.test.ts]] · value

## Types
Remembered (line 154)

## Private helpers
memory (line 160)

## Symbols

### MEASURE_LABEL
*const* · line 6 · exported
- Used in: [[ProcedureDialog.tsx]]

### typeFits
*function* · line 9 · exported
> Can the variable go in the slot at all (type check)?
- Used in: [[ProcedureDialog.tsx]]

### measureFits
*function* · line 14 · exported
> Is the variable's measurement level one the slot suggests?

### slotCountHint
*function* · line 18 · exported
- Used in: [[ProcedureDialog.tsx]], [[dialog.test.ts]]

### slotSuitHint
*function* · line 26 · exported
- Uses: [[varUtils.ts#MEASURE_LABEL|MEASURE_LABEL]]
- Used in: [[ProcedureDialog.tsx]]

### typeProblem
*function* · line 34 · exported
> Why a variable cannot go in a slot (type), or null.
- Calls: [[varUtils.ts#typeFits|typeFits()]]
- Used in: [[tools/analysis.ts]]

### measureWarning
*function* · line 40 · exported
- Calls: [[varUtils.ts#measureFits|measureFits()]]
- Uses: [[varUtils.ts#MEASURE_LABEL|MEASURE_LABEL]]
- Used in: [[ProcedureDialog.tsx]], [[tools/analysis.ts]], [[dialog.test.ts]]

### addToSlot
*function* · line 50 · exported
> Add variables to a slot. Type-incompatible ones are rejected; a max-1 slot is replaced; a list keeps order and ignores duplicates, up to its max. Returns the new slot values and any messages.
- Calls: [[varUtils.ts#typeProblem|typeProblem()]]
- Used in: [[ProcedureDialog.tsx]], [[dialog.test.ts]]

### removeFromSlot
*function* · line 75 · exported
- Used in: [[ProcedureDialog.tsx]]

### moveWithinSlot
*function* · line 79 · exported
- Used in: [[ProcedureDialog.tsx]], [[dialog.test.ts]]

### bestSlotFor
*function* · line 89 · exported
> The slot a double-clicked variable should go to: first with room and a matching type (preferring a measure match).
- Calls: [[varUtils.ts#measureFits|measureFits()]], [[varUtils.ts#typeFits|typeFits()]]
- Used in: [[ProcedureDialog.tsx]], [[dialog.test.ts]]

### optionInactive
*function* · line 103 · exported
> Options that do not apply given another option's value, e.g. the two group values when the groups are defined by a cut point. Hidden options are not shown and not validated.
- Used in: [[ProcedureDialog.tsx]], [[tools/analysis.ts]]

### validate
*function* · line 114 · exported
> Problems that block running.
- Calls: [[varUtils.ts#optionInactive|optionInactive()]], [[varUtils.ts#typeProblem|typeProblem()]]
- Used in: [[ProcedureDialog.tsx]], [[tools/analysis.ts]], [[findings-repro.test.ts]], [[proc-harness.ts]], [[dialog.test.ts]], [[fuzz-fixes.test.ts]]

### remember
*function* · line 162 · exported
- Uses: [[varUtils.ts]]
- Used in: [[ProcedureDialog.tsx]], [[assistant/actions.ts]], [[dialog.test.ts]]

### recall
*function* · line 167 · exported
> Last slots/options for a procedure in this session, dropping variables that no longer exist.
- Calls: [[procedure.ts#defaultOptions|defaultOptions()]], [[varUtils.ts#typeFits|typeFits()]]
- Uses: [[varUtils.ts]]
- Used in: [[ProcedureDialog.tsx]], [[palette.test.tsx]], [[dialog.test.ts]]

### clearMemory
*function* · line 180 · exported
- Uses: [[varUtils.ts]]
- Used in: [[dialog.test.ts]]

### parseValue
*function* · line 185 · exported
> Value for a groupPair/valueList entry typed by the user, matching the variable's type.
- Used in: [[ProcedureDialog.tsx]]

### prefillProcedure
*function* · line 199 · exported
> Put variables into a procedure's boxes before its dialog opens (e.g. "Frequencies of this variable" from the search palette). Each goes to the best-fitting box; options keep their last values.
- Calls: [[varUtils.ts#bestSlotFor|bestSlotFor()]], [[varUtils.ts#recall|recall()]], [[varUtils.ts#remember|remember()]]
- Used in: [[CommandPalette.tsx]]
