// Seeded, reproducible randomness for the fuzz suites (no dependencies).
// Every suite prints its seed; re-run a single failure with FUZZ_SEED=<seed>.

export interface Rng {
  seed: number;
  next(): number; // [0, 1)
  int(lo: number, hi: number): number; // inclusive
  pick<T>(arr: readonly T[]): T;
  bool(p?: number): boolean;
  shuffle<T>(arr: T[]): T[];
  sample<T>(arr: readonly T[], k: number): T[];
  normal(): number;
  fork(salt: number | string): Rng;
}

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** mulberry32 */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0 || 0x9e3779b9;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rng: Rng = {
    seed,
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    bool: (p = 0.5) => next() < p,
    shuffle: (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    sample: (arr, k) => rng.shuffle(arr.slice()).slice(0, Math.max(0, k)),
    normal: () => {
      const u = Math.max(next(), 1e-12);
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
    },
    fork: (salt) => makeRng((seed ^ (typeof salt === 'number' ? Math.imul(salt + 1, 0x9e3779b1) : hashString(salt))) >>> 0),
  };
  return rng;
}

/** Base seed for a suite: FUZZ_SEED env overrides the fixed default (so CI is reproducible). */
export function suiteSeed(defaultSeed: number): number {
  const env = typeof process !== 'undefined' ? process.env.FUZZ_SEED : undefined;
  return env ? Number(env) >>> 0 : defaultSeed;
}

/** Iteration multiplier: FUZZ_SCALE=5 runs five times as many random cases. */
export function fuzzScale(): number {
  const env = typeof process !== 'undefined' ? process.env.FUZZ_SCALE : undefined;
  return env ? Math.max(0.1, Number(env)) : 1;
}
