// SPSS system file (.sav / .zsav) writer. Produces files that SPSS (16 and later), PSPP, R haven
// and pyreadstat open: UTF-8 text (subtype 20 + code page 65001), long variable names, very long
// strings, long string value labels and missing values, display parameters and bytecode or zlib
// compression.

import { zlibSync } from 'fflate';
import type { Dataset, Variable } from '../../core/types';
import { encodeUtf8Truncated, truncateUtf8, utf8ByteLength, utf8Encoder } from './encoding';
import { formatToString, packFormat, packNumericFormat, unpackFormat } from './sav-formats';

export type SavCompression = 'none' | 'bytecode' | 'zsav';

export interface SavWriteOptions {
  compression?: SavCompression;
  /** Write big-endian numbers (SPSS on old Unix workstations did this). Default little-endian. */
  bigEndian?: boolean;
  /** Creation time stamped into the header (default: now). */
  now?: Date;
}

export interface SavWriteResult {
  bytes: Uint8Array;
  /** Things that could not be stored exactly, in plain language. */
  warnings: string[];
}

const BIAS = 100;
const SYSMIS = -Number.MAX_VALUE;
const HIGHEST = Number.MAX_VALUE;
const LOWEST = (() => {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setUint32(0, 0xffefffff);
  dv.setUint32(4, 0xfffffffe);
  return dv.getFloat64(0);
})();
const MAX_STRING = 32767;
const MAX_VAR_LABEL = 256;
const MAX_VALUE_LABEL = 120;
const ZBLOCK = 0x3ff000;
const SPACE8 = new Uint8Array(8).fill(0x20);

/** Growable byte buffer with typed writers. */
class ByteWriter {
  buf: Uint8Array;
  dv: DataView;
  len = 0;
  constructor(
    initial: number,
    readonly le: boolean,
  ) {
    this.buf = new Uint8Array(Math.max(64, initial));
    this.dv = new DataView(this.buf.buffer);
  }
  ensure(n: number): void {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.len + n) cap *= 2;
    const next = new Uint8Array(cap);
    next.set(this.buf.subarray(0, this.len));
    this.buf = next;
    this.dv = new DataView(next.buffer);
  }
  i32(v: number): void {
    this.ensure(4);
    this.dv.setInt32(this.len, v, this.le);
    this.len += 4;
  }
  f64(v: number): void {
    this.ensure(8);
    this.dv.setFloat64(this.len, v, this.le);
    this.len += 8;
  }
  i64(v: number): void {
    this.ensure(8);
    const hi = Math.floor(v / 4294967296);
    const lo = v - hi * 4294967296;
    this.dv.setUint32(this.len + (this.le ? 0 : 4), lo, this.le);
    this.dv.setInt32(this.len + (this.le ? 4 : 0), hi, this.le);
    this.len += 8;
  }
  u8(v: number): void {
    this.ensure(1);
    this.buf[this.len++] = v;
  }
  bytes(b: Uint8Array): void {
    this.ensure(b.length);
    this.buf.set(b, this.len);
    this.len += b.length;
  }
  /** Bytes padded (with `pad`) or cut to exactly n. */
  fixed(b: Uint8Array, n: number, pad = 0x20): void {
    this.ensure(n);
    const k = Math.min(n, b.length);
    this.buf.set(b.subarray(0, k), this.len);
    this.buf.fill(pad, this.len + k, this.len + n);
    this.len += n;
  }
  zeros(n: number): void {
    this.ensure(n);
    this.buf.fill(0, this.len, this.len + n);
    this.len += n;
  }
  result(): Uint8Array {
    return this.buf.slice(0, this.len);
  }
}

interface SegmentPlan {
  shortName: string;
  /** Width declared in the variable record (255 for full very-long-string segments). */
  allocWidth: number;
  /** Bytes of the string value stored in this segment. */
  usedBytes: number;
  dictIndex: number;
  /** Byte offset in the case. */
  offset: number;
}

interface VarPlan {
  v: Variable;
  name: string;
  isString: boolean;
  /** String width in bytes (0 for numeric). */
  width: number;
  segments: SegmentPlan[];
  printFormat: number;
  label: Uint8Array | null;
  numericMissing: { discrete: number[]; range?: { lo: number; hi: number } };
  stringMissing: string[];
}

