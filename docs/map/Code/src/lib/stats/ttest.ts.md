---
id: src/lib/stats/ttest.ts
type: module
file: src/lib/stats/ttest.ts
area: lib/stats
---

# src/lib/stats/ttest.ts

*Module* · area [[lib - stats|lib/stats]] · 220 lines

> t tests (SPSS T-TEST): one-sample, independent samples (with Levene's test and Welch), paired. Frequency weights are treated as replication counts, so N and df come from summed weights.

## Imports
- [[distributions.ts]] · value
- [[util.ts]] · value

## Calls
- [[distributions.ts#tCdf|tCdf()]]
- [[distributions.ts#tPpf|tPpf()]]
- [[distributions.ts#tSf|tSf()]]
- [[distributions.ts#twoSidedP|twoSidedP()]]

## Tested by
- [[lib.test.ts]] · import

## Imported by
- [[anova.ts]] · value
- [[ttests.ts]] · value
- [[lib.test.ts]] · value

## Types
GroupStats (line 7) · TResult (line 25) · EffectSize (line 53) · OneSampleResult (line 59) · LeveneResult (line 81) · IndependentResult (line 147) · PairedResult (line 183)

## Private helpers
tResult() (line 38) · weightedMedianHaverage() (line 103)

## Symbols

### groupStats
*function* · line 14 · exported
- Calls: [[util.ts#moments|moments()]]

### hedgesJ
*function* · line 20 · exported
> Hedges' small-sample correction factor J(df) = Gamma(df/2) / (sqrt(df/2) Gamma((df-1)/2)).
- Calls: [[distributions.ts#lnGamma|lnGamma()]]

### oneSampleT
*function* · line 65 · exported
- Calls: [[ttest.ts#groupStats|groupStats()]], [[ttest.ts#hedgesJ|hedgesJ()]], [[ttest.ts]]
- Used in: [[ttests.ts]], [[lib.test.ts]]

### levene
*function* · line 89 · exported
> Levene's test for k groups: one-way ANOVA on |x - centre| (centre = mean, as SPSS, or median).
- Calls: [[ttest.ts#anovaF|anovaF()]], [[ttest.ts]], [[util.ts#moments|moments()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[anova.ts]]

### anovaF
*function* · line 131 · exported
> Minimal weighted one-way ANOVA F (used by Levene).
- Calls: [[distributions.ts#fSf|fSf()]], [[util.ts#Acc|Acc]], [[util.ts#moments|moments()]]

### independentT
*function* · line 156 · exported
- Calls: [[ttest.ts#groupStats|groupStats()]], [[ttest.ts#hedgesJ|hedgesJ()]], [[ttest.ts#levene|levene()]], [[ttest.ts]]
- Used in: [[ttests.ts]], [[lib.test.ts]]

### pairedT
*function* · line 194 · exported
> Paired t test on first - second (SPSS "Pair 1: first - second").
- Calls: [[distributions.ts#twoSidedP|twoSidedP()]], [[ttest.ts#groupStats|groupStats()]], [[ttest.ts#hedgesJ|hedgesJ()]], [[ttest.ts]], [[util.ts#moments|moments()]], [[util.ts#pearsonWeighted|pearsonWeighted()]]
- Used in: [[ttests.ts]], [[lib.test.ts]]
