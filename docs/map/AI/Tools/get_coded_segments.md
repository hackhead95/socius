---
id: "ai-tool:get_coded_segments"
type: ai-tool
file: src/lib/assistant/tools/coding.ts
line: 151
area: lib/assistant
---

# get_coded_segments

*Assistant tool* · defined in [[coding.ts]] (line 151) · area [[lib - assistant|lib/assistant]]

- **Description:** Quotes coded with a code (and its sub-codes), spread over documents, with the document name and attributes. Use to summarise or illustrate a theme.
- **Tool kind:** read

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[assistant/format.ts#closestNames|closestNames()]]
- [[coding.ts#codeNotFound|codeNotFound()]]
- [[tree.ts#codePath|codePath()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[coding.ts#docLabel|docLabel()]]
- [[assistant/format.ts#enc|enc]]
- [[coding.ts#findCode|findCode()]]
- [[assistant/format.ts#levenshtein|levenshtein()]]
- [[coding.ts#NO_CODING|NO_CODING]]
- [[coding.ts#projectOf|projectOf()]]
- [[coding.ts#scopedSegments|scopedSegments()]]
- [[coding.ts#TEXTS_OFF|TEXTS_OFF]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[useStore/coding|useStore.coding]]

## Tested by
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[coding.ts#getSegments|getSegments()]]

## Listed by
- [[tools/index.ts#compactTools|compactTools()]]
