import { describe, expect, it } from 'vitest';
import fx from './fixtures/matrix.json';
import {
  cholesky,
  choleskySolve,
  crossprod,
  determinant,
  fromRows,
  identity,
  inverse,
  leastSquares,
  logDet,
  matVec,
  multiply,
  qrApplyQt,
  qrDecompose,
  qrR,
  solve,
  spdInverse,
  symEigen,
  symMatrixFunction,
  toRows,
  transpose,
  SingularMatrixError,
} from '../../src/lib/stats/matrix';
import { close, closeAll } from './helpers';

const flat = (a: number[][]) => a.flat();

describe('matrix (vs numpy)', () => {
  it('Cholesky factor, SPD inverse and log-determinant', () => {
    const A = fromRows(fx.spd);
    const L = cholesky(A)!;
    expect(L).not.toBeNull();
    closeAll(L.data, flat(fx.chol), 1e-12, 1e-12, 'chol');
    closeAll(spdInverse(A).data, flat(fx.spdInv), 1e-10, 1e-13, 'spdInv');
    close(logDet(A).logAbs, fx.spdLogDet, 1e-12, 1e-12, 'logdet');
    const b = [1, 2, 3, 4, 5, 6];
    const x = choleskySolve(L, b);
    closeAll(matVec(A, x), b, 1e-12, 1e-12, 'cholSolve');
  });

  it('rejects non-positive-definite matrices', () => {
    expect(cholesky(fromRows([[1, 2], [2, 1]]))).toBeNull();
    expect(() => spdInverse(fromRows([[1, 1], [1, 1]]))).toThrow(SingularMatrixError);
  });

  it('LU: general inverse, solve and determinant', () => {
    const G = fromRows(fx.gen);
    closeAll(inverse(G).data, flat(fx.genInv), 1e-10, 1e-12, 'genInv');
    closeAll(solve(G, fx.genSolveB), fx.genSolveX, 1e-10, 1e-12, 'solve');
    close(determinant(G), fx.genDet, 1e-10, 1e-12, 'det');
    const ld = logDet(G);
    expect(ld.sign).toBe(fx.genSign);
    close(ld.logAbs, fx.genLogAbs, 1e-12, 1e-12, 'logAbs');
    expect(() => inverse(fromRows([[1, 2], [2, 4]]))).toThrow(SingularMatrixError);
    expect(logDet(fromRows([[1, 2], [2, 4]])).sign).toBe(0);
  });

  it('symmetric eigen-decomposition (sorted descending, vectors up to sign)', () => {
    const S = fromRows(fx.sym);
    const { values, vectors } = symEigen(S);
    closeAll(values, fx.symValues, 1e-11, 1e-12, 'eigenvalues');
    const V = toRows(vectors);
    const n = values.length;
    for (let k = 0; k < n; k++) {
      const s = Math.sign(V[0][k]) === Math.sign(fx.symVectors[0][k]) ? 1 : -1;
      for (let i = 0; i < n; i++) close(s * V[i][k], fx.symVectors[i][k], 1e-9, 1e-11, `vec[${i}][${k}]`);
    }
    // Reconstruction and orthogonality.
    const VtV = multiply(transpose(vectors), vectors);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) close(VtV.data[i * n + j], i === j ? 1 : 0, 0, 1e-12, 'VtV');
  });

  it('eigen handles diagonal, repeated and 1x1 matrices', () => {
    expect(Array.from(symEigen(fromRows([[3]])).values)).toEqual([3]);
    const e = symEigen(fromRows([[2, 0, 0], [0, 5, 0], [0, 0, 2]]));
    closeAll(e.values, [5, 2, 2], 0, 1e-14, 'diag');
    const sq = symMatrixFunction(fromRows([[4, 1], [1, 3]]), Math.sqrt);
    const back = multiply(sq, sq);
    closeAll(back.data, [4, 1, 1, 3], 1e-12, 1e-12, 'sqrtm');
  });

  it('Householder QR reproduces A and detects rank', () => {
    const X = fromRows(fx.X);
    const f = qrDecompose(X, { pivot: false });
    expect(f.rank).toBe(5);
    const R = qrR(f);
    // R'R = X'X
    const RtR = multiply(transpose(R), R);
    closeAll(RtR.data, crossprod(X).data, 1e-11, 1e-11, 'RtR');
    const fp = qrDecompose(fromRows(fx.Xdef));
    expect(fp.rank).toBe(fx.lsDefRank);
    const qty = qrApplyQt(f, fx.y);
    let norm = 0, norm2 = 0;
    for (const v of qty) norm += v * v;
    for (const v of fx.y) norm2 += v * v;
    close(norm, norm2, 1e-12, 0, 'Q orthogonal');
  });

  it('least squares matches numpy, including a rank-deficient design', () => {
    const ls = leastSquares(fromRows(fx.X), fx.y);
    closeAll(ls.coef, fx.lsCoef, 1e-10, 1e-12, 'lsCoef');
    closeAll(ls.unscaledCov.data, flat(fx.lsCov), 1e-10, 1e-12, 'lsCov');
    const def = leastSquares(fromRows(fx.Xdef), fx.y);
    expect(def.rank).toBe(5);
    expect(def.aliased.length).toBe(1);
    // The fitted values are unique even though the coefficients are not; compare residual SS.
    const kept = fromRows(fx.Xdef.map((r) => r.filter((_, j) => j !== def.aliased[0])));
    const ref = leastSquares(kept, fx.y);
    close(def.rss, ref.rss, 1e-10, 1e-12, 'rss');
  });

  it('identity and multiply basics', () => {
    const A = fromRows([[1, 2], [3, 4]]);
    expect(Array.from(multiply(A, identity(2)).data)).toEqual([1, 2, 3, 4]);
  });
});
