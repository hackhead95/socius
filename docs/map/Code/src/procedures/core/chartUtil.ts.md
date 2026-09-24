---
id: src/procedures/core/chartUtil.ts
type: module
file: src/procedures/core/chartUtil.ts
area: procedures
---

# src/procedures/core/chartUtil.ts

*Module* · area [[procedures]] · 48 lines

> Chart helpers for core procedures (histogram binning with "nice" widths).

## Imported by
- [[core/descriptives.ts]] · value
- [[core/frequencies.ts]] · value

## Symbols

### niceWidth
*function* · line 4 · exported
> A "nice" bin width (1, 2, 2.5 or 5 times a power of ten) giving roughly `target` bins.
- Used in: [[core/descriptives.ts]], [[core/frequencies.ts]]

### histogram
*function* · line 14 · exported
> Weighted histogram with nice bin edges. Integer-valued data with few values get unit bins.
- Calls: [[chartUtil.ts#niceWidth|niceWidth()]]
- Used in: [[core/descriptives.ts]], [[core/frequencies.ts]]
