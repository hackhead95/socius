---
id: src/lib/stats/crosstabs.ts
type: module
file: src/lib/stats/crosstabs.ts
area: lib/stats
---

# src/lib/stats/crosstabs.ts

*Module* · area [[lib - stats|lib/stats]] · 783 lines

> Contingency-table statistics (SPSS CROSSTABS): chi-square family, exact tests, nominal and ordinal measures of association with asymptotic standard errors (SPSS CROSSTABS algorithms), risk estimates, McNemar/Bowker, and Cochran-Mantel-Haenszel statistics for layered 2x2 tables.

## Imports
- [[distributions.ts]] · value
- [[util.ts]] · value

## Calls
- [[distributions.ts#lnGamma|lnGamma()]]

## Tested by
- [[lib.test.ts]] · import

## Imported by
- [[correlation.ts]] · value
- [[core/crosstabs.ts]] · value
- [[lib.test.ts]] · value

## Types
Table (line 8) · Margins (line 10) · CellStats (line 44) · ChiSquareTests (line 69) · FisherResult (line 85) · Measure (line 294) · NominalMeasures (line 304) · DirectionalNominal (line 327) · OrdinalMeasures (line 454) · RiskEstimate (line 634) · McNemarResult (line 655) · CMHResult (line 684)

## Private helpers
logTableProb() (line 179) · concordance() (line 465)

## Symbols

### margins
*function* · line 16 · exported
- Used in: [[core/crosstabs.ts]]

### populated
*function* · line 32 · exported
> Drop rows and columns whose total is zero (SPSS computes statistics on populated rows/cols).
- Calls: [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]]

### expected
*function* · line 39 · exported
- Calls: [[stats/crosstabs.ts#margins|margins()]]

### cellStats
*function* · line 51 · exported
- Calls: [[stats/crosstabs.ts#expected|expected()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### chiSquareTests
*function* · line 98 · exported
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[stats/crosstabs.ts#expected|expected()]], [[stats/crosstabs.ts#fisher2x2|fisher2x2()]], [[stats/crosstabs.ts#fisherRxC|fisherRxC()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#pearsonFromTable|pearsonFromTable()]], [[stats/crosstabs.ts#populated|populated()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### fisher2x2
*function* · line 155 · exported
> Fisher's exact test for a 2x2 table (two-sided by probability ordering, like SPSS and scipy).
- Calls: [[distributions.ts#hypergeomLogPmf|hypergeomLogPmf()]]

### fisherRxC
*function* · line 192 · exported
> Fisher-Freeman-Halton exact test for r x c tables. Enumerates all tables with the observed margins (column by column) when that is cheap enough; otherwise estimates the p-value from 10,000 Monte Carlo tables (fixed seed 2000000, as SPSS'...
- Calls: [[stats/crosstabs.ts#fisherMonteCarlo|fisherMonteCarlo()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts]]
- Used in: [[lib.test.ts]]

### fisherMonteCarlo
*function* · line 253 · exported
> Monte Carlo estimate of the Fisher-Freeman-Halton p-value (random tables with fixed margins).
- Calls: [[distributions.ts#normalPpf|normalPpf()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts]], [[util.ts#seededRandom|seededRandom()]]

### nominalMeasures
*function* · line 310 · exported
- Calls: [[stats/crosstabs.ts#chiSquareTests|chiSquareTests()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#populated|populated()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### lambdaTau
*function* · line 333 · exported
> Goodman and Kruskal's lambda and tau (SPSS CROSSTABS /STATISTICS=LAMBDA).
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#populated|populated()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### ordinalMeasures
*function* · line 492 · exported
> Gamma, Kendall's tau-b and tau-c, Somers' d with ASE1 and T based on ASE0 (SPSS algorithms).
- Calls: [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#populated|populated()]], [[stats/crosstabs.ts]]
- Used in: [[correlation.ts]], [[core/crosstabs.ts]], [[lib.test.ts]]

### pearsonFromTable
*function* · line 546 · exported
> Pearson r on a table with the given scores, with SPSS's ASE1 and t-based significance.
- Calls: [[distributions.ts#twoSidedP|twoSidedP()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]]

### spearmanFromTable
*function* · line 576 · exported
> Spearman correlation on a table (midrank scores from the margins).
- Calls: [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#pearsonFromTable|pearsonFromTable()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### kappa
*function* · line 590 · exported
> Cohen's kappa for square tables (rows and columns with the same categories, in order).
- Calls: [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### riskEstimate
*function* · line 642 · exported
- Calls: [[distributions.ts#normalPpf|normalPpf()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### mcnemar
*function* · line 662 · exported
- Calls: [[distributions.ts#binomialCdf|binomialCdf()]], [[distributions.ts#chi2Sf|chi2Sf()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### cmh
*function* · line 696 · exported
> Cochran-Mantel-Haenszel statistics for K layered 2x2 tables.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[distributions.ts#normalPpf|normalPpf()]], [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]
