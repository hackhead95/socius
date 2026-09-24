---
id: src/lib/stats/reliability.ts
type: module
file: src/lib/stats/reliability.ts
area: lib/stats
---

# src/lib/stats/reliability.ts

*Module* · area [[lib - stats|lib/stats]] · 200 lines

> Scale reliability: Cronbach's alpha and item analysis (SPSS RELIABILITY /MODEL=ALPHA), plus McDonald's omega total from a one-factor maximum-likelihood model. Moments use frequency weights with the (Σw - 1) denominator, like SPSS.

## Imports
- [[matrix.ts]] · value
- [[models-util.ts]] · value

## Tested by
- [[stats-models/scale.test.ts]] · import
- [[sample-oracle.test.ts]] · import

## Imported by
- [[DeriveDialogs.tsx]] · value
- [[models/reliability.ts]] · value
- [[stats-models/scale.test.ts]] · value
- [[sample-oracle.test.ts]] · value

## Types
ReliabilityResult (line 9) · SummaryRow (line 36) · OneFactorML (line 129)

## Private helpers
summarize() (line 45)

## Symbols

### reliabilityAnalysis
*function* · line 54 · exported
- Calls: [[matrix.ts#fromRows|fromRows()]], [[matrix.ts#spdInverse|spdInverse()]], [[models-util.ts#sum|sum()]], [[models-util.ts#weightedMean|weightedMean()]], [[stats/reliability.ts]]
- Uses: [[matrix.ts#SingularMatrixError|SingularMatrixError]]
- Used in: [[DeriveDialogs.tsx]], [[models/reliability.ts]], [[stats-models/scale.test.ts]], [[sample-oracle.test.ts]]

### oneFactorML
*function* · line 143 · exported
> One-factor maximum-likelihood factor analysis of a correlation matrix (EM algorithm, uniquenesses bounded below at .005 like R's factanal), and McDonald's omega total omega = (Σλ)² / ((Σλ)² + Σψ).
- Calls: [[matrix.ts#fromRows|fromRows()]], [[matrix.ts#spdInverse|spdInverse()]]
- Uses: [[matrix.ts#SingularMatrixError|SingularMatrixError]]
- Used in: [[models/reliability.ts]], [[stats-models/scale.test.ts]]
