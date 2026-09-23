// Delimited text import/export. pandas is the oracle for parsing where Python is available.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import { exportCsv, importFile } from '../../src/lib/io';
import { detectDelimiter, parseDelimited } from '../../src/lib/io/csv';
import { HAS_ORACLE, PYTHON, tempPath } from './helpers';

const enc = (s: string) => new TextEncoder().encode(s);
const col = (r: Awaited<ReturnType<typeof importFile>>, name: string) => {
  const v = r.dataset.variables.find((x) => x.name === name);
  if (!v) throw new Error(`no variable ${name} in ${r.dataset.variables.map((x) => x.name).join(',')}`);
  return { v, data: Array.from(r.dataset.columns[v.id] as ArrayLike<number | string>) };
};

const TRICKY = [
  'id,text,"quoted, header"',
  '1,plain,"with, comma"',
  '2,"multi\nline\r\nfield","say ""hi"""',
  '3,,"trailing space "',
  '',
  '4,"",x',
  '5,é ü ß,"বাংলা, हिन्दी"',
].join('\r\n');

describe('CSV parsing', () => {
  it('follows RFC 4180: quotes, doubled quotes, embedded delimiters and line breaks', () => {
    const { rows, unterminatedQuote } = parseDelimited(TRICKY, ',');
    expect(unterminatedQuote).toBe(false);
    expect(rows).toEqual([
      ['id', 'text', 'quoted, header'],
      ['1', 'plain', 'with, comma'],
      ['2', 'multi\nline\r\nfield', 'say "hi"'],
      ['3', '', 'trailing space '],
      ['4', '', 'x'],
      ['5', 'é ü ß', 'বাংলা, हिन्दी'],
    ]);
  });

  it('handles CR-only line endings, a trailing delimiter and no final newline', () => {
    expect(parseDelimited('a;b\r1;\r2;3', ';').rows).toEqual([['a', 'b'], ['1', ''], ['2', '3']]);
  });

  it('flags an unterminated quote', () => {
    const r = parseDelimited('a,b\n1,"never closed\n2,3\n', ',');
    expect(r.unterminatedQuote).toBe(true);
    expect(r.rows[1]).toEqual(['1', 'never closed\n2,3\n']);
  });

  it('detects comma, semicolon, tab and pipe delimiters', () => {
    expect(detectDelimiter('a,b,c\n1,2,3\n4,5,6\n')).toBe(',');
    expect(detectDelimiter('name;score\nAsha;1,5\nBikram;2,25\n')).toBe(';');
    expect(detectDelimiter('a\tb\tc\n1\t2,5\t3\n')).toBe('\t');
    expect(detectDelimiter('a|b\n1|2\n')).toBe('|');
    expect(detectDelimiter('"x, y";z\n"1,2";3\n')).toBe(';');
  });

  it.skipIf(!HAS_ORACLE)('parses a tricky file exactly like pandas (oracle; skipped without Python)', () => {
    const p = tempPath('tricky.csv');
    writeFileSync(p, TRICKY);
    const script = `import pandas as pd, json, sys
df = pd.read_csv(sys.argv[1], dtype=str, keep_default_na=False)
print(json.dumps([list(df.columns)] + df.values.tolist(), ensure_ascii=False))`;
    const out = JSON.parse(execFileSync(PYTHON, ['-c', script, p], { encoding: 'utf-8' }));
    expect(parseDelimited(TRICKY, ',').rows).toEqual(out);
  });
});

