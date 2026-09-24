---
id: "ai-tool:codes_by_attribute"
type: ai-tool
file: src/lib/assistant/tools/coding.ts
line: 163
area: lib/assistant
---

# codes_by_attribute

*Assistant tool* · defined in [[coding.ts]] (line 163) · area [[lib - assistant|lib/assistant]]

- **Description:** How often each top-level code (or the listed codes) occurs across values of a document attribute such as gender or city: documents coded and column %.
- **Tool kind:** read

## Calls
- [[coding/analysis.ts#attributeKeys|attributeKeys()]]
- [[coding/analysis.ts#attributeValues|attributeValues()]]
- [[assistant/format.ts#byteLength|byteLength()]]
- [[coding/analysis.ts#codeByAttribute|codeByAttribute()]]
- [[tree.ts#descendantIds|descendantIds()]]
- [[assistant/format.ts#enc|enc]]
- [[coding.ts#findCode|findCode()]]
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
- [[coding.ts#byAttribute|byAttribute()]]
