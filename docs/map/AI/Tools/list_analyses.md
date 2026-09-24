---
id: "ai-tool:list_analyses"
type: ai-tool
file: src/lib/assistant/tools/analysis.ts
line: 307
area: lib/assistant
---

# list_analyses

*Assistant tool* · defined in [[tools/analysis.ts]] (line 307) · area [[lib - assistant|lib/assistant]]

- **Description:** The analyses Socius offers (ids, menu paths, variable slots with allowed types and measurement levels). With procedure_id: that analysis in detail with all options and defaults.
- **Tool kind:** read

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[tools/analysis.ts#catalogueText|catalogueText()]]
- [[assistant/format.ts#enc|enc]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[tools/analysis.ts#MEASURE_WORD|MEASURE_WORD]]
- [[tools/analysis.ts#menuPath|menuPath()]]
- [[tools/analysis.ts#optionLine|optionLine()]]
- [[tools/analysis.ts#slotLine|slotLine()]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Tested by
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[tools/analysis.ts#listAnalyses|listAnalyses()]]
