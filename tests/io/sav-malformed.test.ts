// (4) Malformed or truncated .sav files give a clear SavFormatError, never a crash, hang or a
// low-level exception (RangeError from a DataView, out-of-memory allocation, ...).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importFile } from '../../src/lib/io';
import { readSav, SavFormatError } from '../../src/lib/io/sav-reader';
import { FIXTURES } from './helpers';

const fixture = (name: string) => new Uint8Array(readFileSync(join(FIXTURES, name)));

/** Deterministic PRNG (mulberry32) so failures are reproducible. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function expectCleanOutcome(bytes: Uint8Array, ctx: string): 'ok' | 'error' {
  try {
    readSav(bytes);
    return 'ok';
  } catch (e) {
    if (!(e instanceof SavFormatError)) {
      throw new Error(`${ctx}: expected SavFormatError, got ${(e as Error)?.name}: ${(e as Error)?.message}`);
    }
    expect((e as Error).message.length, ctx).toBeGreaterThan(20);
    return 'error';
  }
}

describe('reader: malformed input', () => {
  it('rejects empty, tiny and non-SPSS input with a readable message', () => {
    expect(() => readSav(new Uint8Array(0))).toThrow(/not an SPSS data file/);
    expect(() => readSav(new TextEncoder().encode('$FL2 short'))).toThrow(/ended unexpectedly/);
    expect(() => readSav(new TextEncoder().encode('id,name\n1,a\n'.repeat(20)))).toThrow(/not an SPSS data file/);
  });

  for (const name of ['main_uncompressed.sav', 'main_bytecode.sav', 'main_zlib.zsav']) {
    it(`every truncation of ${name} fails with a clear error`, () => {
      const full = fixture(name);
      const t0 = Date.now();
      let n = 0;
      for (let len = 0; len < full.length; len += len < 400 ? 1 : 13) {
        expect(expectCleanOutcome(full.subarray(0, len), `${name} cut at ${len}`), `${name} cut at ${len}`).toBe('error');
        n++;
      }
      expect(n).toBeGreaterThan(500);
      expect(Date.now() - t0).toBeLessThan(20000);
    });
  }

  it('reports truncated data with the promised and actual case counts', () => {
    const full = fixture('main_uncompressed.sav');
    expect(() => readSav(full.subarray(0, full.length - 100))).toThrow(/promises 6 cases but the data holds only 5/);
  });

  for (const name of ['main_uncompressed.sav', 'main_bytecode.sav', 'main_zlib.zsav', 'weighted.sav']) {
    it(`random byte corruption of ${name} never escapes as a low-level error`, () => {
      const full = fixture(name);
      const rand = rng(name.length * 7919);
      let ok = 0;
      let err = 0;
      for (let iter = 0; iter < 400; iter++) {
        const b = full.slice();
        const flips = 1 + Math.floor(rand() * 4);
        for (let k = 0; k < flips; k++) {
          const pos = Math.floor(rand() * b.length);
          b[pos] = Math.floor(rand() * 256);
        }
        if (expectCleanOutcome(b, `${name} iteration ${iter}`) === 'ok') ok++;
        else err++;
      }
      expect(ok + err).toBe(400);
    });
  }

  it('corrupting integer fields to extreme values never allocates absurd memory', () => {
    const full = fixture('main_bytecode.sav');
    const offsets = [68, 72, 76, 80];
    for (const off of offsets) {
      for (const v of [0x7fffffff, -0x7fffffff, -1, 0, 1_000_000_000]) {
        const b = full.slice();
        new DataView(b.buffer).setInt32(off, v, true);
        expectCleanOutcome(b, `header offset ${off} = ${v}`);
      }
    }
  });

  it('a damaged zlib block is reported as damaged', () => {
    const full = fixture('main_zlib.zsav');
    const b = full.slice();
    // The compressed data follows the 24-byte zheader; locate it through the header.
    const dv = new DataView(b.buffer);
    // The trailer ends the file: 24 bytes of header, then one 24-byte entry per block. This small
    // file has one block, whose first field is its uncompressed offset (= the zheader offset).
    expect(dv.getInt32(b.length - 24 - 4, true)).toBe(1);
    const zheaderOfs = Number(dv.getBigInt64(b.length - 24, true));
    for (let i = zheaderOfs + 26; i < zheaderOfs + 60; i++) b[i] ^= 0xff;
    expect(() => readSav(b)).toThrow(/damaged/);
  });

  it('importFile passes the readable error through', async () => {
    const full = fixture('main_bytecode.sav');
    await expect(importFile('survey.sav', full.subarray(0, 1000))).rejects.toThrow(/ended unexpectedly|truncated/);
    await expect(importFile('survey.sav', new TextEncoder().encode('hello'))).rejects.toThrow(/not a valid SPSS data file/);
  });
});
