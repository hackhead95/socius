---
id: "ai-tool:list_codes"
type: ai-tool
file: src/lib/assistant/tools/coding.ts
line: 143
area: lib/assistant
---

# list_codes

*Assistant tool* · defined in [[coding.ts]] (line 143) · area [[lib - assistant|lib/assistant]]

- **Description:** The Text coding project: number of documents and responses, document attributes, and the codebook (hierarchy, descriptions) with how many documents and segments each code has.
- **Tool kind:** read

## Calls
- [[coding/analysis.ts#attributeKeys|attributeKeys()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[coding/analysis.ts#codeFrequencies|codeFrequencies()]]
- [[tree.ts#codePath|codePath()]]
- [[assistant/format.ts#enc|enc]]
- [[coding.ts#NO_CODING|NO_CODING]]
- [[tree.ts#orderedCodes|orderedCodes()]]
- [[assistant/format.ts#pct|pct()]]
- [[coding.ts#projectOf|projectOf()]]
- [[coding.ts#scopedSegments|scopedSegments()]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[useStore/coding|useStore.coding]]

## Tested by
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[coding.ts#listCodes|listCodes()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
