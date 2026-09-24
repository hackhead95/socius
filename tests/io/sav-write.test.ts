// (2) Socius writes .sav/.zsav files that pyreadstat reads back identically (needs the Python
//     oracle; skipped with a reason when /opt/oracle/bin/python is absent, e.g. in CI).
// (3) Socius's own round trip read(write(ds)) is lossless (always runs).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Dataset, Variable } from '../../src/core/types';
import { exportSav, exportSavWithReport } from '../../src/lib/io';
import { readSav } from '../../src/lib/io/sav-reader';
import { writeSav, type SavCompression } from '../../src/lib/io/sav-writer';
import { edgeDataset, emptyDataset, EXPECTED_DOCS } from './datasets';
import { expectMatchesOracle, FIXTURES, HAS_ORACLE, pyreadstatRead } from './helpers';

const MODES: SavCompression[] = ['none', 'bytecode', 'zsav'];
/** Compare two datasets ignoring ids (the reader assigns new ones). */
function expectSameDataset(actual: Dataset, expected: Dataset, opts: { documents?: string[] } = {}) {
  expect(actual.nCases).toBe(expected.nCases);
  expect(actual.fileLabel).toBe(expected.fileLabel);
  expect(actual.documents).toEqual(opts.documents ?? expected.documents);
  expect(actual.variables.length).toBe(expected.variables.length);
  expected.variables.forEach((ev, k) => {
    const av = actual.variables[k];
    const strip = (v: Variable) => ({ ...v, id: '', attributes: v.attributes && Object.keys(v.attributes).length ? v.attributes : undefined });
    expect(strip(av), `variable ${ev.name}`).toEqual(strip(ev));
    const ac = actual.columns[av.id];
    const ec = expected.columns[ev.id];
    if (ec instanceof Float64Array) {
      expect(ac).toBeInstanceOf(Float64Array);
      expect(Array.from(ac as Float64Array), ev.name).toEqual(Array.from(ec));
    } else {
      expect(ac, ev.name).toEqual((ec as string[]).map((s) => s.replace(/ +$/, '')));
    }
  });
  const wa = actual.variables.find((v) => v.id === actual.weightVarId)?.name ?? null;
  const we = expected.variables.find((v) => v.id === expected.weightVarId)?.name ?? null;
  expect(wa).toBe(we);
}


