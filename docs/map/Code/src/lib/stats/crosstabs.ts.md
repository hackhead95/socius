---
id: src/lib/stats/crosstabs.ts
type: module
file: src/lib/stats/crosstabs.ts
area: lib/stats
---

# src/lib/stats/crosstabs.ts

*Module* · area [[lib - stats|lib/stats]] · 834 lines

> Contingency-table statistics (SPSS CROSSTABS): chi-square family, exact tests, nominal and ordinal measures of association with asymptotic standard errors (SPSS CROSSTABS algorithms), risk estimates, McNemar/Bowker, and Cochran-Mantel-Haenszel statistics for layered 2x2 tables.

## Imports
- [[distributions.ts]] · value
- [[util.ts]] · value

## Calls
- [[distributions.ts#lnGamma|lnGamma()]]

## Tested by
- [[fuzz-fixes.test.ts]] · import
- [[lib.test.ts]] · import

## Imported by
- [[correlation.ts]] · value
- [[core/crosstabs.ts]] · value
- [[fuzz-fixes.test.ts]] · value
- [[lib.test.ts]] · value

## Types
Table (line 10) · Margins (line 12) · CellStats (line 46) · ChiSquareTests (line 71) · FisherResult (line 87) · Measure (line 345) · NominalMeasures (line 355) · DirectionalNominal (line 378) · OrdinalMeasures (line 505) · RiskEstimate (line 685) · McNemarResult (line 706) · CMHResult (line 735)

## Private helpers
lnChoose() (line 8) · logTableProb() (line 181) · rhyper() (line 266) · concordance() (line 516)

## Symbols

### margins
*function* · line 18 · exported
- Used in: [[core/crosstabs.ts]]

### populated
*function* · line 34 · exported
> Drop rows and columns whose total is zero (SPSS computes statistics on populated rows/cols).
- Calls: [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]]

### expected
*function* · line 41 · exported
- Calls: [[stats/crosstabs.ts#margins|margins()]]

### cellStats
*function* · line 53 · exported
- Calls: [[stats/crosstabs.ts#expected|expected()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### chiSquareTests
*function* · line 100 · exported
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[stats/crosstabs.ts#expected|expected()]], [[stats/crosstabs.ts#fisher2x2|fisher2x2()]], [[stats/crosstabs.ts#fisherRxC|fisherRxC()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#pearsonFromTable|pearsonFromTable()]], [[stats/crosstabs.ts#populated|populated()]]
- Used in: [[core/crosstabs.ts]], [[fuzz-fixes.test.ts]], [[lib.test.ts]]

### fisher2x2
*function* · line 157 · exported
> Fisher's exact test for a 2x2 table (two-sided by probability ordering, like SPSS and scipy).
- Calls: [[distributions.ts#hypergeomLogPmf|hypergeomLogPmf()]]

### fisherRxC
*function* · line 194 · exported
> Fisher-Freeman-Halton exact test for r x c tables. Enumerates all tables with the observed margins (column by column) when that is cheap enough; otherwise estimates the p-value from 10,000 Monte Carlo tables (fixed seed 2000000, as SPSS'...
- Calls: [[stats/crosstabs.ts#fisherMonteCarlo|fisherMonteCarlo()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts]]
- Used in: [[fuzz-fixes.test.ts]], [[lib.test.ts]]

### fisherMonteCarlo
*function* · line 301 · exported
> Monte Carlo estimate of the Fisher-Freeman-Halton p-value: random tables with the observed margins, drawn column by column as sequential hypergeometric draws (Patefield 1981), so each table costs O(r x c) draws instead of a shuffle of al...
- Calls: [[distributions.ts#normalPpf|normalPpf()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts]], [[util.ts#seededRandom|seededRandom()]]
- Used in: [[fuzz-fixes.test.ts]]

### nominalMeasures
*function* · line 361 · exported
- Calls: [[stats/crosstabs.ts#chiSquareTests|chiSquareTests()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#populated|populated()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### lambdaTau
*function* · line 384 · exported
> Goodman and Kruskal's lambda and tau (SPSS CROSSTABS /STATISTICS=LAMBDA).
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#populated|populated()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### ordinalMeasures
*function* · line 543 · exported
> Gamma, Kendall's tau-b and tau-c, Somers' d with ASE1 and T based on ASE0 (SPSS algorithms).
- Calls: [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#populated|populated()]], [[stats/crosstabs.ts]]
- Used in: [[correlation.ts]], [[core/crosstabs.ts]], [[lib.test.ts]]

### pearsonFromTable
*function* · line 597 · exported
> Pearson r on a table with the given scores, with SPSS's ASE1 and t-based significance.
- Calls: [[distributions.ts#twoSidedP|twoSidedP()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]]

### spearmanFromTable
*function* · line 627 · exported
> Spearman correlation on a table (midrank scores from the margins).
- Calls: [[stats/crosstabs.ts#margins|margins()]], [[stats/crosstabs.ts#pearsonFromTable|pearsonFromTable()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### kappa
*function* · line 641 · exported
> Cohen's kappa for square tables (rows and columns with the same categories, in order).
- Calls: [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### riskEstimate
*function* · line 693 · exported
- Calls: [[distributions.ts#normalPpf|normalPpf()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### mcnemar
*function* · line 713 · exported
- Calls: [[distributions.ts#binomialCdf|binomialCdf()]], [[distributions.ts#chi2Sf|chi2Sf()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]

### cmh
*function* · line 747 · exported
> Cochran-Mantel-Haenszel statistics for K layered 2x2 tables.
- Calls: [[distributions.ts#chi2Sf|chi2Sf()]], [[distributions.ts#normalPpf|normalPpf()]], [[distributions.ts#normalSf|normalSf()]], [[stats/crosstabs.ts#margins|margins()]]
- Used in: [[core/crosstabs.ts]], [[lib.test.ts]]
