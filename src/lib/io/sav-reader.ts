// SPSS system file (.sav / .zsav) reader.
//
// Implements the system file format as documented by GNU PSPP ("System File Format"): file header,
// variable records with continuation records, value labels (types 3/4), documents (type 6), the
// extension records (type 7) SPSS, PSPP, R haven and Stata write, and the three data layouts
// (uncompressed, bytecode compressed, zlib compressed). Both byte orders are supported.
//
// Performance: the whole file is one Uint8Array read through a DataView; the case loop writes
// straight into Float64Array / string[] columns without per-cell allocations for numeric data.

import { unzlibSync } from 'fflate';
import { makeDataset, newId } from '../../core/types';
import type { Alignment, Column, Dataset, MeasureLevel, MissingSpec, ValueLabel, VarRole, Variable } from '../../core/types';
import { decodeTrimmed, encodingForCodepage, isAscii, isValidUtf8, makeDecoder, normalizeEncodingName } from './encoding';
import { formatToString, unpackFormat } from './sav-formats';

export interface SavReadOptions {
  fileName?: string;
  /** Encoding to use when the file has no subtype 20 encoding record. */
  encoding?: string;
}

export interface SavReadResult {
  dataset: Dataset;
  warnings: string[];
}

/** Thrown for files that cannot be read; the message is written for end users. */
export class SavFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SavFormatError';
  }
}

const DEFAULT_SYSMIS = -Number.MAX_VALUE;
const DEFAULT_HIGHEST = Number.MAX_VALUE;
// SPSS LOWEST is the second-largest negative double (0xffeffffffffffffe).
const DEFAULT_LOWEST = (() => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setUint32(0, 0xffefffff);
  dv.setUint32(4, 0xfffffffe);
  return dv.getFloat64(0);
})();

