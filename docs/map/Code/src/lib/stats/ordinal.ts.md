---
id: src/lib/stats/ordinal.ts
type: module
file: src/lib/stats/ordinal.ts
area: lib/stats
---

# src/lib/stats/ordinal.ts

*Module* · area [[lib - stats|lib/stats]] · 283 lines

> Ordinal regression: cumulative logit (proportional odds) model, as in SPSS PLUM with the logit link. SPSS parameterisation (used throughout): logit P(Y <= j | x) = theta_j - x'beta, j = 1..J-1. A positive beta therefore shifts cases towards HIGHER categories. The "general" (non-proportional) model used by the test of parallel lines lets every threshold equation have its own slopes: logit P(Y <=...

## Imports
- [[distributions.ts]] · value
- [[logistic.ts]] · value
- [[matrix.ts]] · value
- [[models-util.ts]] · value

## Uses
- [[models-util.ts#logistic|logistic()]]
- [[models-util.ts#logisticDensity|logisticDensity()]]

## Tested by
- [[logistic.test.ts]] · import
- [[separation.test.ts]] · import

## Imported by
- [[plum.ts]] · value
- [[logistic.test.ts]] · value
- [[separation.test.ts]] · value

## Types
CumulativeFit (line 17) · OrdinalGoodnessOfFit (line 230)

## Private helpers
F (line 39) · f (line 40) · fp() (line 42) · nParams() (line 44) · bandProb() (line 49) · evalLogLik() (line 55) · eqArg() (line 69)

## Symbols

### fitCumulativeLogit
*function* · line 84 · exported
> Fit the cumulative logit model. y holds category indices 0..J-1 (ordered). `start` optional.
- Calls: [[logistic.ts#columnScales|columnScales()]], [[logistic.ts#divergenceTracker|divergenceTracker()]], [[logistic.ts#unstableParams|unstableParams()]], [[matrix.ts#spdInverseRobust|spdInverseRobust()]], [[matrix.ts#spdSolveRobust|spdSolveRobust()]], [[matrix.ts#zeros|zeros()]], [[ordinal.ts]]
- Used in: [[plum.ts]], [[logistic.test.ts]], [[separation.test.ts]]

### cumulativeNullLogLik
*function* · line 218 · exported
> Log-likelihood of the thresholds-only model (closed form).
- Used in: [[plum.ts]], [[logistic.test.ts]]

### ordinalGoodnessOfFit
*function* · line 245 · exported
> Pearson and deviance goodness-of-fit over covariate patterns x response categories (SPSS PLUM). Cases with the same `patternKey` share a covariate pattern.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]]
- Used in: [[plum.ts]], [[logistic.test.ts]]

### waldCI
*function* · line 279 · exported
- Calls: [[distributions.ts#normalPpf|normalPpf()]]
- Used in: [[plum.ts]]
