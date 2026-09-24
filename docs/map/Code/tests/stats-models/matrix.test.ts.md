---
id: tests/stats-models/matrix.test.ts
type: test
file: tests/stats-models/matrix.test.ts
area: tests
---

# tests/stats-models/matrix.test.ts

*Test file* · area [[tests]] · 119 lines

## Test cases
- **matrix (vs numpy)**
  - Cholesky factor, SPD inverse and log-determinant
  - rejects non-positive-definite matrices
  - LU: general inverse, solve and determinant
  - symmetric eigen-decomposition (sorted descending, vectors up to sign)
  - eigen handles diagonal, repeated and 1x1 matrices
  - Householder QR reproduces A and detects rank
  - least squares matches numpy, including a rank-deficient design
  - identity and multiply basics

## Imports
- [[matrix.ts]] · value
- `tests/stats-models/fixtures/matrix.json` · value
- [[stats-models/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[matrix.ts#cholesky|cholesky()]]
- [[matrix.ts#choleskySolve|choleskySolve()]]
- [[stats-models/helpers.ts#close|close()]]
- [[stats-models/helpers.ts#closeAll|closeAll()]]
- [[matrix.ts#crossprod|crossprod()]]
- [[matrix.ts#determinant|determinant()]]
- [[matrix.ts#fromRows|fromRows()]]
- [[matrix.ts#identity|identity()]]
- [[matrix.ts#inverse|inverse()]]
- [[matrix.ts#leastSquares|leastSquares()]]
- [[matrix.ts#logDet|logDet()]]
- [[matrix.ts#matVec|matVec()]]
- [[matrix.ts#multiply|multiply()]]
- [[matrix.ts#qrApplyQt|qrApplyQt()]]
- [[matrix.ts#qrDecompose|qrDecompose()]]
- [[matrix.ts#qrR|qrR()]]
- [[matrix.ts#solve|solve()]]
- [[matrix.ts#spdInverse|spdInverse()]]
- [[matrix.ts#symEigen|symEigen()]]
- [[matrix.ts#symMatrixFunction|symMatrixFunction()]]
- [[matrix.ts#toRows|toRows()]]
- [[matrix.ts#transpose|transpose()]]

## Uses
- [[matrix.ts#SingularMatrixError|SingularMatrixError]]

## Tests
- [[matrix.ts]] · import

## Private helpers
flat() (line 28)
