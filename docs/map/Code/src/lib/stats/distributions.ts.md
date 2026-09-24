---
id: src/lib/stats/distributions.ts
type: module
file: src/lib/stats/distributions.ts
area: lib/stats
---

# src/lib/stats/distributions.ts

*Module* · area [[lib - stats|lib/stats]] · 1163 lines

> Probability distributions for Socius statistics. Pure functions, no dependencies. Accuracy target is about 1e-12 relative in the body of each distribution and full relative accuracy in the tails down to ~1e-300 where the value is representable. Algorithms: - log-gamma: Lanczos (Godfrey g = 607/128) for small arguments, Stirling series otherwise. - densities: Loader's saddle-point method (stirle...

## Tested by
- [[distributions.test.ts]] · import
- [[lib.test.ts]] · import

## Imported by
- [[anova.ts]] · value
- [[correlation.ts]] · value
- [[stats/crosstabs.ts]] · value
- [[stats/descriptives.ts]] · value
- [[stats/factor.ts]] · value
- [[logistic.ts]] · value
- [[stats/nonparametric.ts]] · value
- [[ordinal.ts]] · value
- [[regression.ts]] · value
- [[ttest.ts]] · value
- [[binary.ts]] · value
- [[nomreg.ts]] · value
- [[plum.ts]] · value
- [[distributions.test.ts]] · value
- [[lib.test.ts]] · value

## Private helpers
LN_SQRT_2PI (line 16) · LN_2PI (line 17) · SQRT_2PI (line 18) · INV_SQRT_2PI (line 19) · DBL_EPS (line 20) · DBL_MIN (line 21) · FPMIN (line 22) · LANCZOS_G (line 28) · LANCZOS_C (line 29) · STIRLING (line 38) · bd0() (line 97) · logDbinomRaw() (line 118) · logDpoisRaw() (line 133) · incGamma() (line 153) · betacf() (line 208) · bd0d() (line 244) · logBetaKernel() (line 268) · logIbetaSeries() (line 279) · logIbetaCF() (line 293) · incBeta() (line 307) · CODY_A (line 347) · CODY_B (line 348) · CODY_C (line 349) · CODY_D (line 354) · CODY_P (line 358) · CODY_Q (line 359) · normalBoth() (line 362) · ACK_A (line 425) · ACK_B (line 426) · ACK_C (line 427) · ACK_D (line 428) · normalPpfLower() (line 431) · tBoth() (line 468) · fBoth() (line 530) · solvePositive() (line 565) · gaussLegendre() (line 679) · GL (line 707) · compositeRule() (line 710) · makeRangeRule() (line 737) · RANGE_FULL (line 749) · RANGE_FAST (line 750) · rangeProbs() (line 753) · CHEB_N (line 811) · RANGE_W_MAX (line 812) · PRE_RULE (line 813) · GL8 (line 814) · rangeLowerLogScaled() (line 817) · rangeUpperLog() (line 837) · chebFit() (line 858) · chebEval() (line 872) · chebPieces() (line 887) · findPiece() (line 902) · RANGE_TABLES (line 913) · rangeTable() (line 915) · rangeProbsTab() (line 943) · tableFor() (line 955) · studentizedRangeBoth() (line 957)

## Symbols

### stirlerr
*function* · line 46 · exported
> stirlerr(n) = log(Gamma(n+1)) - (n + 1/2) log(n) + n - log(sqrt(2 pi)): the error of Stirling's formula, computed without cancellation. Valid for n > 0 (non-integer allowed).
- Uses: [[distributions.ts]]

