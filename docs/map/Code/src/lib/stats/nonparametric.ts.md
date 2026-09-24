---
id: src/lib/stats/nonparametric.ts
type: module
file: src/lib/stats/nonparametric.ts
area: lib/stats
---

# src/lib/stats/nonparametric.ts

*Module* · area [[lib - stats|lib/stats]] · 406 lines

> Nonparametric tests (SPSS NPAR TESTS): chi-square goodness of fit, binomial test, Mann-Whitney U, Wilcoxon signed-rank, Kruskal-Wallis H (with Dunn's pairwise comparisons) and Friedman with Kendall's W. Frequency weights are treated as replication counts.

## Imports
- [[distributions.ts]] · value
- [[util.ts]] · value

## Tested by
- [[lib.test.ts]] · import

## Imported by
- [[core/nonparametric.ts]] · value
- [[lib.test.ts]] · value

## Types
GofResult (line 12) · BinomialResult (line 58) · MannWhitneyResult (line 90) · WilcoxonResult (line 210) · KruskalResult (line 293) · DunnComparison (line 334) · FriedmanResult (line 369)

## Private helpers
uDistribution() (line 112)

## Symbols

### chiSquareGof
*function* · line 25 · exported
> `proportions` are relative (they need not sum to 1); equal when omitted.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### binomialTest
*function* · line 69 · exported
- Calls: [[distributions.ts#binomialCdf|binomialCdf()]], [[distributions.ts#binomialSfInclusive|binomialSfInclusive()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### mannWhitney
*function* · line 145 · exported
- Calls: [[distributions.ts#normalCdf|normalCdf()]], [[stats/nonparametric.ts]], [[util.ts#rankWithTies|rankWithTies()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### wilcoxonSignedRank
*function* · line 228 · exported
> Differences are second - first (SPSS: "second < first" are negative ranks).
- Calls: [[distributions.ts#normalCdf|normalCdf()]], [[util.ts#rankWithTies|rankWithTies()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### kruskalWallis
*function* · line 305 · exported
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[util.ts#rankWithTies|rankWithTies()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### dunnTest
*function* · line 347 · exported
> Dunn's (1964) pairwise comparisons after Kruskal-Wallis, tie-corrected, Bonferroni adjusted.
- Calls: [[distributions.ts#normalSf|normalSf()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### friedman
*function* · line 380 · exported
> `columns[j][i]` is the value of variable j for case i (complete cases only).
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[util.ts#rankWithTies|rankWithTies()]], [[util.ts#weightsOrOnes|weightsOrOnes()]]
- Used in: [[core/nonparametric.ts]], [[lib.test.ts]]

### binomialPoint
*function* · line 403 · exported
> Probability of exactly k successes (exported for reporting point probabilities).
- Calls: [[distributions.ts#binomialLogPmf|binomialLogPmf()]]
