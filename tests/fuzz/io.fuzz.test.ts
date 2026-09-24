// IO round trips and robustness.
// - Random datasets -> exportSav (none / bytecode / zsav, little and big endian) -> importFile -> equal
//   dictionary and data (differences allowed only when the export report warns about them).
// - A random subset is cross-checked with pyreadstat (Python oracle, skipped when absent).
// - CSV and XLSX round trips keep names and values (XLSX also the dictionary via its Variables sheet).
// - Truncated / bit-flipped / header-mangled .sav bytes and garbage files never hang and never throw
//   anything but SavFormatError (for .sav) or a plain-English Error.
// Reproduce: FUZZ_SEED=<seed> npx vitest run tests/fuzz/io.fuzz.test.ts
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { exportCsv, exportSavWithReport, exportXlsx, importFile } from '../../src/lib/io';
import { writeSav } from '../../src/lib/io/sav-writer';
import { SavFormatError } from '../../src/lib/io/sav-reader';
import { makeDataset, makeVariable, type Column, type Dataset, type Variable } from '../../src/core/types';
import { makeRng, suiteSeed, fuzzScale, type Rng } from './lib/rng';
import { datasetToCode, genDataset, genVariable } from './lib/gen-data';
import { Collector } from './lib/findings';
import { badWords, errorProblems } from './lib/invariants';

const SEED = suiteSeed(9090);
const col = new Collector('io');
const out = (s: string) => process.stdout.write(s + '\n');
const PYTHON = '/opt/oracle/bin/python';
const HAS_ORACLE = existsSync(PYTHON) && !process.env.SOCIUS_NO_ORACLE;
const DUMP = resolve(__dirname, '..', '..', 'scripts', 'fixtures', 'dump_sav.py');
const N = (k: number) => Math.round(k * fuzzScale());

function fail(subject: string, check: string, detail: string, seed: number, repro?: string) {
  col.add({ area: 'io', subject, check, detail, seed, repro });
}

// ---------- IO-focused dataset generator ----------

const utf8 = (s: string) => new TextEncoder().encode(s).length;

function ioDataset(rng: Rng): Dataset {
  const base = genDataset(rng, { nCases: rng.pick([0, 1, 3, 17, 60]), weight: rng.pick(['none', 'int', 'frac'] as const), extra: rng.int(0, 5) }).ds;
  const vars: Variable[] = [...base.variables];
  const cols: Record<string, Column> = { ...base.columns };
  const n = base.nCases;
  const add = (v: Variable, c: Column) => {
    vars.push(v);
    cols[v.id] = c;
  };
  // Very long strings (segments of 255 bytes), multi-byte characters across a segment boundary.
  if (rng.bool(0.5)) {
    const w = rng.pick([255, 256, 300, 510, 1000]);
    const unit = rng.pick(['a', 'ক', 'ह', 'é', '𝒳']);
    const vals = Array.from({ length: n }, (_, i) => (i % 3 === 0 ? '' : unit.repeat(Math.floor(w / utf8(unit)) - (i % 2)).slice(0, w)));
    add(makeVariable({ name: `long${rng.int(1, 999)}`, type: 'string', width: Math.max(w, ...vals.map(utf8)), label: 'Open answer' }), vals);
  }
  // Extreme numbers.
  if (rng.bool(0.5)) {
    const pool = [0, -0, 1e308, -1e308, 5e-324, 2.5, -2.5, 1e15 + 0.5, Number.MAX_SAFE_INTEGER, 100, 151, -99, -100, 252, 253, 254, 255, NaN];
    add(makeVariable({ name: `extreme${rng.int(1, 999)}`, decimals: 2 }), Float64Array.from({ length: n }, () => rng.pick(pool)));
  }
  // Rich dictionary: long value labels, LO/HI missing ranges, formats.
  if (rng.bool(0.6)) {
    const v = makeVariable({
      name: `dict${rng.int(1, 999)}`,
      label: rng.pick(['', 'x'.repeat(300), 'প্রশ্ন ১: আপনার বয়স কত?', 'Label with "quotes" and \'apostrophes\'']),
      format: rng.pick(['F8.2', 'DOLLAR10.2', 'COMMA9.1', 'PCT6.1', 'DATE11', 'DATETIME20', 'ADATE10', 'TIME8', 'E10.3', 'N5']),
      decimals: 2,
      valueLabels: [
        { value: 1, label: rng.pick(['One', 'y'.repeat(200), 'এক']) },
        { value: -1, label: 'Minus one' },
        { value: 99, label: 'Missing code' },
      ],
      missing: rng.pick([{ discrete: [99] }, { discrete: [97, 98, 99] }, { discrete: [], range: { lo: -Infinity, hi: -1 } }, { discrete: [99], range: { lo: 900, hi: Infinity } }, { discrete: [1, 2, 3, 4] }, { discrete: [] }]),
      measure: rng.pick(['nominal', 'ordinal', 'scale'] as const),
    });
    add(v, Float64Array.from({ length: n }, () => rng.pick([1, -1, 99, 2, NaN, 1000, -5])));
  }
  if (rng.bool(0.3)) {
    const v = makeVariable({ name: `smiss${rng.int(1, 999)}`, type: 'string', width: rng.pick([1, 3, 9, 40]), missing: { discrete: ['NA', 'DK', ''] }, valueLabels: [{ value: 'NA', label: 'Not asked' }, { value: 'ক', label: 'বাংলা' }] });
    add(v, Array.from({ length: n }, () => rng.pick(['NA', 'DK', '', 'x', 'ক'])).map((s) => s.slice(0, v.width)));
  }
  const ds = makeDataset({ ...base, variables: vars, columns: cols, fileLabel: rng.pick(['', 'Survey 2026', 'f'.repeat(80), 'সমীক্ষা']), documents: rng.bool(0.3) ? ['Created by the fuzzer', 'দ্বিতীয় লাইন'] : [] });
  return ds;
}

