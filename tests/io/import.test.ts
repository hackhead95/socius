// importFile type detection (magic bytes first, then extension), friendly rejections, and codebookRows.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import { codebookRows, importFile } from '../../src/lib/io';
import { FIXTURES } from './helpers';

const enc = (s: string) => new TextEncoder().encode(s);
const fixture = (n: string) => new Uint8Array(readFileSync(join(FIXTURES, n)));

describe('importFile: detection', () => {
  it('detects SPSS files by their signature whatever the extension', async () => {
    const r = await importFile('download.dat', fixture('main_bytecode.sav'));
    expect(r.dataset.source?.kind).toBe('sav');
    expect(r.dataset.nCases).toBe(6);
    const z = await importFile('noext', fixture('main_zlib.zsav'));
    expect(z.dataset.source?.kind).toBe('zsav');
  });

  it('detects xlsx by its zip signature', async () => {
    const r = await importFile('export (1).bin.xlsx', fixture('workbook.xlsx'));
    expect(r.dataset.source?.kind).toBe('xlsx');
  });

  it('reads text files with unknown extensions as delimited text', async () => {
    const r = await importFile('data.export', enc('a,b\n1,2\n'));
    expect(r.dataset.source?.kind).toBe('csv');
  });

  it('names the alternative for formats it cannot read', async () => {
    const cases: Array<[string, Uint8Array, RegExp]> = [
      ['old.por', enc('ASCII SPSS PORT FILE'), /portable files \(\.por\).*save it as \.sav/],
      ['survey.dta', enc('<stata_dta><header>'), /Stata files \(\.dta\).*export CSV/],
      ['survey.bin', enc('<stata_dta><header>'), /Stata files/],
      ['data.sas7bdat', Uint8Array.from([0, 0, 0, 0, 1, 2, 3]), /SAS data files.*PROC EXPORT/],
      ['data.rds', Uint8Array.from([0x58, 0x0a, 0, 0, 0, 3]), /haven::write_sav/],
      ['legacy.xls', Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), /Save As.*\.xlsx/],
      ['sheet.ods', Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0, 0]), /OpenDocument/],
      ['data.csv.gz', Uint8Array.from([0x1f, 0x8b, 8, 0]), /gzip-compressed/],
      ['photo.png', Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]), /not recognised.*Supported files/],
      ['empty.csv', new Uint8Array(0), /is empty/],
      ['fake.sav', enc('id,name\n1,a\n'), /not a valid SPSS data file/],
      ['fake.xlsx', enc('id,name\n1,a\n'), /not a valid Excel workbook/],
      ['archive.zip.docx', Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0, 0]), /compressed \(zip\) file/],
    ];
    for (const [name, bytes, re] of cases) {
      await expect(importFile(name, bytes), name).rejects.toThrow(re);
    }
  });
});

describe('codebookRows', () => {
  it('lists every variable with its dictionary information', () => {
    const vars = [
      makeVariable({ name: 'gender', label: 'Gender', decimals: 0, width: 1, format: 'F1.0', measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }], missing: { discrete: [9] } }),
      makeVariable({ name: 'income', format: 'DOLLAR12.2', width: 12, missing: { discrete: [-1], range: { lo: -Infinity, hi: 0 } } }),
      makeVariable({ name: 'age', missing: { discrete: [], range: { lo: 100, hi: Infinity } } }),
      makeVariable({ name: 'when', format: 'DATE11', width: 11, decimals: 0 }),
      makeVariable({ name: 'city', type: 'string', width: 20, valueLabels: [{ value: 'KOL', label: 'Kolkata' }], missing: { discrete: ['NA', 'DK'] } }),
      makeVariable({ name: 'likert', measure: 'ordinal', format: 'F8.0', decimals: 0 }),
    ];
    const ds = makeDataset({ name: 'cb', variables: vars, columns: {}, nCases: 0 });
    const rows = codebookRows(ds);
    expect(rows[0]).toEqual({
      Position: '1', Name: 'gender', Label: 'Gender', Type: 'Numeric', Width: '1', Decimals: '0', Measure: 'Nominal',
      'Value labels': '1 = Male; 2 = Female', 'Missing values': '9', Format: 'F1.0',
    });
    expect(rows[1].Type).toBe('Dollar');
    expect(rows[1]['Missing values']).toBe('LO THRU 0, -1');
    expect(rows[2]['Missing values']).toBe('100 THRU HI');
    expect(rows[3].Type).toBe('Date');
    expect(rows[4]).toMatchObject({ Type: 'String', Width: '20', 'Value labels': 'KOL = Kolkata', 'Missing values': 'NA, DK', Format: 'A20', Measure: 'Nominal' });
    expect(rows[5].Measure).toBe('Ordinal');
    expect(Object.keys(rows[0])).toEqual(['Position', 'Name', 'Label', 'Type', 'Width', 'Decimals', 'Measure', 'Value labels', 'Missing values', 'Format']);
  });
});
