---
id: src/lib/coding/tree.ts
type: module
file: src/lib/coding/tree.ts
area: lib/coding
---

# src/lib/coding/tree.ts

*Module* · area [[lib - coding|lib/coding]] · 90 lines

> Codebook hierarchy helpers (themes > sub-codes).

## Imports
- [[coding-types.ts]] · type-only

## Tested by
- [[scenarios.test.ts]] · import
- [[codebook.test.ts]] · import

## Imported by
- [[coding/actions.ts]] · value
- [[AnalyseView.tsx]] · value
- [[CodebookPanel.tsx]] · value
- [[ExportDialogs.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[coding/hooks.ts]] · value
- [[QuickCode.tsx]] · value
- [[Reader.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[coding.ts]] · value
- [[coding/analysis.ts]] · value
- [[codebookIO.ts]] · value
- [[docxExports.ts]] · value
- [[exports.ts]] · value
- [[scenarios.test.ts]] · value
- [[codebook.test.ts]] · value

## Types
CodeNode (line 5)

## Symbols

### buildCodeTree
*function* · line 12 · exported
> Build the code tree, keeping codebook order within each level. Orphans (missing parent) become top level.
- Used in: [[coding/hooks.ts]], [[docxExports.ts]], [[exports.ts]], [[codebook.test.ts]]

### flattenTree
*function* · line 33 · exported
> Depth-first flattened order (what the codebook panel shows).
- Used in: [[coding/hooks.ts]], [[docxExports.ts]], [[exports.ts]]

### orderedCodes
*function* · line 42 · exported
> Codes in display order.
- Calls: [[tree.ts#buildCodeTree|buildCodeTree()]], [[tree.ts#flattenTree|flattenTree()]]
- Used in: [[coding.ts]], [[codebookIO.ts]], [[codebook.test.ts]]

### descendantIds
*function* · line 47 · exported
> Ids of all descendants of `id` (not including itself).
- Used in: [[AnalyseView.tsx]], [[CodebookPanel.tsx]], [[RetrievalView.tsx]], [[coding/actions.ts]], [[ExportDialogs.tsx]], [[coding.ts]], [[coding/analysis.ts]], [[scenarios.test.ts]], [[codebook.test.ts]]

### canReparent
*function* · line 64 · exported
> True if `codeId` may be moved under `newParentId` (no self-parenting, no cycles).
- Calls: [[tree.ts#descendantIds|descendantIds()]]
- Used in: [[CodebookPanel.tsx]], [[coding/actions.ts]], [[SmallDialogs.tsx]], [[codebook.test.ts]]

### codePath
*function* · line 71 · exported
> "Theme > Sub-code" path label.
- Used in: [[QuickCode.tsx]], [[Reader.tsx]], [[RetrievalView.tsx]], [[SmallDialogs.tsx]], [[coding.ts]], [[exports.ts]], [[codebook.test.ts]]

### parentName
*function* · line 85 · exported
> Name of the parent code, or ''.
- Used in: [[codebookIO.ts]], [[exports.ts]]
