---
id: src/lib/transform/syntax.ts
type: module
file: src/lib/transform/syntax.ts
area: lib/transform
---

# src/lib/transform/syntax.ts

*Module* · area [[lib - transform|lib/transform]] · 59 lines

> Helpers for writing equivalent SPSS syntax in the output log.

## Imports
- [[core/types.ts]] · type-only

## Imported by
- [[aggregate.ts]] · value
- [[binning.ts]] · value
- [[cases.ts]] · value
- [[compute.ts]] · value
- [[derive.ts]] · value
- [[merge.ts]] · value
- [[properties.ts]] · value
- [[recode.ts]] · value

## Symbols

### q
*function* · line 6 · exported
> SPSS string literal: single quotes, embedded quotes doubled.
- Used in: [[aggregate.ts]], [[cases.ts]], [[merge.ts]], [[properties.ts]]

### sv
*function* · line 11 · exported
> A value as it appears in syntax: numbers bare, strings quoted.
- Calls: [[syntax.ts#q|q()]]
- Used in: [[derive.ts]], [[properties.ts]], [[recode.ts]]

### valueLabelsSyntax
*function* · line 19 · exported
- Calls: [[syntax.ts#q|q()]], [[syntax.ts#sv|sv()]]
- Used in: [[binning.ts]], [[derive.ts]], [[properties.ts]], [[recode.ts]]

### variableLabelSyntax
*function* · line 25 · exported
- Calls: [[syntax.ts#q|q()]]
- Used in: [[binning.ts]], [[compute.ts]], [[derive.ts]], [[recode.ts]]

### missingSyntax
*function* · line 29 · exported
- Calls: [[syntax.ts#sv|sv()]]
- Used in: [[properties.ts]]

### formatsSyntax
*function* · line 36 · exported

### lines
*function* · line 41 · exported
> Join non-empty syntax lines.
- Used in: [[aggregate.ts]], [[binning.ts]], [[cases.ts]], [[compute.ts]], [[derive.ts]], [[merge.ts]], [[properties.ts]], [[recode.ts]]

### varList
*function* · line 46 · exported
> Variable list with SPSS line wrapping.
- Used in: [[aggregate.ts]], [[derive.ts]], [[merge.ts]], [[properties.ts]], [[recode.ts]]
