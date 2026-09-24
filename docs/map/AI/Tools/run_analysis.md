---
id: "ai-tool:run_analysis"
type: ai-tool
file: src/lib/assistant/tools/analysis.ts
line: 315
area: lib/assistant
---

# run_analysis

*Assistant tool* · defined in [[tools/analysis.ts]] (line 315) · area [[lib - assistant|lib/assistant]]

- **Description:** Run a Socius analysis on the live data exactly as its dialog would (same missing values, filter, weight) and read the SPSS-style tables, warnings, interpretation and APA sentence. It does not change anything and does not add to the Output tab (the user gets an "Add to Output" button). Use it to answer questions about relationships and differences with real numbers.
- **Tool kind:** read
- **In compact tool set:** yes

## Calls
- [[assistant/format.ts#blockText|blockText()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[tools/data.ts#caseStatus|caseStatus()]]
- [[assistant/format.ts#clipTable|clipTable()]]
- [[assistant/format.ts#closestNames|closestNames()]]
- [[tools/analysis.ts#describeRun|describeRun()]]
- [[assistant/format.ts#enc|enc]]
- [[assistant/format.ts#levenshtein|levenshtein()]]
- [[tools/analysis.ts#MEASURE_WORD|MEASURE_WORD]]
- [[tools/analysis.ts#menuPath|menuPath()]]
- [[tools/analysis.ts#needData|needData()]]
- [[core/types.ts#newId|newId()]]
- [[tools/data.ts#NO_DATA|NO_DATA]]
- [[assistant/format.ts#num|num()]]
- [[assistant/format.ts#outputItemText|outputItemText()]]
- [[tools/analysis.ts#parseVarValue|parseVarValue()]]
- [[tools/analysis.ts#prepareProcedure|prepareProcedure()]]
- [[tools/data.ts#resolveVariables|resolveVariables()]]
- [[tools/analysis.ts#slotLine|slotLine()]]
- [[tools/data.ts#STATS_OFF|STATS_OFF]]
- [[tools/analysis.ts#toList|toList()]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[dataset|useStore.dataset]]

## Tested by
- [[assistant.spec.ts]] · tool name
- [[scenarios.test.ts]] · tool name
- [[units.test.ts]] · tool name
- [[ai-latency.test.ts]] · tool name

## Implemented by
- [[tools/analysis.ts#runAnalysis|runAnalysis()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
