---
id: src/procedures/graphs/stats.ts
type: module
file: src/procedures/graphs/stats.ts
area: procedures
---

# src/procedures/graphs/stats.ts

*Module* · area [[procedures]] · 290 lines

> Small, self-contained statistics used by the Graphs procedures (weighted moments, t quantiles for confidence intervals, Tukey hinges, binning). Kept local so charts do not depend on the stats modules being written in parallel.

## Tested by
- [[graphs.test.ts]] · import

## Imported by
- [[graphs/index.ts]] · value
- [[graphs.test.ts]] · value

## Types
BoxStats (line 159)

## Symbols

### wMoments
*function* · line 6 · exported
> Weighted mean, variance (frequency weights, SPSS: divisor W - 1), and total weight.
- Used in: [[graphs/index.ts]]

### lgamma
*function* · line 34
> ---- t distribution (for 95% CIs) ----
- Used in: [[graphs/index.ts]]

### betacf
*function* · line 43
- Used in: [[graphs/index.ts]]

### ibeta
*function* · line 78 · exported
> Regularised incomplete beta I_x(a, b).
- Calls: [[stats.ts#betacf|betacf()]], [[stats.ts#lgamma|lgamma()]]
- Used in: [[graphs/index.ts]]

### tTwoSidedP
*function* · line 87 · exported
> Two-sided p for a t statistic.
- Calls: [[stats.ts#ibeta|ibeta()]]
- Used in: [[graphs/index.ts]]

### tQuantile
*function* · line 93 · exported
> Upper quantile of t: P(T > q) = alpha (e.g. alpha = .025 for a 95% CI).
- Calls: [[stats.ts#tTwoSidedP|tTwoSidedP()]]
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### meanCI
*function* · line 108 · exported
> Mean with a 95% CI (t-based; frequency weights).
- Calls: [[stats.ts#tQuantile|tQuantile()]], [[stats.ts#wMoments|wMoments()]]
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### wPercentile
*function* · line 122 · exported
> Weighted percentile, SPSS HAVERAGE definition: position p * (W + 1) over cumulative weights. With unit weights this is the usual (n + 1)p interpolation.
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### tukeyHinges
*function* · line 144 · exported
> Tukey's hinges (what SPSS EXAMINE draws as the box). Unweighted.
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### boxStats
*function* · line 175 · exported
> Box-plot statistics like SPSS EXAMINE: box = Tukey's hinges (weighted HAVERAGE quartiles when weights are not all 1); outliers beyond 1.5 box-lengths, extremes beyond 3; whiskers end at the most extreme non-outlying values. `rows` are 0-...
- Calls: [[stats.ts#tukeyHinges|tukeyHinges()]], [[stats.ts#wMoments|wMoments()]], [[stats.ts#wPercentile|wPercentile()]]
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### histogramEdges
*function* · line 217 · exported
> Histogram bin edges: `bins` equal-width bins, or automatic: the Freedman-Diaconis width (resistant to outliers; needs the IQR) bounded between Sturges' count and 50 bins, rounded to a nice width.
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### binCounts
*function* · line 241 · exported
> Weighted counts per bin; the last bin includes its upper edge.
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]

### linearFit
*function* · line 268 · exported
> Weighted least squares line y = a + b x, with Pearson r.
- Used in: [[graphs/index.ts]], [[graphs.test.ts]]