// ---------- comparison ----------

function sameNum(a: number, b: number): boolean {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  return a === b; // -0 == 0 accepted
}

/** Differences between the written and the read dataset (by variable name). */
function diffDatasets(a: Dataset, b: Dataset, opts: { dictionary: boolean; strict: boolean }): string[] {
  const d: string[] = [];
  if (b.nCases !== a.nCases) d.push(`nCases ${a.nCases} -> ${b.nCases}`);
  const byName = new Map(b.variables.map((v) => [v.name.toLowerCase(), v]));
  for (const va of a.variables) {
    const vb = byName.get(va.name.toLowerCase());
    if (!vb) {
      d.push(`variable ${va.name} missing after round trip (have ${b.variables.map((v) => v.name).slice(0, 8).join(', ')})`);
      continue;
    }
    if (vb.name !== va.name) d.push(`name ${va.name} -> ${vb.name}`);
    if (opts.strict && vb.type !== va.type) d.push(`${va.name}: type ${va.type} -> ${vb.type}`);
    const ca = a.columns[va.id], cb = b.columns[vb.id];
    for (let i = 0; i < a.nCases && i < b.nCases; i++) {
      const x = ca[i], y = cb[i];
      if (typeof x === 'number') {
        const yy = typeof y === 'string' ? (y.trim() === '' ? NaN : Number(y)) : y;
        if (!sameNum(x, yy)) {
          d.push(`${va.name} row ${i}: ${x} -> ${JSON.stringify(y)}`);
          break;
        }
      } else if (typeof y === 'string' ? y.trimEnd() !== x.trimEnd() : !(x.trim() === '' ? Number.isNaN(y) : Number(x) === y)) {
        d.push(`${va.name} row ${i}: ${JSON.stringify(x.slice(0, 40))} -> ${JSON.stringify(String(y).slice(0, 40))}`);
        break;
      }
    }
    if (!opts.dictionary) continue;
    if (vb.label !== va.label) d.push(`${va.name}: label ${JSON.stringify(va.label.slice(0, 40))} -> ${JSON.stringify(vb.label.slice(0, 40))}`);
    if (vb.measure !== va.measure) d.push(`${va.name}: measure ${va.measure} -> ${vb.measure}`);
    const vl = (v: Variable) => JSON.stringify(v.valueLabels.map((l) => [typeof l.value === 'string' ? l.value.trimEnd() : l.value, l.label]).sort());
    if (vl(va) !== vl(vb)) d.push(`${va.name}: value labels ${vl(va).slice(0, 80)} -> ${vl(vb).slice(0, 80)}`);
    const ms = (v: Variable) => JSON.stringify({ d: v.missing.discrete.map((x) => (typeof x === 'string' ? x.trimEnd() : x)).sort(), r: v.missing.range ? [String(v.missing.range.lo), String(v.missing.range.hi)] : null });
    if (ms(va) !== ms(vb)) d.push(`${va.name}: missing ${ms(va)} -> ${ms(vb)}`);
    if (opts.strict && va.type === 'numeric' && va.format.replace(/\d.*$/, '') !== vb.format.replace(/\d.*$/, '')) d.push(`${va.name}: format ${va.format} -> ${vb.format}`);
  }
  if (opts.strict) {
    const wa = a.variables.find((v) => v.id === a.weightVarId)?.name ?? null;
    const wb = b.variables.find((v) => v.id === b.weightVarId)?.name ?? null;
    if (wa !== wb) d.push(`weight ${wa} -> ${wb}`);
  }
  return d;
}

