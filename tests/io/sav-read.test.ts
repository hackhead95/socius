// (1) Socius reads every pyreadstat-written fixture exactly as pyreadstat itself reads it.
// Runs without Python: the expected readings are committed JSON files next to the fixtures.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readSav } from '../../src/lib/io/sav-reader';
import { expectMatchesOracle, expectSpssioMatches, FIXTURES, type OracleDump, type SpssioDump } from './helpers';

const fixtures = readdirSync(FIXTURES).filter((f) => /\.z?sav$/.test(f)).sort();

function load(name: string) {
  const bytes = new Uint8Array(readFileSync(join(FIXTURES, name)));
  const expected = JSON.parse(readFileSync(join(FIXTURES, name.replace(/\.z?sav$/, '.json')), 'utf-8')) as OracleDump;
  return { bytes, expected };
}

describe('SPSS reader matches pyreadstat on committed fixtures', () => {
  it('has fixtures to test', () => {
    expect(fixtures.length).toBeGreaterThanOrEqual(9);
  });

  for (const name of fixtures) {
    it(`reads ${name}`, () => {
      const { bytes, expected } = load(name);
      const { dataset, warnings } = readSav(bytes, { fileName: name });
      expectMatchesOracle(dataset, expected, { columns: true });
      expect(dataset.source?.kind).toBe(name.endsWith('.zsav') ? 'zsav' : 'sav');
      expect(dataset.source?.encoding).toBe('utf-8');
      if (expected.weight_var) {
        const w = dataset.variables.find((v) => v.id === dataset.weightVarId);
        expect(w?.name).toBe(expected.weight_var);
      } else {
        expect(dataset.weightVarId).toBeNull();
      }
      if (name.startsWith('spss_io')) {
        // Written by IBM's SPSS I/O library with a multiple response set, which Socius skips.
        expect(warnings).toEqual([expect.stringMatching(/defines 1 multiple response set/)]);
      } else {
        // pyreadstat-written files are well formed: nothing to warn about.
        expect(warnings).toEqual([]);
      }
    });
  }

  it('reads the same dataset from uncompressed, bytecode and zlib files', () => {
    const a = readSav(load('main_uncompressed.sav').bytes).dataset;
    const b = readSav(load('main_bytecode.sav').bytes).dataset;
    const c = readSav(load('main_zlib.zsav').bytes).dataset;
    for (const other of [b, c]) {
      expect(other.nCases).toBe(a.nCases);
      a.variables.forEach((v, k) => {
        const w = other.variables[k];
        expect({ ...w, id: '' }).toEqual({ ...v, id: '' });
        expect(Array.from(other.columns[w.id] as ArrayLike<unknown>)).toEqual(Array.from(a.columns[v.id] as ArrayLike<unknown>));
      });
    }
  });

  it('keeps multi-byte characters split across very long string segments intact', () => {
    const ds = readSav(load('main_bytecode.sav').bytes).dataset;
    const v = ds.variables.find((x) => x.name === 's600')!;
    const col = ds.columns[v.id] as string[];
    expect(v.width).toBe(600);
    expect(col[0]).toBe('A'.repeat(255) + 'B'.repeat(255) + 'C'.repeat(90));
    expect(col[3]).toBe('x' + 'অ'.repeat(199));
  });

  it('maps SPSS dictionary details onto Socius variables', () => {
    const ds = readSav(load('main_zlib.zsav').bytes).dataset;
    const byName = Object.fromEntries(ds.variables.map((v) => [v.name, v]));
    expect(byName.income.missing.range).toEqual({ lo: -Infinity, hi: 0 });
    expect(byName.income.format).toBe('DOLLAR12.2');
    expect(byName.income.width).toBe(12);
    expect(byName.income.decimals).toBe(2);
    expect(byName.likert.measure).toBe('ordinal');
    expect(byName.likert.missing).toEqual({ discrete: [-1], range: { lo: 8, hi: 9 } });
    expect(byName.d.format).toBe('DATE11');
    expect(byName.ts.format).toBe('DATETIME20');
    expect(byName.t.format).toBe('TIME8');
    expect(byName.s1.align).toBe('left');
    expect(byName.id.align).toBe('right');
    expect(byName['বয়স'].label).toBe('বয়স (বছর)');
  });
});

describe('SPSS reader matches IBM SPSS I/O on files IBM SPSS I/O wrote', () => {
  for (const name of ['spss_io_bytecode.sav', 'spss_io_zlib.zsav']) {
    it(`reads ${name} (roles, attributes, display settings, weight, very long Bengali text)`, () => {
      const bytes = new Uint8Array(readFileSync(join(FIXTURES, name)));
      const expected = JSON.parse(readFileSync(join(FIXTURES, name.replace(/\.z?sav$/, '.spssio.json')), 'utf-8')) as SpssioDump;
      const { dataset } = readSav(bytes, { fileName: name });
      expectSpssioMatches(dataset, expected);
      const by = Object.fromEntries(dataset.variables.map((v) => [v.name, v]));
      expect(by.q1_a_long_variable_name.role).toBe('target');
      expect(by.wt.role).toBe('none');
      expect(by.income.attributes).toEqual({ Source: 'Q12' });
      expect(by.when.format).toBe('ADATE10');
      expect(by.essay.width).toBe(700);
    });
  }
});
