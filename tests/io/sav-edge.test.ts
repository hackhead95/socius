// Reader edge cases on hand-built files (see sav-builder.ts): byte order, legacy encodings,
// unknown case counts, display-record variants, extension records Socius skips.
import { describe, expect, it } from 'vitest';
import { readSav } from '../../src/lib/io/sav-reader';
import { buildSav, ext, ext32, fmt, valueLabels, W, type BuildOptions } from './sav-builder';

const LOWEST = (() => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setUint32(0, 0xffefffff);
  dv.setUint32(4, 0xfffffffe);
  return dv.getFloat64(0);
})();

function cp1252(s: string): Uint8Array {
  const map: Record<string, number> = { '€': 0x80, '’': 0x92, '“': 0x93, '”': 0x94 };
  return Uint8Array.from(Array.from(s, (c) => map[c] ?? c.charCodeAt(0)));
}

function sampleFile(le: boolean, compression: 0 | 1): Uint8Array {
  return buildSav({
    le,
    compression,
    fileLabel: 'Big-endian test',
    vars: [
      { name: 'ID', width: 0, format: fmt(5, 4, 0), label: 'Identifier' },
      { name: 'SCORE', width: 0, missing: { range: [LOWEST, 0], discrete: [99] } },
      { name: 'CITY', width: 12, label: 'City name', missing: { strings: [new TextEncoder().encode('none    ')] } },
      { name: 'WHEN', width: 0, format: fmt(20, 11, 0) },
    ],
    records: [
      valueLabels(le, [[1, 'One'], [99, 'Not asked']], [2]),
      ext32(le, 3, [1, 0, 0, -1, 1, 1, le ? 2 : 1, 65001]),
      ext32(le, 11, [3, 5, 1, 3, 8, 1, 1, 12, 0, 3, 11, 1]), // CITY spans 2 records but has 1 display entry
      ext(le, 13, 1, 'ID=id\tSCORE=score\tCITY=city\tWHEN=when'),
    ],
    cases: [
      [1, 1.5, 'Kolkata', 13797302400],
      [2, NaN, 'Dhaka', NaN],
      [300, 99, 'none', 0],
    ],
    weightIndex: 1,
  });
}

describe('reader: byte order', () => {
  for (const compression of [0, 1] as const) {
    it(`reads a hand-built big-endian file (compression ${compression}) the same as little-endian`, () => {
      const be = readSav(sampleFile(false, compression));
      const le = readSav(sampleFile(true, compression));
      expect(be.warnings).toEqual([]);
      for (const r of [be, le]) {
        const ds = r.dataset;
        expect(ds.fileLabel).toBe('Big-endian test');
        expect(ds.variables.map((v) => v.name)).toEqual(['id', 'score', 'city', 'when']);
        const [id, score, city, when] = ds.variables;
        expect(Array.from(ds.columns[id.id] as Float64Array)).toEqual([1, 2, 300]);
        expect(Array.from(ds.columns[score.id] as Float64Array)).toEqual([1.5, NaN, 99]);
        expect(ds.columns[city.id]).toEqual(['Kolkata', 'Dhaka', 'none']);
        expect(Array.from(ds.columns[when.id] as Float64Array)).toEqual([13797302400, NaN, 0]);
        expect(score.missing).toEqual({ discrete: [99], range: { lo: -Infinity, hi: 0 } });
        expect(score.valueLabels).toEqual([{ value: 1, label: 'One' }, { value: 99, label: 'Not asked' }]);
        expect(city.missing).toEqual({ discrete: ['none'] });
        expect(city.width).toBe(12);
        expect(id.format).toBe('F4.0');
        expect(when.format).toBe('DATE11');
        expect(id.measure).toBe('scale');
        expect(city.measure).toBe('nominal');
        expect(city.columns).toBe(12);
        expect(city.align).toBe('left');
        expect(ds.weightVarId).toBe(id.id);
      }
    });
  }

  it('rejects a file whose layout code fits neither byte order', () => {
    const bytes = buildSav({ vars: [{ name: 'X', width: 0 }], cases: [[1]], layoutCode: 77 });
    expect(() => readSav(bytes)).toThrow(/layout code/);
  });
});