describe('CSV import', () => {
  it('infers numeric, string, date and datetime columns', async () => {
    const text = [
      'id,score,city,when,stamp,missing_mix,big',
      '1,3.5,Kolkata,2021-03-04,2021-03-04 09:30:00,NA,1234567890',
      '2,,দিল্লি,1999-12-31,2000-01-01T00:00:01,N/A,-5',
      '3,10.125,Dhaka,,,.,0',
      '4,-2,x,2024-02-29,2024-02-29 23:59:59,null,1e3',
    ].join('\n');
    const r = await importFile('survey.csv', enc(text));
    expect(r.warnings).toEqual([]);
    expect(r.dataset.name).toBe('survey');
    expect(r.dataset.source).toEqual({ kind: 'csv', fileName: 'survey.csv', encoding: 'utf-8' });
    const score = col(r, 'score');
    expect(score.v.type).toBe('numeric');
    expect(score.v.decimals).toBe(3);
    expect(score.v.format).toBe('F8.3');
    expect(score.data).toEqual([3.5, NaN, 10.125, -2]);
    const city = col(r, 'city');
    expect(city.v.type).toBe('string');
    expect(city.v.width).toBe(new TextEncoder().encode('দিল্লি').length);
    expect(city.v.measure).toBe('nominal');
    const when = col(r, 'when');
    expect(when.v.format).toBe('DATE11');
    expect(when.data).toEqual([13834195200, 13165977600, NaN, 13928544000]);
    const stamp = col(r, 'stamp');
    expect(stamp.v.format).toBe('DATETIME20');
    expect(stamp.data).toEqual([13834229400, 13166064001, NaN, 13928630399]);
    expect(col(r, 'missing_mix').data.every((x) => Number.isNaN(x))).toBe(true);
    const big = col(r, 'big');
    expect(big.data).toEqual([1234567890, -5, 0, 1000]);
    expect(big.v.width).toBe(10);
  });

  it('chooses measurement levels from the values', async () => {
    const rows = ['gender,likert,age,income'];
    for (let i = 0; i < 40; i++) rows.push(`${(i % 2) + 1},${(i % 5) + 1},${18 + i},${(1000 + i * 37.5).toFixed(2)}`);
    const r = await importFile('m.csv', enc(rows.join('\n')));
    expect(col(r, 'gender').v.measure).toBe('nominal');
    expect(col(r, 'likert').v.measure).toBe('ordinal');
    expect(col(r, 'age').v.measure).toBe('scale');
    expect(col(r, 'income').v.measure).toBe('scale');
  });

  it('makes valid unique names and keeps the original header as the label', async () => {
    const r = await importFile('n.csv', enc('Age (years),age,,2nd wave,মোট আয়,বয়স\n1,2,3,4,5,6\n'));
    const names = r.dataset.variables.map((v) => v.name);
    expect(names).toEqual(['Age_years', 'age', 'VAR00003', 'nd_wave', 'মোট_আয়', 'বয়স']);
    expect(r.dataset.variables.map((v) => v.label)).toEqual(['Age (years)', '', '', '2nd wave', 'মোট আয়', '']);
    expect(r.warnings.join(' ')).toMatch(/3 column name\(s\) were not valid/);
  });

  it('makes duplicate headers unique', async () => {
    const r = await importFile('d.csv', enc('x,x,X\n1,2,3\n'));
    expect(r.dataset.variables.map((v) => v.name)).toEqual(['x', 'x_1', 'X_2']);
  });

  it('reads files without a header row', async () => {
    const r = await importFile('h.csv', enc('1,a\n2,b\n'), { header: false });
    expect(r.dataset.variables.map((v) => v.name)).toEqual(['VAR00001', 'VAR00002']);
    expect(r.dataset.nCases).toBe(2);
  });

  it('strips a UTF-8 BOM and reads semicolon files with decimal commas', async () => {
    const r = await importFile('eu.csv', enc('﻿name;score\nAsha;1,5\nBikram;2,25\n'));
    expect(r.dataset.variables[0].name).toBe('name');
    expect(col(r, 'score').data).toEqual([1.5, 2.25]);
  });

  it('keeps comma numbers as text outside semicolon files (they may be thousands separators)', async () => {
    const r = await importFile('t.tsv', enc('n\tm\n1,500\t2\n2,250\t3\n'));
    expect(col(r, 'n').v.type).toBe('string');
    expect(col(r, 'n').data).toEqual(['1,500', '2,250']);
  });

  it('falls back to windows-1252 for invalid UTF-8, and honours an encoding override', async () => {
    const bytes = Uint8Array.from([...enc('name\n'), 0x43, 0x72, 0xe8, 0x6d, 0x65, 0x0a]); // Crème in cp1252
    const r = await importFile('w.csv', bytes);
    expect(col(r, 'name').data).toEqual(['Crème']);
    expect(r.warnings.join(' ')).toMatch(/Windows-1252/);
    const r2 = await importFile('w.csv', Uint8Array.from([...enc('n\n'), 0xc4, 0xe0, 0x0a]), { encoding: 'windows-1251' });
    expect(col(r2, 'n').data).toEqual(['Да']);
  });

  it('reads tab-separated .tsv and a delimiter override', async () => {
    const r = await importFile('t.tsv', enc('a\tb\n1\thello, world\n'));
    expect(col(r, 'b').data).toEqual(['hello, world']);
    const r2 = await importFile('p.txt', enc('a|b\n1|2\n'), { delimiter: '|' });
    expect(col(r2, 'b').data).toEqual([2]);
  });

  it('pads short rows and warns', async () => {
    const r = await importFile('r.csv', enc('a,b,c\n1,2\n3,4,5\n'));
    expect(col(r, 'c').data).toEqual([NaN, 5]);
    expect(r.warnings.join(' ')).toMatch(/1 row\(s\) had a different number of fields/);
  });

  it('rejects a file with no data', async () => {
    await expect(importFile('e.csv', enc('\n\n  \n'))).rejects.toThrow(/contains no data/);
  });
});

