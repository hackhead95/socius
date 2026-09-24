---
id: src/procedures/core/index.ts
type: module
file: src/procedures/core/index.ts
area: procedures
---

# src/procedures/core/index.ts

*Module* · area [[procedures]] · 34 lines

> Core statistics procedures, in SPSS menu order.

## Imports
- [[procedure.ts]] · type-only
- [[correlations.ts]] · value
- [[core/crosstabs.ts]] · value
- [[core/descriptives.ts]] · value
- [[core/frequencies.ts]] · value
- [[core/nonparametric.ts]] · value
- [[oneway.ts]] · value
- [[ttests.ts]] · value

## Tested by
- [[stats-core/procedures.test.ts]] · import

## Imported by
- [[procedures/index.ts]] · value
- [[stats-core/procedures.test.ts]] · value

## Symbols

### coreProcedures
*const* · line 11 · exported
- Uses: [[core/crosstabs.ts#crosstabs|crosstabs]], [[core/descriptives.ts#descriptives|descriptives]], [[core/descriptives.ts#explore|explore]], [[core/frequencies.ts#frequencies|frequencies]], [[core/nonparametric.ts#binomialProc|binomialProc]], [[core/nonparametric.ts#chiSquareGofProc|chiSquareGofProc]], [[core/nonparametric.ts#friedmanProc|friedmanProc]], [[core/nonparametric.ts#kruskalProc|kruskalProc]], [[core/nonparametric.ts#mannWhitneyProc|mannWhitneyProc]], [[core/nonparametric.ts#wilcoxonProc|wilcoxonProc]], [[correlations.ts#bivariateCorrelations|bivariateCorrelations]], [[correlations.ts#partialCorrelationsProc|partialCorrelationsProc]], [[oneway.ts#means|means]], [[oneway.ts#onewayAnova|onewayAnova]], [[ttests.ts#independentTTest|independentTTest]], [[ttests.ts#oneSampleTTest|oneSampleTTest]], [[ttests.ts#pairedTTest|pairedTTest]]
- Used in: [[procedures/index.ts]], [[stats-core/procedures.test.ts]]
