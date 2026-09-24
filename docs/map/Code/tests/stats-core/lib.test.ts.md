---
id: tests/stats-core/lib.test.ts
type: test
file: tests/stats-core/lib.test.ts
area: tests
---

# tests/stats-core/lib.test.ts

*Test file* · area [[tests]] · 344 lines

> Core statistics library vs scipy / statsmodels / pingouin / scikit-posthocs references. Fixture: scripts/oracle/core_oracle.py (tests/stats-core/fixtures/core.json).

## Test cases
- **descriptives**
- **t tests**
  - one-sample
  - independent samples (Student, Welch, Levene, effect sizes)
  - paired
- **one-way ANOVA**
- **crosstabs**
  - Cochran-Mantel-Haenszel
  - integer case weights equal replicated data
- **nonparametric**
  - chi-square goodness of fit
  - binomial
  - Mann-Whitney
  - Wilcoxon signed-rank
  - Kruskal-Wallis and Dunn
  - Friedman
- **correlations**
  - reports the largest observed deviations

## Imports
- [[anova.ts]] · value
- [[correlation.ts]] · value
- [[stats/crosstabs.ts]] · value
- [[stats/descriptives.ts]] · value
- [[distributions.ts]] · value
- [[stats/nonparametric.ts]] · value
- [[ttest.ts]] · value
- `tests/stats-core/fixtures/core.json` · value
- [[vitest]] · value

## Calls
- [[stats/nonparametric.ts#binomialTest|binomialTest()]]
- [[stats/crosstabs.ts#cellStats|cellStats()]]
- [[stats/nonparametric.ts#chiSquareGof|chiSquareGof()]]
- [[stats/crosstabs.ts#chiSquareTests|chiSquareTests()]]
- [[stats/crosstabs.ts#cmh|cmh()]]
- [[stats/nonparametric.ts#dunnTest|dunnTest()]]
- [[stats/descriptives.ts#expandIntegerWeights|expandIntegerWeights()]]
- [[stats/descriptives.ts#exploreStats|exploreStats()]]
- [[stats/crosstabs.ts#fisherRxC|fisherRxC()]]
- [[stats/nonparametric.ts#friedman|friedman()]]
- [[ttest.ts#independentT|independentT()]]
- [[stats/crosstabs.ts#kappa|kappa()]]
- [[correlation.ts#kendallTauB|kendallTauB()]]
- [[stats/nonparametric.ts#kruskalWallis|kruskalWallis()]]
- [[stats/descriptives.ts#ksLilliefors|ksLilliefors()]]
- [[stats/crosstabs.ts#lambdaTau|lambdaTau()]]
- [[stats/descriptives.ts#lillieforsP|lillieforsP()]]
- [[stats/nonparametric.ts#mannWhitney|mannWhitney()]]
- [[stats/crosstabs.ts#mcnemar|mcnemar()]]
- [[stats/crosstabs.ts#nominalMeasures|nominalMeasures()]]
- [[ttest.ts#oneSampleT|oneSampleT()]]
- [[anova.ts#oneWayAnova|oneWayAnova()]]
- [[stats/crosstabs.ts#ordinalMeasures|ordinalMeasures()]]
- [[ttest.ts#pairedT|pairedT()]]
- [[correlation.ts#partialCorrelations|partialCorrelations()]]
- [[correlation.ts#pearson|pearson()]]
- [[anova.ts#postHoc|postHoc()]]
- [[stats/crosstabs.ts#riskEstimate|riskEstimate()]]
- [[stats/descriptives.ts#shapiroWilk|shapiroWilk()]]
- [[correlation.ts#spearman|spearman()]]
- [[stats/crosstabs.ts#spearmanFromTable|spearmanFromTable()]]
- [[distributions.ts#studentizedRangePpf|studentizedRangePpf()]]
- [[stats/nonparametric.ts#wilcoxonSignedRank|wilcoxonSignedRank()]]

## Tests
- [[anova.ts]] · import
- [[correlation.ts]] · import
- [[stats/crosstabs.ts]] · import
- [[stats/descriptives.ts]] · import
- [[distributions.ts]] · import
- [[stats/nonparametric.ts]] · import
- [[ttest.ts]] · import

## Private helpers
STAT (line 25) · PV (line 26) · maxStatErr (line 27) · maxPErr (line 28) · close() (line 30)