class Cursor {
  pos = 0;
  readonly dv: DataView;
  constructor(readonly bytes: Uint8Array, public le: boolean) {
    this.dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  need(n: number, what: string): void {
    if (n < 0 || this.pos + n > this.bytes.length) {
      throw new SavFormatError(`The file ended unexpectedly while reading ${what}. It may be truncated (for example, an incomplete download) or damaged.`);
    }
  }
  i32(what: string): number {
    this.need(4, what);
    const v = this.dv.getInt32(this.pos, this.le);
    this.pos += 4;
    return v;
  }
  f64(what: string): number {
    this.need(8, what);
    const v = this.dv.getFloat64(this.pos, this.le);
    this.pos += 8;
    return v;
  }
  i64(what: string): number {
    this.need(8, what);
    const lo = this.dv.getUint32(this.pos + (this.le ? 0 : 4), this.le);
    const hi = this.dv.getInt32(this.pos + (this.le ? 4 : 0), this.le);
    this.pos += 8;
    return hi * 4294967296 + lo;
  }
  u8(what: string): number {
    this.need(1, what);
    return this.bytes[this.pos++];
  }
  take(n: number, what: string): Uint8Array {
    this.need(n, what);
    const out = this.bytes.subarray(this.pos, this.pos + n);
    this.pos += n;
    return out;
  }
  skip(n: number, what: string): void {
    this.need(n, what);
    this.pos += n;
  }
}

interface RawVar {
  /** 1-based dictionary index (continuation records count). */
  dictIndex: number;
  /** 0 = numeric, otherwise string width in bytes. */
  width: number;
  shortName: Uint8Array;
  label: Uint8Array | null;
  nMissing: number;
  missing: Uint8Array[];
  print: number;
  /** Byte offset of this variable within a case. */
  offset: number;
  /** Number of 8-byte elements (1 + continuation records). */
  nElements: number;
}

interface RawValueLabelSet {
  labels: Array<{ value: Uint8Array; label: Uint8Array }>;
  dictIndices: number[];
}

interface LongStringLabels {
  name: Uint8Array;
  width: number;
  labels: Array<{ value: Uint8Array; label: Uint8Array }>;
}

interface LongStringMissing {
  name: Uint8Array;
  values: Uint8Array[];
}

interface Dictionary {
  le: boolean;
  zsav: boolean;
  compression: number;
  nominalCaseSize: number;
  weightIndex: number;
  nCasesHeader: number;
  bias: number;
  fileLabel: Uint8Array;
  vars: RawVar[];
  caseBytes: number;
  valueLabelSets: RawValueLabelSet[];
  documents: Uint8Array[];
  codepage: number | null;
  sysmis: number;
  highest: number;
  lowest: number;
  display: number[] | null;
  longNames: Uint8Array | null;
  veryLongStrings: Uint8Array | null;
  nCases64: number | null;
  varAttributes: Uint8Array | null;
  encodingName: string | null;
  longStringLabels: LongStringLabels[];
  longStringMissing: LongStringMissing[];
  mrSets: number;
  dataStart: number;
}

function ascii(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

function readHeader(bytes: Uint8Array, warnings: string[]): { cur: Cursor; dict: Partial<Dictionary> } {
  if (bytes.length < 176) {
    if (bytes.length >= 4 && (ascii(bytes.subarray(0, 4)) === '$FL2' || ascii(bytes.subarray(0, 4)) === '$FL3')) {
      throw new SavFormatError('The file ended unexpectedly while reading the file header. It may be truncated or damaged.');
    }
    throw new SavFormatError('This is not an SPSS data file (.sav): the file is too short.');
  }
  const magic = ascii(bytes.subarray(0, 4));
  if (magic !== '$FL2' && magic !== '$FL3') {
    throw new SavFormatError('This is not an SPSS data file (.sav): the file does not start with the SPSS signature.');
  }
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let le: boolean;
  const layoutLE = dv.getInt32(64, true);
  const layoutBE = dv.getInt32(64, false);
  if (layoutLE === 2 || layoutLE === 3) le = true;
  else if (layoutBE === 2 || layoutBE === 3) le = false;
  else throw new SavFormatError('This SPSS file has an unrecognised layout code, so its byte order cannot be determined. The file may be damaged.');
  const cur = new Cursor(bytes, le);
  cur.pos = 68;
  const nominalCaseSize = cur.i32('the file header');
  const compression = cur.i32('the file header');
  const weightIndex = cur.i32('the file header');
  const nCasesHeader = cur.i32('the file header');
  const bias = cur.f64('the file header');
  cur.skip(17, 'the file header'); // creation date (9) + time (8)
  const fileLabel = cur.take(64, 'the file header');
  cur.skip(3, 'the file header');
  if (compression !== 0 && compression !== 1 && compression !== 2) {
    throw new SavFormatError(`This SPSS file uses an unknown compression method (${compression}). It may be damaged or written by an unsupported program.`);
  }
  if (magic === '$FL3' && compression !== 2) warnings.push('The file is marked as a compressed .zsav file but its header says otherwise; it was read according to the header.');
  if (magic === '$FL2' && compression === 2) warnings.push('The file uses zlib compression (.zsav) but has a .sav signature; it was read as .zsav.');
  let b = bias;
  if (compression === 1 || compression === 2) {
    if (!Number.isFinite(bias) || bias !== Math.round(bias) || bias < 0 || bias > 251) {
      warnings.push(`The file header has an unusual compression bias (${bias}); the standard value 100 was used.`);
      b = 100;
    }
  }
  return {
    cur,
    dict: { le, zsav: compression === 2, compression, nominalCaseSize, weightIndex, nCasesHeader, bias: b, fileLabel },
  };
}

function readDictionary(bytes: Uint8Array, warnings: string[]): Dictionary {
  const { cur, dict: head } = readHeader(bytes, warnings);
  const d: Dictionary = {
    ...(head as Dictionary),
    vars: [],
    caseBytes: 0,
    valueLabelSets: [],
    documents: [],
    codepage: null,
    sysmis: DEFAULT_SYSMIS,
    highest: DEFAULT_HIGHEST,
    lowest: DEFAULT_LOWEST,
    display: null,
    longNames: null,
    veryLongStrings: null,
    nCases64: null,
    varAttributes: null,
    encodingName: null,
    longStringLabels: [],
    longStringMissing: [],
    mrSets: 0,
    dataStart: 0,
  };
  let dictIndex = 0;
  let elements = 0;
  let pendingContinuations = 0;
  let lastString: RawVar | null = null;

  for (;;) {
    const recStart = cur.pos;
    const recType = cur.i32('the variable dictionary');
    if (recType === 2) {
      const type = cur.i32('a variable record');
      const hasLabel = cur.i32('a variable record');
      const nMissing = cur.i32('a variable record');
      const print = cur.i32('a variable record');
      cur.i32('a variable record'); // write format
      const shortName = cur.take(8, 'a variable record');
      let label: Uint8Array | null = null;
      if (hasLabel !== 0 && hasLabel !== 1) throw new SavFormatError(`A variable record at byte ${recStart} is damaged (bad label flag).`);
      if (hasLabel === 1) {
        const len = cur.i32('a variable label');
        if (len < 0 || len > 65535) throw new SavFormatError(`A variable label at byte ${cur.pos} has an impossible length (${len}). The file is damaged.`);
        label = cur.take(len, 'a variable label');
        cur.skip((4 - (len % 4)) % 4, 'a variable label');
      }
      dictIndex++;
      if (type === -1) {
        if (!lastString || pendingContinuations <= 0) {
          // PSPP tolerates stray continuation records; keep the element so offsets stay right.
          if (!lastString) throw new SavFormatError(`The dictionary has a string continuation record (at byte ${recStart}) with no string variable before it. The file is damaged.`);
          const msg = 'The dictionary has more string continuation records than expected; the file may be damaged.';
          if (!warnings.includes(msg)) warnings.push(msg);
        }
        lastString.nElements++;
        pendingContinuations--;
        elements++;
        if (nMissing !== 0) cur.skip(Math.abs(nMissing) * 8, 'missing values');
        continue;
      }
      if (pendingContinuations > 0) {
        warnings.push(`String variable ${ascii(lastString!.shortName).trim()} has fewer continuation records than its width needs; the file may be damaged.`);
      }
      if (type < 0 || type > 255) throw new SavFormatError(`A variable record at byte ${recStart} has an invalid type code (${type}). The file is damaged.`);
      let nm = nMissing;
      if (type === 0) {
        if (nm !== 0 && nm !== 1 && nm !== 2 && nm !== 3 && nm !== -2 && nm !== -3) throw new SavFormatError(`A numeric variable at byte ${recStart} has an invalid missing-value count (${nm}). The file is damaged.`);
      } else if (nm < 0 || nm > 3) {
        throw new SavFormatError(`A string variable at byte ${recStart} has an invalid missing-value count (${nm}). The file is damaged.`);
      }
      const missing: Uint8Array[] = [];
      for (let k = 0; k < Math.abs(nm); k++) missing.push(cur.take(8, 'missing values'));
      const v: RawVar = { dictIndex, width: type, shortName, label, nMissing: nm, missing, print, offset: elements * 8, nElements: 1 };
      d.vars.push(v);
      elements++;
      if (type > 0) {
        lastString = v;
        pendingContinuations = Math.ceil(type / 8) - 1;
      } else {
        lastString = null;
        pendingContinuations = 0;
      }
    } else if (recType === 3) {
      const count = cur.i32('a value label record');
      if (count < 0) throw new SavFormatError(`A value label record at byte ${recStart} is damaged (negative count).`);
      cur.need(count * 9, 'a value label record');
      const labels: RawValueLabelSet['labels'] = [];
      for (let k = 0; k < count; k++) {
        const value = cur.take(8, 'a value label');
        const len = cur.u8('a value label');
        const label = cur.take(len, 'a value label');
        cur.skip((8 - ((len + 1) % 8)) % 8, 'a value label');
        labels.push({ value, label });
      }
      const rt = cur.i32('a value label record');
      if (rt !== 4) throw new SavFormatError(`A value label record at byte ${recStart} is not followed by its variable list. The file is damaged.`);
      const nv = cur.i32('a value label variable list');
      if (nv < 0) throw new SavFormatError(`A value label variable list at byte ${cur.pos} is damaged.`);
      cur.need(nv * 4, 'a value label variable list');
      const dictIndices: number[] = [];
      for (let k = 0; k < nv; k++) dictIndices.push(cur.i32('a value label variable list'));
      d.valueLabelSets.push({ labels, dictIndices });
    } else if (recType === 4) {
      throw new SavFormatError(`A value label variable list at byte ${recStart} has no value labels before it. The file is damaged.`);
    } else if (recType === 6) {
      const n = cur.i32('the documents record');
      if (n < 0) throw new SavFormatError('The documents record is damaged (negative line count).');
      cur.need(n * 80, 'the documents record');
      for (let k = 0; k < n; k++) d.documents.push(cur.take(80, 'the documents record'));
    } else if (recType === 7) {
      const subtype = cur.i32('an extension record');
      const size = cur.i32('an extension record');
      const count = cur.i32('an extension record');
      if (size < 0 || count < 0) throw new SavFormatError(`An extension record (subtype ${subtype}) at byte ${recStart} is damaged.`);
      const total = size * count;
      const body = cur.take(total, `an extension record (subtype ${subtype})`);
      readExtension(d, subtype, size, count, body, warnings);
    } else if (recType === 999) {
      cur.i32('the end of the dictionary');
      break;
    } else {
      throw new SavFormatError(`The dictionary contains an unknown record type (${recType}) at byte ${recStart}. The file is damaged or not an SPSS data file.`);
    }
  }
  if (pendingContinuations > 0 && lastString) {
    warnings.push(`String variable ${ascii(lastString.shortName).trim()} has fewer continuation records than its width needs; the file may be damaged.`);
  }
  d.caseBytes = elements * 8;
  if (d.nominalCaseSize !== -1 && d.nominalCaseSize !== elements) {
    warnings.push(`The file header says each case has ${d.nominalCaseSize} data elements but the dictionary defines ${elements}; the dictionary was used.`);
  }
  d.dataStart = cur.pos;
  return d;
}

function readExtension(d: Dictionary, subtype: number, size: number, count: number, body: Uint8Array, warnings: string[]): void {
  const dv = new DataView(body.buffer, body.byteOffset, body.byteLength);
  switch (subtype) {
    case 3: // machine integer info
      if (size === 4 && count >= 8) d.codepage = dv.getInt32(28, d.le);
      break;
    case 4: // machine floating-point info
      if (size === 8 && count >= 3) {
        const sysmis = dv.getFloat64(0, d.le);
        const highest = dv.getFloat64(8, d.le);
        const lowest = dv.getFloat64(16, d.le);
        if (!Number.isNaN(sysmis)) d.sysmis = sysmis;
        if (!Number.isNaN(highest)) d.highest = highest;
        if (!Number.isNaN(lowest)) d.lowest = lowest;
      }
      break;
    case 11: // variable display parameters
      if (size === 4) {
        const vals: number[] = [];
        for (let k = 0; k < count; k++) vals.push(dv.getInt32(k * 4, d.le));
        d.display = vals;
      }
      break;
    case 13:
      d.longNames = body;
      break;
    case 14:
      d.veryLongStrings = body;
      break;
    case 16:
      if (size === 8 && count === 2) {
        const c = new Cursor(body, d.le);
        c.i64('the case count record');
        d.nCases64 = c.i64('the case count record');
      }
      break;
    case 18:
      d.varAttributes = body;
      break;
    case 20:
      d.encodingName = ascii(body).replace(/\0+$/, '').trim() || null;
      break;
    case 21:
      if (size === 1) parseLongStringLabels(d, body, warnings);
      break;
    case 22:
      if (size === 1) parseLongStringMissing(d, body, warnings);
      break;
    case 7:
    case 19:
      // Multiple response sets: Socius has no equivalent; count them so the user is told.
      d.mrSets += ascii(body).split('\n').filter((l) => l.trim().startsWith('$')).length;
      break;
    default:
      // 5 variable sets, 6 trends, 10 product info, 12 UUID, 17 file attributes, 24 XML, others:
      // not needed by Socius and safe to skip (the body was already consumed by size * count).
      break;
  }
}

function parseLongStringLabels(d: Dictionary, body: Uint8Array, warnings: string[]): void {
  const c = new Cursor(body, d.le);
  try {
    while (c.pos < body.length) {
      const nameLen = c.i32('long string value labels');
      const name = c.take(nameLen, 'long string value labels');
      const width = c.i32('long string value labels');
      const n = c.i32('long string value labels');
      if (n < 0) throw new SavFormatError('negative label count');
      const labels: LongStringLabels['labels'] = [];
      for (let k = 0; k < n; k++) {
        const vlen = c.i32('long string value labels');
        const value = c.take(vlen, 'long string value labels');
        const llen = c.i32('long string value labels');
        const label = c.take(llen, 'long string value labels');
        labels.push({ value, label });
      }
      d.longStringLabels.push({ name, width, labels });
    }
  } catch {
    warnings.push('Some value labels for long string variables could not be read (the record is damaged) and were skipped.');
  }
}

function parseLongStringMissing(d: Dictionary, body: Uint8Array, warnings: string[]): void {
  const c = new Cursor(body, d.le);
  try {
    while (c.pos < body.length) {
      const nameLen = c.i32('long string missing values');
      const name = c.take(nameLen, 'long string missing values');
      const n = c.u8('long string missing values');
      const vlen = c.i32('long string missing values');
      if (n > 3 || vlen < 0) throw new SavFormatError('bad record');
      const values: Uint8Array[] = [];
      for (let k = 0; k < n; k++) values.push(c.take(vlen, 'long string missing values'));
      d.longStringMissing.push({ name, values });
    }
  } catch {
    warnings.push('Some missing-value definitions for long string variables could not be read (the record is damaged) and were skipped.');
  }
}

// ---------------------------------------------------------------------------------------------
// Encoding

function collectDictionaryText(d: Dictionary): Uint8Array[] {
  const parts: Uint8Array[] = [d.fileLabel];
  const stringIndex = new Set<number>();
  for (const v of d.vars) {
    parts.push(v.shortName);
    if (v.label) parts.push(v.label);
    if (v.width > 0) {
      stringIndex.add(v.dictIndex);
      parts.push(...v.missing);
    }
  }
  for (const s of d.valueLabelSets) {
    const isString = s.dictIndices.length > 0 && stringIndex.has(s.dictIndices[0]);
    for (const l of s.labels) {
      parts.push(l.label);
      if (isString) parts.push(l.value);
    }
  }
  for (const m of d.longStringMissing) parts.push(m.name, ...m.values);
  for (const doc of d.documents) parts.push(doc);
  if (d.longNames) parts.push(d.longNames);
  if (d.varAttributes) parts.push(d.varAttributes);
  for (const s of d.longStringLabels) for (const l of s.labels) parts.push(l.value, l.label);
  return parts;
}

interface EncodingChoice {
  label: string;
  decoder: TextDecoder;
  /** True when nothing in the file names the encoding and the dictionary was pure ASCII. */
  guessedFromAscii: boolean;
}

function chooseEncoding(d: Dictionary, override: string | undefined, warnings: string[]): EncodingChoice {
  const tryLabel = (label: string): TextDecoder | null => makeDecoder(label);
  if (d.encodingName) {
    const label = normalizeEncodingName(d.encodingName);
    const dec = tryLabel(label);
    if (dec) return { label, decoder: dec, guessedFromAscii: false };
    warnings.push(`The file says its text encoding is "${d.encodingName}", which this browser cannot decode; text was read as Windows-1252 and some characters may look wrong.`);
    return { label: 'windows-1252', decoder: new TextDecoder('windows-1252'), guessedFromAscii: false };
  }
  if (override) {
    const label = normalizeEncodingName(override);
    const dec = tryLabel(label);
    if (!dec) throw new SavFormatError(`The text encoding "${override}" is not supported by this browser. Try "utf-8" or "windows-1252".`);
    return { label, decoder: dec, guessedFromAscii: false };
  }
  if (d.codepage !== null) {
    const label = encodingForCodepage(d.codepage);
    if (label) {
      const dec = tryLabel(label);
      if (dec) return { label, decoder: dec, guessedFromAscii: false };
    }
  }
  const parts = collectDictionaryText(d);
  let allAscii = true;
  let validUtf8 = true;
  for (const p of parts) {
    if (!isAscii(p, 0, p.length)) {
      allAscii = false;
      if (!isValidUtf8(p)) {
        validUtf8 = false;
        break;
      }
    }
  }
  if (allAscii) return { label: 'utf-8', decoder: new TextDecoder('utf-8', { fatal: true }), guessedFromAscii: true };
  if (validUtf8) {
    warnings.push('The file does not state its text encoding; it was read as UTF-8.');
    return { label: 'utf-8', decoder: new TextDecoder('utf-8'), guessedFromAscii: false };
  }
  warnings.push('The file does not state its text encoding and is not UTF-8, so it was read as Windows-1252 (Western European). If letters look wrong, re-import it with the correct encoding.');
  return { label: 'windows-1252', decoder: new TextDecoder('windows-1252'), guessedFromAscii: false };
}

// ---------------------------------------------------------------------------------------------
// Dictionary -> Variables

interface Segment {
  offset: number;
  length: number;
}

interface LogicalVar {
  variable: Variable;
  raw: RawVar;
  /** For strings: byte runs to concatenate (one per very-long-string segment). */
  segments: Segment[];
  totalWidth: number;
  /** True when the measure level came from the display record. */
  measureSet: boolean;
}

const MEASURES: Record<number, MeasureLevel> = { 1: 'nominal', 2: 'ordinal', 3: 'scale' };
const ALIGNS: Record<number, Alignment> = { 0: 'left', 1: 'right', 2: 'center' };
const ROLES: Record<string, VarRole> = { '0': 'input', '1': 'target', '2': 'both', '3': 'none', '4': 'partition', '5': 'split' };

function decodeFull(dec: TextDecoder, b: Uint8Array): string {
  return decodeTrimmed(dec, b, 0, b.length);
}

function parseKeyValueRecord(text: string, sep: RegExp): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const part of text.split(sep)) {
    const p = part.replace(/\0/g, '');
    if (!p) continue;
    const eq = p.indexOf('=');
    if (eq <= 0) continue;
    out.push([p.slice(0, eq), p.slice(eq + 1)]);
  }
  return out;
}