/** Differences the .sav export report explains (SPSS limits) are accepted. */
function explained(diff: string, warnings: string[]): boolean {
  const w = warnings.join(' ').toLowerCase();
  if (/value labels/.test(diff) && /value label/.test(w)) return true;
  if (/: missing /.test(diff) && /missing/.test(w)) return true;
  if (/: label /.test(diff) && /label/.test(w)) return true;
  if (/^name /.test(diff) && /name/.test(w)) return true;
  return false;
}

function reproFor(ds: Dataset, call: string): string {
  const code = datasetToCode(ds);
  return (code.length > 3500 ? code.slice(0, 3500) + '\n/* ...truncated: re-run with the seed */' : code) + '\n' + call;
}

describe('.sav round trips', () => {
  it('export -> import is lossless across compression modes and byte orders', async () => {
    const files: Array<{ ds: Dataset; bytes: Uint8Array; seed: number; comp: string }> = [];
    for (let t = 0; t < N(120); t++) {
      const seed = makeRng(SEED).fork(`sav#${t}`).seed;
      const rng = makeRng(seed);
      const ds = ioDataset(rng);
      for (const compression of ['none', 'bytecode', 'zsav'] as const) {
        const bigEndian = rng.bool(0.2);
        let bytes: Uint8Array;
        let warnings: string[];
        try {
          const r = writeSav(ds, { compression, bigEndian });
          bytes = r.bytes;
          warnings = r.warnings;
        } catch (e) {
          fail('exportSav', 'throw', `${compression}: ${(e as Error)?.name}: ${(e as Error)?.message}`, seed, reproFor(ds, `exportSav(ds, { compression: '${compression}' })`));
          continue;
        }
        for (const w of warnings) for (const b of badWords(w).filter((x) => x !== 'null')) fail('exportSav', 'text', `warning contains ${b}: "${w.slice(0, 120)}"`, seed);
        let back: Dataset;
        try {
          back = (await importFile(compression === 'zsav' ? 'rt.zsav' : 'rt.sav', bytes)).dataset;
        } catch (e) {
          fail('importSav', 'roundtrip-throw', `${compression}${bigEndian ? ' big-endian' : ''}: ${(e as Error)?.message}`, seed, reproFor(ds, `await importFile('rt.sav', exportSav(ds, { compression: '${compression}' }))`));
          continue;
        }
        const diffs = diffDatasets(ds, back, { dictionary: true, strict: true }).filter((d) => !explained(d, warnings));
        for (const d of diffs.slice(0, 3))
          fail('sav-roundtrip', 'roundtrip', `${compression}${bigEndian ? ' BE' : ''}: ${d}`, seed, reproFor(ds, `const back = (await importFile('rt.sav', exportSav(ds, { compression: '${compression}' }))).dataset; // compare ${d.split(':')[0]}`));
        if (files.length < 12 && rng.bool(0.3)) files.push({ ds, bytes, seed, comp: compression });
      }
    }
    // Oracle: pyreadstat reads the same bytes identically.
    if (!HAS_ORACLE) {
      out('[fuzz:io] Python oracle not available: pyreadstat cross-check skipped');
      return;
    }
    const dir = mkdtempSync(join(tmpdir(), 'socius-fuzz-io-'));
    for (const f of files) {
      const p = join(dir, `f${f.seed}.${f.comp === 'zsav' ? 'zsav' : 'sav'}`);
      writeFileSync(p, f.bytes);
      let dump: any;
      try {
        dump = JSON.parse(execFileSync(PYTHON, [DUMP, p], { encoding: 'utf-8', maxBuffer: 1 << 28 }));
      } catch (e) {
        fail('sav-oracle', 'pyreadstat-rejects', `pyreadstat cannot read our ${f.comp} file: ${String((e as Error).message).split('\n').slice(-2).join(' ').slice(0, 200)}`, f.seed, reproFor(f.ds, `exportSav(ds, { compression: '${f.comp}' }) // then pyreadstat.read_sav`));
        continue;
      }
      for (const va of f.ds.variables) {
        const ov = dump.variables.find((x: any) => x.name.toLowerCase() === va.name.toLowerCase());
        if (!ov) {
          fail('sav-oracle', 'pyreadstat', `pyreadstat does not see variable ${va.name}`, f.seed);
          continue;
        }
        if ((ov.label ?? '') !== va.label && va.label.length <= 255) fail('sav-oracle', 'pyreadstat', `label of ${va.name}: pyreadstat reads ${JSON.stringify(String(ov.label).slice(0, 40))}`, f.seed);
        const data = dump.data[ov.name] as Array<number | string | null>;
        const c = f.ds.columns[va.id];
        for (let i = 0; i < f.ds.nCases; i++) {
          const x = c[i];
          const y = data[i];
          const ok = typeof x === 'number' ? (Number.isNaN(x) ? y === null : y === x || (y === 'Infinity' && x === Infinity) || (y === '-Infinity' && x === -Infinity)) : String(y ?? '').trimEnd() === x.trimEnd();
          if (!ok) {
            fail('sav-oracle', 'pyreadstat', `${va.name} row ${i}: we wrote ${JSON.stringify(x)}, pyreadstat reads ${JSON.stringify(y)} (${f.comp})`, f.seed, reproFor(f.ds, `exportSav(ds, { compression: '${f.comp}' }) // then pyreadstat.read_sav`));
            break;
          }
        }
      }
    }
  }, 120_000);
});

