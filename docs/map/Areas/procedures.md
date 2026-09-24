---
id: "area:procedures"
type: area
area: procedures
---

# Area: procedures

21 files, 8083 lines.

## Depends on (module imports)
- [[core]]: 65
- [[lib - stats|lib/stats]]: 24
- [[features - output|features/output]]: 1

## Used by areas
- [[Areas/app|app]]: 2
- [[lib - assistant|lib/assistant]]: 2
- [[features - analysis|features/analysis]]: 1
- [[features - output|features/output]]: 1

## Files
- [[chartUtil.ts]]: Chart helpers for core procedures (histogram binning with "nice" widths).
- [[core/common.ts]]: Helpers shared by the core statistics procedures: case selection, category handling, output building, plain-language wording (APA numbers, e…
- [[correlations.ts]]: Analyze > Correlate: Bivariate (SPSS CORRELATIONS / NONPAR CORR) and Partial (SPSS PARTIAL CORR).
- [[core/crosstabs.ts]]: Analyze > Descriptive Statistics > Crosstabs (SPSS CROSSTABS), including layered tables for the elaboration model (a control variable), chi-…
- [[core/descriptives.ts]]: Analyze > Descriptive Statistics > Descriptives (SPSS DESCRIPTIVES) and Explore (SPSS EXAMINE).
- [[core/frequencies.ts]]: Analyze > Descriptive Statistics > Frequencies (SPSS FREQUENCIES).
- [[core/index.ts]]: Core statistics procedures, in SPSS menu order.
- [[core/nonparametric.ts]]: Analyze > Nonparametric Tests (SPSS NPAR TESTS): chi-square goodness of fit, binomial, Mann-Whitney U, Wilcoxon signed-rank, Kruskal-Wallis …
- [[oneway.ts]]: Analyze > Compare Means: Means (SPSS MEANS) and One-Way ANOVA (SPSS ONEWAY).
- [[ttests.ts]]: Analyze > Compare Means: One-Sample, Independent-Samples and Paired-Samples T Test (SPSS T-TEST).
- [[graphs/index.ts]]: Graphs menu: chart procedures that build OutputItems with a chart, a small summary table, SPSS syntax and a one-line interpretation. Filter,…
- [[stats.ts]]: Small, self-contained statistics used by the Graphs procedures (weighted moments, t quantiles for confidence intervals, Tukey hinges, binnin…
- [[procedures/index.ts]]: Procedure registry. Each team owns its own sub-index; this file only concatenates them.
- [[binary.ts]]: Binary Logistic Regression (SPSS LOGISTIC REGRESSION, METHOD=ENTER).
- [[models/common.ts]]: Shared helpers for the model procedures: option access, case notes, SPSS syntax preamble, APA number formatting, and predictor design (autom…
- [[models/factor.ts]]: Factor Analysis (SPSS FACTOR): principal components or principal axis factoring, with varimax / promax / direct oblimin rotation, KMO and Ba…
- [[models/index.ts]]
- [[linear.ts]]: Linear Regression (SPSS REGRESSION): hierarchical blocks, automatic dummy coding, Enter or Stepwise, SPSS tables, residual diagnostics, inte…
- [[nomreg.ts]]: Multinomial Logistic Regression (SPSS NOMREG): baseline-category logit for an unordered outcome.
- [[plum.ts]]: Ordinal Regression (SPSS PLUM, logit link): proportional-odds cumulative logit model. SPSS parameterisation: logit P(Y <= j) = threshold_j -…
- [[models/reliability.ts]]: Reliability Analysis (SPSS RELIABILITY /MODEL=ALPHA) with McDonald's omega.
