---
id: src/lib/stats/util.ts
type: module
file: src/lib/stats/util.ts
area: lib/stats
---

# src/lib/stats/util.ts

*Module* · area [[lib - stats|lib/stats]] · 375 lines

> Shared numeric helpers for the core statistics modules: compensated sums, weighted moments, ranking with ties, SPSS order statistics (HAVERAGE percentiles, Tukey hinges, trimmed mean) and a seeded random generator. Everything here is pure and works on plain arrays.

## Tested by
- [[stats-core/procedures.test.ts]] · import

## Imported by
- [[anova.ts]] · value
- [[correlation.ts]] · value
- [[stats/crosstabs.ts]] · value
- [[stats/descriptives.ts]] · value
- [[stats/nonparametric.ts]] · value
- [[ttest.ts]] · value
- [[correlations.ts]] · value
- [[core/frequencies.ts]] · value
- [[oneway.ts]] · value
- [[stats-core/procedures.test.ts]] · value

## Types
Num (line 5) · Moments (line 45) · Distinct (line 143) · RankResult (line 296)

## Private helpers
kpoint() (line 190)

## Symbols

### sum
*function* · line 8 · exported
> Neumaier (improved Kahan) compensated summation.

### Acc
*class* · line 22 · exported
> Compensated accumulator for streaming sums.
- Used in: [[anova.ts]], [[ttest.ts]]

### unitWeights
*function* · line 37 · exported
> Weights array (all ones when undefined).

### weightsOrOnes
*function* · line 41 · exported
- Calls: [[util.ts#unitWeights|unitWeights()]]
- Used in: [[correlation.ts]], [[stats/nonparametric.ts]], [[ttest.ts]]

### moments
*function* · line 63 · exported
> Weighted moments by a two-pass algorithm (mean first, then centred sums).
- Calls: [[util.ts#Acc|Acc]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[anova.ts]], [[stats/descriptives.ts]], [[ttest.ts]], [[correlations.ts]], [[core/frequencies.ts]], [[oneway.ts]]

### skewness
*function* · line 111 · exported
> SPSS skewness (G1) and its standard error, from weighted moments.
- Calls: [[util.ts#seSkew|seSkew()]]
- Used in: [[stats/descriptives.ts]], [[core/frequencies.ts]]

### seSkew
*function* · line 119 · exported

### kurtosis
*function* · line 124 · exported
> SPSS kurtosis (G2, excess) and its standard error.
- Calls: [[util.ts#seKurt|seKurt()]]
- Used in: [[stats/descriptives.ts]], [[core/frequencies.ts]]

### seKurt
*function* · line 133 · exported
- Calls: [[util.ts#seSkew|seSkew()]]

### distinctWeighted
*function* · line 155 · exported
- Calls: [[util.ts#Acc|Acc]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[stats/descriptives.ts]], [[core/frequencies.ts]], [[oneway.ts]]

### percentileHaverage
*function* · line 217 · exported
> Weighted percentile by SPSS's default HAVERAGE definition ((W+1)p, interpolating), p in [0, 1]. Matches the usual (n+1)p rule for unit weights and the expanded data for integer weights.
- Calls: [[util.ts]]
- Used in: [[stats/descriptives.ts]], [[core/frequencies.ts]], [[oneway.ts]]

### tukeyHinges
*function* · line 234 · exported
> Tukey's hinges [lower hinge, median, upper hinge] as computed by SPSS EXAMINE.
- Calls: [[util.ts]]
- Used in: [[stats/descriptives.ts]]

### trimmedMean
*function* · line 259 · exported
> SPSS trimmed mean: removes `tail` of the total weight from each end (fractional at the edges).
- Calls: [[util.ts#Acc|Acc]]
- Used in: [[stats/descriptives.ts]]

### modes
*function* · line 285 · exported
> Mode(s): the values with the largest summed weight.
- Used in: [[core/frequencies.ts]]

### rankWithTies
*function* · line 306 · exported
> Average ranks with ties; frequency weights treated as replicated cases.
- Calls: [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[correlation.ts]], [[stats/nonparametric.ts]]

### seededRandom
*function* · line 338 · exported
> --------------------------------------------------------------------------------------------- Random numbers (Monte Carlo exact tests): mulberry32-style generator with a fixed seed. -------------------------------------------------------...
- Used in: [[stats/crosstabs.ts]], [[stats-core/procedures.test.ts]]

### pearsonWeighted
*function* · line 350 · exported
> Pearson correlation on paired arrays with weights (two-pass).
- Calls: [[util.ts#Acc|Acc]], [[util.ts#moments|moments()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[correlation.ts]], [[ttest.ts]]
