---
id: tests/stats-models/separation.test.ts
type: test
file: tests/stats-models/separation.test.ts
area: tests
---

# tests/stats-models/separation.test.ts

*Test file* · area [[tests]] · 242 lines

> Logit models under (quasi-)complete separation: estimates at the last iteration, standard errors from a numerically stable inverse of the information matrix (huge for the separated parameters, ordinary for the rest), and SPSS-like warnings. Unaffected parameters are compared with statsmodels fits of the limiting model (scripts/oracle/models_separation.py).

## Test cases
- **robust inverse of an information matrix**
  - equals the Cholesky inverse for a positive-definite matrix
  - floors null directions: huge but finite variances there, ordinary ones elsewhere
  - solves on the identified subspace (minimum norm) for a singular matrix
- **binary logistic regression, region = South has no voters**
  - reports finite SEs for every coefficient, a huge one only for the separated dummy
  - unaffected coefficients and SEs match statsmodels Logit without the South cases
  - procedure: marked row, other rows usable, no "." standard errors
- **ordinal regression, every South case in the lowest category**
  - thresholds and unaffected slopes match statsmodels OrderedModel without the South cases
  - unaffected SEs equal the analytic SEs of the limiting model (South cases left out)
  - procedure: separation warning names the category, only that row is marked
- **multinomial logistic regression, every South case chooses Centre**
  - unaffected parameters and SEs match statsmodels MNLogit without the South cases
  - the same data without separation still converges normally
  - keeps the non-separated fits identical (no warning on the regular survey)
- **sample survey: employ on age + gender (no "Other" gender respondent is a Student or Retired)**
  - shows SPSS-like singularity warning and names the empty combination
  - non-separated parameters get normal SEs matching statsmodels MNLogit; separated ones huge SEs
  - likelihood-based results are unaffected (LL matches statsmodels)

## Imports
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · value
- [[core/types.ts]] · type-only
- [[io/index.ts]] · value
- [[logistic.ts]] · value
- [[matrix.ts]] · value
- [[ordinal.ts]] · value
- [[procedures/index.ts]] · value
- [[dataset.ts]] · value
- `tests/stats-models/fixtures/logistic.json` · value
- `tests/stats-models/fixtures/separation.json` · value
- [[stats-models/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[dataset.ts#buildSurvey|buildSurvey()]]
- [[stats-models/helpers.ts#close|close()]]
- [[stats-models/helpers.ts#closeAll|closeAll()]]
- [[stats-models/helpers.ts#col|col()]]
- [[procedure.ts#defaultOptions|defaultOptions()]]
- [[stats-models/helpers.ts#dummyCols|dummyCols()]]
- [[logistic.ts#fitBinaryLogit|fitBinaryLogit()]]
- [[ordinal.ts#fitCumulativeLogit|fitCumulativeLogit()]]
- [[logistic.ts#fitMultinomial|fitMultinomial()]]
- [[matrix.ts#fromRows|fromRows()]]
- [[io/index.ts#importFile|importFile()]]
- [[stats-models/helpers.ts#ones|ones()]]
- [[matrix.ts#spdInverse|spdInverse()]]
- [[matrix.ts#spdInverseRobust|spdInverseRobust()]]
- [[matrix.ts#spdSolveRobust|spdSolveRobust()]]

## Uses
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Procedures/models.logistic|Binary Logistic Regression]] · procedure id
- [[Procedures/models.multinomial|Multinomial Logistic Regression]] · procedure id
- [[Procedures/models.ordinal|Ordinal Regression]] · procedure id
- [[output.ts]] · import
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[io/index.ts]] · import
- [[logistic.ts]] · import
- [[matrix.ts]] · import
- [[ordinal.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
HESSIAN (line 21) · age (line 23) · educ (line 23) · female (line 23) · region (line 23) · n (line 24) · reg2 (line 25) · reg3 (line 25) · keptRows (line 26) · run() (line 28) · table() (line 34) · texts() (line 39) · noBadText() (line 42)