describe('CSV and XLSX round trips', () => {
  it('CSV keeps names and values; XLSX also the dictionary', async () => {
    for (let t = 0; t < N(60); t++) {
      const seed = makeRng(SEED).fork(`csv#${t}`).seed;
      const rng = makeRng(seed);
      const ds = ioDataset(rng);
      if (!ds.nCases) continue;
      // CSV
      const delimiter = rng.pick([',', ';', '\t']);
      let text = '';
      try {
        text = exportCsv(ds, { delimiter, bom: rng.bool() });
        const fileName = delimiter === '\t' ? 'rt.tsv' : 'rt.csv';
        // Values only (CSV has no dictionary); dates come back as dates, so skip date formats.
        const plain = { ...ds, variables: ds.variables.filter((v) => !/DATE|TIME|DOLLAR|COMMA|PCT/i.test(v.format)) };
        // FZ-18 (intended, with warning): by default numeric-looking text columns become numbers and
        // "NA" becomes system-missing, and the import warning must name every column whose text changed.
        const res = await importFile(fileName, new TextEncoder().encode(text), { delimiter });
        const warned = res.warnings.join('\n');
        for (const d of diffDatasets(plain, res.dataset, { dictionary: false, strict: false }).slice(0, 3)) {
          const name = /^(\S+) row \d+: /.exec(d)?.[1];
          const src = ds.variables.find((v) => v.name === name);
          const converted = src?.type === 'string' && res.dataset.variables.find((v) => v.name === name)?.type === 'numeric';
          // Named in the warning (or, past the first columns, counted in its "and N more" and reported in res.columns).
          const reported = warned.includes(`${name} (`) || (/Read as numbers: .* more\./.test(warned) && !!res.columns?.find((c) => c.name === name)?.missingWords.length);
          if (converted && /Read as numbers: /.test(warned) && reported) continue;
          fail('csv-roundtrip', converted ? 'silent-conversion' : 'roundtrip', `delimiter ${JSON.stringify(delimiter)}: ${d}`, seed, reproFor(ds, `await importFile('rt.csv', new TextEncoder().encode(exportCsv(ds, { delimiter: ${JSON.stringify(delimiter)} })))`));
        }
        // With "Keep as text" for the string columns, the text comes back exactly.
        const textColumns = ds.variables.flatMap((v, j) => (v.type === 'string' ? [j] : []));
        const kept = (await importFile(fileName, new TextEncoder().encode(text), { delimiter, textColumns })).dataset;
        for (const d of diffDatasets(plain, kept, { dictionary: false, strict: false }).slice(0, 3))
          fail('csv-roundtrip', 'roundtrip', `keep as text, delimiter ${JSON.stringify(delimiter)}: ${d}`, seed, reproFor(ds, `await importFile('rt.csv', new TextEncoder().encode(exportCsv(ds, { delimiter: ${JSON.stringify(delimiter)} })), { textColumns: ${JSON.stringify(textColumns)} })`));
        for (const j of textColumns) {
          const v = kept.variables[j];
          if (v && v.type !== 'string') fail('csv-roundtrip', 'keep-as-text', `${v.name} was read as ${v.type} although "Keep as text" was asked`, seed);
        }
      } catch (e) {
        fail('csv-roundtrip', 'throw', `${(e as Error)?.name}: ${(e as Error)?.message?.slice(0, 160)}`, seed, reproFor(ds, `exportCsv(ds) -> importFile`));
      }
      // XLSX
      try {
        const blob = await exportXlsx(ds);
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const back = (await importFile('rt.xlsx', bytes)).dataset;
        const plain = { ...ds, variables: ds.variables.filter((v) => !/DATE|TIME/i.test(v.format)) };
        for (const d of diffDatasets(plain, back, { dictionary: true, strict: false }).slice(0, 3))
          fail('xlsx-roundtrip', 'roundtrip', d, seed, reproFor(ds, `await importFile('rt.xlsx', new Uint8Array(await (await exportXlsx(ds)).arrayBuffer()))`));
      } catch (e) {
        fail('xlsx-roundtrip', 'throw', `${(e as Error)?.name}: ${(e as Error)?.message?.slice(0, 160)}`, seed, reproFor(ds, `exportXlsx(ds) -> importFile`));
      }
    }
  }, 120_000);
});

