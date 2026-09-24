// Zipped data files: the claude.ai Artifact viewer saves .sav files as <name>.sav.zip, and people
// email zipped CSVs. importFile unwraps a plain zip holding exactly one openable file.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { importFile, isPlainZip, unopenableReason, unwrapZip } from '../../src/lib/io';
import { FIXTURES } from './helpers';

const enc = (s: string) => new TextEncoder().encode(s);
const fixture = (n: string) => new Uint8Array(readFileSync(join(FIXTURES, n)));

describe('zipped data files', () => {
  it('opens the .sav inside survey.sav.zip (how the Artifact viewer saves SPSS files)', async () => {
    const zip = zipSync({ 'survey.sav': fixture('main_bytecode.sav') });
    expect(isPlainZip(zip)).toBe(true);
    const r = await importFile('survey.sav.zip', zip);
    expect(r.dataset.source?.kind).toBe('sav');
    expect(r.dataset.nCases).toBe(6);
  });

  it('opens a zipped .zsav, CSV and xlsx, ignoring folders and macOS metadata', async () => {
    const z = await importFile('a.zip', zipSync({ 'data/w.zsav': fixture('main_zlib.zsav'), '__MACOSX/data/._w.zsav': enc('junk'), '.DS_Store': enc('x') }));
    expect(z.dataset.source?.kind).toBe('zsav');
    const c = await importFile('b.zip', zipSync({ 'x.csv': enc('a,b\n1,2\n3,4\n') }));
    expect(c.dataset.nCases).toBe(2);
    const x = await importFile('c.zip', zipSync({ 'book.xlsx': fixture('workbook.xlsx') }));
    expect(x.dataset.source?.kind).toBe('xlsx');
  });

  it('still reads real xlsx workbooks (which are zips too) as Excel', async () => {
    expect(isPlainZip(fixture('workbook.xlsx'))).toBe(false);
    const r = await importFile('download.zip', fixture('workbook.xlsx'));
    expect(r.dataset.source?.kind).toBe('xlsx');
  });

  it('explains archives it cannot open', async () => {
    await expect(importFile('e.zip', zipSync({ 'readme.md': enc('hi') }))).rejects.toThrow(/no data file Socius can open/);
    await expect(importFile('m.zip', zipSync({ 'a.sav': fixture('main_bytecode.sav'), 'b.csv': enc('a\n1\n') }))).rejects.toThrow(/holds 2 files \(a\.sav, b\.csv\)/);
    await expect(importFile('p.zip', zipSync({ 'study.socius.json': enc('{}') }))).rejects.toThrow(/Socius project.*Open project/);
  });

  it('unwrapZip returns the single project or data file with its bare name', () => {
    const inner = unwrapZip('p.zip', zipSync({ 'folder/study.socius.json': enc('{"a":1}') }));
    expect(inner.name).toBe('study.socius.json');
    expect(new TextDecoder().decode(inner.bytes)).toBe('{"a":1}');
  });
});

describe('unopenableReason', () => {
  it('rejects PDFs, images and other formats before any parsing', () => {
    expect(unopenableReason('x.pdf', enc('%PDF-1.7'))).toMatch(/PDF files/);
    expect(unopenableReason('x.dta')).toMatch(/Stata/);
    expect(unopenableReason('x.por')).toMatch(/portable/);
    expect(unopenableReason('pic.jpg')).toMatch(/Images/);
    expect(unopenableReason('ok.csv', enc('a,b\n'))).toBeNull();
    expect(unopenableReason('ok.sav', fixture('main_bytecode.sav').subarray(0, 8192))).toBeNull();
  });
});
