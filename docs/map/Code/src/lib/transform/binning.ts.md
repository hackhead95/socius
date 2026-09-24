---
id: src/lib/transform/binning.ts
type: module
file: src/lib/transform/binning.ts
area: lib/transform
---

# src/lib/transform/binning.ts

*Module* · area [[lib - transform|lib/transform]] · 183 lines

> Visual Binning: turn a scale variable into ordered groups (equal width, equal count, custom cutpoints).

## Imports
- [[core/data.ts]] · value
- [[core/types.ts]] · type-only
- [[dsops.ts]] · value
- [[syntax.ts]] · value

## Calls
- [[core/data.ts#activeCaseMask|activeCaseMask()]]
- [[core/data.ts#isMissingValue|isMissingValue()]]

## Imported by
- [[transform/index.ts]] · re-export

## Types
BinMethod (line 8) · BinSpec (line 14) · BinPreview (line 130)

## Private helpers
validStats() (line 32) · niceRound() (line 50) · fmtCut() (line 104)

## Symbols

### BinError
*class* · line 23 · exported
- Used in: [[transforms-ops.fuzz.test.ts]]

### computeCutpoints
*function* · line 56 · exported
> Interior cutpoints (sorted, unique). k cutpoints make k+1 bins.
- Calls: [[binning.ts#BinError|BinError]], [[binning.ts]]
- Used in: [[transforms.test.ts]]

### binOf
*function* · line 91 · exported
> 1-based bin number for x (NaN stays NaN).
- Used in: [[transforms.test.ts]]

### binLabels
*function* · line 109 · exported
> Readable labels: "18-29", "30-44", "65+" for whole numbers; "<= 2.5", "2.5-5", "> 5" otherwise.
- Calls: [[binning.ts]]
- Used in: [[transforms.test.ts]]

### previewBins
*function* · line 138 · exported
- Calls: [[binning.ts#BinError|BinError]], [[binning.ts#binLabels|binLabels()]], [[binning.ts#binOf|binOf()]], [[binning.ts#computeCutpoints|computeCutpoints()]], [[binning.ts]]
- Used in: [[CasesDialogs.tsx]], [[transforms.test.ts]]

### visualBin
*function* · line 150 · exported
- Calls: [[binning.ts#BinError|BinError]], [[binning.ts#binOf|binOf()]], [[binning.ts#previewBins|previewBins()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#validateVarName|validateVarName()]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[syntax.ts#lines|lines()]], [[syntax.ts#valueLabelsSyntax|valueLabelsSyntax()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[CasesDialogs.tsx]], [[transforms-ops.fuzz.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