describe('CSV export', () => {
  function sample() {
    const g = makeVariable({ name: 'gender', type: 'numeric', decimals: 0, valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }] });
    const s = makeVariable({ name: 'comment', type: 'string', width: 40 });
    const d = makeVariable({ name: 'when', type: 'numeric', format: 'DATE11', width: 11, decimals: 0 });
    const t = makeVariable({ name: 'stamp', type: 'numeric', format: 'DATETIME20', width: 20, decimals: 0 });
    const x = makeVariable({ name: 'x', type: 'numeric' });
    return makeDataset({
      name: 's',
      variables: [g, s, d, t, x],
      columns: {
        [g.id]: Float64Array.from([1, 2, NaN]),
        [s.id]: ['plain', 'has "quotes", commas\nand lines', ' padded'],
        [d.id]: Float64Array.from([13834195200, NaN, 0]),
        [t.id]: Float64Array.from([13834229400.5, 13166064001, NaN]),
        [x.id]: Float64Array.from([0.1 + 0.2, -1e-7, 1e21]),
      },
      nCases: 3,
    });
  }

  it('writes codes with RFC 4180 quoting, ISO dates and empty system-missing cells', () => {
    expect(exportCsv(sample())).toBe(
      [
        'gender,comment,when,stamp,x',
        '1,plain,2021-03-04,2021-03-04 09:30:00.5,0.30000000000000004',
        '2,"has ""quotes"", commas\nand lines",,2000-01-01 00:00:01,-1e-7',
        ',\" padded\",1582-10-14,,1e+21',
        '',
      ].join('\r\n'),
    );
  });

  it('writes value labels when asked, with another delimiter and a BOM', () => {
    const out = exportCsv(sample(), { values: 'labels', delimiter: ';', bom: true });
    expect(out.startsWith('﻿gender;comment')).toBe(true);
    expect(out.split('\r\n')[1].startsWith('Male;plain;')).toBe(true);
    expect(out.split('\r\n')[2].startsWith('Female;')).toBe(true);
  });

  it('round trips through import', async () => {
    const ds = sample();
    const back = await importFile('rt.csv', enc(exportCsv(ds)));
    const by = Object.fromEntries(back.dataset.variables.map((v) => [v.name, Array.from(back.dataset.columns[v.id] as ArrayLike<unknown>)]));
    expect(by.gender).toEqual([1, 2, NaN]);
    expect(by.comment).toEqual(['plain', 'has "quotes", commas\nand lines', ' padded']);
    expect(by.when).toEqual([13834195200, NaN, 0]);
    expect(by.stamp).toEqual([13834229400.5, 13166064001, NaN]);
    expect(by.x).toEqual([0.1 + 0.2, -1e-7, 1e21]);
  });

  it.skipIf(!HAS_ORACLE)('pandas reads the exported CSV identically (oracle; skipped without Python)', () => {
    const p = tempPath('export.csv');
    writeFileSync(p, exportCsv(sample()));
    const script = `import pandas as pd, json, sys, math
df = pd.read_csv(sys.argv[1], keep_default_na=False, na_values=[''], float_precision='round_trip', dtype={'comment': str, 'when': str, 'stamp': str})
rows = df.astype(object).where(df.notna(), None).values.tolist()
print(json.dumps(rows, ensure_ascii=False))`;
    const out = JSON.parse(execFileSync(PYTHON, ['-c', script, p], { encoding: 'utf-8' }));
    expect(out).toEqual([
      [1, 'plain', '2021-03-04', '2021-03-04 09:30:00.5', 0.30000000000000004],
      [2, 'has "quotes", commas\nand lines', null, '2000-01-01 00:00:01', -1e-7],
      [null, ' padded', '1582-10-14', null, 1e21],
    ]);
  });
});
