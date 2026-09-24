---
id: src/lib/stats/factor.ts
type: module
file: src/lib/stats/factor.ts
area: lib/stats
---

# src/lib/stats/factor.ts

*Module* · area [[lib - stats|lib/stats]] · 435 lines

> Factor analysis on a correlation matrix, following SPSS FACTOR. Extraction - Principal components (SPSS default): loadings = eigenvectors * sqrt(eigenvalues) of R. - Principal axis factoring: start with squared multiple correlations on the diagonal of R, then iterate (eigen-decompose the reduced matrix, recompute communalities) until the largest change in any communality is below the convergenc...

## Imports
- [[distributions.ts]] · value
- [[matrix.ts]] · value
- [[models-util.ts]] · value

## Calls
- [[matrix.ts#fromRows|fromRows()]]
- [[matrix.ts#identity|identity()]]
- [[matrix.ts#inverse|inverse()]]
- [[matrix.ts#multiply|multiply()]]
- [[matrix.ts#symMatrixFunction|symMatrixFunction()]]
- [[matrix.ts#transpose|transpose()]]
- [[matrix.ts#zeros|zeros()]]

## Tested by
- [[stats-models/scale.test.ts]] · import

## Imported by
- [[models/factor.ts]] · value
- [[stats-models/scale.test.ts]] · value

## Types
Extraction (line 33) · Rotation (line 34) · KmoBartlett (line 53) · ExtractionResult (line 95) · RotationResult (line 189)

## Private helpers
toMatrix() (line 201) · toArray() (line 204) · kaiserNormalize() (line 210) · varimaxRaw() (line 216) · finishOblique() (line 293) · obliminGPA() (line 308) · scaleM() (line 406)

## Symbols

### correlationMatrix
*function* · line 37 · exported
> Weighted Pearson correlation matrix of the columns (listwise complete data).
- Calls: [[models-util.ts#weightedMean|weightedMean()]]
- Used in: [[models/factor.ts]], [[stats-models/scale.test.ts]]

### kmoBartlett
*function* · line 64 · exported
> Kaiser-Meyer-Olkin measure and Bartlett's test of sphericity (n = weighted number of cases).
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[matrix.ts#fromRows|fromRows()]], [[matrix.ts#logDet|logDet()]], [[matrix.ts#spdInverse|spdInverse()]]
- Uses: [[matrix.ts#SingularMatrixError|SingularMatrixError]]
- Used in: [[models/factor.ts]], [[stats-models/scale.test.ts]]

### extractFactors
*function* · line 110 · exported
- Calls: [[matrix.ts#fromRows|fromRows()]], [[matrix.ts#spdInverse|spdInverse()]], [[matrix.ts#symEigen|symEigen()]], [[stats/factor.ts#orientColumns|orientColumns()]]
- Uses: [[matrix.ts#SingularMatrixError|SingularMatrixError]]
- Used in: [[models/factor.ts]], [[stats-models/scale.test.ts]]

### orientColumns
*function* · line 177 · exported
> Reflect columns so each column's loadings sum to a positive number.

### rotate
*function* · line 251 · exported
- Calls: [[matrix.ts#inverse|inverse()]], [[matrix.ts#multiply|multiply()]], [[matrix.ts#transpose|transpose()]], [[matrix.ts#zeros|zeros()]], [[stats/factor.ts#orientColumns|orientColumns()]], [[stats/factor.ts]]
- Used in: [[models/factor.ts]], [[stats-models/scale.test.ts]]

### columnSS
*function* · line 413 · exported
> Sums of squared loadings per column.
- Used in: [[models/factor.ts]]

### sortOrder
*function* · line 425 · exported
> Row order for "sort by size" (SPSS): variables grouped by the factor on which they have their largest absolute loading, and sorted by that loading (descending) within each group.
- Used in: [[models/factor.ts]], [[stats-models/scale.test.ts]]
