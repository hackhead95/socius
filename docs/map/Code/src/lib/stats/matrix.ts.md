---
id: src/lib/stats/matrix.ts
type: module
file: src/lib/stats/matrix.ts
area: lib/stats
---

# src/lib/stats/matrix.ts

*Module* · area [[lib - stats|lib/stats]] · 927 lines

> Dense linear algebra for the model procedures. Matrices are row-major Float64Array buffers wrapped in a small plain object. Everything here is pure: inputs are never mutated. Algorithms are the numerically careful textbook ones: Householder QR (optionally with column pivoting for rank detection), Cholesky for symmetric positive-definite systems, LU with partial pivoting for general systems, and...

## Tested by
- [[matrix.test.ts]] · import
- [[separation.test.ts]] · import

## Imported by
- [[stats/factor.ts]] · value
- [[logistic.ts]] · value
- [[ordinal.ts]] · value
- [[stats/reliability.ts]] · value
- [[matrix.test.ts]] · value
- [[separation.test.ts]] · value

## Types
Matrix (line 9) · LU (line 326) · QR (line 439) · LeastSquaresResult (line 557) · SymEigen (line 629) · RobustSolve (line 850) · RobustInverse (line 883)

## Private helpers
backSubstituteTransposed() (line 279) · luSolveVec() (line 380) · tred2() (line 664) · tql2() (line 738) · scaledEigen() (line 834)

## Symbols

### SingularMatrixError
*class* · line 16 · exported
- Used in: [[stats/factor.ts]], [[stats/reliability.ts]], [[matrix.test.ts]]

### zeros
*function* · line 25 · exported
> ---------- Construction and access ----------
- Used in: [[stats/factor.ts]], [[logistic.ts]], [[ordinal.ts]]

### identity
*function* · line 29 · exported
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### matrix
*function* · line 35 · exported

### fromRows
*function* · line 40 · exported
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[stats/factor.ts]], [[stats/reliability.ts]], [[matrix.test.ts]], [[separation.test.ts]]

