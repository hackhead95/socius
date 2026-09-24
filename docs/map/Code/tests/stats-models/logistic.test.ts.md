---
id: tests/stats-models/logistic.test.ts
type: test
file: tests/stats-models/logistic.test.ts
area: tests
---

# tests/stats-models/logistic.test.ts

*Test file* · area [[tests]] · 175 lines

## Test cases
- **binary logistic regression (vs statsmodels Logit / GLM)**
  - coefficients, SEs, log-likelihood
  - pseudo R², Wald test for a multi-df term, classification
  - Block 0 score tests (vs statsmodels GLM.score_test)
  - Hosmer-Lemeshow (SPSS grouping, algorithm oracle)
  - frequency weights (vs GLM freq_weights)
  - detects quasi-complete separation and names the variable
  - detects complete separation on a continuous predictor
- **multinomial logistic regression (vs statsmodels MNLogit)**
  - frequency weights equal replication
- **ordinal regression, PLUM logit (vs statsmodels OrderedModel)**
  - thresholds, location parameters and SEs
  - model fitting, pseudo R², goodness of fit
  - general (non-parallel) model for the test of parallel lines (algorithm oracle)
  - frequency weights equal replication

## Imports
- [[logistic.ts]] · value
- [[ordinal.ts]] · value
- `tests/stats-models/fixtures/logistic.json` · value
- `tests/stats-models/fixtures/multinomial.json` · value
- `tests/stats-models/fixtures/ordinal.json` · value
- [[stats-models/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[stats-models/helpers.ts#close|close()]]
- [[stats-models/helpers.ts#closeAll|closeAll()]]
- [[stats-models/helpers.ts#col|col()]]
- [[ordinal.ts#cumulativeNullLogLik|cumulativeNullLogLik()]]
- [[logistic.ts#detectSeparation|detectSeparation()]]
- [[stats-models/helpers.ts#dummyCols|dummyCols()]]
- [[logistic.ts#fitBinaryLogit|fitBinaryLogit()]]
- [[ordinal.ts#fitCumulativeLogit|fitCumulativeLogit()]]
- [[logistic.ts#fitMultinomial|fitMultinomial()]]
- [[logistic.ts#hosmerLemeshow|hosmerLemeshow()]]
- [[logistic.ts#multinomialNullLogLik|multinomialNullLogLik()]]
- [[stats-models/helpers.ts#ones|ones()]]
- [[ordinal.ts#ordinalGoodnessOfFit|ordinalGoodnessOfFit()]]
- [[logistic.ts#pseudoR2|pseudoR2()]]
- [[logistic.ts#scoreTestsConstantOnly|scoreTestsConstantOnly()]]
- [[logistic.ts#waldTest|waldTest()]]

## Tests
- [[logistic.ts]] · import
- [[ordinal.ts]] · import

## Private helpers
age (line 18) · educ (line 18) · female (line 18) · n (line 19)
