---
id: tests/stats-core/procedures.test.ts
type: test
file: tests/stats-core/procedures.test.ts
area: tests
---

# tests/stats-core/procedures.test.ts

*Test file* · area [[tests]] · 320 lines

> Every core procedure produces a well-formed OutputItem on a synthetic survey dataset with value labels, user-missing codes, a weight variable and a filter; weights, filters and missing values change N as SPSS would; integer weights give the same results as replicated cases.

## Test cases
- **core procedures produce well-formed output**
  - registers every procedure once, with the expected menus
- **case selection follows SPSS rules**
  - Frequencies lists user-missing codes and system-missing separately
  - weights and filter change N like SPSS
  - integer weights give the same results as replicated cases
  - user-missing codes are excluded from analyses
  - readable errors for impossible requests
- **interpretations use labels and conventions**
  - crosstabs names groups by value label and reports Cramer V
  - independent t test recommends a row based on Levene

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · value
- [[util.ts]] · value
- [[core/index.ts]] · value
- [[vitest]] · value

## Calls
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[util.ts#seededRandom|seededRandom()]]

## Uses
- [[core/index.ts#coreProcedures|coreProcedures]]

## Tests
- [[Compare Means|Analyze > Compare Means]] · menu label
- [[Correlate|Analyze > Correlate]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Descriptives|Analyze > Descriptive Statistics > Descriptives...]] · menu label
- [[Nonparametric Tests|Analyze > Nonparametric Tests]] · menu label
- [[Procedures/binomial|Binomial]] · procedure id
- [[Procedures/correlations|Bivariate Correlations]] · procedure id
- [[Procedures/chisquare-gof|Chi-Square (goodness of fit)]] · procedure id
- [[Procedures/crosstabs|Crosstabs]] · procedure id
- [[Procedures/descriptives|Descriptives]] · menu label, procedure id
- [[Procedures/explore|Explore]] · procedure id
- [[Procedures/frequencies|Frequencies]] · procedure id
- [[Procedures/friedman|Friedman (k related samples)]] · procedure id
- [[Procedures/ttest-independent|Independent-Samples T Test]] · procedure id
- [[Procedures/kruskal-wallis|Kruskal-Wallis H (k independent samples)]] · procedure id
- [[Procedures/mann-whitney|Mann-Whitney U (2 independent samples)]] · procedure id
- [[Procedures/means|Means]] · procedure id
- [[Procedures/ttest-one-sample|One-Sample T Test]] · procedure id
- [[Procedures/oneway-anova|One-Way ANOVA]] · procedure id
- [[Procedures/ttest-paired|Paired-Samples T Test]] · procedure id
- [[Procedures/partial-correlations|Partial Correlations]] · procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[util.ts]] · import
- [[core/index.ts]] · import
- [[Procedures/wilcoxon|Wilcoxon Signed-Rank (2 related samples)]] · procedure id

## Private helpers
build() (line 11) · replicate() (line 63) · byName() (line 76) · checkGeometry() (line 79) · checkItem() (line 107) · proc() (line 122) · runProc() (line 128) · findTable() (line 139) · num() (line 145) · CASES (line 147)
