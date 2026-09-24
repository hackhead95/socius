---
id: tests/fuzz/procedures-oracle.fuzz.test.ts
type: test
file: tests/fuzz/procedures-oracle.fuzz.test.ts
area: tests
---

# tests/fuzz/procedures-oracle.fuzz.test.ts

*Test file* · area [[tests]] · 376 lines

> Numerical cross-check of a random subset of procedure runs against scipy / statsmodels / pingouin (scripts/fuzz/oracle.py through /opt/oracle/bin/python). Random datasets (unweighted and with integer frequency weights, filter on/off, user-missing codes, ties) -> run the procedure -> read the statistic from the output table -> compare with the oracle on the same cases (weights replicated). Skipp...

## Test cases
- **procedures vs scipy / statsmodels**
  - gate: no new failures (known ones are listed in tests/fuzz/known-issues.ts)

## Imports
- [[node-child_process|node:child_process]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · type-only
- [[output/format.ts]] · value
- [[procedures/index.ts]] · value
- [[findings.ts]] · value
- [[gen-data.ts]] · value
- [[rng.ts]] · value
- [[vitest]] · value

## Calls
- [[findings.ts#Collector|Collector]]
- [[gen-data.ts#datasetToCode|datasetToCode()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[rng.ts#fuzzScale|fuzzScale()]]
- [[gen-data.ts#genDataset|genDataset()]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[core/data.ts#isMissingValue|isMissingValue()]]
- [[gen-data.ts#keepVariables|keepVariables()]]
- [[output/format.ts#layoutRows|layoutRows()]]
- [[rng.ts#makeRng|makeRng()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[rng.ts#suiteSeed|suiteSeed()]]

## Tests
- [[Procedures/correlations|Bivariate Correlations]] · procedure id
- [[Procedures/crosstabs|Crosstabs]] · procedure id
- [[Procedures/descriptives|Descriptives]] · procedure id
- [[Procedures/friedman|Friedman (k related samples)]] · procedure id
- [[Procedures/ttest-independent|Independent-Samples T Test]] · procedure id
- [[Procedures/kruskal-wallis|Kruskal-Wallis H (k independent samples)]] · procedure id
- [[Procedures/models.linear|Linear Regression]] · procedure id
- [[Procedures/mann-whitney|Mann-Whitney U (2 independent samples)]] · procedure id
- [[Procedures/ttest-one-sample|One-Sample T Test]] · procedure id
- [[Procedures/oneway-anova|One-Way ANOVA]] · procedure id
- [[Procedures/models.reliability|Reliability Analysis]] · procedure id
- [[core/data.ts]] · import
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[output/format.ts]] · import
- [[procedures/index.ts]] · import
- [[Procedures/wilcoxon|Wilcoxon Signed-Rank (2 related samples)]] · procedure id

## Private helpers
SEED (line 21) · PYTHON (line 22) · HAS_ORACLE (line 23) · ORACLE (line 24) · col (line 25) · out() (line 26) · grid() (line 37) · tablesOf() (line 49) · num() (line 54) · byKind() (line 71) · valuesOf() (line 73) · weightsFor() (line 87) · buildCases() (line 91)
