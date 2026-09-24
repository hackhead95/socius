---
id: src/lib/stats/logistic.ts
type: module
file: src/lib/stats/logistic.ts
area: lib/stats
---

# src/lib/stats/logistic.ts

*Module* · area [[lib - stats|lib/stats]] · 632 lines

> Binary and multinomial logistic regression by Newton-Raphson with step halving, as in SPSS LOGISTIC REGRESSION and NOMREG. Frequency weights multiply each case's log-likelihood contribution (SPSS WEIGHT BY semantics). Also: separation diagnostics, Hosmer-Lemeshow test, score tests for variables not in the equation.

## Imports
- [[distributions.ts]] · value
- [[matrix.ts]] · value
- [[models-util.ts]] · value

## Calls
- [[models-util.ts#log1pExp|log1pExp()]]

## Tested by
- [[logistic.test.ts]] · import
- [[separation.test.ts]] · import

## Imported by
- [[ordinal.ts]] · value
- [[binary.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[logistic.test.ts]] · value
- [[separation.test.ts]] · value

## Types
CollinearityScreen (line 58) · BinaryLogitFit (line 105) · HosmerLemeshow (line 314) · SeparationReport (line 365) · MultinomialFit (line 442)

## Private helpers
linearPredictor() (line 132) · binaryLogLik() (line 138) · multinomialLogLik() (line 469)

## Symbols

### DEFAULT_MAX_ITER
*const* · line 10 · exported

### DIVERGE_DLL
*const* · line 18 · exported
> Newton iterations stop as "diverging" when the log-likelihood has stopped improving (relative change below this) for DIVERGE_ITERS iterations in a row while some estimate still moves by at least DIVERGE_STEP: the signature of (quasi-)com...

### DIVERGE_STEP
*const* · line 19 · exported

### DIVERGE_ITERS
*const* · line 20 · exported

### divergenceTracker
*function* · line 23 · exported
> Tracks the divergence rule above across iterations.
- Uses: [[logistic.ts#DIVERGE_DLL|DIVERGE_DLL]], [[logistic.ts#DIVERGE_ITERS|DIVERGE_ITERS]], [[logistic.ts#DIVERGE_STEP|DIVERGE_STEP]]
- Used in: [[ordinal.ts]]

### unstableParams
*function* · line 39 · exported
> Flags parameters whose estimates cannot be trusted because the information matrix is (nearly) singular in their direction: a clear share in the numerical null space, a non-finite standard error, or (for slopes, `scale` = standard deviati...
- Used in: [[ordinal.ts]]

### columnScales
*function* · line 50 · exported
> Weighted standard deviation of each column (0 for a constant column).
- Calls: [[models-util.ts#sum|sum()]], [[models-util.ts#weightedMean|weightedMean()]], [[models-util.ts#weightedSS|weightedSS()]]
- Used in: [[ordinal.ts]]

### screenCollinear
*function* · line 67 · exported
> Drop predictors that are constant or (nearly) linear combinations of earlier ones, using the same sequential tolerance rule as linear regression on the weighted, centred columns.
- Calls: [[models-util.ts#weightedMean|weightedMean()]], [[models-util.ts#weightedSS|weightedSS()]]
- Used in: [[binary.ts]], [[nomreg.ts]], [[plum.ts]]

### fitBinaryLogit
*function* · line 152 · exported
> Maximum-likelihood binary logistic regression. y must be 0/1. Predictors should already be screened for collinearity. `start` gives optional starting values.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[logistic.ts#columnScales|columnScales()]], [[logistic.ts#divergenceTracker|divergenceTracker()]], [[logistic.ts#unstableParams|unstableParams()]], [[logistic.ts]], [[matrix.ts#spdInverseRobust|spdInverseRobust()]], [[matrix.ts#spdSolveRobust|spdSolveRobust()]], [[matrix.ts#zeros|zeros()]], [[models-util.ts#logistic|logistic()]], [[models-util.ts#sum|sum()]]
- Uses: [[logistic.ts#DEFAULT_MAX_ITER|DEFAULT_MAX_ITER]]
- Used in: [[binary.ts]], [[logistic.test.ts]], [[separation.test.ts]]

### waldTest
*function* · line 253 · exported
> Wald chi-square for a set of coefficients (indices into coef): b' V^-1 b, df = count.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[matrix.ts#choleskySolve|choleskySolve()]], [[matrix.ts#cholesky|cholesky()]], [[matrix.ts#zeros|zeros()]]
- Used in: [[binary.ts]], [[logistic.test.ts]]

### expCI
*function* · line 270 · exported
> Wald confidence interval for exp(B).
- Calls: [[distributions.ts#normalPpf|normalPpf()]]
- Used in: [[binary.ts]], [[nomreg.ts]]

### scoreTestsConstantOnly
*function* · line 279 · exported
> Score tests for variables not in the equation when only the constant is in the model (SPSS Block 0 "Variables not in the Equation"). Returns per-variable scores and the overall statistic.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[matrix.ts#choleskySolve|choleskySolve()]], [[matrix.ts#cholesky|cholesky()]], [[matrix.ts#zeros|zeros()]], [[models-util.ts#sum|sum()]], [[models-util.ts#weightedMean|weightedMean()]]
- Used in: [[binary.ts]], [[logistic.test.ts]]

### hosmerLemeshow
*function* · line 327 · exported
> Hosmer-Lemeshow goodness of fit, SPSS style: cases are sorted by predicted probability and split into about 10 groups of roughly equal (weighted) size; cases with the same covariate pattern (`patternKey`) are never split across groups, s...
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]]
- Used in: [[binary.ts]], [[logistic.test.ts]]

### detectSeparation
*function* · line 378 · exported
> Detect complete or quasi-complete separation after a fit. Checks each predictor on its own first (a category in which every case has the same outcome, or a covariate whose ranges for the two outcomes do not overlap), then looks at diverg...
- Used in: [[binary.ts]], [[logistic.test.ts]]

### fitMultinomial
*function* · line 497 · exported
> Multinomial (baseline-category) logit. yIdx holds category indices 0..J-1; `ref` is the reference category.
- Calls: [[logistic.ts#columnScales|columnScales()]], [[logistic.ts#divergenceTracker|divergenceTracker()]], [[logistic.ts#unstableParams|unstableParams()]], [[logistic.ts]], [[matrix.ts#spdInverseRobust|spdInverseRobust()]], [[matrix.ts#spdSolveRobust|spdSolveRobust()]], [[matrix.ts#zeros|zeros()]]
- Uses: [[logistic.ts#DEFAULT_MAX_ITER|DEFAULT_MAX_ITER]]
- Used in: [[nomreg.ts]], [[logistic.test.ts]], [[separation.test.ts]]

### multinomialNullLogLik
*function* · line 614 · exported
> Log-likelihood of the intercept-only multinomial model (closed form).
- Used in: [[binary.ts]], [[nomreg.ts]], [[logistic.test.ts]]

### pseudoR2
*function* · line 627 · exported
> Cox & Snell, Nagelkerke and McFadden pseudo R² from null and model log-likelihoods.
- Used in: [[binary.ts]], [[nomreg.ts]], [[plum.ts]], [[logistic.test.ts]]