### fromColumns
*function* · line 52 · exported
> Build a matrix whose columns are the given vectors (all the same length).
- Calls: [[matrix.ts#zeros|zeros()]]

### toRows
*function* · line 64 · exported
- Used in: [[matrix.test.ts]]

### get
*function* · line 70 · exported

### column
*function* · line 74 · exported

### row
*function* · line 80 · exported

### diag
*function* · line 84 · exported

### diagMatrix
*function* · line 91 · exported
- Calls: [[matrix.ts#zeros|zeros()]]

### clone
*function* · line 98 · exported

### subMatrix
*function* · line 103 · exported
> Sub-matrix of the given row and column indices.
- Calls: [[matrix.ts#zeros|zeros()]]

### transpose
*function* · line 114 · exported
> ---------- Basic arithmetic ----------
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### multiply
*function* · line 120 · exported
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### matVec
*function* · line 136 · exported
- Used in: [[matrix.test.ts]]

### tMatVec
*function* · line 149 · exported
> a' x

### crossprod
*function* · line 162 · exported
> A' diag(w) A (or A'A when w is omitted). Result is exactly symmetric.
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[matrix.test.ts]]

### add
*function* · line 179 · exported
- Calls: [[matrix.ts#zeros|zeros()]]

### subtract
*function* · line 186 · exported
- Calls: [[matrix.ts#zeros|zeros()]]

### scale
*function* · line 193 · exported
- Calls: [[matrix.ts#zeros|zeros()]]

### dot
*function* · line 199 · exported

### maxAbsDiff
*function* · line 206 · exported
> Largest absolute element difference (for convergence checks and tests).

### symmetrize
*function* · line 213 · exported
> Make a nearly-symmetric matrix exactly symmetric by averaging with its transpose.
- Calls: [[matrix.ts#clone|clone()]]

### cholesky
*function* · line 231 · exported
> Cholesky factor L (lower triangular, A = L L') of a symmetric positive-definite matrix, or null when A is not numerically positive definite.
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[logistic.ts]], [[matrix.test.ts]]

### forwardSubstitute
*function* · line 255 · exported
> Solve L y = b (L lower triangular).

### backSubstitute
*function* · line 267 · exported
> Solve U x = b (U upper triangular, stored in the upper triangle of a square matrix).

### choleskySolve
*function* · line 290 · exported
- Calls: [[matrix.ts#forwardSubstitute|forwardSubstitute()]], [[matrix.ts]]
- Used in: [[logistic.ts]], [[matrix.test.ts]]

### spdInverse
*function* · line 295 · exported
> Inverse of a symmetric positive-definite matrix via Cholesky. Throws SingularMatrixError otherwise.
- Calls: [[matrix.ts#SingularMatrixError|SingularMatrixError]], [[matrix.ts#choleskyInverse|choleskyInverse()]], [[matrix.ts#cholesky|cholesky()]]
- Used in: [[stats/factor.ts]], [[stats/reliability.ts]], [[matrix.test.ts]], [[separation.test.ts]]

### choleskyInverse
*function* · line 301 · exported
- Calls: [[matrix.ts#zeros|zeros()]]

### luDecompose
*function* · line 333 · exported
- Calls: [[matrix.ts#clone|clone()]]

### solve
*function* · line 394 · exported
> Solve A x = b for square A. Throws SingularMatrixError when A is singular.
- Calls: [[matrix.ts#SingularMatrixError|SingularMatrixError]], [[matrix.ts#luDecompose|luDecompose()]], [[matrix.ts]]
- Used in: [[matrix.test.ts]]

### inverse
*function* · line 401 · exported
> Inverse of a general square matrix. Throws SingularMatrixError when singular.
- Calls: [[matrix.ts#SingularMatrixError|SingularMatrixError]], [[matrix.ts#luDecompose|luDecompose()]], [[matrix.ts#zeros|zeros()]], [[matrix.ts]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### logDet
*function* · line 417 · exported
> log|det(A)| and the sign of det(A). A singular matrix gives { sign: 0, logAbs: -Infinity }.
- Calls: [[matrix.ts#luDecompose|luDecompose()]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### determinant
*function* · line 432 · exported
- Calls: [[matrix.ts#logDet|logDet()]]
- Used in: [[matrix.test.ts]]

### qrDecompose
*function* · line 454 · exported
> Householder QR with column pivoting (Businger-Golub). `rank` is the number of leading diagonal elements of R with |r_kk| > tol * |r_11|, where tol defaults to max(m, n) * machine epsilon * 10. Set `pivot` to false for a plain QR in the o...
- Calls: [[matrix.ts#clone|clone()]]
- Used in: [[matrix.test.ts]]

### qrApplyQt
*function* · line 533 · exported
> Q' b for a QR factorisation.
- Used in: [[matrix.test.ts]]

### qrR
*function* · line 549 · exported
> The upper-triangular R (first min(m,n) rows) of a QR factorisation, in pivoted column order.
- Calls: [[matrix.ts#zeros|zeros()]]
- Used in: [[matrix.test.ts]]

### leastSquares
*function* · line 573 · exported
> Minimum-norm-free least squares min ||y - X b|| using pivoted QR. Linearly dependent columns (beyond the numerical rank) are dropped and reported in `aliased`.
- Calls: [[matrix.ts#backSubstitute|backSubstitute()]], [[matrix.ts#qrApplyQt|qrApplyQt()]], [[matrix.ts#qrDecompose|qrDecompose()]], [[matrix.ts#upperTriangularInverse|upperTriangularInverse()]], [[matrix.ts#zeros|zeros()]]
- Used in: [[matrix.test.ts]]

### upperTriangularInverse
*function* · line 611 · exported
> Inverse of a non-singular upper-triangular matrix.
- Calls: [[matrix.ts#SingularMatrixError|SingularMatrixError]], [[matrix.ts#zeros|zeros()]]

### symEigen
*function* · line 640 · exported
> Eigen-decomposition of a real symmetric matrix: Householder reduction to tridiagonal form followed by the implicit QL algorithm (EISPACK tred2 / tql2). Eigenvalues are returned in descending order.
- Calls: [[matrix.ts#zeros|zeros()]], [[matrix.ts]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### symMatrixFunction
*function* · line 802 · exported
> Symmetric matrix function: V f(D) V'. Used for inverse square roots (polar decompositions in factor rotation) and similar.
- Calls: [[matrix.ts#symEigen|symEigen()]], [[matrix.ts#symmetrize|symmetrize()]], [[matrix.ts#zeros|zeros()]]
- Used in: [[stats/factor.ts]], [[matrix.test.ts]]

### NULL_EIGEN_TOL
*const* · line 824 · exported
> Relative size (after scaling the matrix to unit diagonal) below which an eigenvalue of an information matrix is treated as zero. Well above the rounding noise of symEigen (about n * 1e-16 * largest eigenvalue) and far below any eigenvalu...

### spdSolveRobust
*function* · line 862 · exported
> Solve A x = b for a symmetric positive semi-definite A (a Newton step with an information matrix). Uses Cholesky when A is positive definite; otherwise the minimum-norm solution on the identified subspace (Moore-Penrose pseudo-inverse of...
- Calls: [[matrix.ts#choleskySolve|choleskySolve()]], [[matrix.ts#cholesky|cholesky()]], [[matrix.ts]]
- Uses: [[matrix.ts#NULL_EIGEN_TOL|NULL_EIGEN_TOL]]
- Used in: [[logistic.ts]], [[ordinal.ts]], [[separation.test.ts]]

### spdInverseRobust
*function* · line 904 · exported
> Inverse of an information matrix that may be numerically singular, for standard errors in the style of SPSS when the Hessian has "unexpected singularities". Cholesky when possible; otherwise the matrix is scaled to unit diagonal and eige...
- Calls: [[matrix.ts#choleskyInverse|choleskyInverse()]], [[matrix.ts#cholesky|cholesky()]], [[matrix.ts#symmetrize|symmetrize()]], [[matrix.ts#zeros|zeros()]], [[matrix.ts]]
- Uses: [[matrix.ts#NULL_EIGEN_TOL|NULL_EIGEN_TOL]]
- Used in: [[logistic.ts]], [[ordinal.ts]], [[separation.test.ts]]
