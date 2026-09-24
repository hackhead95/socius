---
id: src/lib/stats/regression.ts
type: module
file: src/lib/stats/regression.ts
area: lib/stats
---

# src/lib/stats/regression.ts

*Module* · area [[lib - stats|lib/stats]] · 513 lines

> Linear regression (OLS / frequency-weighted least squares), as in SPSS REGRESSION. Frequency weights follow SPSS WEIGHT BY: every moment is weighted and the error degrees of freedom are Σw - k - 1 (so a case with weight 3 counts as three identical cases). Fitting uses Householder QR on the weight-scaled, mean-centred design, which is far better conditioned than inverting X'X. Predictors are ent...

## Imports
- [[distributions.ts]] · value
- [[models-util.ts]] · value

## Calls
- [[models-util.ts#sum|sum()]]
- [[models-util.ts#weightedCP|weightedCP()]]
- [[models-util.ts#weightedMean|weightedMean()]]
- [[models-util.ts#weightedSS|weightedSS()]]

## Tested by
- [[regression.test.ts]] · import

## Imported by
- [[linear.ts]] · value
- [[regression.test.ts]] · value

## Types
LinearFit (line 16) · ExcludedStat (line 319) · StepwiseStep (line 424)

## Private helpers
fmtN() (line 286) · SweepState (line 376)

## Symbols

### DEFAULT_TOLERANCE
*const* · line 14 · exported
- Used in: [[linear.ts]]

### RegressionError
*class* · line 65 · exported

### fitLinear
*function* · line 71 · exported
> Fit y on the given predictor columns (with a constant) by weighted least squares. All arrays have one entry per case; weights must be positive.
- Calls: [[distributions.ts#fSf|fSf()]], [[distributions.ts#tPpf|tPpf()]], [[distributions.ts#tSf|tSf()]], [[models-util.ts#sum|sum()]], [[models-util.ts#weightedCP|weightedCP()]], [[models-util.ts#weightedMean|weightedMean()]], [[models-util.ts#weightedSS|weightedSS()]], [[regression.ts#RegressionError|RegressionError]], [[regression.ts]]
- Uses: [[regression.ts#DEFAULT_TOLERANCE|DEFAULT_TOLERANCE]]
- Used in: [[linear.ts]], [[regression.test.ts]]

### r2Change
*function* · line 291 · exported
> R² change statistics between a reduced and a fuller nested model.
- Calls: [[distributions.ts#fSf|fSf()]]
- Used in: [[linear.ts]], [[regression.test.ts]]

### durbinWatson
*function* · line 306 · exported
> Durbin-Watson statistic on residuals in case order. With frequency weights it is the statistic of the replicated data (consecutive copies of the same case contribute nothing to the numerator).
- Used in: [[linear.ts]], [[regression.test.ts]]

### excludedStats
*function* · line 335 · exported
> For each candidate not in `model`, the statistics it would have if entered next (SPSS "Excluded Variables"): Beta In, t, Sig., partial correlation, tolerance, VIF and minimum tolerance. Uses the sweep operator on the weighted correlation...
- Calls: [[distributions.ts#tSf|tSf()]], [[regression.ts]]
- Uses: [[regression.ts#DEFAULT_TOLERANCE|DEFAULT_TOLERANCE]]
- Used in: [[linear.ts]], [[regression.test.ts]]

### stepwiseSelect
*function* · line 439 · exported
> SPSS METHOD=STEPWISE: starting from `base` (variables already in the equation, e.g. earlier blocks), repeatedly enter the candidate with the smallest probability of F-to-enter if it is below `pin`, then remove the entered candidate with ...
- Calls: [[distributions.ts#fSf|fSf()]], [[regression.ts#RegressionError|RegressionError]], [[regression.ts]]
- Uses: [[regression.ts#DEFAULT_TOLERANCE|DEFAULT_TOLERANCE]]
- Used in: [[linear.ts]], [[regression.test.ts]]
