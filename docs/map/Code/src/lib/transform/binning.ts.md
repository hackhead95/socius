---
id: src/lib/transform/binning.ts
type: module
file: src/lib/transform/binning.ts
area: lib/transform
---

# src/lib/transform/binning.ts

*Module* · area [[lib - transform|lib/transform]] · 204 lines

> Visual Binning: turn a scale variable into ordered groups (equal width, equal count, custom cutpoints). Group labels read "18 to 29" (never "18-29", which is ambiguous for negative numbers: "-20--10").

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
BinMethod (line 9) · BinSpec (line 15) · BinPreview (line 151)

## Private helpers
validStats() (line 33) · niceRound() (line 51) · fmtCut() (line 110) · cutDigits() (line 118)

## Symbols

### BinError
*class* · line 24 · exported
- Used in: [[findings-repro.test.ts]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]]

### computeCutpoints
*function* · line 57 · exported
> Interior cutpoints (sorted, unique). k cutpoints make k+1 bins.
- Calls: [[binning.ts#BinError|BinError]], [[binning.ts]]
- Used in: [[data-fixes.test.ts]], [[transforms.test.ts]]

### binOf
*function* · line 97 · exported
> 1-based bin number for x (NaN stays NaN).
- Used in: [[transforms.test.ts]]

### binLabels
*function* · line 124 · exported
> Readable labels: "18 to 29", "30 to 44", "65+" for whole numbers; "<= 2.5", "2.5 to 5", "> 5" otherwise.
- Calls: [[binning.ts]]
- Used in: [[findings-repro.test.ts]], [[data-fixes.test.ts]], [[transforms.test.ts]]

### previewBins
*function* · line 159 · exported
- Calls: [[binning.ts#BinError|BinError]], [[binning.ts#binLabels|binLabels()]], [[binning.ts#binOf|binOf()]], [[binning.ts#computeCutpoints|computeCutpoints()]], [[binning.ts]]
- Used in: [[CasesDialogs.tsx]], [[data-fixes.test.ts]], [[transforms.test.ts]]

### visualBin
*function* · line 171 · exported
- Calls: [[binning.ts#BinError|BinError]], [[binning.ts#binOf|binOf()]], [[binning.ts#previewBins|previewBins()]], [[core/data.ts#isMissingValue|isMissingValue()]], [[core/data.ts#validateVarName|validateVarName()]], [[dsops.ts#addVariable|addVariable()]], [[dsops.ts#fmtN|fmtN()]], [[dsops.ts#newNumericVar|newNumericVar()]], [[syntax.ts#lines|lines()]], [[syntax.ts#valueLabelsSyntax|valueLabelsSyntax()]], [[syntax.ts#variableLabelSyntax|variableLabelSyntax()]]
- Used in: [[CasesDialogs.tsx]], [[findings-repro.test.ts]], [[transforms-ops.fuzz.test.ts]], [[data-fixes.test.ts]], [[sample-oracle.test.ts]], [[transforms.test.ts]]
