// Text encoding helpers shared by the SPSS, CSV and XLSX code. Everything here works in the browser
// and in node (TextDecoder/TextEncoder are globals in both).

export const utf8Encoder = new TextEncoder();

/** Windows / IBM code page numbers (SPSS subtype 3 "character code") mapped to WHATWG encoding labels. */
const CODEPAGES: Record<number, string> = {
  708: 'iso-8859-6',
  720: 'iso-8859-6',
  866: 'ibm866',
  874: 'windows-874',
  932: 'shift_jis',
  936: 'gbk',
  949: 'euc-kr',
  950: 'big5',
  1200: 'utf-16le',
  1201: 'utf-16be',
  1250: 'windows-1250',
  1251: 'windows-1251',
  1252: 'windows-1252',
  1253: 'windows-1253',
  1254: 'windows-1254',
  1255: 'windows-1255',
  1256: 'windows-1256',
  1257: 'windows-1257',
  1258: 'windows-1258',
  10000: 'macintosh',
  10007: 'x-mac-cyrillic',
  20127: 'windows-1252',
  20866: 'koi8-r',
  20932: 'euc-jp',
  20936: 'gbk',
  21866: 'koi8-u',
  28591: 'windows-1252',
  28592: 'iso-8859-2',
  28593: 'iso-8859-3',
  28594: 'iso-8859-4',
  28595: 'iso-8859-5',
  28596: 'iso-8859-6',
  28597: 'iso-8859-7',
  28598: 'iso-8859-8',
  28599: 'windows-1254',
  28603: 'iso-8859-13',
  28605: 'iso-8859-15',
  50220: 'iso-2022-jp',
  51932: 'euc-jp',
  51936: 'gbk',
  51949: 'euc-kr',
  54936: 'gb18030',
  65001: 'utf-8',
};

/**
 * Encoding label for an SPSS subtype-3 character code, or null when the code says nothing useful
 * (1 = EBCDIC, 2 = 7-bit ASCII, 3 = 8-bit ASCII, 4 = DEC Kanji, 0 or unknown numbers).
 */
export function encodingForCodepage(code: number): string | null {
  return CODEPAGES[code] ?? null;
}

/** Normalise an encoding name as SPSS/PSPP/R write it (e.g. "CP1252", "UTF8", "ISO-8859-1") to a WHATWG label. */
export function normalizeEncodingName(name: string): string {
  const n = name.trim().toLowerCase().replace(/_/g, '-');
  if (n === 'utf8' || n === 'utf-8') return 'utf-8';
  if (/^(us-)?ascii$|^ansi-x3\.4-1968$|^iso646-us$/.test(n)) return 'windows-1252';
  let m = /^(?:cp|windows-?|win|ms-?)(\d{3,5})$/.exec(n);
  if (m) {
    const cp = Number(m[1]);
    return CODEPAGES[cp] ?? n;
  }
  m = /^ibm-?(\d{3,5})$/.exec(n);
  if (m) return CODEPAGES[Number(m[1])] ?? n;
  if (n === 'windows-31j' || n === 'ms-kanji' || n === 'sjis') return 'shift_jis';
  if (n === 'gb2312' || n === 'euc-cn') return 'gbk';
  if (n === 'latin1' || n === 'iso-8859-1' || n === 'iso8859-1' || n === 'l1') return 'windows-1252';
  m = /^iso-?8859-?(\d{1,2})$/.exec(n);
  if (m) return `iso-8859-${m[1]}`;
  return n;
}

/** A TextDecoder for `label`, or null when this runtime does not support it. */
export function makeDecoder(label: string, fatal = false): TextDecoder | null {
  try {
    return new TextDecoder(label, { fatal });
  } catch {
    return null;
  }
}

const fatalUtf8 = makeDecoder('utf-8', true)!;

/** True when `bytes` is valid UTF-8 (pure ASCII counts as valid). */
export function isValidUtf8(bytes: Uint8Array): boolean {
  if (isAscii(bytes, 0, bytes.length)) return true;
  try {
    fatalUtf8.decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export function isAscii(bytes: Uint8Array, start: number, end: number): boolean {
  for (let i = start; i < end; i++) if (bytes[i] >= 0x80) return false;
  return true;
}

/** Number of bytes `s` takes in UTF-8, without allocating. */
export function utf8ByteLength(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        n += 4;
        i++;
      } else n += 3;
    } else n += 3;
  }
  return n;
}

/** Cut `s` so its UTF-8 form has at most `maxBytes` bytes, never splitting a character. */
export function truncateUtf8(s: string, maxBytes: number): string {
  if (s.length <= maxBytes / 3) return s;
  if (utf8ByteLength(s) <= maxBytes) return s;
  const buf = new Uint8Array(maxBytes);
  const { read } = utf8Encoder.encodeInto(s, buf);
  return s.slice(0, read ?? 0);
}

/** Encode to UTF-8 and cut to `maxBytes` at a character boundary. */
export function encodeUtf8Truncated(s: string, maxBytes: number): Uint8Array {
  const buf = new Uint8Array(Math.min(maxBytes, utf8ByteLength(s)));
  const { written } = utf8Encoder.encodeInto(s, buf);
  return written === buf.length ? buf : buf.subarray(0, written ?? 0);
}

/**
 * Decode `bytes[start, end)` after removing trailing spaces and NULs (SPSS pads strings with
 * spaces; a few writers pad with NUL). Pure-ASCII runs skip the TextDecoder for speed.
 */
export function decodeTrimmed(decoder: TextDecoder, bytes: Uint8Array, start: number, end: number): string {
  while (end > start && (bytes[end - 1] === 0x20 || bytes[end - 1] === 0)) end--;
  if (end === start) return '';
  let ascii = true;
  for (let i = start; i < end; i++) {
    if (bytes[i] >= 0x80) {
      ascii = false;
      break;
    }
  }
  if (ascii && end - start <= 4096) {
    return String.fromCharCode.apply(null, bytes.subarray(start, end) as unknown as number[]);
  }
  return decoder.decode(bytes.subarray(start, end));
}

/** Decode a byte string for text files: strips a BOM, honours `encoding`, else UTF-8 with a windows-1252 fallback. */
export function decodeText(bytes: Uint8Array, encoding?: string): { text: string; encoding: string; warning?: string } {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return { text: new TextDecoder('utf-8').decode(bytes.subarray(3)), encoding: 'utf-8' };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return { text: new TextDecoder('utf-16le').decode(bytes.subarray(2)), encoding: 'utf-16le' };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    const d = makeDecoder('utf-16be');
    if (d) return { text: d.decode(bytes.subarray(2)), encoding: 'utf-16be' };
  }
  if (encoding) {
    const label = normalizeEncodingName(encoding);
    const d = makeDecoder(label);
    if (!d) throw new Error(`The text encoding "${encoding}" is not supported by this browser. Try "utf-8" or "windows-1252".`);
    return { text: d.decode(bytes), encoding: label };
  }
  try {
    return { text: fatalUtf8.decode(bytes), encoding: 'utf-8' };
  } catch {
    return {
      text: new TextDecoder('windows-1252').decode(bytes),
      encoding: 'windows-1252',
      warning: 'The file is not valid UTF-8, so it was read as Windows-1252 (Western European). If letters look wrong, re-import with the correct encoding.',
    };
  }
}