describe('reader: text encodings', () => {
  const vars = (label: Uint8Array | string) => [
    { name: 'NAME', width: 16, label },
    { name: 'N', width: 0 },
  ];

  it('uses the code page from subtype 3 when there is no encoding record', () => {
    const bytes = buildSav({
      vars: vars(cp1252('Café “quoted”')),
      records: [ext32(true, 3, [1, 0, 0, -1, 1, 1, 2, 1252])],
      cases: [[cp1252('Crème brûlée'), 1], [cp1252('Price €5'), 2]],
    });
    const { dataset, warnings } = readSav(bytes);
    expect(warnings).toEqual([]);
    expect(dataset.source?.encoding).toBe('windows-1252');
    expect(dataset.variables[0].label).toBe('Café “quoted”');
    expect(dataset.columns[dataset.variables[0].id]).toEqual(['Crème brûlée', 'Price €5']);
  });

  it('prefers the subtype 20 encoding name (Cyrillic windows-1251)', () => {
    const cyr = new TextDecoder('windows-1251');
    const bytes1251 = Uint8Array.from([0xcf, 0xf0, 0xe8, 0xe2, 0xe5, 0xf2]); // Привет
    const bytes = buildSav({
      vars: vars('Greeting'),
      records: [ext32(true, 3, [1, 0, 0, -1, 1, 1, 2, 1252]), ext(true, 20, 1, 'windows-1251')],
      cases: [[bytes1251, 1]],
    });
    const { dataset } = readSav(bytes);
    expect(dataset.columns[dataset.variables[0].id]).toEqual([cyr.decode(bytes1251)]);
    expect(dataset.source?.encoding).toBe('windows-1251');
  });

  it('decodes Shift_JIS files (code page 932)', () => {
    const sjis = Uint8Array.from([0x93, 0xfa, 0x96, 0x7b]); // 日本
    const bytes = buildSav({ vars: vars('x'), records: [ext32(true, 3, [1, 0, 0, -1, 1, 1, 2, 932])], cases: [[sjis, 1]] });
    const { dataset } = readSav(bytes);
    expect(dataset.columns[dataset.variables[0].id]).toEqual(['日本']);
    expect(dataset.source?.encoding).toBe('shift_jis');
  });

  it('guesses windows-1252 from a non-UTF-8 dictionary and says so', () => {
    const bytes = buildSav({ vars: vars(cp1252('Réponse')), cases: [[cp1252('déjà vu'), 1]] });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.variables[0].label).toBe('Réponse');
    expect(dataset.columns[dataset.variables[0].id]).toEqual(['déjà vu']);
    expect(warnings.join(' ')).toMatch(/Windows-1252/);
  });

  it('guesses UTF-8 from a valid UTF-8 dictionary', () => {
    const bytes = buildSav({ vars: vars('উত্তরদাতা'), cases: [['নাম', 1]] });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.variables[0].label).toBe('উত্তরদাতা');
    expect(dataset.columns[dataset.variables[0].id]).toEqual(['নাম']);
    expect(warnings.join(' ')).toMatch(/read as UTF-8/);
  });

  it('re-reads string data as windows-1252 when an ASCII dictionary hides non-UTF-8 data', () => {
    const bytes = buildSav({ vars: vars('plain'), cases: [['ok', 1], [cp1252('naïve'), 2]] });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.columns[dataset.variables[0].id]).toEqual(['ok', 'naïve']);
    expect(dataset.source?.encoding).toBe('windows-1252');
    expect(warnings.join(' ')).toMatch(/Windows-1252/);
  });

  it('honours the encoding override when the file names no encoding', () => {
    const bytes1251 = Uint8Array.from([0xc4, 0xe0]); // Да
    const bytes = buildSav({ vars: vars('x'), records: [ext32(true, 3, [1, 0, 0, -1, 1, 1, 2, 2])], cases: [[bytes1251, 1]] });
    const { dataset } = readSav(bytes, { encoding: 'cp1251' });
    expect(dataset.columns[dataset.variables[0].id]).toEqual(['Да']);
    expect(() => readSav(bytes, { encoding: 'no-such-encoding' })).toThrow(/not supported/);
  });
});

describe('reader: case counts and trailing data', () => {
  const base: BuildOptions = {
    vars: [{ name: 'A', width: 0 }, { name: 'S', width: 8 }],
    cases: [[1, 'x'], [2, 'y'], [3, 'z']],
  };

  it('counts cases when the header says -1 (uncompressed) and drops an incomplete last case', () => {
    const bytes = buildSav({ ...base, nCases: -1, trailer: new Uint8Array(5) });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.nCases).toBe(3);
    expect(warnings.join(' ')).toMatch(/incomplete case/);
  });

  it('counts cases when the header says -1 (bytecode)', () => {
    const { dataset, warnings } = readSav(buildSav({ ...base, nCases: -1, compression: 1 }));
    expect(dataset.nCases).toBe(3);
    expect(warnings).toEqual([]);
    expect(dataset.columns[dataset.variables[1].id]).toEqual(['x', 'y', 'z']);
  });

  it('uses the 64-bit case count record when the header says -1', () => {
    const body = new W(true).i32(1).i32(0).i32(2).i32(0).bytes(); // int64 1, int64 2
    const { dataset } = readSav(buildSav({ ...base, nCases: -1, compression: 1, records: [ext(true, 16, 8, body)] }));
    expect(dataset.nCases).toBe(2);
  });

  it('ignores garbage after the declared cases', () => {
    const trailer = Uint8Array.from({ length: 300 }, (_, i) => (i * 37) % 256);
    for (const compression of [0, 1] as const) {
      const { dataset } = readSav(buildSav({ ...base, compression, trailer }));
      expect(dataset.nCases).toBe(3);
      expect(Array.from(dataset.columns[dataset.variables[0].id] as Float64Array)).toEqual([1, 2, 3]);
    }
  });

  it('reads a file with variables but no cases', () => {
    const { dataset } = readSav(buildSav({ ...base, cases: [] }));
    expect(dataset.nCases).toBe(0);
    expect((dataset.columns[dataset.variables[0].id] as Float64Array).length).toBe(0);
  });
});

