---
id: src/lib/stats/anova.ts
type: module
file: src/lib/stats/anova.ts
area: lib/stats
---

# src/lib/stats/anova.ts

*Module* · area [[lib - stats|lib/stats]] · 263 lines

> One-way analysis of variance (SPSS ONEWAY / MEANS): ANOVA table, robust tests of equality of means (Welch, Brown-Forsythe), effect sizes, post hoc comparisons (Tukey HSD, Bonferroni, Scheffe, Games-Howell), Tukey homogeneous subsets and a linear trend contrast.

## Imports
- [[distributions.ts]] · value
- [[ttest.ts]] · value
- [[util.ts]] · value

## Calls
- [[util.ts#moments|moments()]]
- [[distributions.ts#tPpf|tPpf()]]

## Tested by
- [[lib.test.ts]] · import

## Imported by
- [[oneway.ts]] · value
- [[lib.test.ts]] · value

## Types
GroupInput (line 9) · GroupDesc (line 14) · AnovaResult (line 25) · PostHocMethod (line 131) · PairComparison (line 133) · Subset (line 194) · TrendResult (line 225)

## Private helpers
desc() (line 45)

## Symbols

### oneWayAnova
*function* · line 52 · exported
- Calls: [[anova.ts]], [[distributions.ts#fSf|fSf()]], [[ttest.ts#levene|levene()]], [[util.ts#Acc|Acc]], [[util.ts#moments|moments()]]
- Used in: [[oneway.ts]], [[lib.test.ts]]

### postHoc
*function* · line 144 · exported
> All ordered pairs (i, j), i != j, as SPSS lists them.
- Calls: [[distributions.ts#fPpf|fPpf()]], [[distributions.ts#fSf|fSf()]], [[distributions.ts#studentizedRangePpf|studentizedRangePpf()]], [[distributions.ts#studentizedRangeSf|studentizedRangeSf()]], [[distributions.ts#tPpf|tPpf()]], [[distributions.ts#twoSidedP|twoSidedP()]]
- Used in: [[oneway.ts]], [[lib.test.ts]]

### tukeySubsets
*function* · line 205 · exported
> Tukey HSD homogeneous subsets (harmonic mean of group sizes, as SPSS). Groups are sorted by mean; each maximal run of consecutive means whose range is not significant forms a subset.
- Calls: [[distributions.ts#studentizedRangeSf|studentizedRangeSf()]]
- Used in: [[oneway.ts]]

### linearTrend
*function* · line 235 · exported
> Linear polynomial contrast across ordered groups (equal spacing).
- Calls: [[distributions.ts#fSf|fSf()]]
- Used in: [[oneway.ts]]
