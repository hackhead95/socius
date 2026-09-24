---
id: tests/fuzz/findings-repro.test.ts
type: test
file: tests/fuzz/findings-repro.test.ts
area: tests
---

# tests/fuzz/findings-repro.test.ts

*Test file* · area [[tests]] · 215 lines

> Minimal reproductions of the open fuzz findings (docs/qa/FUZZ-FINDINGS.md). Each test asserts the CORRECT behaviour. While a finding's id is listed in tests/fuzz/known-issues.ts the test is expected to fail (it.fails); deleting the id from known-issues.ts turns it into a normal test that must pass, and re-arms the fuzz suites for that problem. If one of these starts "passing unexpectedly", the ...

## Test cases
- **open fuzz findings (minimal reproductions)**

## Imports
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · value
- [[varUtils.ts]] · value
- [[output/format.ts]] · value
- [[io/index.ts]] · value
- [[transform/index.ts]] · value
- [[procedures/index.ts]] · value
- [[known-issues.ts]] · value
- [[vitest]] · value

## Calls
- [[aggregate.ts#aggregate|aggregate()]]
- [[binning.ts#binLabels|binLabels()]]
- [[evaluate.ts#compileExpression|compileExpression()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[io/index.ts#exportCsv|exportCsv()]]
- [[io/index.ts#exportXlsx|exportXlsx()]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[io/index.ts#importFile|importFile()]]
- [[output/format.ts#layoutRows|layoutRows()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[varUtils.ts#validate|validate()]]
- [[binning.ts#visualBin|visualBin()]]

## Uses
- [[binning.ts#BinError|BinError]]
- [[expr.ts#ExprError|ExprError]]
- [[known-issues.ts#KNOWN_ISSUES|KNOWN_ISSUES]]

## Tests
- [[Procedures/correlations|Bivariate Correlations]] · procedure id
- [[Procedures/chisquare-gof|Chi-Square (goodness of fit)]] · procedure id
- [[Procedures/crosstabs|Crosstabs]] · procedure id
- [[Procedures/descriptives|Descriptives]] · procedure id
- [[Procedures/graph-line|Line Chart]] · procedure id
- [[Procedures/ttest-one-sample|One-Sample T Test]] · procedure id
- [[Procedures/oneway-anova|One-Way ANOVA]] · procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[varUtils.ts]] · import
- [[output/format.ts]] · import
- [[io/index.ts]] · import
- [[transform/index.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
OPEN (line 17) · finding() (line 18) · ds() (line 20) · run() (line 25) · texts() (line 29) · table() (line 30)
