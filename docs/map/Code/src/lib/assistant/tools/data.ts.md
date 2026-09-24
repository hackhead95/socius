---
id: src/lib/assistant/tools/data.ts
type: module
file: src/lib/assistant/tools/data.ts
area: lib/assistant
---

# src/lib/assistant/tools/data.ts

*Module* · area [[lib - assistant|lib/assistant]] · 336 lines

> Read-only dataset tools: overview (dictionary + data-quality flags), variable summaries, and individual cases (only when the user allows it). Missing values, filter and weight follow src/core/data.ts exactly as the procedures do.

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[assistant/format.ts]] · value
- [[assistant/types.ts]] · type-only
- [[stats/descriptives.ts]] · value
- [[stats/frequencies.ts]] · value

## Imported by
- [[prompt.ts]] · value
- [[tools/analysis.ts]] · value
- [[tools/index.ts]] · value
- [[transform.ts]] · value

## Symbols

### NO_DATA
*const* · line 13 · exported
- Used in: [[tools/analysis.ts]], [[transform.ts]]

### STATS_OFF
*const* · line 14 · exported
- Used in: [[tools/analysis.ts]], [[transform.ts]]

### resolveVariables
*function* · line 18 · exported
> Resolve variable names (case-insensitive). Unknown names get "did you mean" suggestions.
- Calls: [[assistant/format.ts#closestNames|closestNames()]], [[core/data.ts#getVariable|getVariable()]]
- Used in: [[tools/analysis.ts]], [[transform.ts]]

### ctxData
*function* · line 36
- Uses: [[tools/data.ts#NO_DATA|NO_DATA]], [[tools/data.ts#STATS_OFF|STATS_OFF]]

### caseStatus
*function* · line 44 · exported
> Status line: cases, filter, weight.
- Calls: [[assistant/format.ts#num|num()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]]
- Used in: [[prompt.ts]], [[tools/analysis.ts]]

### MISSING_WORDS
*const* · line 61

### SENTINELS
*const* · line 62

### scan
*function* · line 75
- Calls: [[core/data.ts#isUserMissing|isUserMissing()]]
- Uses: [[tools/data.ts#SENTINELS|SENTINELS]]

### variableFlags
*function* · line 110 · exported
> Data-quality flags for one variable (plain language, for the model to pass on).
- Calls: [[assistant/format.ts#pct|pct()]], [[core/data.ts#isDateFormat|isDateFormat()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[core/data.ts#valueLabelFor|valueLabelFor()]]
- Uses: [[tools/data.ts#MISSING_WORDS|MISSING_WORDS]]

### overview
*function* · line 132
- Calls: [[assistant/format.ts#missingText|missingText()]], [[assistant/format.ts#num|num()]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[assistant/format.ts#valueLabelsText|valueLabelsText()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#formatRawValue|formatRawValue()]], [[core/data.ts#isDateFormat|isDateFormat()]], [[tools/data.ts#caseStatus|caseStatus()]], [[tools/data.ts#ctxData|ctxData()]], [[tools/data.ts#scan|scan()]], [[tools/data.ts#variableFlags|variableFlags()]]

### freqEntries
*function* · line 184
> ---------- describe variables ----------
- Calls: [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#caseWeights|caseWeights()]], [[core/data.ts#isUserMissing|isUserMissing()]]

### describeVariable
*function* · line 198 · exported
- Calls: [[assistant/format.ts#num|num()]], [[assistant/format.ts#pct|pct()]], [[core/data.ts#categoryLabel|categoryLabel()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[core/data.ts#selectCases|selectCases()]], [[core/data.ts#valueLabelFor|valueLabelFor()]], [[stats/descriptives.ts#exploreStats|exploreStats()]], [[stats/frequencies.ts#frequencyTable|frequencyTable()]], [[tools/data.ts#freqEntries|freqEntries()]]

### describe
*function* · line 240
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[tools/data.ts#caseStatus|caseStatus()]], [[tools/data.ts#ctxData|ctxData()]], [[tools/data.ts#describeVariable|describeVariable()]], [[tools/data.ts#resolveVariables|resolveVariables()]]

### CASES_OFF
*const* · line 254 · exported
> ---------- individual cases ----------

### cases
*function* · line 257
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[core/data.ts#activeCaseMask|activeCaseMask()]], [[core/data.ts#formatCell|formatCell()]], [[core/data.ts#isUserMissing|isUserMissing()]], [[tools/data.ts#ctxData|ctxData()]], [[tools/data.ts#resolveVariables|resolveVariables()]]
- Uses: [[tools/data.ts#CASES_OFF|CASES_OFF]]

### dataTools
*const* · line 287 · exported
- Uses: [[tools/data.ts#cases|cases()]], [[tools/data.ts#describe|describe()]], [[tools/data.ts#overview|overview()]]
- Used in: [[tools/index.ts]]