/** Parse subtype 18 text: `name:attr('v'\n'v2'\n)attr2('x'\n)/name2:...`. */
export function parseVariableAttributes(text: string): Map<string, Record<string, string>> {
  const result = new Map<string, Record<string, string>>();
  let i = 0;
  const n = text.length;
  while (i < n) {
    const colon = text.indexOf(':', i);
    if (colon < 0) break;
    const varName = text.slice(i, colon);
    i = colon + 1;
    const attrs: Record<string, string> = {};
    while (i < n && text[i] !== '/') {
      const paren = text.indexOf('(', i);
      if (paren < 0) {
        i = n;
        break;
      }
      const attrName = text.slice(i, paren);
      i = paren + 1;
      const values: string[] = [];
      while (i < n && text[i] !== ')') {
        const nl = text.indexOf('\n', i);
        const end = nl < 0 ? n : nl;
        let val = text.slice(i, end);
        if (val.length >= 2 && val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        values.push(val);
        i = end + 1;
      }
      i++; // ')'
      if (values.length === 1) attrs[attrName] = values[0];
      else values.forEach((val, k) => (attrs[`${attrName}[${k + 1}]`] = val));
    }
    if (text[i] === '/') i++;
    result.set(varName, attrs);
  }
  return result;
}

function buildVariables(d: Dictionary, enc: EncodingChoice, warnings: string[]): { logical: LogicalVar[]; byDictIndex: Map<number, LogicalVar> } {
  const dictDecoder = enc.guessedFromAscii ? new TextDecoder('utf-8') : enc.decoder;
  const text = (b: Uint8Array) => decodeFull(dictDecoder, b);

  // Long names: SHORT=Long<TAB>...
  const longNames = new Map<string, string>();
  if (d.longNames) for (const [k, v] of parseKeyValueRecord(text(d.longNames), /\t/)) longNames.set(k.toUpperCase(), v);
  // Very long strings: SHORT=00600\0<TAB>...
  const vls = new Map<string, number>();
  if (d.veryLongStrings) {
    for (const [k, v] of parseKeyValueRecord(ascii(d.veryLongStrings), /\t/)) {
      const w = parseInt(v, 10);
      if (Number.isFinite(w) && w > 255) vls.set(k.toUpperCase(), w);
    }
  }

  const logical: LogicalVar[] = [];
  const byDictIndex = new Map<number, LogicalVar>();
  // Index of each non-continuation raw record, for subtype 11 display parameters.
  const displayIndexOf = new Map<RawVar, number>();
  d.vars.forEach((rv, k) => displayIndexOf.set(rv, k));

  const badFormats: string[] = [];
  for (let k = 0; k < d.vars.length; k++) {
    const rv = d.vars[k];
    const short = text(rv.shortName);
    const shortKey = short.toUpperCase();
    let width = rv.width;
    const segments: Segment[] = [];
    if (rv.width > 0 && vls.has(shortKey)) {
      const total = vls.get(shortKey)!;
      const nSeg = Math.ceil(total / 252);
      if (k + nSeg - 1 >= d.vars.length) {
        warnings.push(`Very long string variable ${short} is missing some of its segments; it was read as a ${rv.width}-byte string.`);
        segments.push({ offset: rv.offset, length: Math.min(rv.width, rv.nElements * 8) });
      } else {
        let remaining = total;
        let ok = true;
        for (let s = 0; s < nSeg; s++) {
          const seg = d.vars[k + s];
          if (seg.width <= 0) {
            ok = false;
            break;
          }
          const len = Math.min(255, seg.width, seg.nElements * 8, remaining);
          segments.push({ offset: seg.offset, length: len });
          remaining -= len;
        }
        if (ok) {
          width = total;
          k += nSeg - 1;
        } else {
          warnings.push(`Very long string variable ${short} has a numeric variable where a string segment was expected; it was read as a ${rv.width}-byte string.`);
          segments.length = 0;
          segments.push({ offset: rv.offset, length: Math.min(rv.width, rv.nElements * 8) });
        }
      }
    } else if (rv.width > 0) {
      segments.push({ offset: rv.offset, length: Math.min(rv.width, rv.nElements * 8) });
    }

    const name = longNames.get(shortKey) ?? short;
    const isString = rv.width > 0;
    const { typeCode, width: fw, decimals: fd } = unpackFormat(rv.print);
    let format: string;
    let dispWidth: number;
    let decimals: number;
    if (isString) {
      format = typeCode === 2 ? `AHEX${width * 2}` : `A${width}`;
      dispWidth = width;
      decimals = 0;
    } else {
      const f = formatToString(typeCode, fw, fd);
      if (!f || typeCode === 1 || typeCode === 2 || fw === 0) {
        format = `F${Math.max(1, Math.min(40, fw || 8))}.${Math.min(fd, 16)}`;
        badFormats.push(name);
        dispWidth = Math.max(1, fw || 8);
        decimals = Math.min(fd, 16);
      } else {
        format = f;
        dispWidth = fw;
        decimals = fd;
      }
    }

    const variable: Variable = {
      id: newId('v'),
      name,
      label: rv.label ? text(rv.label) : '',
      type: isString ? 'string' : 'numeric',
      width: dispWidth,
      decimals,
      format,
      measure: 'scale',
      role: 'input',
      align: isString ? 'left' : 'right',
      columns: Math.max(1, Math.min(255, isString ? Math.min(width, 40) : dispWidth)),
      valueLabels: [],
      missing: readMissing(rv, d, dictDecoder, isString),
    };
    const lv: LogicalVar = { variable, raw: rv, segments, totalWidth: width, measureSet: false };
    logical.push(lv);
    byDictIndex.set(rv.dictIndex, lv);
  }

  if (badFormats.length) {
    warnings.push(`${listNames(badFormats)} had an unrecognised display format; F format was used instead.`);
  }

  // Names must be unique (case-insensitive); damaged or hand-edited files can break that.
  const seen = new Set<string>();
  const renamed: string[] = [];
  for (const lv of logical) {
    const v = lv.variable;
    if (!v.name.trim()) v.name = `VAR${String(logical.indexOf(lv) + 1).padStart(5, '0')}`;
    if (seen.has(v.name.toUpperCase())) {
      let i = 1;
      while (seen.has(`${v.name}_${i}`.toUpperCase())) i++;
      renamed.push(`${v.name} -> ${v.name}_${i}`);
      v.name = `${v.name}_${i}`;
    }
    seen.add(v.name.toUpperCase());
  }
  if (renamed.length) warnings.push(`Some variable names appeared twice and were made unique: ${renamed.join(', ')}.`);

  // Display parameters (subtype 11): one set per variable record, very long string segments
  // included. Some writers emit one set per logical variable instead; accept that too.
  if (d.display) {
    const len = d.display.length;
    const nRaw = d.vars.length;
    const nLogical = logical.length;
    let per = 0;
    let byRaw = true;
    if (len === nRaw * 3) per = 3;
    else if (len === nRaw * 2) per = 2;
    else if (len === nLogical * 3) [per, byRaw] = [3, false];
    else if (len === nLogical * 2) [per, byRaw] = [2, false];
    if (per === 0) {
      warnings.push('The variable display settings (measure, column width, alignment) did not match the variable list and were ignored.');
    } else {
      logical.forEach((lv, li) => {
        const variable = lv.variable;
        const di = (byRaw ? displayIndexOf.get(lv.raw)! : li) * per;
        const m = MEASURES[d.display![di]];
        if (m) {
          variable.measure = m;
          lv.measureSet = true;
        }
        if (per === 3) {
          const cols = d.display![di + 1];
          if (cols > 0 && cols < 32768) variable.columns = cols;
        }
        const a = ALIGNS[d.display![di + per - 1]];
        if (a) variable.align = a;
      });
    }
  }

  // Value labels (types 3/4).
  let badLabelRefs = 0;
  for (const set of d.valueLabelSets) {
    for (const idx of set.dictIndices) {
      const lv = byDictIndex.get(idx);
      if (!lv) {
        badLabelRefs++;
        continue;
      }
      const v = lv.variable;
      const numeric = v.type === 'numeric';
      for (const l of set.labels) {
        let value: number | string;
        if (numeric) {
          const x = new DataView(l.value.buffer, l.value.byteOffset, 8).getFloat64(0, d.le);
          if (Number.isNaN(x) || x === d.sysmis) continue;
          value = x;
        } else {
          value = text(l.value);
        }
        upsertLabel(v.valueLabels, value, text(l.label));
      }
    }
  }
  if (badLabelRefs) warnings.push(`${badLabelRefs} value label set(s) referred to variables that do not exist and were skipped.`);

  const byName = new Map<string, LogicalVar>();
  for (const lv of logical) byName.set(lv.variable.name.toUpperCase(), lv);
  const findByNameBytes = (b: Uint8Array) => byName.get(text(b).toUpperCase());

  // Long string value labels (subtype 21).
  for (const rec of d.longStringLabels) {
    const lv = findByNameBytes(rec.name);
    if (!lv || lv.variable.type !== 'string') {
      warnings.push(`Value labels for an unknown long string variable "${text(rec.name)}" were skipped.`);
      continue;
    }
    for (const l of rec.labels) upsertLabel(lv.variable.valueLabels, text(l.value), text(l.label));
  }
  // Long string missing values (subtype 22).
  for (const rec of d.longStringMissing) {
    const lv = findByNameBytes(rec.name);
    if (!lv || lv.variable.type !== 'string') {
      warnings.push(`Missing values for an unknown long string variable "${text(rec.name)}" were skipped.`);
      continue;
    }
    lv.variable.missing = { discrete: rec.values.map((b) => text(b)) };
  }

  // Variable attributes (subtype 18), incl. SPSS roles ($@Role).
  if (d.varAttributes) {
    try {
      const attrs = parseVariableAttributes(text(d.varAttributes));
      for (const [vn, a] of attrs) {
        const lv = byName.get(vn.toUpperCase());
        if (!lv) continue;
        const custom: Record<string, string> = {};
        for (const [key, val] of Object.entries(a)) {
          if (key === '$@Role') {
            const r = ROLES[val.trim()];
            if (r) lv.variable.role = r;
          } else custom[key] = val;
        }
        if (Object.keys(custom).length) lv.variable.attributes = custom;
      }
    } catch {
      warnings.push('Custom variable attributes could not be read and were skipped.');
    }
  }

  // Measure fallback when no display record: strings and labelled numerics are nominal.
  for (const lv of logical) {
    if (!lv.measureSet) {
      const v = lv.variable;
      v.measure = v.type === 'string' || v.valueLabels.length > 0 ? 'nominal' : 'scale';
    }
  }
  return { logical, byDictIndex };
}

function listNames(names: string[]): string {
  const shown = names.slice(0, 5).join(', ');
  return names.length === 1 ? `Variable ${shown}` : `${names.length} variables (${shown}${names.length > 5 ? ', ...' : ''})`;
}

function upsertLabel(list: ValueLabel[], value: number | string, label: string): void {
  const i = list.findIndex((x) => x.value === value);
  if (i >= 0) list[i] = { value, label };
  else list.push({ value, label });
}

function readMissing(rv: RawVar, d: Dictionary, dec: TextDecoder, isString: boolean): MissingSpec {
  if (rv.nMissing === 0) return { discrete: [] };
  if (isString) return { discrete: rv.missing.map((b) => decodeFull(dec, b)) };
  const nums = rv.missing.map((b) => new DataView(b.buffer, b.byteOffset, 8).getFloat64(0, d.le));
  if (rv.nMissing > 0) return { discrete: nums };
  let lo = nums[0];
  let hi = nums[1];
  // SPSS writes LO as its LOWEST value (0xffeffffffffffffe); some writers use -DBL_MAX or the
  // subtype 4 value. Anything at or below LOWEST means LO; likewise for HI.
  if (lo <= d.lowest || lo <= DEFAULT_LOWEST) lo = -Infinity;
  if (hi >= d.highest || hi >= DEFAULT_HIGHEST) hi = Infinity;
  const spec: MissingSpec = { discrete: [], range: { lo, hi } };
  if (rv.nMissing === -3) spec.discrete.push(nums[2]);
  return spec;
}

// ---------------------------------------------------------------------------------------------
// Data

interface Plan {
  numOffsets: Int32Array;
  numCols: Float64Array[];
  numVars: LogicalVar[];
  strVars: LogicalVar[];
  strCols: string[][];
}

function makePlan(logical: LogicalVar[], capacity: number): Plan {
  const numVars = logical.filter((l) => l.variable.type === 'numeric');
  const strVars = logical.filter((l) => l.variable.type === 'string');
  return {
    numOffsets: Int32Array.from(numVars.map((l) => l.raw.offset)),
    numCols: numVars.map(() => new Float64Array(capacity)),
    numVars,
    strVars,
    strCols: strVars.map(() => []),
  };
}

function growPlan(p: Plan, capacity: number): void {
  for (let j = 0; j < p.numCols.length; j++) {
    const next = new Float64Array(capacity);
    next.set(p.numCols[j]);
    p.numCols[j] = next;
  }
}

/**
 * Decodes string cells, remembering values already seen in the column. Survey string variables are
 * mostly categorical, so most cells are repeats; hashing the bytes is much cheaper than decoding.
 * Columns that turn out to be mostly unique stop using the cache.
 */
class StringCache {
  private buckets = new Map<number, Array<{ bytes: Uint8Array; text: string }>>();
  private stored = 0;
  private hits = 0;
  private misses = 0;
  private enabled = true;
  constructor(private readonly decoder: TextDecoder) {}

  decode(buf: Uint8Array, start: number, end: number): string {
    while (end > start && (buf[end - 1] === 0x20 || buf[end - 1] === 0)) end--;
    if (end === start) return '';
    if (!this.enabled) return decodeTrimmed(this.decoder, buf, start, end);
    let h = 0x811c9dc5;
    for (let i = start; i < end; i++) h = Math.imul(h ^ buf[i], 16777619);
    const len = end - start;
    const bucket = this.buckets.get(h);
    if (bucket) {
      for (const entry of bucket) {
        const b = entry.bytes;
        if (b.length !== len) continue;
        let same = true;
        for (let i = 0; i < len; i++) {
          if (b[i] !== buf[start + i]) {
            same = false;
            break;
          }
        }
        if (same) {
          this.hits++;
          return entry.text;
        }
      }
    }
    this.misses++;
    const text = decodeTrimmed(this.decoder, buf, start, end);
    if (this.stored < 4096) {
      const entry = { bytes: buf.slice(start, end), text };
      if (bucket) bucket.push(entry);
      else this.buckets.set(h, [entry]);
      this.stored++;
    } else if (this.misses > 4 * this.hits) {
      this.enabled = false;
      this.buckets.clear();
    }
    return text;
  }
}

function readData(d: Dictionary, bytes: Uint8Array, logical: LogicalVar[], decoder: TextDecoder, warnings: string[]): { plan: Plan; nCases: number } {
  const le = d.le;
  const caseBytes = d.caseBytes;
  const sysmis = d.sysmis;
  let declared = d.nCasesHeader;
  if (declared < 0 && d.nCases64 !== null && d.nCases64 >= 0) declared = d.nCases64;
  if (declared < 0) declared = -1;

  let src = bytes;
  let start = d.dataStart;
  let end = bytes.length;
  if (d.compression === 2) {
    const z = inflateZsav(d, bytes, warnings);
    src = z;
    start = 0;
    end = z.length;
  }
  const srcDv = new DataView(src.buffer, src.byteOffset, src.byteLength);

  let capacity: number;
  if (caseBytes === 0) capacity = 0;
  else if (d.compression === 0) capacity = Math.floor((end - start) / caseBytes);
  else {
    // A compressed case needs at least one code byte per 8-byte element, which bounds the count
    // (and protects against absurd case counts in damaged headers).
    const maxCases = Math.floor(((end - start) * 8) / (caseBytes / 8)) + 1;
    capacity = declared >= 0 ? Math.min(declared, maxCases) : Math.max(16, Math.min(1 << 20, Math.floor((end - start) / Math.max(8, caseBytes / 4))));
  }
  if (declared >= 0 && d.compression === 0) capacity = Math.min(capacity, declared);
  if (declared >= 0 && d.compression === 0 && caseBytes > 0) {
    const available = Math.floor((end - start) / caseBytes);
    if (available < declared) {
      throw new SavFormatError(`The file is truncated: the header promises ${declared} cases but the data holds only ${available}. The file may be an incomplete download or damaged.`);
    }
  }
  const plan = makePlan(logical, capacity);
  const { numOffsets, numCols, strVars, strCols } = plan;
  const nNum = numOffsets.length;
  const nStr = strVars.length;
  const strSegs = strVars.map((l) => l.segments);
  const scratch = new Uint8Array(strVars.reduce((m, l) => Math.max(m, l.totalWidth + 8), 8));
  const caches = strVars.map(() => new StringCache(decoder));

  const extractStrings = (buf: Uint8Array, base: number) => {
    for (let j = 0; j < nStr; j++) {
      const segs = strSegs[j];
      let s: string;
      if (segs.length === 1) {
        const o = base + segs[0].offset;
        s = caches[j].decode(buf, o, o + segs[0].length);
      } else {
        // IBM SPSS never splits a character across segments: it ends the segment early and fills
        // the rest with NUL bytes, which must be dropped before joining the segments.
        let n = 0;
        for (let q = 0; q < segs.length; q++) {
          const o = base + segs[q].offset;
          let e = o + segs[q].length;
          if (q < segs.length - 1) while (e > o && buf[e - 1] === 0) e--;
          scratch.set(buf.subarray(o, e), n);
          n += e - o;
        }
        s = caches[j].decode(scratch, 0, n);
      }
      strCols[j].push(s);
    }
  };
  const extract = (buf: Uint8Array, dv: DataView, base: number, row: number) => {
    for (let j = 0; j < nNum; j++) {
      const x = dv.getFloat64(base + numOffsets[j], le);
      numCols[j][row] = x === sysmis ? NaN : x;
    }
    extractStrings(buf, base);
  };

  let row = 0;
  if (caseBytes === 0) {
    return { plan, nCases: 0 };
  }
  if (d.compression === 0) {
    const n = declared >= 0 ? declared : Math.floor((end - start) / caseBytes);
    if (declared < 0 && (end - start) % caseBytes !== 0) {
      warnings.push('The data ends with an incomplete case, which was ignored.');
    }
    for (row = 0; row < n; row++) extract(src, srcDv, start + row * caseBytes, row);
    return { plan, nCases: n };
  }

  // Bytecode decompression (also the inner layer of zsav). Numeric elements go straight into
  // their columns; string elements are assembled in a row buffer and decoded once per case.
  const bias = d.bias;
  const rowBuf = new Uint8Array(caseBytes);
  const nElem = caseBytes / 8;
  // Per element: index into numCols, or -1 for string elements.
  const elemNum = new Int32Array(nElem).fill(-1);
  for (let j = 0; j < nNum; j++) elemNum[numOffsets[j] / 8] = j;
  let pos = start;
  let codeBase = 0;
  let ci = 8;
  let ended = false;
  while (declared < 0 || row < declared) {
    if (row >= capacity) {
      capacity = Math.max(16, capacity * 2);
      growPlan(plan, capacity);
    }
    let e = 0;
    while (e < nElem) {
      if (ci === 8) {
        if (pos + 8 > end) {
          ended = true;
          break;
        }
        codeBase = pos;
        pos += 8;
        ci = 0;
      }
      const code = src[codeBase + ci++];
      if (code === 0) continue;
      if (code === 252) {
        ended = true;
        break;
      }
      const nc = elemNum[e];
      if (nc >= 0) {
        if (code === 253) {
          if (pos + 8 > end) {
            ended = true;
            break;
          }
          const x = srcDv.getFloat64(pos, le);
          pos += 8;
          numCols[nc][row] = x === sysmis ? NaN : x;
        } else if (code === 255 || code === 254) {
          numCols[nc][row] = NaN;
        } else {
          numCols[nc][row] = code - bias;
        }
      } else {
        const o = e * 8;
        if (code === 253) {
          if (pos + 8 > end) {
            ended = true;
            break;
          }
          rowBuf.set(src.subarray(pos, pos + 8), o);
          pos += 8;
        } else if (code === 254) {
          rowBuf.fill(0x20, o, o + 8);
        } else {
          // A number code or system-missing in a string element: SPSS never writes this; treat
          // the chunk as blank rather than inventing text.
          rowBuf.fill(0x20, o, o + 8);
        }
      }
      e++;
    }
    if (ended) {
      if (e > 0) {
        if (declared >= 0) {
          throw new SavFormatError(`The file is truncated: the header promises ${declared} cases but the data ends in the middle of case ${row + 1}. The file may be an incomplete download or damaged.`);
        }
        warnings.push(`The data ends in the middle of case ${row + 1}; that incomplete case was ignored.`);
      }
      break;
    }
    if (nStr) extractStrings(rowBuf, 0);
    row++;
  }
  if (declared >= 0 && row < declared) {
    throw new SavFormatError(`The file is truncated: the header promises ${declared} cases but the data holds only ${row}. The file may be an incomplete download or damaged.`);
  }
  return { plan, nCases: row };
}

function inflateZsav(d: Dictionary, bytes: Uint8Array, warnings: string[]): Uint8Array {
  const c = new Cursor(bytes, d.le);
  c.pos = d.dataStart;
  const zheaderOfs = c.i64('the compressed data header');
  const ztrailerOfs = c.i64('the compressed data header');
  const ztrailerLen = c.i64('the compressed data header');
  if (zheaderOfs !== d.dataStart) warnings.push('The compressed data header records an unexpected position; the file may have been modified.');
  if (ztrailerOfs < d.dataStart + 24 || ztrailerOfs + ztrailerLen > bytes.length || ztrailerLen < 24) {
    throw new SavFormatError('The compressed data index of this .zsav file points outside the file. The file is truncated or damaged.');
  }
  const t = new Cursor(bytes, d.le);
  t.pos = ztrailerOfs;
  t.i64('the compressed data index'); // bias
  t.i64('the compressed data index'); // zero
  t.i32('the compressed data index'); // block size
  const nBlocks = t.i32('the compressed data index');
  if (nBlocks < 0 || 24 + nBlocks * 24 !== ztrailerLen) {
    throw new SavFormatError('The compressed data index of this .zsav file is damaged.');
  }
  const blocks: Array<{ cOfs: number; uSize: number; cSize: number }> = [];
  let total = 0;
  for (let k = 0; k < nBlocks; k++) {
    t.i64('the compressed data index'); // uncompressed offset
    const cOfs = t.i64('the compressed data index');
    const uSize = t.i32('the compressed data index');
    const cSize = t.i32('the compressed data index');
    if (cOfs < 0 || cSize < 0 || uSize < 0 || cOfs + cSize > bytes.length) {
      throw new SavFormatError(`Compressed data block ${k + 1} of this .zsav file lies outside the file. The file is truncated or damaged.`);
    }
    blocks.push({ cOfs, uSize, cSize });
    total += uSize;
  }
  const out = new Uint8Array(total);
  let o = 0;
  blocks.forEach((b, k) => {
    let chunk: Uint8Array;
    try {
      chunk = unzlibSync(bytes.subarray(b.cOfs, b.cOfs + b.cSize));
    } catch {
      throw new SavFormatError(`Compressed data block ${k + 1} of this .zsav file is damaged and cannot be decompressed.`);
    }
    if (chunk.length !== b.uSize) {
      throw new SavFormatError(`Compressed data block ${k + 1} of this .zsav file has the wrong size after decompression. The file is damaged.`);
    }
    out.set(chunk, o);
    o += chunk.length;
  });
  return out;
}

// ---------------------------------------------------------------------------------------------

export function readSav(input: Uint8Array, opts: SavReadOptions = {}): SavReadResult {
  const warnings: string[] = [];
  const d = readDictionary(input, warnings);
  let enc = chooseEncoding(d, opts.encoding, warnings);
  const { logical, byDictIndex } = buildVariables(d, enc, warnings);

  let result: { plan: Plan; nCases: number };
  const dataWarnings: string[] = [];
  try {
    result = readData(d, input, logical, enc.decoder, dataWarnings);
  } catch (e) {
    // Only a fatal UTF-8 decoder (used when the dictionary gave no clue) throws TypeError here.
    if (!(e instanceof TypeError) || !enc.guessedFromAscii) throw e;
    // A fatal UTF-8 decoder threw: the text data is not UTF-8. Re-read it as Windows-1252.
    enc = { label: 'windows-1252', decoder: new TextDecoder('windows-1252'), guessedFromAscii: false };
    warnings.push('The file does not state its text encoding and its text is not UTF-8, so it was read as Windows-1252 (Western European). If letters look wrong, re-import it with the correct encoding.');
    dataWarnings.length = 0;
    result = readData(d, input, logical, enc.decoder, dataWarnings);
  }
  warnings.push(...dataWarnings);
  const { plan, nCases } = result;

  const columns: Record<string, Column> = {};
  plan.numVars.forEach((lv, j) => {
    const col = plan.numCols[j];
    columns[lv.variable.id] = col.length === nCases ? col : col.slice(0, nCases);
  });
  plan.strVars.forEach((lv, j) => {
    columns[lv.variable.id] = plan.strCols[j];
  });

  let weightVarId: string | null = null;
  if (d.weightIndex > 0) {
    const lv = byDictIndex.get(d.weightIndex);
    if (lv && lv.variable.type === 'numeric') weightVarId = lv.variable.id;
    else warnings.push('The file names a weight variable that does not exist or is not numeric; the data were loaded unweighted.');
  }

  if (d.mrSets > 0) {
    warnings.push(`This file defines ${d.mrSets} multiple response set(s). Socius does not use them, so they were not imported (the variables themselves were).`);
  }

  const textDecoder = enc.guessedFromAscii ? new TextDecoder('utf-8') : enc.decoder;
  const documents = d.documents.map((b) => decodeFull(textDecoder, b));
  const fileName = opts.fileName ?? '';
  const baseName = fileName.replace(/^.*[\\/]/, '').replace(/\.(z?sav)$/i, '') || 'Untitled';

  const dataset = makeDataset({
    name: baseName,
    fileLabel: decodeFull(textDecoder, d.fileLabel),
    variables: logical.map((l) => l.variable),
    columns,
    nCases,
    weightVarId,
    documents,
    source: { kind: d.zsav ? 'zsav' : 'sav', fileName: fileName || undefined, encoding: enc.label },
  });
  return { dataset, warnings };
}
