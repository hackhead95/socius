// One way to show dates and times everywhere in the app (Output, memos, exports, recent files).
//
// Locale-aware for English: the month is always a word (never "9/24" vs "24/9" ambiguity) and the
// clock is always 24-hour, but the order follows the reader's English locale ("24 Sep 2026, 14:55"
// in en-GB/en-IN/en-AU, "Sep 24, 2026, 14:55" in en-US). The interface is English, so a non-English
// browser locale falls back to en-GB rather than mixing languages ("24. Sept. 2026").
//
// Plain functions of a timestamp (milliseconds, a Date or an ISO string); pure except for reading
// the browser language, which tests can override with `locale`.

export type DateInput = number | string | Date;

export interface DateFormatOptions {
  /** BCP 47 locale; defaults to the browser's English locale (see above). */
  locale?: string;
  /** IANA time zone; defaults to the reader's own. Tests pass 'UTC'. */
  timeZone?: string;
}

const FALLBACK_LOCALE = 'en-GB';

/** The locale used for dates: the browser's language when it is an English variant, else en-GB. */
export function dateLocale(): string {
  const langs: readonly string[] =
    typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : []) : [];
  for (const l of langs) {
    if (!/^en(-|$)/i.test(l)) continue;
    try {
      // Throws RangeError on a malformed tag.
      return Intl.DateTimeFormat.supportedLocalesOf([l]).length ? l : FALLBACK_LOCALE;
    } catch {
      return FALLBACK_LOCALE;
    }
  }
  return FALLBACK_LOCALE;
}

function toDate(d: DateInput): Date | null {
  const x = d instanceof Date ? d : new Date(d);
  return Number.isNaN(x.getTime()) ? null : x;
}

const cache = new Map<string, Intl.DateTimeFormat>();
function fmt(kind: string, o: DateFormatOptions, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const locale = o.locale ?? dateLocale();
  const key = `${kind}|${locale}|${o.timeZone ?? ''}`;
  let f = cache.get(key);
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(locale, { ...opts, ...(o.timeZone ? { timeZone: o.timeZone } : {}) });
    } catch {
      f = new Intl.DateTimeFormat(FALLBACK_LOCALE, opts);
    }
    cache.set(key, f);
  }
  return f;
}

// Newer ICU writes "Sept" for September in en-GB; every other month is three letters, so use "Sep".
const tidy = (s: string) => s.replace(/\bSept\b/g, 'Sep').replace(/ /g, ' ');

const DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
const TIME: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };

/** "24 Sep 2026, 14:55": the standard date and time for anything the user saved or ran. */
export function formatDateTime(d: DateInput, o: DateFormatOptions = {}): string {
  const x = toDate(d);
  if (!x) return '';
  return tidy(fmt('dt', o, { ...DATE, ...TIME }).format(x));
}

/** "24 Sep 2026": a date on its own (lists where the time would be noise). */
export function formatDate(d: DateInput, o: DateFormatOptions = {}): string {
  const x = toDate(d);
  if (!x) return '';
  return tidy(fmt('d', o, DATE).format(x));
}

/** "24 September 2026": the long date used on report title pages. */
export function formatLongDate(d: DateInput, o: DateFormatOptions = {}): string {
  const x = toDate(d);
  if (!x) return '';
  return tidy(fmt('ld', o, { day: 'numeric', month: 'long', year: 'numeric' }).format(x));
}

/** "14:55": the time on its own (the Output outline, items from today). */
export function formatTime(d: DateInput, o: DateFormatOptions = {}): string {
  const x = toDate(d);
  if (!x) return '';
  return tidy(fmt('t', o, TIME).format(x));
}