describe('corrupted input', () => {
  async function tryImport(name: string, bytes: Uint8Array, seed: number, what: string, mustBeSav: boolean) {
    const t0 = performance.now();
    try {
      await importFile(name, bytes);
    } catch (e) {
      const ms = performance.now() - t0;
      if (ms > 3000) fail('import', 'slow', `${what}: took ${Math.round(ms)} ms to reject`, seed);
      const msg = (e as Error)?.message ?? '';
      if (mustBeSav && !(e instanceof SavFormatError)) {
        fail('importSav', 'corrupt-throw', `${what}: ${(e as Error)?.name ?? typeof e}: ${msg.slice(0, 140)}`, seed, `// bytes: ${what} (seed ${seed})\nawait importFile(${JSON.stringify(name)}, bytes)`);
        return;
      }
      for (const p of errorProblems(e)) fail(mustBeSav ? 'importSav' : 'import', 'corrupt-message', `${what}: ${p}`, seed, `await importFile(${JSON.stringify(name)}, bytes /* ${what} */)`);
      return;
    }
    const ms = performance.now() - t0;
    if (ms > 3000) fail('import', 'slow', `${what}: took ${Math.round(ms)} ms`, seed);
  }

  it('truncated, bit-flipped and header-mangled .sav files', async () => {
    const rng = makeRng(SEED).fork('corrupt');
    const bases: Array<{ bytes: Uint8Array; comp: string }> = [];
    for (let k = 0; k < 6; k++) {
      const ds = ioDataset(rng.fork(k));
      for (const compression of ['none', 'bytecode', 'zsav'] as const) bases.push({ bytes: exportSavWithReport(ds, { compression }).bytes, comp: compression });
    }
    for (let t = 0; t < N(1500); t++) {
      const seed = makeRng(SEED).fork(`mut#${t}`).seed;
      const r = makeRng(seed);
      const base = r.pick(bases);
      const b = new Uint8Array(base.bytes);
      let bytes: Uint8Array = b;
      let what = '';
      const kind = r.int(0, 5);
      if (kind === 0) {
        const len = r.int(0, b.length - 1);
        bytes = b.slice(0, len);
        what = `${base.comp} file truncated to ${len} of ${b.length} bytes`;
      } else if (kind === 1) {
        const k = r.int(1, 12);
        for (let j = 0; j < k; j++) b[r.int(4, b.length - 1)] ^= 1 << r.int(0, 7);
        what = `${base.comp} file with ${k} flipped bits`;
      } else if (kind === 2) {
        // Header integers: layout code, nominal case size, compression, weight index, ncases, bias.
        const dv = new DataView(b.buffer);
        const off = r.pick([64, 68, 72, 76, 80, 84]);
        const val = r.pick([0, -1, 1, 2, 3, 0x7fffffff, 0x10000000, 65535, -2147483648]);
        if (off === 84) dv.setFloat64(84, r.pick([0, NaN, -100, 1e308]), true);
        else dv.setInt32(off, val, true);
        what = `${base.comp} header field at offset ${off} set to ${off === 84 ? 'odd bias' : val}`;
      } else if (kind === 3) {
        // Random 4-byte integers inside the dictionary (record counts, lengths).
        const dv = new DataView(b.buffer);
        const k = r.int(1, 4);
        for (let j = 0; j < k; j++) dv.setInt32(176 + 4 * r.int(0, Math.max(1, Math.floor((Math.min(b.length, 4000) - 180) / 4))), r.pick([0, -1, 0x7fffffff, 1e6, 255, 256, 65536]), true);
        what = `${base.comp} dictionary with ${k} mangled integers`;
      } else if (kind === 4) {
        const at = r.int(0, b.length);
        const ins = Uint8Array.from({ length: r.int(1, 64) }, () => r.int(0, 255));
        bytes = new Uint8Array([...b.slice(0, at), ...ins, ...b.slice(at)]);
        what = `${base.comp} file with ${ins.length} random bytes inserted at ${at}`;
      } else {
        bytes = Uint8Array.from({ length: r.int(4, 3000) }, () => r.int(0, 255));
        bytes.set([0x24, 0x46, 0x4c, 0x32]);
        what = 'random bytes after a $FL2 signature';
      }
      await tryImport(base.comp === 'zsav' ? 'bad.zsav' : 'bad.sav', bytes, seed, what, true);
    }
  }, 120_000);

  it('garbage CSV / XLSX / unknown files give readable errors', async () => {
    for (let t = 0; t < N(300); t++) {
      const seed = makeRng(SEED).fork(`garbage#${t}`).seed;
      const r = makeRng(seed);
      const name = r.pick(['x.csv', 'x.tsv', 'x.txt', 'x.xlsx', 'x.dat', 'x', 'x.sav.zip', 'x.zip']);
      const kind = r.int(0, 3);
      let bytes: Uint8Array;
      let what: string;
      if (kind === 0) {
        bytes = Uint8Array.from({ length: r.int(1, 2000) }, () => r.int(0, 255));
        what = 'random bytes';
      } else if (kind === 1) {
        const rows = Array.from({ length: r.int(1, 30) }, () => Array.from({ length: r.int(1, 8) }, () => r.pick(['1', '2.5', '', '"a,b"', '"unterminated', 'x"y', '১২', '1,5', '-', 'NaN', 'Infinity', '1e999', '  ', '\t', 'TRUE', '2026-09-24', '31/02/2026'])).join(r.pick([',', ';', '\t'])));
        bytes = new TextEncoder().encode(rows.join(r.pick(['\n', '\r\n', '\r'])));
        what = `odd delimited text: ${JSON.stringify(rows.slice(0, 2).join(' / ')).slice(0, 80)}`;
      } else if (kind === 2) {
        const ds = ioDataset(r);
        const blob = await exportXlsx(ds).catch(() => null);
        if (!blob) continue;
        bytes = new Uint8Array(await blob.arrayBuffer());
        const len = r.int(10, bytes.length - 1);
        bytes = r.bool() ? bytes.slice(0, len) : (() => { const b = new Uint8Array(bytes); for (let j = 0; j < 8; j++) b[r.int(30, b.length - 1)] ^= 0xff; return b; })();
        what = 'damaged xlsx';
      } else {
        bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...Array.from({ length: r.int(0, 500) }, () => r.int(0, 255))]);
        what = 'zip signature + garbage';
      }
      await tryImport(name, bytes, seed, what, false);
    }
  }, 120_000);
});

describe('gate', () => {
  it('no new failures (known ones are listed in tests/fuzz/known-issues.ts)', () => {
    const g = col.gate();
    out(`[fuzz:io] seed ${SEED}\n${g.summary}`);
    expect(g.unknown, g.summary).toEqual([]);
  });
});

void genVariable;
