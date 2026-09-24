---
id: "ai-tool:search_text"
type: ai-tool
file: src/lib/assistant/tools/coding.ts
line: 175
area: lib/assistant
---

# search_text

*Assistant tool* · defined in [[coding.ts]] (line 175) · area [[lib - assistant|lib/assistant]]

- **Description:** Keyword-in-context search across all Text coding documents and responses (whole words, * wildcard).
- **Tool kind:** read

## Calls
- [[assistant/format.ts#byteLength|byteLength()]]
- [[coding.ts#docLabel|docLabel()]]
- [[assistant/format.ts#enc|enc]]
- [[text.ts#kwic|kwic()]]
- [[coding.ts#NO_CODING|NO_CODING]]
- [[coding.ts#projectOf|projectOf()]]
- [[coding.ts#TEXTS_OFF|TEXTS_OFF]]
- [[assistant/format.ts#trimToBytes|trimToBytes()]]

## Reads
- [[useStore/coding|useStore.coding]]

## Tested by
- [[scenarios.test.ts]] · tool name

## Implemented by
- [[coding.ts#searchText|searchText()]]
