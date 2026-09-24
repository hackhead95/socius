---
id: src/lib/stats/descriptives.ts
type: module
file: src/lib/stats/descriptives.ts
area: lib/stats
---

# src/lib/stats/descriptives.ts

*Module* · area [[lib - stats|lib/stats]] · 295 lines

> Descriptive statistics (DESCRIPTIVES, EXAMINE): moments, percentiles, normality tests, boxplot summaries. Pure functions on numeric arrays with optional frequency weights.

## Imports
- [[distributions.ts]] · value
- [[util.ts]] · value

## Tested by
- [[lib.test.ts]] · import

## Imported by
- [[tools/data.ts]] · value
- [[transform.ts]] · value
- [[core/descriptives.ts]] · value
- [[lib.test.ts]] · value

## Types
Summary (line 17) · ExploreStats (line 59) · KSResult (line 93) · SWResult (line 147) · BoxStats (line 262)

## Private helpers
poly() (line 141)

## Symbols

### summarize
*function* · line 37 · exported
> DESCRIPTIVES-style summary.
- Calls: [[util.ts#kurtosis|kurtosis()]], [[util.ts#moments|moments()]], [[util.ts#skewness|skewness()]]
- Used in: [[core/descriptives.ts]]

### DEFAULT_PERCENTILES
*const* · line 70 · exported
- Used in: [[core/descriptives.ts]]

### exploreStats
*function* · line 73 · exported
> EXAMINE descriptives with a (conf*100)% confidence interval for the mean.
- Calls: [[distributions.ts#tPpf|tPpf()]], [[stats/descriptives.ts#summarize|summarize()]], [[util.ts#distinctWeighted|distinctWeighted()]], [[util.ts#percentileHaverage|percentileHaverage()]], [[util.ts#trimmedMean|trimmedMean()]], [[util.ts#tukeyHinges|tukeyHinges()]]
- Uses: [[stats/descriptives.ts#DEFAULT_PERCENTILES|DEFAULT_PERCENTILES]]
- Used in: [[tools/data.ts]], [[transform.ts]], [[core/descriptives.ts]], [[lib.test.ts]]

### lillieforsP
*function* · line 108 · exported
> Dallal & Wilkinson (1986) approximation to the Lilliefors p-value, as used by SPSS EXAMINE. The approximation is intended for p <= 0.1; SPSS reports .200 as a lower bound above 0.2.
- Used in: [[lib.test.ts]]

### ksLilliefors
*function* · line 119 · exported
> Kolmogorov-Smirnov test of normality with estimated mean and SD (Lilliefors correction).
- Calls: [[distributions.ts#normalCdf|normalCdf()]], [[stats/descriptives.ts#lillieforsP|lillieforsP()]], [[util.ts#distinctWeighted|distinctWeighted()]], [[util.ts#moments|moments()]]
- Used in: [[core/descriptives.ts]], [[lib.test.ts]]

### shapiroWilk
*function* · line 157 · exported
> Shapiro-Wilk W test (Royston 1995, algorithm AS R94), valid for 3 <= n <= 5000. `sorted` must be ascending. Frequency weights must be expanded (integer replication) by the caller.
- Calls: [[distributions.ts#normalPpf|normalPpf()]], [[distributions.ts#normalSf|normalSf()]], [[stats/descriptives.ts]]
- Used in: [[core/descriptives.ts]], [[lib.test.ts]]

### expandIntegerWeights
*function* · line 246 · exported
> Expand integer frequency weights into replicated sorted values (for Shapiro-Wilk).
- Used in: [[core/descriptives.ts]], [[lib.test.ts]]

### boxStats
*function* · line 274 · exported
> `index` values in outliers refer to positions in `x` (callers map them to case numbers).
- Calls: [[util.ts#distinctWeighted|distinctWeighted()]], [[util.ts#tukeyHinges|tukeyHinges()]]
- Used in: [[core/descriptives.ts]]