describe('reader: dictionary records', () => {
  it('reads the 2-value display record form (measure, alignment)', () => {
    const bytes = buildSav({
      vars: [{ name: 'A', width: 0 }, { name: 'B', width: 0 }],
      records: [ext32(true, 11, [2, 2, 1, 0])],
      cases: [[1, 2]],
    });
    const [a, b] = readSav(bytes).dataset.variables;
    expect([a.measure, a.align, b.measure, b.align]).toEqual(['ordinal', 'center', 'nominal', 'left']);
  });

  it('skips unknown and unused extension records, and reports multiple response sets', () => {
    const bytes = buildSav({
      vars: [{ name: 'Q1A', width: 0 }, { name: 'Q1B', width: 0 }],
      records: [
        ext(true, 99, 1, 'whatever bytes'),
        ext(true, 24, 1, '<xml>ignored</xml>'),
        ext(true, 10, 1, 'extra product info'),
        ext(true, 5, 1, 'SET1= Q1A Q1B'),
        ext(true, 17, 1, "Origin('survey'\n)"),
        ext(true, 7, 1, '$q1=C 10 Brand use Q1A Q1B\n'),
        new W(true).i32(6).i32(1).raw('A document line.', 80).bytes(),
      ],
      cases: [[1, 0]],
    });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.variables.map((v) => v.name)).toEqual(['Q1A', 'Q1B']);
    expect(dataset.documents).toEqual(['A document line.']);
    expect(warnings.join(' ')).toMatch(/1 multiple response set/);
  });

  it('reads variable attributes and SPSS roles (subtype 18)', () => {
    const bytes = buildSav({
      vars: [{ name: 'A', width: 0 }, { name: 'LONGNAME', width: 0 }],
      records: [
        ext(true, 13, 1, 'A=age\tLONGNAME=income_household'),
        ext(true, 18, 1, "age:$@Role('1'\n)Source('Q12'\n)/income_household:Note('first'\n'second'\n)$@Role('3'\n)"),
      ],
      cases: [[30, 1000]],
    });
    const [age, inc] = readSav(bytes).dataset.variables;
    expect(age.name).toBe('age');
    expect(age.role).toBe('target');
    expect(age.attributes).toEqual({ Source: 'Q12' });
    expect(inc.role).toBe('none');
    expect(inc.attributes).toEqual({ 'Note[1]': 'first', 'Note[2]': 'second' });
  });

  it('applies one value label record to several variables and handles string labels', () => {
    const bytes = buildSav({
      vars: [{ name: 'Q1', width: 0 }, { name: 'Q2', width: 0 }, { name: 'SEX', width: 1 }],
      records: [valueLabels(true, [[1, 'Yes'], [2, 'No']], [1, 2]), valueLabels(true, [['m', 'Male'], ['f', 'Female']], [3])],
      cases: [[1, 2, 'm']],
    });
    const [q1, q2, sex] = readSav(bytes).dataset.variables;
    expect(q1.valueLabels).toEqual(q2.valueLabels);
    expect(q1.valueLabels.length).toBe(2);
    expect(sex.valueLabels).toEqual([{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }]);
    expect(q1.measure).toBe('nominal'); // labelled numeric without a display record
  });

  it('makes duplicate long names unique', () => {
    const bytes = buildSav({
      vars: [{ name: 'A', width: 0 }, { name: 'B', width: 0 }],
      records: [ext(true, 13, 1, 'A=score\tB=SCORE')],
      cases: [[1, 2]],
    });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.variables.map((v) => v.name)).toEqual(['score', 'SCORE_1']);
    expect(warnings.join(' ')).toMatch(/appeared twice/);
  });

  it('warns when the weight variable is a string', () => {
    const bytes = buildSav({ vars: [{ name: 'S', width: 4 }], cases: [['a']], weightIndex: 1 });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.weightVarId).toBeNull();
    expect(warnings.join(' ')).toMatch(/weight variable/);
  });

  it('falls back to F format for an unknown format code and says so', () => {
    const bytes = buildSav({ vars: [{ name: 'X', width: 0, format: fmt(99, 8, 2) }], cases: [[1]] });
    const { dataset, warnings } = readSav(bytes);
    expect(dataset.variables[0].format).toBe('F8.2');
    expect(warnings.join(' ')).toMatch(/Variable X had an unrecognised display format/);
  });
});
