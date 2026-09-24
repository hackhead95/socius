---
id: tests/stats-core/distributions.test.ts
type: test
file: tests/stats-core/distributions.test.ts
area: tests
---

# tests/stats-core/distributions.test.ts

*Test file* · area [[tests]] · 163 lines

> Distribution functions vs high-precision references (mpmath at 40 digits; scipy/Boost for very large parameters; scipy for the studentized range). Fixture: scripts/oracle/core_oracle_dist.py.

## Test cases
- **lnGamma**
  - matches mpmath
- **normal**
  - cdf/sf/pdf
  - ppf
- **t**
  - cdf/sf incl. extreme df and tails
  - ppf
  - twoSidedP
- **chi-square**
  - cdf/sf
  - ppf
- **F**
  - cdf/sf
  - ppf
- **incomplete beta and gamma**
  - regIncBeta both tails
  - regIncGamma P and Q
- **discrete**
  - binomial pmf/cdf
  - hypergeometric pmf
- **studentized range**
  - cdf/sf match scipy to 1e-10 absolute
  - k = 2 reduces to the t distribution: P(Q > q) = P(|T| > q / sqrt 2)
  - ppf inverts cdf
  - matches scipy for fractional df, both tails and extreme quantiles
  - k = 2 upper tail keeps relative accuracy far out (t distribution identity)
  - is fast enough for Games-Howell: 50 quantiles and 200 p-values with fractional df in well under a second

## Imports
- [[distributions.ts]] · value
- `tests/stats-core/fixtures/distributions.json` · value
- [[vitest]] · value

## Calls
- [[distributions.ts#binomialCdf|binomialCdf()]]
- [[distributions.ts#binomialPmf|binomialPmf()]]
- [[distributions.ts#chi2Cdf|chi2Cdf()]]
- [[distributions.ts#chi2Ppf|chi2Ppf()]]
- [[distributions.ts#chi2Sf|chi2Sf()]]
- [[distributions.ts#fCdf|fCdf()]]
- [[distributions.ts#fPpf|fPpf()]]
- [[distributions.ts#fSf|fSf()]]
- [[distributions.ts#hypergeomPmf|hypergeomPmf()]]
- [[distributions.ts#lnGamma|lnGamma()]]
- [[distributions.ts#normalCdf|normalCdf()]]
- [[distributions.ts#normalPdf|normalPdf()]]
- [[distributions.ts#normalPpf|normalPpf()]]
- [[distributions.ts#normalSf|normalSf()]]
- [[distributions.ts#regIncBeta|regIncBeta()]]
- [[distributions.ts#regIncBetaUpper|regIncBetaUpper()]]
- [[distributions.ts#regIncGammaP|regIncGammaP()]]
- [[distributions.ts#regIncGammaQ|regIncGammaQ()]]
- [[distributions.ts#studentizedRangeCdf|studentizedRangeCdf()]]
- [[distributions.ts#studentizedRangePpf|studentizedRangePpf()]]
- [[distributions.ts#studentizedRangeSf|studentizedRangeSf()]]
- [[distributions.ts#tCdf|tCdf()]]
- [[distributions.ts#tPpf|tPpf()]]
- [[distributions.ts#tSf|tSf()]]
- [[distributions.ts#twoSidedP|twoSidedP()]]

## Tests
- [[distributions.ts]] · import

## Private helpers
relErr() (line 8) · expectRel() (line 14)
