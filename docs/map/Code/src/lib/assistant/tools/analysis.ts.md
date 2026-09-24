---
id: src/lib/assistant/tools/analysis.ts
type: module
file: src/lib/assistant/tools/analysis.ts
area: lib/assistant
---

# src/lib/assistant/tools/analysis.ts

*Module* · area [[lib - assistant|lib/assistant]] · 364 lines

> Analysis tools: the procedure catalogue (generated from the live registry), running a real procedure on the live dataset without touching the Output tab, proposing a prefilled dialog, and reading results the user already has.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · type-only, value
- [[varUtils.ts]] · value
- [[assistant/format.ts]] · value
- [[tools/data.ts]] · value
- [[assistant/types.ts]] · type-only
- [[ai-tools.ts]] · type-only
- [[procedures/index.ts]] · value

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[prompt.ts]] · value
- [[tools/index.ts]] · value
- [[units.test.ts]] · value

## Private helpers
OPTIONS_SCHEMA (line 288) · variablesSchema() (line 294)

## Symbols

### menuPath
*function* · line 17 · exported
> Where a procedure lives in the menus, e.g. "Analyze > Compare Means > Independent-Samples T Test".
- Used in: [[prompt.ts]]

### MEASURE_WORD
*const* · line 21

### slotLine
*function* · line 23
- Uses: [[tools/analysis.ts#MEASURE_WORD|MEASURE_WORD]]

### optionLine
*function* · line 33

### catalogueText
*function* · line 51 · exported
> The whole catalogue (compact) or one procedure in detail. Generated from the registry at run time.
- Calls: [[procedures/index.ts#getProcedure|getProcedure()]], [[tools/analysis.ts#menuPath|menuPath()]], [[tools/analysis.ts#optionLine|optionLine()]], [[tools/analysis.ts#slotLine|slotLine()]]
- Uses: [[procedures/index.ts#procedures|procedures]]
- Used in: [[units.test.ts]]

### listAnalyses
*function* · line 69
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[procedures/index.ts#getProcedure|getProcedure()]], [[tools/analysis.ts#catalogueText|catalogueText()]]

### allSlotKeys
*function* · line 77 · exported
> All slot keys across procedures (for the schema).
- Uses: [[procedures/index.ts#procedures|procedures]]

### toList
*function* · line 83

### parseVarValue
*function* · line 91
> Match a user/model value (code, or label text) to a value of the variable.

### prepareProcedure
*function* · line 113 · exported
> Turn tool arguments into dialog slots/options, with helpful errors and automatic group pairs.
- Calls: [[assistant/format.ts#closestNames|closestNames()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#categoryLabel|categoryLabel()]], [[core/data.ts#distinctValues|distinctValues()]], [[procedure.ts#defaultOptions|defaultOptions()]], [[procedures/index.ts#getProcedure|getProcedure()]], [[tools/analysis.ts#parseVarValue|parseVarValue()]], [[tools/analysis.ts#slotLine|slotLine()]], [[tools/analysis.ts#toList|toList()]], [[tools/data.ts#resolveVariables|resolveVariables()]], [[varUtils.ts#measureWarning|measureWarning()]], [[varUtils.ts#optionInactive|optionInactive()]], [[varUtils.ts#typeProblem|typeProblem()]], [[varUtils.ts#validate|validate()]]
- Uses: [[procedures/index.ts#procedures|procedures]]

### describeRun
*function* · line 212

### needData
*function* · line 218
- Uses: [[tools/data.ts#NO_DATA|NO_DATA]], [[tools/data.ts#STATS_OFF|STATS_OFF]]

### runAnalysis
*function* · line 225
- Calls: [[assistant/format.ts#outputItemText|outputItemText()]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[core/types.ts#newId|newId()]], [[tools/analysis.ts#describeRun|describeRun()]], [[tools/analysis.ts#menuPath|menuPath()]], [[tools/analysis.ts#needData|needData()]], [[tools/analysis.ts#prepareProcedure|prepareProcedure()]], [[tools/data.ts#caseStatus|caseStatus()]]

### openDialog
*function* · line 249
- Calls: [[core/types.ts#newId|newId()]], [[tools/analysis.ts#describeRun|describeRun()]], [[tools/analysis.ts#menuPath|menuPath()]], [[tools/analysis.ts#needData|needData()]], [[tools/analysis.ts#prepareProcedure|prepareProcedure()]]

### listOutputs
*function* · line 267
> ---------- outputs the user already has ----------
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]]

### getOutput
*function* · line 274
- Calls: [[assistant/format.ts#outputItemText|outputItemText()]], [[assistant/format.ts#trimToBytes|trimToBytes()]]

### analysisTools
*function* · line 304 · exported
- Calls: [[procedures/index.ts#getProcedure|getProcedure()]], [[tools/analysis.ts]]
- Uses: [[procedures/index.ts#procedures|procedures]], [[tools/analysis.ts#getOutput|getOutput()]], [[tools/analysis.ts#listAnalyses|listAnalyses()]], [[tools/analysis.ts#listOutputs|listOutputs()]], [[tools/analysis.ts#openDialog|openDialog()]], [[tools/analysis.ts#runAnalysis|runAnalysis()]], [[tools/analysis.ts]]
- Used in: [[tools/index.ts]]
