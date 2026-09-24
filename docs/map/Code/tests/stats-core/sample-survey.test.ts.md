---
id: tests/stats-core/sample-survey.test.ts
type: test
file: tests/stats-core/sample-survey.test.ts
area: tests
---

# tests/stats-core/sample-survey.test.ts

*Test file* · area [[tests]] · 291 lines

> End-to-end numerical checks on the bundled sample survey (src/samples/urban_trust_survey.sav): every procedure is run the way the dialogs run it, and key numbers are compared with values computed independently in Python (pyreadstat with user-missing codes as missing, scipy, statsmodels, pingouin, factor_analyzer). Also covers wording regressions found in QA.

## Test cases
- **sample survey: numbers match the Python oracle**
  - frequencies list user-missing codes separately
  - descriptives exclude the 999999 income code
  - explore: Shapiro-Wilk and Lilliefors by migrant
  - crosstabs trust5 by gender: chi-square, V and ordinal measures
  - crosstabs 2x2: Fisher and odds ratio
  - t tests
  - one-way ANOVA with Tukey and Games-Howell
  - correlations and partial correlation
  - nonparametric tests
  - hierarchical linear regression with dummy coding
  - binary logistic regression with a computed civic count
  - ordinal regression (PLUM)
  - reliability before and after reverse-coding trust3
  - factor analysis: KMO, Bartlett and eigenvalues
  - weights change results like weighted Python
  - a filter changes N everywhere and is named in the case note
- **sample survey: wording**
  - question-style labels are replaced by names inside sentences
  - crosstab interpretation compares the column groups when column percentages are shown
  - group comparisons name the groups as groups
  - graphs: equal medians, significant weak correlations, non-monotonic lines, skew wording
  - readable errors instead of meaningless output
  - APA p values never read "p = 1.000"

## Imports
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · value
- [[io/index.ts]] · value
- [[transform/index.ts]] · value
- [[core/common.ts]] · value
- [[procedures/index.ts]] · value
- [[models/common.ts]] · value
- [[vitest]] · value

## Calls
- [[core/common.ts#apaP|apaP()]]
- [[compute.ts#computeVariable|computeVariable()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[models/common.ts#fmtP|fmtP()]]
- [[io/index.ts#importFile|importFile()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[derive.ts#reverseCode|reverseCode()]]

## Uses
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Procedures/models.logistic|Binary Logistic Regression]] · procedure id
- [[Procedures/binomial|Binomial]] · procedure id
- [[Procedures/correlations|Bivariate Correlations]] · procedure id
- [[Procedures/graph-box|Box Plot]] · procedure id
- [[Procedures/chisquare-gof|Chi-Square (goodness of fit)]] · procedure id
- [[Transforms/count|count]] · transform id
- [[Procedures/crosstabs|Crosstabs]] · procedure id
- [[Procedures/descriptives|Descriptives]] · procedure id
- [[Procedures/explore|Explore]] · procedure id
- [[Procedures/models.factor|Factor Analysis]] · procedure id
- [[Procedures/frequencies|Frequencies]] · procedure id
- [[Procedures/friedman|Friedman (k related samples)]] · procedure id
- [[Procedures/graph-histogram|Histogram]] · procedure id
- [[Procedures/ttest-independent|Independent-Samples T Test]] · procedure id
- [[Procedures/kruskal-wallis|Kruskal-Wallis H (k independent samples)]] · procedure id
- [[Procedures/graph-line|Line Chart]] · procedure id
- [[Procedures/models.linear|Linear Regression]] · procedure id
- [[Procedures/mann-whitney|Mann-Whitney U (2 independent samples)]] · procedure id
- [[Procedures/means|Means]] · procedure id
- [[Procedures/ttest-one-sample|One-Sample T Test]] · procedure id
- [[Procedures/oneway-anova|One-Way ANOVA]] · procedure id
- [[Procedures/models.ordinal|Ordinal Regression]] · procedure id
- [[Procedures/ttest-paired|Paired-Samples T Test]] · procedure id
- [[Procedures/partial-correlations|Partial Correlations]] · procedure id
- [[Procedures/graph-pie|Pie Chart]] · procedure id
- [[Procedures/models.reliability|Reliability Analysis]] · procedure id
- [[Procedures/graph-scatter|Scatter Plot]] · procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[transform/index.ts]] · import
- [[core/common.ts]] · import
- [[procedures/index.ts]] · import
- [[models/common.ts]] · import
- [[Procedures/wilcoxon|Wilcoxon Signed-Rank (2 related samples)]] · procedure id

## Private helpers
SAV (line 17) · ds (line 18) · ids() (line 24) · run() (line 32) · table() (line 42) · lastTable() (line 48) · nums() (line 55) · expectValue() (line 60) · texts() (line 65)
