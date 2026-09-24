// Excel round trips of the dictionary (FZ-10, FZ-17) and CSV/Excel type inference with its warning
// and "Keep as text" (FZ-18, intended with warning). See docs/qa/FUZZ-FINDINGS.md.
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeDataset, makeVariable, type Dataset, type Variable } from '../../src/core/types';
import { codebookRows, exportCsv, exportXlsx, importFile } from '../../src/lib/io';
import { quoteValue } from '../../src/lib/io/codebook';
import { conversionWarning } from '../../src/lib/io/infer';
import { parseMissingText, parseValueLabelsText } from '../../src/lib/io/xlsx';
import { HAS_ORACLE, PYTHON, tempPath } from './helpers';

const enc = (s: string) => new TextEncoder().encode(s);
function one(v: Variable, values: Array<number | string>): Dataset {
  return makeDataset({ name: 'rt', variables: [v], columns: { [v.id]: v.type === 'string' ? (values as string[]) : Float64Array.from(values as number[]) }, nCases: values.length });
}
async function xlsxRoundTrip(d: Dataset, values: 'codes' | 'labels' = 'codes') {
  return importFile('rt.xlsx', new Uint8Array(await (await exportXlsx(d, { values })).arrayBuffer()));
}

/** String values that broke the old unquoted "a, b" codebook text. */
const TRICKY = ['DK', '', 'a, b', "it's", '"q"', 'x; y', 'k = v', 'না', '  lead', "''", ','];

describe('FZ-10: string missing values and value labels survive the codebook text', () => {
  it('quotes string values SPSS-style', () => {
    expect(quoteValue("it's")).toBe("'it''s'");
    expect(quoteValue('pad   ')).toBe("'pad'");
    const v = makeVariable({ name: 's', type: 'string', width: 8, missing: { discrete: ['DK', ''] }, valueLabels: [{ value: '', label: 'No answer' }, { value: 'a; b', label: 'Both; either' }] });
    const row = codebookRows(one(v, ['x']))[0];
    expect(row['Missing values']).toBe("'DK', ''");
    expect(row['Value labels']).toBe("'' = No answer; 'a; b' = Both; either");
  });
  it('parses every tricky value back (missing values, three at a time)', () => {
    for (let i = 0; i < TRICKY.length; i += 3) {
      const vals = TRICKY.slice(i, i + 3);
      const text = vals.map(quoteValue).join(', ');
      expect(parseMissingText(text, 'string'), text).toEqual({ discrete: vals.map((s) => s.replace(/ +$/, '')) });
    }
    expect(parseMissingText("'DK', 'oops", 'string')).toBeNull();
    // Unquoted text written by older versions still reads.
    expect(parseMissingText('NA, DK', 'string')).toEqual({ discrete: ['NA', 'DK'] });
  });
  it('parses value labels whose codes or labels contain "; " and " = "', () => {
    const labels = TRICKY.map((value, k) => ({ value, label: `L${k}; more = text` }));
    const text = labels.map((l) => `${quoteValue(l.value)} = ${l.label}`).join('; ');
    expect(parseValueLabelsText(text, 'string')).toEqual(labels);
    expect(parseValueLabelsText('1 = Yes; or = not; 2 = No', 'numeric')).toEqual([{ value: 1, label: 'Yes; or = not' }, { value: 2, label: 'No' }]);
    expect(parseValueLabelsText('-9 = Refused; 1.5e3 = Many', 'numeric')).toEqual([{ value: -9, label: 'Refused' }, { value: 1500, label: 'Many' }]);
  });
  it('an Excel round trip keeps tricky string missing values and value labels exactly', async () => {
    for (let i = 0; i < TRICKY.length; i += 3) {
      const miss = TRICKY.slice(i, i + 3);
      const labels = TRICKY.map((value, k) => ({ value, label: `Label ${k}, "quoted"; ok` }));
      const v = makeVariable({ name: 'answer', type: 'string', width: 12, missing: { discrete: miss }, valueLabels: labels });
      const back = (await xlsxRoundTrip(one(v, ['yes', 'DK', '', 'a, b']))).dataset.variables[0];
      expect(back.missing.discrete).toEqual(miss.map((s) => s.replace(/ +$/, '')));
      expect(back.valueLabels).toEqual(labels.map((l) => ({ ...l, value: l.value.replace(/ +$/, '') })));
    }
  });
});