const NAME_RE = /^[A-Za-z@#$À-￿][A-Za-z0-9_.@#$À-￿]*$/;
const RESERVED = new Set(['ALL', 'AND', 'BY', 'EQ', 'GE', 'GT', 'LE', 'LT', 'NE', 'NOT', 'OR', 'TO', 'WITH']);

function sanitizeName(name: string): string {
  let n = name.replace(/[^A-Za-z0-9_.@#$À-￿]/g, '_');
  if (!/^[A-Za-z@#$À-￿]/.test(n)) n = 'V' + n;
  n = n.replace(/[._]+$/, '');
  if (!n) n = 'V';
  n = truncateUtf8(n, 60).replace(/[._]+$/, '') || 'V';
  if (RESERVED.has(n.toUpperCase())) n += '_V';
  return n;
}

/** Unique 8-byte upper-case short names following SPSS rules. */
class ShortNames {
  private used = new Set<string>();
  make(base: string): string {
    let b = base.toUpperCase().replace(/[^A-Z0-9_.@#$À-￿]/g, '_');
    if (!/^[A-Z@#$À-￿]/.test(b)) b = 'V' + b;
    let cand = truncateUtf8(b, 8);
    if (cand && !RESERVED.has(cand) && !this.used.has(cand)) {
      this.used.add(cand);
      return cand;
    }
    for (let i = 1; ; i++) {
      const suffix = `_${i}`;
      const prefix = truncateUtf8(b, 8 - suffix.length) || 'V';
      cand = prefix + suffix;
      if (!this.used.has(cand)) {
        this.used.add(cand);
        return cand;
      }
    }
  }
}

function segmentCount(width: number): number {
  return width <= 255 ? 1 : Math.ceil(width / 252);
}

function planVariables(ds: Dataset, warnings: string[]): { plans: VarPlan[]; caseBytes: number } {
  const plans: VarPlan[] = [];
  const shortNames = new ShortNames();
  const longNamesUsed = new Set<string>();
  let dictIndex = 0;
  let offset = 0;
  const renamed: string[] = [];

  for (const v of ds.variables) {
    const col = ds.columns[v.id];
    if (!col) throw new Error(`Variable ${v.name} has no data column, so the file cannot be written.`);
    if (col.length !== ds.nCases) throw new Error(`Variable ${v.name} has ${col.length} values but the dataset has ${ds.nCases} cases, so the file cannot be written.`);
    const isString = v.type === 'string';
    if (isString === col instanceof Float64Array) throw new Error(`Variable ${v.name} is marked as ${v.type} but its data are not, so the file cannot be written.`);

    // Name: valid, <= 64 bytes, unique (case-insensitive).
    let name = v.name;
    if (!NAME_RE.test(name) || utf8ByteLength(name) > 64 || RESERVED.has(name.toUpperCase()) || /[._]$/.test(name)) name = sanitizeName(name);
    if (longNamesUsed.has(name.toUpperCase())) {
      const base = truncateUtf8(name, 58);
      for (let i = 1; ; i++) {
        const cand = `${base}_${i}`;
        if (!longNamesUsed.has(cand.toUpperCase())) {
          name = cand;
          break;
        }
      }
    }
    if (name !== v.name) renamed.push(`${v.name} -> ${name}`);
    longNamesUsed.add(name.toUpperCase());

    // String width: wide enough for every value and value-label value (never truncate data
    // silently); SPSS caps strings at 32767 bytes.
    let width = 0;
    if (isString) {
      width = Math.max(1, Math.round(v.width) || 1);
      const strings = col as string[];
      let maxLen = 0;
      for (let i = 0; i < strings.length; i++) {
        const s = strings[i];
        if (s.length * 3 > maxLen) {
          const n = utf8ByteLength(s.replace(/ +$/, ''));
          if (n > maxLen) maxLen = n;
        }
      }
      for (const vl of v.valueLabels) maxLen = Math.max(maxLen, utf8ByteLength(String(vl.value).replace(/ +$/, '')));
      if (maxLen > width) {
        if (maxLen <= MAX_STRING) warnings.push(`String variable ${name} was widened from ${width} to ${maxLen} bytes so no text is cut off.`);
        width = maxLen;
      }
      if (width > MAX_STRING) {
        warnings.push(`String variable ${name} holds values longer than SPSS's limit of ${MAX_STRING} bytes; they were cut to fit.`);
        width = MAX_STRING;
      }
    }

    // Segments (one unless a very long string).
    const nSeg = isString ? segmentCount(width) : 1;
    const segments: SegmentPlan[] = [];
    const firstShort = shortNames.make(name);
    let remaining = width;
    for (let s = 0; s < nSeg; s++) {
      const allocWidth = !isString ? 0 : nSeg === 1 ? width : s < nSeg - 1 ? 255 : width - 252 * s;
      const usedBytes = !isString ? 8 : nSeg === 1 ? width : Math.min(255, remaining);
      remaining -= usedBytes;
      const shortName = s === 0 ? firstShort : shortNames.make(truncateUtf8(firstShort, 5) + String(s));
      dictIndex++;
      segments.push({ shortName, allocWidth, usedBytes, dictIndex, offset });
      const elements = isString ? Math.ceil(allocWidth / 8) : 1;
      offset += elements * 8;
      dictIndex += elements - 1;
    }

    // Format.
    let printFormat: number;
    if (isString) printFormat = packFormat(1, Math.min(width, 255), 0);
    else {
      const f = packNumericFormat(v.format, v.width, v.decimals);
      printFormat = f.packed;
      if (f.repaired) {
        const u = unpackFormat(f.packed);
        warnings.push(`The display format of ${name} ("${v.format}", width ${v.width}, ${v.decimals} decimals) is not valid in SPSS and was saved as ${formatToString(u.typeCode, u.width, u.decimals)}.`);
      }
    }

    // Label.
    let label: Uint8Array | null = null;
    if (v.label) {
      label = encodeUtf8Truncated(v.label, MAX_VAR_LABEL);
      if (label.length < utf8ByteLength(v.label)) warnings.push(`The label of ${name} was cut to SPSS's limit of ${MAX_VAR_LABEL} bytes.`);
    }

    // Missing values within SPSS limits.
    const numericMissing: VarPlan['numericMissing'] = { discrete: [] };
    const stringMissing: string[] = [];
    if (isString) {
      if (v.missing.range) warnings.push(`String variable ${name} had a missing-value range, which SPSS does not allow for strings; it was dropped.`);
      for (const d of v.missing.discrete) {
        const s = String(d).replace(/ +$/, '');
        if (utf8ByteLength(s) > 8) {
          warnings.push(`Missing value "${s}" of ${name} is longer than the 8 bytes SPSS allows for string missing values; it was dropped.`);
          continue;
        }
        stringMissing.push(s);
      }
      if (stringMissing.length > 3) {
        warnings.push(`${name} had ${stringMissing.length} missing values; SPSS allows 3, so only the first 3 were kept.`);
        stringMissing.length = 3;
      }
    } else {
      const disc = v.missing.discrete.map((d) => (typeof d === 'number' ? d : Number(d))).filter((d) => !Number.isNaN(d));
      if (disc.length !== v.missing.discrete.length) warnings.push(`Non-numeric missing values of numeric variable ${name} were dropped.`);
      const r = v.missing.range;
      if (r && !Number.isNaN(r.lo) && !Number.isNaN(r.hi)) {
        numericMissing.range = { lo: Math.min(r.lo, r.hi), hi: Math.max(r.lo, r.hi) };
        if (disc.length > 1) warnings.push(`${name} had a missing-value range plus ${disc.length} single missing values; SPSS allows a range plus 1, so only the first was kept.`);
        numericMissing.discrete = disc.slice(0, 1);
      } else {
        if (disc.length > 3) warnings.push(`${name} had ${disc.length} missing values; SPSS allows 3, so only the first 3 were kept.`);
        numericMissing.discrete = disc.slice(0, 3);
      }
    }

    plans.push({ v, name, isString, width, segments, printFormat, label, numericMissing, stringMissing });
  }
  if (renamed.length) warnings.push(`Some variable names are not valid in SPSS and were changed: ${renamed.join(', ')}.`);
  return { plans, caseBytes: offset };
}

function measureCode(m: Variable['measure']): number {
  return m === 'nominal' ? 1 : m === 'ordinal' ? 2 : 3;
}
function alignCode(a: Variable['align']): number {
  return a === 'left' ? 0 : a === 'center' ? 2 : 1;
}
const ROLE_CODES: Record<Variable['role'], string> = { input: '0', target: '1', both: '2', none: '3', partition: '4', split: '5' };

function writeExtension(w: ByteWriter, subtype: number, size: number, body: Uint8Array | ((b: ByteWriter) => void)): void {
  if (typeof body === 'function') {
    const inner = new ByteWriter(256, w.le);
    body(inner);
    const data = inner.result();
    w.i32(7);
    w.i32(subtype);
    w.i32(size);
    w.i32(data.length / size);
    w.bytes(data);
  } else {
    w.i32(7);
    w.i32(subtype);
    w.i32(size);
    w.i32(body.length / size);
    w.bytes(body);
  }
}

function spssDate(now: Date): { date: string; time: string } {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${p(now.getDate())} ${months[now.getMonth()]} ${p(now.getFullYear() % 100)}`,
    time: `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`,
  };
}

function asciiBytes(s: string): Uint8Array {
  const b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 0xff;
  return b;
}

function writeDictionary(w: ByteWriter, ds: Dataset, plans: VarPlan[], caseBytes: number, compression: SavCompression, now: Date, warnings: string[]): void {
  // ---- File header (176 bytes).
  w.bytes(asciiBytes(compression === 'zsav' ? '$FL3' : '$FL2'));
  w.fixed(asciiBytes('@(#) SPSS DATA FILE Socius'), 60);
  w.i32(2);
  w.i32(caseBytes / 8);
  w.i32(compression === 'none' ? 0 : compression === 'bytecode' ? 1 : 2);
  let weightIndex = 0;
  if (ds.weightVarId) {
    const p = plans.find((x) => x.v.id === ds.weightVarId);
    if (p && !p.isString) weightIndex = p.segments[0].dictIndex;
    else warnings.push('The weight variable is missing or not numeric, so the file was saved without weighting.');
  }
  w.i32(weightIndex);
  w.i32(ds.nCases <= 0x7fffffff ? ds.nCases : -1);
  w.f64(BIAS);
  const { date, time } = spssDate(now);
  w.fixed(asciiBytes(date), 9);
  w.fixed(asciiBytes(time), 8);
  const fileLabel = encodeUtf8Truncated(ds.fileLabel ?? '', 64);
  if (fileLabel.length < utf8ByteLength(ds.fileLabel ?? '')) warnings.push('The file label was cut to SPSS\'s limit of 64 bytes.');
  w.fixed(fileLabel, 64);
  w.zeros(3);

  // ---- Variable records.
  for (const p of plans) {
    p.segments.forEach((seg, s) => {
      w.i32(2);
      w.i32(p.isString ? seg.allocWidth : 0);
      const label = s === 0 ? p.label : null;
      w.i32(label ? 1 : 0);
      let nMissing = 0;
      if (s === 0) {
        if (!p.isString) nMissing = p.numericMissing.range ? -(2 + p.numericMissing.discrete.length) : p.numericMissing.discrete.length;
        // String missing values (at most 8 bytes each) go in the variable record for every width,
        // as IBM's SPSS I/O library writes them; PSPP, readstat and SPSS all read them there.
        else nMissing = p.stringMissing.length;
      }
      w.i32(nMissing);
      const fmt = p.isString ? packFormat(1, seg.allocWidth, 0) : p.printFormat;
      w.i32(fmt);
      w.i32(fmt);
      w.fixed(utf8Encoder.encode(seg.shortName), 8);
      if (label) {
        w.i32(label.length);
        w.bytes(label);
        w.zeros((4 - (label.length % 4)) % 4);
      }
      if (nMissing !== 0) {
        if (!p.isString) {
          if (p.numericMissing.range) {
            const { lo, hi } = p.numericMissing.range;
            w.f64(lo === -Infinity ? LOWEST : lo === Infinity ? HIGHEST : lo);
            w.f64(hi === Infinity ? HIGHEST : hi === -Infinity ? LOWEST : hi);
          }
          for (const d of p.numericMissing.discrete) w.f64(d);
        } else {
          for (const d of p.stringMissing) w.fixed(utf8Encoder.encode(d), 8);
        }
      }
      // Continuation records.
      const extra = p.isString ? Math.ceil(seg.allocWidth / 8) - 1 : 0;
      for (let k = 0; k < extra; k++) {
        w.i32(2);
        w.i32(-1);
        w.i32(0);
        w.i32(0);
        w.i32(0);
        w.i32(0);
        w.fixed(new Uint8Array(0), 8);
      }
    });
  }

  // ---- Value labels (types 3 + 4) for numeric and short string variables.
  let cutLabels = 0;
  const labelBytes = (label: string) => {
    const b = encodeUtf8Truncated(label, MAX_VALUE_LABEL);
    if (b.length < utf8ByteLength(label)) cutLabels++;
    return b;
  };
  for (const p of plans) {
    if (p.v.valueLabels.length === 0 || (p.isString && p.width > 8)) continue;
    const entries = p.v.valueLabels.filter((vl) => (p.isString ? true : typeof vl.value === 'number' && !Number.isNaN(vl.value)));
    if (!entries.length) continue;
    w.i32(3);
    w.i32(entries.length);
    for (const vl of entries) {
      if (p.isString) w.fixed(utf8Encoder.encode(String(vl.value).replace(/ +$/, '')), 8);
      else w.f64(vl.value as number);
      const lb = labelBytes(vl.label);
      w.u8(lb.length);
      w.bytes(lb);
      w.zeros((8 - ((lb.length + 1) % 8)) % 8);
    }
    w.i32(4);
    w.i32(1);
    w.i32(p.segments[0].dictIndex);
  }

  // ---- Documents (type 6): 80-byte lines.
  const docLines: Uint8Array[] = [];
  for (const line of ds.documents ?? []) {
    let rest = line.replace(/\r?\n/g, ' ');
    if (!rest) docLines.push(new Uint8Array(0));
    while (rest) {
      const part = truncateUtf8(rest, 80);
      if (!part) break;
      docLines.push(utf8Encoder.encode(part));
      rest = rest.slice(part.length);
    }
  }
  if (docLines.length) {
    w.i32(6);
    w.i32(docLines.length);
    for (const l of docLines) w.fixed(l, 80);
  }

  // ---- Extension records.
  // 3: machine integer info.
  writeExtension(w, 3, 4, (b) => {
    for (const x of [20, 0, 0, -1, 1, 1, w.le ? 2 : 1, 65001]) b.i32(x);
  });
  // 4: machine floating-point info.
  writeExtension(w, 4, 8, (b) => {
    b.f64(SYSMIS);
    b.f64(HIGHEST);
    b.f64(LOWEST);
  });
  // 11: display parameters (measure, columns, alignment) for every variable record incl. segments.
  writeExtension(w, 11, 4, (b) => {
    for (const p of plans) {
      for (let s = 0; s < p.segments.length; s++) {
        b.i32(measureCode(p.v.measure));
        b.i32(Math.max(1, Math.min(32767, Math.round(p.v.columns) || 8)));
        b.i32(alignCode(p.v.align));
      }
    }
  });
  // 13: long variable names.
  writeExtension(w, 13, 1, utf8Encoder.encode(plans.map((p) => `${p.segments[0].shortName}=${p.name}`).join('\t')));
  // 14: very long strings.
  const vls = plans.filter((p) => p.isString && p.width > 255);
  if (vls.length) {
    writeExtension(w, 14, 1, utf8Encoder.encode(vls.map((p) => `${p.segments[0].shortName}=${String(p.width).padStart(5, '0')}\0\t`).join('')));
  }
  // 16: 64-bit case count.
  writeExtension(w, 16, 8, (b) => {
    b.i64(1);
    b.i64(ds.nCases);
  });
  // 18: variable attributes (custom attributes and roles).
  const attrText = plans
    .map((p) => {
      const parts: string[] = [];
      const groups = new Map<string, string[]>();
      for (const [key, val] of Object.entries(p.v.attributes ?? {})) {
        const m = /^(.+)\[(\d+)\]$/.exec(key);
        const k = m ? m[1] : key;
        if (!/^[^\s():/'=]+$/.test(k)) continue;
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k)!.push(String(val).replace(/[\r\n]+/g, ' '));
      }
      if (p.v.role && p.v.role !== 'input') groups.set('$@Role', [ROLE_CODES[p.v.role]]);
      for (const [k, vals] of groups) parts.push(`${k}(${vals.map((x) => `'${x}'\n`).join('')})`);
      return parts.length ? `${p.name}:${parts.join('')}` : '';
    })
    .filter(Boolean)
    .join('/');
  if (attrText) writeExtension(w, 18, 1, utf8Encoder.encode(attrText));
  // 20: character encoding.
  writeExtension(w, 20, 1, asciiBytes('UTF-8'));
  // 21: value labels for strings longer than 8 bytes.
  const longLabelled = plans.filter((p) => p.isString && p.width > 8 && p.v.valueLabels.length > 0);
  if (longLabelled.length) {
    writeExtension(w, 21, 1, (b) => {
      for (const p of longLabelled) {
        const nb = utf8Encoder.encode(p.name);
        b.i32(nb.length);
        b.bytes(nb);
        b.i32(p.width);
        b.i32(p.v.valueLabels.length);
        for (const vl of p.v.valueLabels) {
          const val = encodeUtf8Truncated(String(vl.value).replace(/ +$/, ''), p.width);
          b.i32(p.width);
          b.fixed(val, p.width);
          const lb = labelBytes(vl.label);
          b.i32(lb.length);
          b.bytes(lb);
        }
      }
    });
  }
  if (cutLabels) warnings.push(`${cutLabels} value label(s) were cut to SPSS's limit of ${MAX_VALUE_LABEL} bytes.`);

  // ---- Dictionary termination.
  w.i32(999);
  w.i32(0);
}

/** Fills `row` with the raw (uncompressed) bytes of case i. */
function makeRowFiller(ds: Dataset, plans: VarPlan[], caseBytes: number, le: boolean): { row: Uint8Array; fill: (i: number) => void; kinds: Uint8Array } {
  const row = new Uint8Array(caseBytes);
  const dv = new DataView(row.buffer);
  const numOffsets: number[] = [];
  const numCols: Float64Array[] = [];
  const strPlans: VarPlan[] = [];
  const strCols: string[][] = [];
  // Per 8-byte element: 0 = numeric, 1 = string.
  const kinds = new Uint8Array(caseBytes / 8);
  for (const p of plans) {
    if (p.isString) {
      strPlans.push(p);
      strCols.push(ds.columns[p.v.id] as string[]);
      for (const s of p.segments) kinds.fill(1, s.offset / 8, s.offset / 8 + Math.ceil(s.allocWidth / 8));
    } else {
      numOffsets.push(p.segments[0].offset);
      numCols.push(ds.columns[p.v.id] as Float64Array);
    }
  }
  const maxWidth = strPlans.reduce((m, p) => Math.max(m, p.width), 8);
  const scratch = new Uint8Array(maxWidth);
  const fill = (i: number) => {
    for (let j = 0; j < numOffsets.length; j++) {
      const x = numCols[j][i];
      dv.setFloat64(numOffsets[j], Number.isNaN(x) ? SYSMIS : x, le);
    }
    for (let j = 0; j < strPlans.length; j++) {
      const p = strPlans[j];
      const s = strCols[j][i] ?? '';
      if (p.segments.length === 1) {
        const seg = p.segments[0];
        const end = seg.offset + Math.ceil(seg.allocWidth / 8) * 8;
        row.fill(0x20, seg.offset, end);
        if (s) utf8Encoder.encodeInto(s, row.subarray(seg.offset, seg.offset + p.width));
      } else {
        scratch.fill(0x20, 0, p.width);
        if (s) utf8Encoder.encodeInto(s, scratch.subarray(0, p.width));
        let taken = 0;
        for (const seg of p.segments) {
          const end = seg.offset + Math.ceil(seg.allocWidth / 8) * 8;
          row.fill(0x20, seg.offset, end);
          row.set(scratch.subarray(taken, taken + seg.usedBytes), seg.offset);
          taken += seg.usedBytes;
        }
      }
    }
  };
  return { row, fill, kinds };
}

/** Bytecode-compress all cases into `out`. */
function writeBytecode(out: ByteWriter, ds: Dataset, plans: VarPlan[], caseBytes: number): void {
  const { row, fill, kinds } = makeRowFiller(ds, plans, caseBytes, out.le);
  const dv = new DataView(row.buffer);
  const nElem = caseBytes / 8;
  let codePos = -1;
  let ci = 8;
  const le = out.le;
  for (let i = 0; i < ds.nCases; i++) {
    fill(i);
    for (let e = 0; e < nElem; e++) {
      if (ci === 8) {
        out.ensure(8 + 64);
        codePos = out.len;
        out.zeros(8);
        ci = 0;
      }
      const o = e * 8;
      let code: number;
      if (kinds[e] === 0) {
        const x = dv.getFloat64(o, le);
        if (x === SYSMIS) code = 255;
        else if (x >= 1 - BIAS && x <= 251 - BIAS && Math.floor(x) === x && !(x === 0 && 1 / x < 0)) code = x + BIAS;
        else code = 253;
      } else {
        let spaces = true;
        for (let k = 0; k < 8; k++) {
          if (row[o + k] !== 0x20) {
            spaces = false;
            break;
          }
        }
        code = spaces ? 254 : 253;
      }
      out.buf[codePos + ci++] = code;
      if (code === 253) out.bytes(row.subarray(o, o + 8));
    }
  }
}

export function writeSav(ds: Dataset, opts: SavWriteOptions = {}): SavWriteResult {
  const warnings: string[] = [];
  const compression = opts.compression ?? 'bytecode';
  if (compression !== 'none' && compression !== 'bytecode' && compression !== 'zsav') {
    throw new Error(`Unknown compression "${String(compression)}". Use "none", "bytecode" or "zsav".`);
  }
  if (!ds.variables.length) throw new Error('The dataset has no variables, so there is nothing to save as an SPSS file.');
  const le = !opts.bigEndian;
  const { plans, caseBytes } = planVariables(ds, warnings);
  const estimate = 4096 + plans.length * 256 + (compression === 'none' ? ds.nCases * caseBytes : Math.min(ds.nCases * caseBytes, 1 << 24));
  const w = new ByteWriter(estimate, le);
  writeDictionary(w, ds, plans, caseBytes, compression, opts.now ?? new Date(), warnings);

  if (compression === 'none') {
    const { row, fill } = makeRowFiller(ds, plans, caseBytes, le);
    w.ensure(ds.nCases * caseBytes);
    for (let i = 0; i < ds.nCases; i++) {
      fill(i);
      w.bytes(row);
    }
  } else if (compression === 'bytecode') {
    writeBytecode(w, ds, plans, caseBytes);
  } else {
    const data = new ByteWriter(Math.min(ds.nCases * caseBytes + 64, 1 << 24), le);
    writeBytecode(data, ds, plans, caseBytes);
    const zheaderOfs = w.len;
    const blocks: Array<{ uOfs: number; cOfs: number; uSize: number; cSize: number; bytes: Uint8Array }> = [];
    let cOfs = zheaderOfs + 24;
    for (let start = 0; start < data.len; start += ZBLOCK) {
      const chunk = data.buf.subarray(start, Math.min(data.len, start + ZBLOCK));
      // Level 3 is about 3x faster than the default 6 for ~10% larger files.
      const z = zlibSync(chunk, { level: 3 });
      blocks.push({ uOfs: zheaderOfs + start, cOfs, uSize: chunk.length, cSize: z.length, bytes: z });
      cOfs += z.length;
    }
    const ztrailerOfs = cOfs;
    const ztrailerLen = 24 + blocks.length * 24;
    w.i64(zheaderOfs);
    w.i64(ztrailerOfs);
    w.i64(ztrailerLen);
    for (const b of blocks) w.bytes(b.bytes);
    w.i64(-BIAS);
    w.i64(0);
    w.i32(ZBLOCK);
    w.i32(blocks.length);
    for (const b of blocks) {
      w.i64(b.uOfs);
      w.i64(b.cOfs);
      w.i32(b.uSize);
      w.i32(b.cSize);
    }
  }
  return { bytes: w.result(), warnings };
}
