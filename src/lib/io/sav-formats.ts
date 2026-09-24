// SPSS print/write format codes. In a system file a format is packed into one int32 as
// (type << 16) | (width << 8) | decimals; in Socius it is a string such as "F8.2" or "DATE11".

const TYPE_NAMES: Record<number, string> = {
  1: 'A',
  2: 'AHEX',
  3: 'COMMA',
  4: 'DOLLAR',
  5: 'F',
  6: 'IB',
  7: 'PIBHEX',
  8: 'P',
  9: 'PIB',
  10: 'PK',
  11: 'RB',
  12: 'RBHEX',
  15: 'Z',
  16: 'N',
  17: 'E',
  20: 'DATE',
  21: 'TIME',
  22: 'DATETIME',
  23: 'ADATE',
  24: 'JDATE',
  25: 'DTIME',
  26: 'WKDAY',
  27: 'MONTH',
  28: 'MOYR',
  29: 'QYR',
  30: 'WKYR',
  31: 'PCT',
  32: 'DOT',
  33: 'CCA',
  34: 'CCB',
  35: 'CCC',
  36: 'CCD',
  37: 'CCE',
  38: 'EDATE',
  39: 'SDATE',
  40: 'MTIME',
  41: 'YMDHMS',
};

const TYPE_CODES: Record<string, number> = Object.fromEntries(Object.entries(TYPE_NAMES).map(([k, v]) => [v, Number(k)]));

/** Formats that always print their decimals (F8.0 rather than F8). */
const WITH_DECIMALS = new Set(['COMMA', 'DOLLAR', 'F', 'IB', 'P', 'PIB', 'PK', 'RB', 'Z', 'E', 'PCT', 'DOT', 'CCA', 'CCB', 'CCC', 'CCD', 'CCE']);
/** Time-bearing formats that may carry fractional seconds (DATETIME23.2). */
const FRACTIONAL_SECONDS = new Set(['TIME', 'DTIME', 'DATETIME', 'MTIME', 'YMDHMS']);

export interface SavFormat {
  type: string;
  width: number;
  decimals: number;
}

export function unpackFormat(packed: number): { typeCode: number; width: number; decimals: number } {
  return { typeCode: (packed >>> 16) & 0xff, width: (packed >>> 8) & 0xff, decimals: packed & 0xff };
}

/** Format string for a packed format, or null when the type code is unknown. */
export function formatToString(typeCode: number, width: number, decimals: number): string | null {
  const name = TYPE_NAMES[typeCode];
  if (!name) return null;
  if (WITH_DECIMALS.has(name)) return `${name}${width}.${decimals}`;
  if (FRACTIONAL_SECONDS.has(name) && decimals > 0) return `${name}${width}.${decimals}`;
  return `${name}${width}`;
}

/** Parse "F8.2", "a20", "DATETIME20" etc. Returns null when the text is not a known format. */
export function parseFormat(text: string): SavFormat | null {
  const m = /^\s*([A-Za-z]+)(\d+)(?:\.(\d+))?\s*$/.exec(text);
  if (!m) return null;
  const type = m[1].toUpperCase();
  if (!(type in TYPE_CODES)) return null;
  const width = Number(m[2]);
  const decimals = m[3] ? Number(m[3]) : 0;
  return { type, width, decimals };
}

export function formatTypeCode(type: string): number | undefined {
  return TYPE_CODES[type.toUpperCase()];
}

export function packFormat(typeCode: number, width: number, decimals: number): number {
  return ((typeCode & 0xff) << 16) | ((width & 0xff) << 8) | (decimals & 0xff);
}

export function isStringFormatType(type: string): boolean {
  return type === 'A' || type === 'AHEX';
}

/** Smallest width SPSS accepts for date/time formats (used when repairing formats on export). */
const MIN_WIDTH: Record<string, number> = {
  DATE: 9, ADATE: 8, EDATE: 8, SDATE: 8, JDATE: 5, QYR: 6, MOYR: 6, WKYR: 8, DATETIME: 17, YMDHMS: 16,
  TIME: 5, DTIME: 8, MTIME: 5, WKDAY: 2, MONTH: 3, E: 6, F: 1, COMMA: 1, DOLLAR: 2, PCT: 2, DOT: 1, N: 1, Z: 1,
};

/**
 * Pack a numeric variable's format for writing. The format type comes from `format`; for the
 * plain numeric types (F, COMMA, DOLLAR, PCT, ...) width and decimals come from the variable's
 * Width/Decimals fields, which are what users edit. Unknown or string formats fall back to
 * F{width}.{decimals}. Widths are clamped to 1..40 and decimals to 0..16.
 */
export function packNumericFormat(format: string, width: number, decimals: number): { packed: number; repaired: boolean } {
  const f = parseFormat(format);
  const wIn = Number.isFinite(width) ? Math.round(width) : 8;
  const dIn = Number.isFinite(decimals) ? Math.round(decimals) : 0;
  if (f && !isStringFormatType(f.type)) {
    const plain = WITH_DECIMALS.has(f.type);
    const w0 = plain ? wIn : f.width;
    const d0 = plain ? dIn : f.decimals;
    const w = Math.max(MIN_WIDTH[f.type] ?? 1, Math.min(40, w0));
    const d = Math.max(0, Math.min(16, d0, Math.max(0, w - 1)));
    return { packed: packFormat(TYPE_CODES[f.type], w, d), repaired: w !== w0 || d !== d0 };
  }
  const w = Math.max(1, Math.min(40, wIn || 8));
  const d = Math.max(0, Math.min(16, dIn, w - 1));
  return { packed: packFormat(TYPE_CODES.F, w, d), repaired: true };
}