describe('SPSS writer: JS round trip (always runs)', () => {
  for (const mode of MODES) {
    it(`read(write(ds)) is lossless with compression=${mode}`, () => {
      const ds = edgeDataset();
      const { bytes, warnings } = writeSav(ds, { compression: mode });
      expect(warnings).toEqual([]);
      const back = readSav(bytes, { fileName: 'edge.sav' });
      expect(back.warnings).toEqual([]);
      expectSameDataset(back.dataset, ds, { documents: EXPECTED_DOCS });
      expect(back.dataset.source?.kind).toBe(mode === 'zsav' ? 'zsav' : 'sav');
    });

    it(`round trips a dataset with zero cases (compression=${mode})`, () => {
      const ds = emptyDataset();
      const back = readSav(exportSav(ds, { compression: mode }));
      expectSameDataset(back.dataset, ds, { documents: EXPECTED_DOCS });
    });

    it(`writes and reads big-endian files (compression=${mode})`, () => {
      const ds = edgeDataset();
      const be = writeSav(ds, { compression: mode, bigEndian: true }).bytes;
      expect(new DataView(be.buffer).getInt32(64, false)).toBe(2);
      expectSameDataset(readSav(be).dataset, ds, { documents: EXPECTED_DOCS });
    });
  }

  it('re-writes every pyreadstat fixture without loss', () => {
    for (const name of ['main_uncompressed.sav', 'main_bytecode.sav', 'main_zlib.zsav', 'weighted.sav', 'empty_zlib.zsav']) {
      const first = readSav(new Uint8Array(readFileSync(join(FIXTURES, name)))).dataset;
      for (const mode of MODES) {
        const { bytes, warnings } = writeSav(first, { compression: mode });
        expect(warnings, name).toEqual([]);
        expectSameDataset(readSav(bytes).dataset, first);
      }
    }
  });

  it('defaults to bytecode compression and a $FL2 header; zsav gets $FL3', () => {
    const ds = edgeDataset();
    const plain = exportSav(ds);
    expect(new TextDecoder().decode(plain.subarray(0, 4))).toBe('$FL2');
    expect(new DataView(plain.buffer).getInt32(72, true)).toBe(1);
    const z = exportSav(ds, { compression: 'zsav' });
    expect(new TextDecoder().decode(z.subarray(0, 4))).toBe('$FL3');
    expect(new DataView(z.buffer).getInt32(72, true)).toBe(2);
  });

  it('generates unique 8-byte short names for long names that share a prefix', () => {
    const ds = edgeDataset();
    const bytes = exportSav(ds, { compression: 'none' });
    const text = new TextDecoder('latin1').decode(bytes);
    const m = /A_VERY_L=a_very_long_variable_name_number_one\tA_VERY_1=a_very_long_variable_name_number_two/.exec(text);
    expect(m).not.toBeNull();
  });

  it('stores the weight variable in the header', () => {
    const ds = edgeDataset();
    const bytes = exportSav(ds);
    const back = readSav(bytes).dataset;
    expect(back.variables.find((v) => v.id === back.weightVarId)?.name).toBe('wt');
  });

  it('keeps SPSS limits and reports what it had to change', () => {
    const ds = edgeDataset();
    const g = ds.variables.find((v) => v.name === 'gender')!;
    g.missing = { discrete: [7, 8, 9, 10] };
    const l = ds.variables.find((v) => v.name === 'likert')!;
    l.missing = { discrete: [-1, -2], range: { lo: 8, hi: 9 } };
    const s9 = ds.variables.find((v) => v.name === 's9')!;
    s9.missing = { discrete: ['x', 'much too long'], range: { lo: 1, hi: 2 } };
    const s1 = ds.variables.find((v) => v.name === 's1')!;
    (ds.columns[s1.id] as string[])[1] = 'grown beyond one byte';
    ds.variables.find((v) => v.name === 'id')!.label = 'L'.repeat(300);
    ds.variables.find((v) => v.name === 'income')!.name = 'bad name!';
    ds.variables.find((v) => v.name === 'pct')!.name = 'WITH';
    const { bytes, warnings } = exportSavWithReport(ds);
    const text = warnings.join('\n');
    expect(text).toContain('gender had 4 missing values; SPSS allows 3');
    expect(text).toContain('likert had a missing-value range plus 2 single missing values');
    expect(text).toContain('Missing value "much too long" of s9');
    expect(text).toContain('String variable s9 had a missing-value range');
    expect(text).toContain('String variable s1 was widened from 1 to 21 bytes');
    expect(text).toContain('The label of id was cut');
    expect(text).toContain('bad name! -> bad_name');
    expect(text).toContain('WITH -> WITH_V');
    const back = readSav(bytes).dataset;
    const by = Object.fromEntries(back.variables.map((v) => [v.name, v]));
    expect(by.gender.missing.discrete).toEqual([7, 8, 9]);
    expect(by.likert.missing).toEqual({ discrete: [-1], range: { lo: 8, hi: 9 } });
    expect(by.s9.missing).toEqual({ discrete: ['x'] });
    expect(by.s1.width).toBe(21);
    expect((back.columns[by.s1.id] as string[])[1]).toBe('grown beyond one byte');
    expect(by.id.label).toBe('L'.repeat(256));
    expect(by.bad_name).toBeDefined();
    expect(by.WITH_V).toBeDefined();
  });

  it('refuses datasets that cannot be written, with a clear message', () => {
    const ds = edgeDataset();
    expect(() => exportSav({ ...ds, variables: [] })).toThrow(/no variables/);
    const broken = edgeDataset();
    broken.nCases = 6;
    expect(() => exportSav(broken)).toThrow(/has 5 values but the dataset has 6 cases/);
  });
});

describe.skipIf(!HAS_ORACLE)('SPSS writer: pyreadstat reads our files identically (needs /opt/oracle/bin/python; skipped when absent)', () => {
  for (const mode of MODES) {
    it(`edge-case dataset, compression=${mode}`, () => {
      const ds = edgeDataset();
      const bytes = exportSav(ds, { compression: mode });
      const o = pyreadstatRead(bytes, mode === 'zsav' ? 'edge.zsav' : 'edge.sav');
      expectMatchesOracle({ ...ds, documents: EXPECTED_DOCS }, o, { columns: true });
      expect(o.file_encoding).toBe('UTF-8');
    });

    it(`edge-case dataset, big-endian, compression=${mode}`, () => {
      const ds = edgeDataset();
      const bytes = writeSav(ds, { compression: mode, bigEndian: true }).bytes;
      expectMatchesOracle({ ...ds, documents: EXPECTED_DOCS }, pyreadstatRead(bytes), { columns: true });
    });

    it(`zero-case dataset, compression=${mode}`, () => {
      const ds = emptyDataset();
      const o = pyreadstatRead(exportSav(ds, { compression: mode }));
      expectMatchesOracle({ ...ds, documents: EXPECTED_DOCS }, o, { columns: true });
    });

    it(`pyreadstat fixture re-written by Socius, compression=${mode}`, () => {
      const src = new Uint8Array(readFileSync(join(FIXTURES, 'main_bytecode.sav')));
      const ds = readSav(src).dataset;
      const expected = JSON.parse(readFileSync(join(FIXTURES, 'main_bytecode.json'), 'utf-8'));
      const o = pyreadstatRead(exportSav(ds, { compression: mode }));
      // Socius writes a measure level for every variable (SPSS always does), so compare to its own.
      expectMatchesOracle(ds, o, { columns: true, measure: false });
      expect(o.data).toEqual(expected.data);
    });
  }
});