describe('FZ-17: the Variables sheet is authoritative', () => {
  const sex = () => makeVariable({ name: 'sex', decimals: 0, measure: 'nominal', valueLabels: [{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }], missing: { discrete: [9] } });
  it('value labels come back for a variable whose cases are all missing, or that has no cases', async () => {
    for (const values of [[NaN, NaN], [9, 9], [3, 4]]) {
      const back = (await xlsxRoundTrip(one(sex(), values))).dataset.variables[0];
      expect(back.valueLabels).toHaveLength(2);
      expect(back.missing).toEqual({ discrete: [9] });
    }
  });
  it('with "Excel with value labels", label texts are read back as their codes', async () => {
    const r = await xlsxRoundTrip(one(sex(), [1, 2, 9, NaN, 3]), 'labels');
    const v = r.dataset.variables[0];
    expect(v.type).toBe('numeric');
    expect(Array.from(r.dataset.columns[v.id] as Float64Array)).toEqual([1, 2, 9, NaN, 3]);
    expect(v.valueLabels).toEqual([{ value: 1, label: 'Male' }, { value: 2, label: 'Female' }]);
  });
  it('a numeric column holding text that is not a label stays text, with a note', async () => {
    // A workbook edited by hand: the Variables sheet says Numeric, the data holds a word.
    const mod = await import('write-excel-file/universal');
    const write = mod.default as unknown as (sheets: unknown[]) => { toBlob: () => Promise<Blob> };
    const blob = await write([
      { sheet: 'Data', data: [['code'], ['Yes'], ['maybe'], [2]] },
      { sheet: 'Variables', data: [['Name', 'Label', 'Type', 'Value labels'], ['code', 'Answer', 'Numeric', '1 = Yes; 2 = No']] },
    ]).toBlob();
    const r = await importFile('hand.xlsx', new Uint8Array(await blob.arrayBuffer()));
    const v = r.dataset.variables[0];
    expect(v.type).toBe('string');
    expect(r.dataset.columns[v.id]).toEqual(['Yes', 'maybe', '2']);
    expect(v.label).toBe('Answer');
    expect(r.warnings.join(' ')).toMatch(/code is numeric in the "Variables" sheet but holds text that is not one of its value labels, so it was kept as text/);
  });
  it('string columns stay text (numbers, "NA", leading zeros and spaces kept) with their width', async () => {
    const v = makeVariable({ name: 'zip', type: 'string', width: 10, valueLabels: [{ value: '007', label: 'Bond' }], missing: { discrete: ['NA'] } });
    const r = await xlsxRoundTrip(one(v, ['007', '02134', 'NA', ' 3', '1e3']));
    const b = r.dataset.variables[0];
    expect(b.type).toBe('string');
    expect(r.dataset.columns[b.id]).toEqual(['007', '02134', 'NA', ' 3', '1e3']);
    expect(b.width).toBe(10);
    expect(b.valueLabels).toEqual([{ value: '007', label: 'Bond' }]);
    expect(r.warnings.join(' ')).not.toMatch(/Read as numbers/);
  });
});

describe('FZ-18: CSV numbers are inferred, with a warning; Keep as text keeps the text', () => {
  const csv = 'id,zip,code,city\n1,02134,1,Delhi\n2,00501,NA,Mumbai\n3,10001,n/a,Pune\n';
  it('the warning lists each converted column and what changed', async () => {
    const r = await importFile('m.csv', enc(csv));
    expect(r.warnings).toEqual([
      'Read as numbers: zip (leading zeros were dropped in 2 cases ("02134" became 2134)), code ("NA", "n/a" became system-missing in 2 cases). To keep a column exactly as written, tick "Keep as text" for it in the import preview.',
    ]);
    expect(r.columns?.map((c) => [c.name, c.readAs])).toEqual([['id', 'number'], ['zip', 'number'], ['code', 'number'], ['city', 'text']]);
  });
  it('Keep as text reads the chosen columns exactly as written', async () => {
    const r = await importFile('m.csv', enc(csv), { textColumns: [1, 2] });
    const [, zip, code] = r.dataset.variables;
    expect([zip.type, code.type]).toEqual(['string', 'string']);
    expect(r.dataset.columns[zip.id]).toEqual(['02134', '00501', '10001']);
    expect(r.dataset.columns[code.id]).toEqual(['1', 'NA', 'n/a']);
    expect(r.warnings).toEqual([]);
    expect(r.columns?.filter((c) => c.keptAsText).map((c) => c.index)).toEqual([1, 2]);
  });
  it('a CSV round trip of a string column is exact with Keep as text', async () => {
    const d = one(makeVariable({ name: 'code', type: 'string', width: 4 }), ['1', '2', 'NA', '3']);
    const back = (await importFile('rt.csv', enc(exportCsv(d)), { textColumns: [0] })).dataset;
    expect(back.columns[back.variables[0].id]).toEqual(['1', '2', 'NA', '3']);
  });
  it('conversionWarning shortens long lists', () => {
    const cols = Array.from({ length: 9 }, (_, j) => ({ index: j, name: `v${j}`, readAs: 'number' as const, keptAsText: false, missingWords: [{ text: 'NA', count: 1 }], leadingZeros: null }));
    expect(conversionWarning(cols)).toMatch(/v5 \("NA" became system-missing in 1 case\), 3 more\./);
    expect(conversionWarning(cols.map((c) => ({ ...c, missingWords: [] })))).toBeNull();
  });
});

describe.skipIf(!HAS_ORACLE)('openpyxl reads the quoted codebook text (oracle)', () => {
  it('Missing values and Value labels cells hold the SPSS-style text', async () => {
    const v = makeVariable({ name: 'answer', type: 'string', width: 8, missing: { discrete: ['DK', "it's"] }, valueLabels: [{ value: '', label: 'Blank' }] });
    const p = tempPath('codebook.xlsx');
    writeFileSync(p, new Uint8Array(await (await exportXlsx(one(v, ['DK']))).arrayBuffer()));
    const out = JSON.parse(execFileSync(PYTHON, ['-W', 'ignore', '-c', "import openpyxl, json, sys\nws = openpyxl.load_workbook(sys.argv[1])['Variables']\nprint(json.dumps([c.value for c in ws[2]]))", p], { encoding: 'utf-8' }));
    expect(out[7]).toBe("'' = Blank");
    expect(out[8]).toBe("'DK', 'it''s'");
  });
});
