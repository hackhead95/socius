---
id: src/lib/stats/correlation.ts
type: module
file: src/lib/stats/correlation.ts
area: lib/stats
---

# src/lib/stats/correlation.ts

*Module* · area [[lib - stats|lib/stats]] · 196 lines

> Correlations (SPSS CORRELATIONS, NONPAR CORR, PARTIAL CORR): Pearson, Spearman, Kendall's tau-b, and partial correlations. Frequency weights are treated as replication counts.

## Imports
- [[stats/crosstabs.ts]] · value
- [[distributions.ts]] · value
- [[util.ts]] · value

## Calls
- [[distributions.ts#tCdf|tCdf()]]
- [[distributions.ts#tSf|tSf()]]
- [[distributions.ts#twoSidedP|twoSidedP()]]

## Tested by
- [[lib.test.ts]] · import

## Imported by
- [[correlations.ts]] · value
- [[lib.test.ts]] · value

## Types
CorrResult (line 8) · PartialResult (line 132)

## Private helpers
tTest() (line 18) · codes() (line 39)

## Symbols

### pearson
*function* · line 26 · exported
- Calls: [[correlation.ts]], [[util.ts#pearsonWeighted|pearsonWeighted()]]
- Used in: [[correlations.ts]], [[lib.test.ts]]

### spearman
*function* · line 31 · exported
- Calls: [[correlation.ts]], [[util.ts#pearsonWeighted|pearsonWeighted()]], [[util.ts#rankWithTies|rankWithTies()]]
- Used in: [[correlations.ts]], [[lib.test.ts]]

### kendallTauB
*function* · line 52 · exported
> Kendall's tau-b with significance from T = tau-b / ASE0 (Brown & Benedetti 1977), the same statistic SPSS reports in CROSSTABS.
- Calls: [[correlation.ts]], [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#ordinalMeasures|ordinalMeasures()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[correlations.ts]], [[lib.test.ts]]

### invert
*function* · line 113 · exported
> Inverse of a small symmetric positive-definite matrix (Gauss-Jordan with partial pivoting).

### partialCorrelations
*function* · line 145 · exported
> Partial correlations of `vars` controlling for `controls`, from listwise-complete columns. df = N - 2 - (number of controls).
- Calls: [[correlation.ts#invert|invert()]], [[distributions.ts#tCdf|tCdf()]], [[distributions.ts#tSf|tSf()]], [[distributions.ts#twoSidedP|twoSidedP()]], [[util.ts#pearsonWeighted|pearsonWeighted()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[correlations.ts]], [[lib.test.ts]]
