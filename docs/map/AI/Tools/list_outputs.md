---
id: "ai-tool:list_outputs"
type: ai-tool
file: src/lib/assistant/tools/analysis.ts
line: 346
area: lib/assistant
---

# list_outputs

*Assistant tool* · defined in [[tools/analysis.ts]] (line 346) · area [[lib - assistant|lib/assistant]]

- **Description:** The results already in the Output tab (id, title, time), oldest first.
- **Tool kind:** read

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[assistant/format.ts#enc|enc]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[outputs|useStore.outputs]]

## Tested by
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[tools/analysis.ts#listOutputs|listOutputs()]]
