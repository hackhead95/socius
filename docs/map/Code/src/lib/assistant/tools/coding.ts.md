---
id: src/lib/assistant/tools/coding.ts
type: module
file: src/lib/assistant/tools/coding.ts
area: lib/assistant
---

# src/lib/assistant/tools/coding.ts

*Module* · area [[lib - assistant|lib/assistant]] · 188 lines

> Qualitative tools over the Text coding project: codebook with counts, coded segments (quotes), codes by a document attribute, and keyword-in-context search.

## Imports
- [[coding-types.ts]] · type-only
- [[assistant/format.ts]] · value
- [[assistant/types.ts]] · type-only
- [[coding/analysis.ts]] · value
- [[text.ts]] · value
- [[tree.ts]] · value

## Imported by
- [[tools/index.ts]] · value

## Symbols

### TEXTS_OFF
*const* · line 10 · exported

### NO_CODING
*const* · line 12

### scopedSegments
*function* · line 16 · exported
> Segments in scope: the active coder's when several coders have coded, else all.

### projectOf
*function* · line 22
- Uses: [[coding.ts#NO_CODING|NO_CODING]]

### findCode
*function* · line 28
- Calls: [[tree.ts#codePath|codePath()]]

### codeNotFound
*function* · line 33
- Calls: [[assistant/format.ts#closestNames|closestNames()]]

### docLabel
*function* · line 38

### listCodes
*function* · line 43
- Calls: [[assistant/format.ts#pct|pct()]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[coding.ts#projectOf|projectOf()]], [[coding.ts#scopedSegments|scopedSegments()]], [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#codeFrequencies|codeFrequencies()]], [[tree.ts#codePath|codePath()]], [[tree.ts#orderedCodes|orderedCodes()]]

### getSegments
*function* · line 67
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[coding.ts#codeNotFound|codeNotFound()]], [[coding.ts#docLabel|docLabel()]], [[coding.ts#findCode|findCode()]], [[coding.ts#projectOf|projectOf()]], [[coding.ts#scopedSegments|scopedSegments()]], [[tree.ts#codePath|codePath()]], [[tree.ts#descendantIds|descendantIds()]]
- Uses: [[coding.ts#TEXTS_OFF|TEXTS_OFF]]

### byAttribute
*function* · line 102
- Calls: [[assistant/format.ts#pct|pct()]], [[assistant/format.ts#trimToBytes|trimToBytes()]], [[coding.ts#findCode|findCode()]], [[coding.ts#projectOf|projectOf()]], [[coding.ts#scopedSegments|scopedSegments()]], [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#attributeValues|attributeValues()]], [[coding/analysis.ts#codeByAttribute|codeByAttribute()]], [[tree.ts#descendantIds|descendantIds()]], [[tree.ts#orderedCodes|orderedCodes()]]

### searchText
*function* · line 128
- Calls: [[assistant/format.ts#trimToBytes|trimToBytes()]], [[coding.ts#docLabel|docLabel()]], [[coding.ts#projectOf|projectOf()]], [[text.ts#kwic|kwic()]]
- Uses: [[coding.ts#TEXTS_OFF|TEXTS_OFF]]

### codingTools
*const* · line 142 · exported
- Uses: [[coding.ts#byAttribute|byAttribute()]], [[coding.ts#getSegments|getSegments()]], [[coding.ts#listCodes|listCodes()]], [[coding.ts#searchText|searchText()]]
- Used in: [[tools/index.ts]]
