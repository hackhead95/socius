// A tiny, independent SPSS system-file builder for tests. It writes records byte by byte from the
// format specification (not through Socius's writer), so the reader can be tested on files Socius
// would never produce: big-endian, legacy code pages, missing encoding records, odd extension
// records, unknown case counts.

export interface BuildVar {
  name: string; // short name, <= 8 bytes
  /** 0 = numeric, otherwise string width (<= 255). */
  width: number;
  label?: Uint8Array | string;
  /** Packed print format; default F8.2 / A{width}. */
  format?: number;
  missing?: { discrete?: number[]; range?: [number, number] } | { strings: Uint8Array[] };
}

export interface BuildOptions {
  le?: boolean;
  vars: BuildVar[];
  /** Each case: numbers for numeric variables, raw bytes (or ASCII text) for strings. */
  cases: Array<Array<number | Uint8Array | string>>;
  /** Header case count (default cases.length). */
  nCases?: number;
  compression?: 0 | 1;
  weightIndex?: number;
  fileLabel?: Uint8Array | string;
  /** Records inserted after the variable records (value labels, extension records, documents). */
  records?: Uint8Array[];
  /** Bytes appended after the data. */
  trailer?: Uint8Array;
  /** Magic override (e.g. '$FL3'). */
  magic?: string;
  layoutCode?: number;
}

const enc = new TextEncoder();
const bytesOf = (x: Uint8Array | string) => (typeof x === 'string' ? enc.encode(x) : x);

export class W {
  parts: number[] = [];
  constructor(readonly le = true) {}
  i32(v: number) {
    const b = new DataView(new ArrayBuffer(4));
    b.setInt32(0, v, this.le);
    this.parts.push(...new Uint8Array(b.buffer));
    return this;
  }
  f64(v: number) {
    const b = new DataView(new ArrayBuffer(8));
    b.setFloat64(0, v, this.le);
    this.parts.push(...new Uint8Array(b.buffer));
    return this;
  }
  raw(b: Uint8Array | string, n?: number, pad = 0x20) {
    const x = bytesOf(b);
    const len = n ?? x.length;
    for (let i = 0; i < len; i++) this.parts.push(i < x.length ? x[i] : pad);
    return this;
  }
  u8(v: number) {
    this.parts.push(v & 0xff);
    return this;
  }
  bytes() {
    return Uint8Array.from(this.parts);
  }
}

export function fmt(type: number, width: number, decimals: number): number {
  return (type << 16) | (width << 8) | decimals;
}

/** Extension record (type 7). */
export function ext(le: boolean, subtype: number, size: number, body: Uint8Array | string): Uint8Array {
  const b = bytesOf(body);
  return new W(le).i32(7).i32(subtype).i32(size).i32(b.length / size).raw(b).bytes();
}

export function ext32(le: boolean, subtype: number, values: number[]): Uint8Array {
  const w = new W(le).i32(7).i32(subtype).i32(4).i32(values.length);
  for (const v of values) w.i32(v);
  return w.bytes();
}

/** Value label record pair (types 3 + 4). Values: numbers, or 8-byte strings. */
export function valueLabels(le: boolean, labels: Array<[number | string, Uint8Array | string]>, dictIndices: number[]): Uint8Array {
  const w = new W(le).i32(3).i32(labels.length);
  for (const [value, label] of labels) {
    if (typeof value === 'number') w.f64(value);
    else w.raw(value, 8);
    const lb = bytesOf(label);
    w.u8(lb.length).raw(lb);
    const pad = (8 - ((lb.length + 1) % 8)) % 8;
    for (let i = 0; i < pad; i++) w.u8(0x20);
  }
  w.i32(4).i32(dictIndices.length);
  for (const i of dictIndices) w.i32(i);
  return w.bytes();
}