### lnGamma
*function* · line 66 · exported
> Natural log of |Gamma(x)|.
- Calls: [[distributions.ts#stirlerr|stirlerr()]]
- Uses: [[distributions.ts]]
- Used in: [[stats/crosstabs.ts]], [[ttest.ts]], [[distributions.test.ts]]

### lnBeta
*function* · line 90 · exported
> log(Beta(a, b)).
- Calls: [[distributions.ts#lnGamma|lnGamma()]]

### regIncGammaP
*function* · line 192 · exported
> Regularised lower incomplete gamma P(a, x).
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### regIncGammaQ
*function* · line 196 · exported
> Regularised upper incomplete gamma Q(a, x) = 1 - P(a, x), accurate in the upper tail.
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### regIncBeta
*function* · line 330 · exported
> Regularised incomplete beta I_x(a, b).
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### regIncBetaUpper
*function* · line 337 · exported
> Upper tail 1 - I_x(a, b), accurate when small.
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### normalCdf
*function* · line 415 · exported
- Calls: [[distributions.ts]]
- Used in: [[stats/descriptives.ts]], [[stats/nonparametric.ts]], [[distributions.test.ts]]

### normalSf
*function* · line 418 · exported
- Calls: [[distributions.ts]]
- Used in: [[correlation.ts]], [[stats/crosstabs.ts]], [[stats/descriptives.ts]], [[stats/nonparametric.ts]], [[distributions.test.ts]]

### normalPdf
*function* · line 421 · exported
- Uses: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### normalPpf
*function* · line 454 · exported
- Calls: [[distributions.ts]]
- Used in: [[stats/crosstabs.ts]], [[stats/descriptives.ts]], [[logistic.ts]], [[ordinal.ts]], [[distributions.test.ts]]

### tCdf
*function* · line 492 · exported
- Calls: [[distributions.ts]]
- Used in: [[correlation.ts]], [[ttest.ts]], [[distributions.test.ts]]

### tSf
*function* · line 495 · exported
- Calls: [[distributions.ts]]
- Used in: [[correlation.ts]], [[regression.ts]], [[ttest.ts]], [[distributions.test.ts]]

### tPdf
*function* · line 498 · exported
- Calls: [[distributions.ts#lnGamma|lnGamma()]], [[distributions.ts#normalPdf|normalPdf()]]

### chi2Cdf
*function* · line 509 · exported
> --------------------------------------------------------------------------------------------- Chi-square ---------------------------------------------------------------------------------------------
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### chi2Sf
*function* · line 513 · exported
- Calls: [[distributions.ts]]
- Used in: [[stats/crosstabs.ts]], [[stats/factor.ts]], [[logistic.ts]], [[stats/nonparametric.ts]], [[ordinal.ts]], [[binary.ts]], [[nomreg.ts]], [[plum.ts]], [[distributions.test.ts]]

### chi2Pdf
*function* · line 517 · exported
- Calls: [[distributions.ts#lnGamma|lnGamma()]], [[distributions.ts]]

### fCdf
*function* · line 546 · exported
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### fSf
*function* · line 549 · exported
- Calls: [[distributions.ts]]
- Used in: [[anova.ts]], [[regression.ts]], [[ttest.ts]], [[distributions.test.ts]]

### fPdf
*function* · line 552 · exported
- Calls: [[distributions.ts#lnBeta|lnBeta()]]

### tPpf
*function* · line 608 · exported
- Calls: [[distributions.ts#lnGamma|lnGamma()]], [[distributions.ts#normalPpf|normalPpf()]], [[distributions.ts#tPdf|tPdf()]], [[distributions.ts#tSf|tSf()]], [[distributions.ts]]
- Used in: [[anova.ts]], [[stats/descriptives.ts]], [[regression.ts]], [[ttest.ts]], [[distributions.test.ts]]

### chi2Ppf
*function* · line 638 · exported
- Calls: [[distributions.ts#chi2Cdf|chi2Cdf()]], [[distributions.ts#chi2Pdf|chi2Pdf()]], [[distributions.ts#chi2Sf|chi2Sf()]], [[distributions.ts#lnGamma|lnGamma()]], [[distributions.ts#normalPpf|normalPpf()]], [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### fPpf
*function* · line 655 · exported
- Calls: [[distributions.ts#chi2Ppf|chi2Ppf()]], [[distributions.ts#fCdf|fCdf()]], [[distributions.ts#fPdf|fPdf()]], [[distributions.ts#fSf|fSf()]], [[distributions.ts]]
- Used in: [[anova.ts]], [[distributions.test.ts]]

### studentizedRangeCdf
*function* · line 1011 · exported
> CDF of the studentized range distribution (k means, df error degrees of freedom; df may be Infinity).
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### studentizedRangeSf
*function* · line 1016 · exported
> Upper tail of the studentized range distribution (Tukey HSD / Games-Howell p-values).
- Calls: [[distributions.ts]]
- Used in: [[anova.ts]], [[distributions.test.ts]]

### studentizedRangePpf
*function* · line 1021 · exported
> Quantile of the studentized range (Tukey HSD and Games-Howell confidence intervals).
- Calls: [[distributions.ts]]
- Uses: [[distributions.ts]]
- Used in: [[anova.ts]], [[distributions.test.ts]], [[lib.test.ts]]

### binomialPmf
*function* · line 1083 · exported
> --------------------------------------------------------------------------------------------- Discrete distributions ---------------------------------------------------------------------------------------------
- Calls: [[distributions.ts]]
- Used in: [[distributions.test.ts]]

### binomialLogPmf
*function* · line 1090 · exported
> log P(X = k) for X ~ Binomial(n, p).
- Calls: [[distributions.ts]]
- Used in: [[stats/nonparametric.ts]]

### binomialCdf
*function* · line 1096 · exported
> P(X <= k) for X ~ Binomial(n, p).
- Calls: [[distributions.ts]]
- Used in: [[stats/crosstabs.ts]], [[stats/nonparametric.ts]], [[distributions.test.ts]]

### binomialSfInclusive
*function* · line 1108 · exported
> P(X >= k) for X ~ Binomial(n, p), accurate in the upper tail.
- Calls: [[distributions.ts]]
- Used in: [[stats/nonparametric.ts]]

### hypergeomPmf
*function* · line 1122 · exported
> Hypergeometric pmf: probability of k successes in n draws without replacement from a population of N containing K successes.
- Calls: [[distributions.ts#hypergeomLogPmf|hypergeomLogPmf()]]
- Used in: [[distributions.test.ts]]

### hypergeomLogPmf
*function* · line 1126 · exported
- Calls: [[distributions.ts]]
- Used in: [[stats/crosstabs.ts]]

### twoSidedP
*function* · line 1142 · exported
> Two-sided p-value for a z or t statistic.
- Calls: [[distributions.ts#normalSf|normalSf()]], [[distributions.ts]]
- Used in: [[anova.ts]], [[correlation.ts]], [[stats/crosstabs.ts]], [[ttest.ts]], [[distributions.test.ts]]
