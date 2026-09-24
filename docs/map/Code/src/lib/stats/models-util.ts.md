---
id: src/lib/stats/models-util.ts
type: module
file: src/lib/stats/models-util.ts
area: lib/stats
---

# src/lib/stats/models-util.ts

*Module* · area [[lib - stats|lib/stats]] · 70 lines

> Small numeric helpers shared by the model modules (weighted moments, logistic function).

## Imported by
- [[stats/factor.ts]] · value
- [[logistic.ts]] · value
- [[ordinal.ts]] · value
- [[regression.ts]] · value
- [[stats/reliability.ts]] · value
- [[binary.ts]] · value
- [[models/factor.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value

## Symbols

### sum
*function* · line 3 · exported
> Small numeric helpers shared by the model modules (weighted moments, logistic function).
- Used in: [[logistic.ts]], [[regression.ts]], [[stats/reliability.ts]], [[binary.ts]], [[models/factor.ts]], [[nomreg.ts]], [[plum.ts]]

### weightedMean
*function* · line 9 · exported
- Used in: [[stats/factor.ts]], [[logistic.ts]], [[regression.ts]], [[stats/reliability.ts]]

### weightedSS
*function* · line 23 · exported
> Weighted centred sum of squares Σ w (x - mean)².
- Calls: [[models-util.ts#weightedMean|weightedMean()]]
- Used in: [[logistic.ts]], [[regression.ts]]

### weightedCP
*function* · line 33 · exported
> Weighted centred cross-product Σ w (x - mx)(y - my).
- Calls: [[models-util.ts#weightedMean|weightedMean()]]
- Used in: [[regression.ts]]

### weightedVariance
*function* · line 40 · exported
> Frequency-weighted sample variance (denominator Σw - 1, like SPSS).
- Calls: [[models-util.ts#sum|sum()]], [[models-util.ts#weightedSS|weightedSS()]]

### weightedCorrelation
*function* · line 44 · exported
- Calls: [[models-util.ts#weightedCP|weightedCP()]], [[models-util.ts#weightedMean|weightedMean()]], [[models-util.ts#weightedSS|weightedSS()]]

### logistic
*function* · line 53 · exported
> Logistic CDF 1 / (1 + e^-z), stable for large |z|.
- Used in: [[logistic.ts]], [[ordinal.ts]]

### log1pExp
*function* · line 60 · exported
> log(1 + e^z) without overflow.
- Used in: [[logistic.ts]]

### logisticDensity
*function* · line 65 · exported
> Logistic density f(z) = F(z)(1 - F(z)).
- Used in: [[ordinal.ts]]
