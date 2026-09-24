---
id: src/lib/coding/analysis.ts
type: module
file: src/lib/coding/analysis.ts
area: lib/coding
---

# src/lib/coding/analysis.ts

*Module* · area [[lib - coding|lib/coding]] · 191 lines

> Code frequencies, co-occurrence and code-by-attribute counts. Pure functions over explicit lists of codes, documents and segments (callers filter by coder / document kind first).

## Imports
- [[coding-types.ts]] · type-only
- [[tree.ts]] · value

## Tested by
- [[scenarios.test.ts]] · import
- [[analysis.test.ts]] · import
- [[outputs.test.ts]] · import

## Imported by
- [[starters.ts]] · value
- [[AnalyseView.tsx]] · value
- [[Reader.tsx]] · value
- [[ResponsesView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[SourcesPanel.tsx]] · value
- [[coding.ts]] · value
- [[docxExports.ts]] · value
- [[exports.ts]] · value
- [[outputs.ts]] · type-only
- [[scenarios.test.ts]] · value
- [[analysis.test.ts]] · value
- [[outputs.test.ts]] · value

## Types
CodeFrequency (line 7) · CooccurrenceMode (line 55) · CodeByAttribute (line 100)

## Symbols

### codeFrequencies
*function* · line 22 · exported
- Calls: [[tree.ts#descendantIds|descendantIds()]]
- Used in: [[AnalyseView.tsx]], [[coding.ts]], [[docxExports.ts]], [[exports.ts]], [[analysis.test.ts]], [[outputs.test.ts]]

### cooccurrence
*function* · line 63 · exported
> Code co-occurrence matrix. With `members`, each row counts its member codes together. - 'document': cell (i, j) = number of documents coded with both codes; diagonal = documents with code i. - 'overlap': cell (i, j) = number of pairs of ...
- Used in: [[AnalyseView.tsx]], [[analysis.test.ts]], [[outputs.test.ts]]

### codeByAttribute
*function* · line 114 · exported
> Codes by a document attribute (e.g. gender): documents coded, with column percentages.
- Uses: [[coding/analysis.ts#naturalCompare|naturalCompare()]]
- Used in: [[AnalyseView.tsx]], [[coding.ts]], [[scenarios.test.ts]], [[analysis.test.ts]], [[outputs.test.ts]]

### attributeKeys
*function* · line 151 · exported
> Attribute names present on any document, sorted.
- Used in: [[starters.ts]], [[AnalyseView.tsx]], [[ResponsesView.tsx]], [[RetrievalView.tsx]], [[SourcesPanel.tsx]], [[coding.ts]], [[exports.ts]]

### attributeValues
*function* · line 158 · exported
> Distinct values of an attribute, sorted naturally.
- Uses: [[coding/analysis.ts#naturalCompare|naturalCompare()]]
- Used in: [[ResponsesView.tsx]], [[RetrievalView.tsx]], [[SourcesPanel.tsx]], [[coding.ts]]

### naturalCompare
*function* · line 167 · exported

### constantAttributeKeys
*function* · line 176 · exported
> Attribute keys that are the same on every one of `docs` (for example a study title shared by all interviews). They say nothing about which source is which, so lists show them last. With fewer than two sources nothing is treated as constant.
- Calls: [[coding/analysis.ts#attributeKeys|attributeKeys()]]
- Used in: [[Reader.tsx]], [[RetrievalView.tsx]], [[SourcesPanel.tsx]], [[analysis.test.ts]]

### orderedAttributes
*function* · line 187 · exported
> A source's attributes with the informative ones (those that differ between sources) first.
- Used in: [[Reader.tsx]], [[RetrievalView.tsx]], [[SourcesPanel.tsx]], [[analysis.test.ts]]
