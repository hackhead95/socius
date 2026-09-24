---
id: "ai-tool:get_output"
type: ai-tool
file: src/lib/assistant/tools/analysis.ts
line: 354
area: lib/assistant
---

# get_output

*Assistant tool* · defined in [[tools/analysis.ts]] (line 354) · area [[lib - assistant|lib/assistant]]

- **Description:** One result from the Output tab as text (tables, warnings, interpretation, APA sentence, syntax). Without id: the latest analysis.
- **Tool kind:** read

## Calls
- [[assistant/format.ts#blockText|blockText()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[assistant/format.ts#clipTable|clipTable()]]
- [[assistant/format.ts#enc|enc]]
- [[assistant/format.ts#outputItemText|outputItemText()]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[outputs|useStore.outputs]]

## Tested by
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[tools/analysis.ts#getOutput|getOutput()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