export function buildSav(o: BuildOptions): Uint8Array {
  const le = o.le ?? true;
  const w = new W(le);
  const elements = o.vars.reduce((n, v) => n + (v.width === 0 ? 1 : Math.ceil(v.width / 8)), 0);
  w.raw(o.magic ?? '$FL2', 4);
  w.raw('@(#) SPSS DATA FILE test builder', 60);
  w.i32(o.layoutCode ?? 2);
  w.i32(elements);
  w.i32(o.compression ?? 0);
  w.i32(o.weightIndex ?? 0);
  w.i32(o.nCases ?? o.cases.length);
  w.f64(100);
  w.raw('01 Jan 20', 9);
  w.raw('00:00:00', 8);
  w.raw(o.fileLabel ?? '', 64);
  w.raw('', 3, 0);
  for (const v of o.vars) {
    w.i32(2).i32(v.width).i32(v.label !== undefined ? 1 : 0);
    const m = v.missing;
    let n = 0;
    if (m && 'strings' in m) n = m.strings.length;
    else if (m) n = m.range ? -(2 + (m.discrete?.length ?? 0)) : (m.discrete?.length ?? 0);
    w.i32(n);
    const f = v.format ?? (v.width ? fmt(1, v.width, 0) : fmt(5, 8, 2));
    w.i32(f).i32(f);
    w.raw(v.name, 8);
    if (v.label !== undefined) {
      const lb = bytesOf(v.label);
      w.i32(lb.length).raw(lb).raw('', (4 - (lb.length % 4)) % 4, 0);
    }
    if (m && 'strings' in m) for (const s of m.strings) w.raw(s, 8);
    else if (m) {
      if (m.range) w.f64(m.range[0]).f64(m.range[1]);
      for (const d of m.discrete ?? []) w.f64(d);
    }
    for (let k = 1; k < (v.width === 0 ? 1 : Math.ceil(v.width / 8)); k++) {
      w.i32(2).i32(-1).i32(0).i32(0).i32(0).i32(0).raw('', 8);
    }
  }
  for (const r of o.records ?? []) w.raw(r);
  w.i32(999).i32(0);

  // Data.
  const caseBytes = (row: Array<number | Uint8Array | string>): Uint8Array[] => {
    const chunks: Uint8Array[] = [];
    o.vars.forEach((v, j) => {
      const x = row[j];
      if (v.width === 0) {
        const b = new DataView(new ArrayBuffer(8));
        b.setFloat64(0, Number.isNaN(x as number) ? -Number.MAX_VALUE : (x as number), le);
        chunks.push(new Uint8Array(b.buffer));
      } else {
        const bytes = bytesOf(x as Uint8Array | string);
        const n = Math.ceil(v.width / 8) * 8;
        const buf = new Uint8Array(n).fill(0x20);
        buf.set(bytes.subarray(0, v.width));
        for (let k = 0; k < n; k += 8) chunks.push(buf.subarray(k, k + 8));
      }
    });
    return chunks;
  };
  if ((o.compression ?? 0) === 0) {
    for (const row of o.cases) for (const c of caseBytes(row)) w.raw(c);
  } else {
    const codes: number[] = [];
    const data: Uint8Array[] = [];
    const flush = () => {
      while (codes.length < 8) codes.push(0);
      w.raw(Uint8Array.from(codes));
      for (const d of data) w.raw(d);
      codes.length = 0;
      data.length = 0;
    };
    for (const row of o.cases) {
      const chunks = caseBytes(row);
      let k = 0;
      o.vars.forEach((v, j) => {
        const n = v.width === 0 ? 1 : Math.ceil(v.width / 8);
        for (let e = 0; e < n; e++) {
          const c = chunks[k++];
          const x = row[j];
          if (v.width === 0 && Number.isNaN(x as number)) codes.push(255);
          else if (v.width === 0 && Number.isInteger(x) && (x as number) >= -99 && (x as number) <= 151) codes.push((x as number) + 100);
          else if (v.width > 0 && c.every((b) => b === 0x20)) codes.push(254);
          else {
            codes.push(253);
            data.push(c);
          }
          if (codes.length === 8) flush();
        }
      });
    }
    if (codes.length) flush();
  }
  if (o.trailer) w.raw(o.trailer);
  return w.bytes();
}
