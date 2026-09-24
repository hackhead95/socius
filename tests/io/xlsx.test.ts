// Excel import (fixture written by openpyxl in scripts/fixtures/make_fixtures.py) and export
// (checked by reading it back, and by openpyxl when Python is available).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable } from '../../src/core/types';
import { exportXlsx, importFile, listXlsxSheets } from '../../src/lib/io';
import { parseMissingText, parseValueLabelsText } from '../../src/lib/io/xlsx';
import { FIXTURES, HAS_ORACLE, PYTHON, tempPath } from './helpers';

const workbook = () => new Uint8Array(readFileSync(join(FIXTURES, 'workbook.xlsx')));
type R = Awaited<ReturnType<typeof importFile>>;
const col = (r: R, name: string) => {
  const v = r.dataset.variables.find((x) => x.name === name)!;
  return { v, data: Array.from(r.dataset.columns[v.id] as ArrayLike<number | string>) };
};

describe('XLSX import', () => {
  it('reads the first sheet with Excel types mapped to SPSS types', async () => {
    const r = await importFile('workbook.xlsx', workbook());
    expect(r.dataset.name).toBe('workbook');
    expect(r.dataset.source?.kind).toBe('xlsx');
    expect(r.dataset.nCases).toBe(4);
    expect(r.warnings.join(' ')).toMatch(/2 sheets; the first one \("Survey"\) was imported/);
    expect(col(r, 'id').data).toEqual([1, 2, 3, 4]);
    expect(col(r, 'name').data).toEqual(['Asha', 'Bikram', 'Chandra', 'দীপা']);
    expect(col(r, 'score').data).toEqual([3.5, NaN, 10, -2.25]);
    expect(col(r, 'score').v.decimals).toBe(2);
    const joined = col(r, 'joined');
    expect(joined.v.format).toBe('DATE11');
    expect(joined.data).toEqual([13834195200, 13165977600, NaN, 13928544000]);
    const started = col(r, 'started');
    expect(started.v.format).toBe('DATETIME20');
    expect(started.data).toEqual([13834229400, 13166064001, NaN, 13928630399]);
    const duration = col(r, 'duration');
    expect(duration.v.format).toBe('TIME8');
    expect(duration.data).toEqual([2700, 3723, NaN, 43200]);
    const agree = col(r, 'agree');
    expect(agree.data).toEqual([1, 0, 1, NaN]);
    expect(agree.v.valueLabels).toEqual([{ value: 0, label: 'FALSE' }, { value: 1, label: 'TRUE' }]);
    expect(agree.v.measure).toBe('nominal');
    const notes = col(r, 'notes');
    expect(notes.v.type).toBe('string');
    expect(notes.data).toEqual(['12', 'see note', '', '7.5']);
    const age = col(r, 'Age_years');
    expect(age.v.label).toBe('Age (years)');
    expect(col(r, 'বয়স').data).toEqual([20, 21, 22, 23]);
    expect(col(r, 'empty').data.every((x) => Number.isNaN(x))).toBe(true);
  });

  it('selects a sheet by name or 0-based index and lists sheets', async () => {
    expect(await listXlsxSheets(workbook())).toEqual(['Survey', 'Codes']);
    for (const sheet of ['Codes', 'codes', 1] as const) {
      const r = await importFile('workbook.xlsx', workbook(), { sheet });
      expect(r.dataset.variables.map((v) => v.name)).toEqual(['code', 'meaning']);
      expect(r.dataset.name).toBe('workbook - Codes');
      expect(r.warnings).toEqual([]);
    }
    await expect(importFile('workbook.xlsx', workbook(), { sheet: 'Nope' })).rejects.toThrow(/no sheet named "Nope". Its sheets are: Survey, Codes/);
    await expect(importFile('workbook.xlsx', workbook(), { sheet: 5 })).rejects.toThrow(/sheet number 6 does not exist/);
  });

  it('reads without a header row when asked', async () => {
    const r = await importFile('workbook.xlsx', workbook(), { sheet: 'Codes', header: false });
    expect(r.dataset.nCases).toBe(3);
    expect(r.dataset.variables[1].name).toBe('VAR00002');
  });

  it('reports a damaged workbook clearly', async () => {
    const bad = workbook().slice(0, 300);
    await expect(importFile('broken.xlsx', bad)).rejects.toThrow(/could not be read/);
  });
});

function exportSample() {
  const g = makeVariable({ name: 'gender', type: 'numeric', decimals: 0, label: 'Gender', measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }], missing: { discrete: [9] } });
  const s = makeVariable({ name: 'comment', type: 'string', width: 30, label: 'Comment' });
  const d = makeVariable({ name: 'when', type: 'numeric', format: 'DATE11', width: 11, decimals: 0 });
  const t = makeVariable({ name: 'dur', type: 'numeric', format: 'TIME8', width: 8, decimals: 0 });
  const x = makeVariable({ name: 'income', type: 'numeric', missing: { discrete: [], range: { lo: -Infinity, hi: 0 } } });
  return makeDataset({
    name: 'x',
    variables: [g, s, d, t, x],
    columns: {
      [g.id]: Float64Array.from([1, 2, 9]),
      [s.id]: ['plain', 'বাংলা লেখা', ''],
      [d.id]: Float64Array.from([13834195200, NaN, 13928544000]),
      [t.id]: Float64Array.from([2700, 3723, NaN]),
      [x.id]: Float64Array.from([1500.25, NaN, -1]),
    },
    nCases: 3,
  });
}

