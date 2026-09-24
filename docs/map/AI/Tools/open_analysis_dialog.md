---
id: "ai-tool:open_analysis_dialog"
type: ai-tool
file: src/lib/assistant/tools/analysis.ts
line: 333
area: lib/assistant
---

# open_analysis_dialog

*Assistant tool* · defined in [[tools/analysis.ts]] (line 333) · area [[lib - assistant|lib/assistant]]

- **Description:** Offer the user a button that opens the real analysis dialog prefilled with these variables and options, so they can review and click Run themselves. Use when the user wants to run it themselves or learn where it is.
- **Tool kind:** action

## Calls
- [[assistant/format.ts#closestNames|closestNames()]]
- [[tools/analysis.ts#describeRun|describeRun()]]
- [[assistant/format.ts#levenshtein|levenshtein()]]
- [[tools/analysis.ts#MEASURE_WORD|MEASURE_WORD]]
- [[tools/analysis.ts#menuPath|menuPath()]]
- [[tools/analysis.ts#needData|needData()]]
- [[core/types.ts#newId|newId()]]
- [[tools/data.ts#NO_DATA|NO_DATA]]
- [[tools/analysis.ts#parseVarValue|parseVarValue()]]
- [[tools/analysis.ts#prepareProcedure|prepareProcedure()]]
- [[tools/data.ts#resolveVariables|resolveVariables()]]
- [[tools/analysis.ts#slotLine|slotLine()]]
- [[tools/data.ts#STATS_OFF|STATS_OFF]]
- [[tools/analysis.ts#toList|toList()]]

## Reads
- [[dataset|useStore.dataset]]

## Implemented by
- [[tools/analysis.ts#openDialog|openDialog()]]