describe('XLSX export', () => {
  it('writes a Data sheet that imports back to the same values', async () => {
    const blob = await exportXlsx(exportSample());
    expect(blob.type).toContain('spreadsheetml');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(await listXlsxSheets(bytes)).toEqual(['Data', 'Variables']);
    const r = await importFile('x.xlsx', bytes);
    expect(col(r, 'gender').data).toEqual([1, 2, 9]);
    expect(col(r, 'comment').data).toEqual(['plain', 'বাংলা লেখা', '']);
    expect(col(r, 'when').data).toEqual([13834195200, NaN, 13928544000]);
    expect(col(r, 'when').v.format).toBe('DATE11');
    expect(col(r, 'dur').data).toEqual([2700, 3723, NaN]);
    expect(col(r, 'income').data).toEqual([1500.25, NaN, -1]);
    // The Variables sheet brings the dictionary back: labels, value labels, missing values, measure.
    const g = col(r, 'gender').v;
    expect(g.label).toBe('Gender');
    expect(g.valueLabels).toEqual([{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }]);
    expect(g.missing).toEqual({ discrete: [9] });
    expect(g.measure).toBe('nominal');
    expect(col(r, 'income').v.missing).toEqual({ discrete: [], range: { lo: -Infinity, hi: 0 } });
    expect(col(r, 'comment').v.label).toBe('Comment');
    expect(r.warnings.join(' ')).toMatch(/restored from the "Variables" sheet/);
  });

  it('parses codebook text back into value labels and missing values', () => {
    expect(parseValueLabelsText('1 = Yes; 2 = No; 3 = Maybe; or not', 'numeric')).toEqual([{ value: 1, label: 'Yes' }, { value: 2, label: 'No' }, { value: 3, label: 'Maybe; or not' }]);
    expect(parseValueLabelsText('KOL = Kolkata; DEL = Delhi', 'string')).toEqual([{ value: 'KOL', label: 'Kolkata' }, { value: 'DEL', label: 'Delhi' }]);
    expect(parseMissingText('90 THRU HI, -1', 'numeric')).toEqual({ discrete: [-1], range: { lo: 90, hi: Infinity } });
    expect(parseMissingText('LO THRU 0', 'numeric')).toEqual({ discrete: [], range: { lo: -Infinity, hi: 0 } });
    expect(parseMissingText('8, 9', 'numeric')).toEqual({ discrete: [8, 9] });
    expect(parseMissingText('NA, DK', 'string')).toEqual({ discrete: ['NA', 'DK'] });
    expect(parseMissingText('oops', 'numeric')).toBeNull();
  });

  it('writes labels instead of codes when asked, and a codebook sheet', async () => {
    const bytes = new Uint8Array(await (await exportXlsx(exportSample(), { values: 'labels' })).arrayBuffer());
    const r = await importFile('x.xlsx', bytes);
    // The Variables sheet is authoritative: gender is numeric there, so the label texts become codes again.
    expect(col(r, 'gender').data).toEqual([1, 2, 9]);
    expect(col(r, 'gender').v.valueLabels).toEqual([{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }]);
    expect(col(r, 'gender').v.missing).toEqual({ discrete: [9] });
    const book = await importFile('x.xlsx', bytes, { sheet: 'Variables' });
    const names = col(book, 'Name').data;
    expect(names).toEqual(['gender', 'comment', 'when', 'dur', 'income']);
    expect(col(book, 'Value_labels').data[0]).toBe('1 = Male; 2 = Female');
    expect(col(book, 'Missing_values').data).toEqual(['9', '', '', '', 'LO THRU 0']);
  });

  it.skipIf(!HAS_ORACLE)('openpyxl reads the exported workbook (oracle; skipped without Python)', async () => {
    const bytes = new Uint8Array(await (await exportXlsx(exportSample())).arrayBuffer());
    const p = tempPath('export.xlsx');
    writeFileSync(p, bytes);
    const script = `import openpyxl, json, sys, datetime
wb = openpyxl.load_workbook(sys.argv[1])
def cv(v):
    if isinstance(v, datetime.datetime): return v.isoformat()
    if isinstance(v, datetime.time): return v.isoformat()
    if isinstance(v, datetime.timedelta): return v.total_seconds()
    return v
out = {ws.title: [[cv(c.value) for c in row] for row in ws.iter_rows()] for ws in wb.worksheets}
out['formats'] = [c.number_format for c in wb['Data'][2]]
print(json.dumps(out, ensure_ascii=False))`;
    const out = JSON.parse(execFileSync(PYTHON, ['-W', 'ignore', '-c', script, p], { encoding: 'utf-8' }));
    expect(out.Data[0]).toEqual(['gender', 'comment', 'when', 'dur', 'income']);
    expect(out.Data[1][0]).toBe(1);
    expect(out.Data[1][1]).toBe('plain');
    expect(out.Data[1][2]).toBe('2021-03-04T00:00:00');
    expect(out.Data[1][3]).toBeCloseTo(2700, 6); // openpyxl turns [h]:mm:ss cells into durations
    expect(out.Data[2][1]).toBe('বাংলা লেখা');
    expect(out.Data[2][2]).toBeNull();
    expect(out.Data[3][4]).toBe(-1);
    expect(out.formats[2]).toBe('yyyy-mm-dd');
    expect(out.formats[3]).toBe('[h]:mm:ss');
    expect(out.Variables[0]).toEqual(['Position', 'Name', 'Label', 'Type', 'Width', 'Decimals', 'Measure', 'Value labels', 'Missing values', 'Format']);
    expect(out.Variables[1]).toEqual([1, 'gender', 'Gender', 'Numeric', 8, 0, 'Nominal', '1 = Male; 2 = Female', '9', 'F8.0']);
    expect(out.Variables[3][3]).toBe('Date');
  });
});
