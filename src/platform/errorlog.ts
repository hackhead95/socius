// Error log: a small ring buffer of problems the app noticed, kept in this browser (localStorage, or
// memory only when storage is unavailable or full). There is no server: users open Help > Error log
// and copy or download a plain-text report to send with their feedback.
//
// Privacy rules (enforced here, for every entry, whatever the caller passes):
// - Never store data values, variable names or labels, file names, text excerpts, API keys or tokens.
// - Messages and details go through `redact`: known key formats, bearer tokens, `key=` parameters,
//   long random-looking strings, e-mail addresses, quoted text, file names and the open project's own
//   names and labels (supplied by `setSensitiveTermsProvider`) are replaced; URLs lose their query
//   string and fragment; every string is truncated.
// - Unknown objects are never serialised: only an Error's name, message, code, HTTP status, the
//   service's own error text and a trimmed stack are read.
// - Context is sizes and settings only (tab, "500 cases x 40 variables", provider id, model name,
//   app version, a code identifier for the operation, a file extension).
//
// Logging must never throw or change the caller's behaviour: every function here catches its own errors.
//
// How to log (see docs/ARCHITECTURE.md):
//   } catch (e) { logFailure('import', e, { file: name }); ...existing handling... }
//   throw logError('ai', wrapError(e));      // logError returns the error it was given
//   logSlow('analysis', def.id, ms);          // info entry when an operation took more than 5 s

import { BUILD_INFO } from './buildInfo';

export type LogLevel = 'error' | 'warn' | 'info';
export type LogArea = 'ai' | 'import' | 'export' | 'analysis' | 'transform' | 'coding' | 'assistant' | 'ui' | 'storage' | 'network';

export const LOG_AREAS: LogArea[] = ['ai', 'import', 'export', 'analysis', 'transform', 'coding', 'assistant', 'ui', 'storage', 'network'];
export const LOG_LEVELS: LogLevel[] = ['error', 'warn', 'info'];

export interface LogContext {
  /** Main tab: data, variables, output or coding. */
  tab?: string;
  /** Size only, e.g. "500 cases x 40 variables" (never names or values). */
  dataset?: string;
  /** AI provider id (gemini, openai, webllm, claude) or "none". */
  provider?: string;
  model?: string;
  version?: string;
  /** What was running, as a code identifier: a procedure id, a transform id, "render"... */
  op?: string;
  /**
   * A file being opened or saved. Pass the file name: only its extension is stored, and the name is
   * removed from the message and details.
   */
  file?: string;
  /** Duration in milliseconds (slow operations). */
  ms?: number;
}

export interface LogEntry {
  id: string;
  /** ISO time of the last occurrence. */
  time: string;
  level: LogLevel;
  area: LogArea;
  message: string;
  detail?: string;
  context?: LogContext;
  /** How many times in a row this exact entry happened (when more than once). */
  count?: number;
  /** The browser session (page load) that logged it. */
  session: string;
  /** Same problem in earlier sessions too: when it was first seen, and in how many sessions. */
  first?: string;
  sessions?: number;
}

export const ERROR_LOG_KEY = 'socius.errorlog';
export const MAX_ENTRIES = 300;
export const MAX_BYTES = 200_000;
export const MAX_MESSAGE = 300;
export const MAX_DETAIL = 2000;
export const MAX_STACK_FRAMES = 8;
export const SLOW_MS = 5000;
/** Repeats of the same entry within this time are counted instead of stored again. */
const REPEAT_MS = 60_000;

// ---------- redaction ----------

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  // Google API keys and OAuth access tokens.
  [/AIza[0-9A-Za-z_-]{20,}/g, '[key removed]'],
  [/\bAQ\.[0-9A-Za-z._-]{20,}/g, '[key removed]'],
  [/\bya29\.[0-9A-Za-z._-]{20,}/g, '[token removed]'],
  // OpenAI, OpenRouter, Anthropic (sk-...), Groq (gsk_...), Hugging Face, GitHub, Slack.
  [/\bsk-[A-Za-z0-9_-]{16,}/g, '[key removed]'],
  [/\bgsk_[A-Za-z0-9_-]{16,}/g, '[key removed]'],
  [/\b(?:hf|ghp|gho|ghu|ghs|ghr|github_pat|xox[abprs])_[A-Za-z0-9_-]{16,}/g, '[token removed]'],
  // JSON web tokens.
  [/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}/g, '[token removed]'],
  // Authorization headers.
  [/\b(Bearer|Basic|Token)\s+[A-Za-z0-9._~+/=-]{8,}/gi, '$1 [token removed]'],
  // key=... in query strings, headers or text.
  [/([?&;#]\s*(?:key|api[_-]?key|apikey|access[_-]?token|token|auth|secret|password|sig|signature)=)[^&\s#"'<>]*/gi, '$1[removed]'],
  [/\b((?:x-goog-api-key|x-api-key|api[_-]?key|apikey|access[_-]?token|secret|password|authorization)["']?\s*[:=]\s*["']?)[^\s"',;&]{6,}/gi, '$1[removed]'],
];

const URL_RE = /\b(?:https?|file|blob|ftp|wss?|chrome-extension|moz-extension|safari-web-extension|webkit-masked-url):\/\/[^\s"'<>()[\]{}]+/gi;
const DATA_URL_RE = /\bdata:[^\s"'<>(),]*[;,][^\s"'<>()]*/gi;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
// Quoted text (data excerpts, names in messages). The opening quote must start a word and the closing
// one end it, so apostrophes in "don't" are left alone.
const QUOTED_RE = /(^|[\s(\[{:=,])(["'“‘`«])([^\n"“”`«»]{1,400}?)(["'”’`»])(?=$|[\s)\]}:;,.!?])/g;
const FILE_RE = /(?<![\w.-])[\w\-()[\]]+(?:\.[\w\-()[\]]+)*?\.(sav|zsav|por|sps|csv|tsv|txt|tab|dat|psv|xlsx|xlsm|xls|ods|json|zip|docx|doc|odt|pdf|rtf|md|html?)\b/gi;
const TOKEN_RE = /[A-Za-z0-9+/_=-]{24,}/g;
// Numbers that identify people, from pasted field data: Indian mobile numbers (+91 / 0091 / 0 prefix,
// 10 digits starting 6-9, optionally split 5+5), Aadhaar-like 12-digit numbers (optionally in groups
// of four), and any other run of 9 or more digits in free text (in any script's digits). Short
// numbers stay: HTTP statuses, counts, line:column positions, sizes.
const PHONE_CC_RE = /(?:\+|(?<![\w+])00)\s?91[\s.-]?[6-9]\d{4}[\s.-]?\d{5}(?!\d)/g;
const PHONE_RE = /(?<![\w+.])0?[6-9]\d{4}[\s.-]?\d{5}(?![\w])/g;
const AADHAAR_RE = /(?<![\w.])\d{4}([\s-]?)\d{4}\1\d{4}(?![\w])/g;
const LONG_DIGITS_RE = /(?<![\p{L}\p{N}_])\p{Nd}{9,}(?![\p{L}\p{N}_])/gu;
export const NUMBER_REMOVED = '[number removed]';

/** Replace phone numbers, Aadhaar-like numbers and long digit runs (see the patterns above). */
export function removeLongNumbers(s: string): string {
  return s.replace(PHONE_CC_RE, NUMBER_REMOVED).replace(AADHAAR_RE, NUMBER_REMOVED).replace(PHONE_RE, NUMBER_REMOVED).replace(LONG_DIGITS_RE, NUMBER_REMOVED);
}

/** A long string that looks random (a key, token or hash) rather than a word or a code identifier. */
export function looksSecret(t: string): boolean {
  // Judge the longest run of letters and digits: "gemini-2.5-flash:streamGenerateContent" is words.
  const run = (String(t).match(/[A-Za-z0-9]+/g) ?? []).reduce((a, b) => (b.length > a.length ? b : a), '');
  if (run.length >= 32 && /^[0-9a-f]+$/i.test(run) && /\d/.test(run) && /[a-f]/i.test(run)) return true;
  if (run.length < 20 || !/\d/.test(run) || !/[A-Za-z]/.test(run)) return false;
  const cls = (c: string) => (/[a-z]/.test(c) ? 1 : /[A-Z]/.test(c) ? 2 : 3);
  let changes = 0;
  for (let i = 1; i < run.length; i++) if (cls(run[i]) !== cls(run[i - 1])) changes++;
  return changes >= run.length / 4;
}

function removeSecrets(s: string): string {
  let out = s;
  for (const [re, rep] of SECRET_PATTERNS) out = out.replace(re, rep);
  return out;
}

function cleanUrl(u: string): string {
  let url = u;
  let pos = '';
  const q = url.search(/[?#]/);
  if (q >= 0) {
    const tail = url.slice(q);
    pos = /(:\d+:\d+)$/.exec(tail)?.[1] ?? '';
    url = url.slice(0, q) + (tail.length > pos.length ? '?…' : '');
  }
  // Keys in the path, and path segments that look like keys or tokens.
  url = removeSecrets(url).replace(/[^/?]+/g, (seg, off: number) => (off > 8 && looksSecret(seg) ? '[removed]' : seg));
  return url + pos;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Terms to remove from logged text: the open project's own names and labels (see setSensitiveTermsProvider). */
function removeTerms(text: string, terms: readonly string[]): string {
  if (!terms.length || !text) return text;
  let out = text;
  let lower = out.toLowerCase();
  for (const term of terms) {
    const t = term.toLowerCase();
    if (!lower.includes(t)) continue;
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRe(term)}(?![\\p{L}\\p{N}_])`, 'giu'), '[name]');
    lower = out.toLowerCase();
  }
  return out;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, Math.max(0, max - 1))}…` : s;
}

/**
 * Make a string safe to log: remove keys, tokens, e-mail addresses, quoted text, file names and the
 * given terms; strip URL query strings; truncate to `max` characters.
 */
export function redact(input: unknown, max = MAX_MESSAGE, terms: readonly string[] = []): string {
  try {
    let s = typeof input === 'string' ? input : input == null ? '' : String(input);
    if (s.length > max * 4 + 2000) s = s.slice(0, max * 4 + 2000);
    s = s.replace(DATA_URL_RE, 'data:[removed]');
    // URLs first (their query strings go whole), kept aside so later steps leave host and path alone.
    const urls: string[] = [];
    s = s.replace(/\u0000/g, '').replace(URL_RE, (u) => {
      urls.push(cleanUrl(u));
      return `\u0000${urls.length - 1}\u0000`;
    });
    s = removeSecrets(s);
    s = s.replace(EMAIL_RE, '[email]');
    s = removeLongNumbers(s);
    s = removeTerms(s, terms);
    s = s.replace(QUOTED_RE, (_m, pre: string, open: string, _body: string, close: string) => `${pre}${open}…${close}`);
    s = s.replace(FILE_RE, (_m, ext: string) => `[file].${ext.toLowerCase()}`);
    s = s.replace(TOKEN_RE, (t) => (looksSecret(t) ? '[removed]' : t));
    s = s.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => urls[Number(i)] ?? '');
    return truncate(s, max);
  } catch {
    return '[could not be logged safely]';
  }
}

/** The extension of a file name ("sav", "csv"...), or "" when there is none. Never the name itself. */
export function fileKind(name: string): string {
  const m = /\.([A-Za-z0-9]{1,5})$/.exec(String(name ?? '').trim());
  return m ? m[1].toLowerCase() : '';
}

// ---------- describing errors ----------

/**
 * React's component stack reduced to component names ("at DataGrid"), without file URLs, query
 * hashes or line numbers. At most `max` lines.
 */
export function componentStackText(stack: unknown, max = 10): string | undefined {
  if (typeof stack !== 'string' || !stack.trim()) return undefined;
  const names: string[] = [];
  for (const raw of stack.split('\n')) {
    const l = raw.trim();
    if (!l) continue;
    // Chrome/Node: "at Name (url:1:2)" or "at url:1:2"; Firefox/Safari: "Name@url:1:2".
    const m = /^at\s+([^\s(]+)/.exec(l) ?? /^([^@\s]+)@/.exec(l);
    const name = m?.[1] ?? '';
    if (!name || /[/:]/.test(name)) continue;
    names.push(`at ${name}`);
  }
  if (!names.length) return undefined;
  const more = names.length - max;
  return `Component stack:\n${names.slice(0, max).map((l) => `  ${l}`).join('\n')}${more > 0 ? `\n  (${more} more)` : ''}`;
}

function trimStack(stack: string): string {
  const frames = stack
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^at\s/.test(l) || /@\S+:\d+/.test(l));
  if (!frames.length) return '';
  const more = frames.length - MAX_STACK_FRAMES;
  return frames.slice(0, MAX_STACK_FRAMES).map((f) => `  ${f}`).join('\n') + (more > 0 ? `\n  (${more} more)` : '');
}

function shortOf(v: unknown): string {
  if (v == null) return String(v);
  if (typeof v === 'string') return v;
  if (typeof v === 'object') {
    const e = v as { name?: unknown; message?: unknown };
    const name = typeof e.name === 'string' ? e.name : '';
    const msg = typeof e.message === 'string' ? e.message : '';
    return [name, msg].filter(Boolean).join(': ') || Object.prototype.toString.call(v);
  }
  return String(v);
}

interface Described {
  message: string;
  lines: string[];
}

function describe(err: unknown): Described {
  if (err == null || typeof err !== 'object') return { message: String(err ?? 'Unknown problem'), lines: [] };
  const e = err as Record<string, any>;
  const lines: string[] = [];
  let name = '';
  try {
    name = typeof e.name === 'string' ? e.name : '';
  } catch {
    /* getter threw */
  }
  const message = typeof e.message === 'string' && e.message ? e.message : shortOf(err);
  if (name && name !== 'Error') lines.push(`Type: ${name}`);
  if (typeof e.code === 'string' || typeof e.code === 'number') lines.push(`Code: ${e.code}`);
  const status = typeof e.status === 'number' ? e.status : typeof e.statusCode === 'number' ? e.statusCode : Number(/\banswered (\d{3})\b/.exec(message)?.[1] ?? NaN);
  if (Number.isFinite(status)) lines.push(`HTTP status: ${status}`);
  if (typeof e.detail === 'string' && e.detail.trim()) lines.push(`Service said: ${e.detail.trim()}`);
  if (e.cause != null && e.cause !== err) lines.push(`Caused by: ${shortOf(e.cause)}`);
  if (typeof e.stack === 'string') {
    const st = trimStack(e.stack);
    if (st) lines.push(`Stack:\n${st}`);
  }
  return { message, lines };
}

/** Errors that are not problems: the user pressed Stop, or a benign browser notice. */
function isNoise(err: unknown): boolean {
  if (!err || (typeof err !== 'object' && typeof err !== 'string')) return false;
  const e = err as { code?: unknown; name?: unknown; message?: unknown };
  if (typeof err === 'object' && (e.code === 'cancelled' || e.name === 'AbortError')) return true;
  const msg = typeof err === 'string' ? err : typeof e.message === 'string' ? e.message : '';
  return /^ResizeObserver loop/.test(msg);
}

/** Errors the user can act on (not set up, not allowed) are warnings, not errors. */
function softAiCode(err: unknown): boolean {
  const code = (err as { code?: unknown } | null)?.code;
  return code === 'not_configured' || code === 'not_granted';
}

/** Programming errors (TypeError and friends) as opposed to messages the app raises on purpose. */
export function isLikelyBug(err: unknown): boolean {
  return err instanceof TypeError || err instanceof ReferenceError || err instanceof RangeError || err instanceof SyntaxError || (typeof err === 'object' && err !== null && (err as { name?: unknown }).name === 'InternalError');
}

// ---------- state ----------

type ContextProvider = () => Partial<LogContext>;
type TermsProvider = () => readonly string[];

let contextProvider: ContextProvider | null = null;
let termsProvider: TermsProvider | null = null;

/** Called at each log to add the tab, dataset size, AI provider and model (sizes and ids only). */
export function setLogContextProvider(fn: ContextProvider | null): void {
  contextProvider = fn;
}

/** Called at each log for the open project's names and labels, which are removed from logged text. */
export function setSensitiveTermsProvider(fn: TermsProvider | null): void {
  termsProvider = fn;
}

export const SESSION_ID = Math.random().toString(36).slice(2, 10);

let entries: LogEntry[] = [];
let persist = true;
let seq = 0;
let seenCount = 0;
let lastRaw = '';
const listeners = new Set<() => void>();
const loggedErrors = new WeakSet<object>();
/** Entries of earlier sessions merged into a newer one (not to be brought back from storage). */
const absorbed = new Set<string>();

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function validEntry(x: any): x is LogEntry {
  return !!x && typeof x === 'object' && typeof x.id === 'string' && typeof x.time === 'string' && LOG_LEVELS.includes(x.level) && LOG_AREAS.includes(x.area) && typeof x.message === 'string';
}

function readStored(): LogEntry[] {
  try {
    const raw = storage()?.getItem(ERROR_LOG_KEY);
    if (!raw) return [];
    const o = JSON.parse(raw);
    const list = Array.isArray(o?.entries) ? o.entries : [];
    return list.filter(validEntry).map((e: LogEntry) => ({ ...e, session: typeof e.session === 'string' ? e.session : '' }));
  } catch {
    return [];
  }
}

/** Keep the newest entries within MAX_ENTRIES and MAX_BYTES. */
function capped(list: LogEntry[]): LogEntry[] {
  let out = list.length > MAX_ENTRIES ? list.slice(list.length - MAX_ENTRIES) : list;
  let size = JSON.stringify(out).length;
  while (size > MAX_BYTES && out.length > 1) {
    const drop = Math.max(1, Math.ceil(out.length / 20));
    out = out.slice(drop);
    size = JSON.stringify(out).length;
  }
  return out;
}

function persistNow(): void {
  if (!persist) return;
  const st = storage();
  if (!st) {
    persist = false;
    return;
  }
  // Merge with entries another tab saved, so two open tabs do not erase each other's log.
  const mine = new Set(entries.map((e) => e.id));
  const others = readStored().filter((e) => !mine.has(e.id) && e.session !== SESSION_ID && !absorbed.has(e.id));
  let list = others.length ? [...others, ...entries].sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0)) : entries;
  list = capped(list);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      st.setItem(ERROR_LOG_KEY, JSON.stringify({ v: 1, entries: list }));
      return;
    } catch {
      // Storage full: keep fewer entries; after three tries, keep the log in memory only.
      list = list.slice(Math.floor(list.length / 2));
    }
  }
  persist = false;
}

function notify(): void {
  for (const l of [...listeners]) {
    try {
      l();
    } catch {
      /* a listener failed: ignore */
    }
  }
}

function load(): void {
  entries = capped(readStored());
}
load();

function currentTerms(extra: string[]): string[] {
  let terms: string[] = [];
  try {
    terms = termsProvider ? [...termsProvider()] : [];
  } catch {
    terms = [];
  }
  const all = [...extra, ...terms].map((t) => (typeof t === 'string' ? t.trim() : '')).filter((t) => t.length >= 3 && !/^\d+(\.\d+)?$/.test(t));
  // Longest first, so "income group" is removed before "income".
  return [...new Set(all)].sort((a, b) => b.length - a.length).slice(0, 5000);
}

function buildContext(ctx: LogContext | undefined, terms: readonly string[]): LogContext {
  let base: Partial<LogContext> = {};
  try {
    base = contextProvider ? contextProvider() : {};
  } catch {
    base = {};
  }
  const merged: LogContext = { ...base, ...(ctx ?? {}), version: BUILD_INFO.label };
  const out: LogContext = {};
  for (const k of ['tab', 'dataset', 'provider', 'model', 'version', 'op'] as const) {
    const v = merged[k];
    if (typeof v === 'string' && v) out[k] = redact(v, 80, terms);
  }
  if (typeof merged.file === 'string' && merged.file) out.file = fileKind(merged.file) || 'unknown';
  if (typeof merged.ms === 'number' && Number.isFinite(merged.ms)) out.ms = Math.round(merged.ms);
  return out;
}

function add(level: LogLevel, area: LogArea, err: unknown, ctx?: LogContext, extraDetail?: string): void {
  if (isNoise(err)) return;
  if (err && typeof err === 'object') {
    if (loggedErrors.has(err)) return;
    loggedErrors.add(err);
  }
  if (!LOG_AREAS.includes(area)) area = 'ui';
  const d = describe(err);
  // The same raw problem again: count it (no new entry, no redaction work).
  const raw = `${level}|${area}|${d.message}|${d.lines.join('|')}`;
  const last = entries[entries.length - 1];
  const now = new Date();
  if (last && raw === lastRaw && last.session === SESSION_ID && now.getTime() - Date.parse(last.time) < REPEAT_MS) {
    last.count = (last.count ?? 1) + 1;
    last.time = now.toISOString();
    persistNow();
    notify();
    return;
  }
  lastRaw = raw;
  const fileName = typeof ctx?.file === 'string' ? ctx.file.trim() : '';
  const extra = fileName ? [fileName, fileName.replace(/^.*[\\/]/, ''), fileName.replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '')] : [];
  const terms = currentTerms(extra);
  const detailText = [...d.lines, extraDetail ?? ''].filter(Boolean).join('\n');
  const entry: LogEntry = {
    id: `${SESSION_ID}-${++seq}`,
    time: now.toISOString(),
    level,
    area,
    message: redact(d.message, MAX_MESSAGE, terms) || 'Unknown problem',
    context: buildContext(ctx, terms),
    session: SESSION_ID,
  };
  const detail = detailText ? redact(detailText, MAX_DETAIL, terms) : '';
  if (detail) entry.detail = detail;
  // The same problem logged in an earlier session (page load): one entry with the total count, moved
  // to now, instead of one entry per session (for example a storage error on every visit).
  const prevIdx = level === 'info' ? -1 : entries.findIndex((e) => e.session !== SESSION_ID && sameProblem(e, entry));
  if (prevIdx >= 0) {
    const prev = entries[prevIdx];
    entry.count = (prev.count ?? 1) + 1;
    entry.first = prev.first ?? prev.time;
    entry.sessions = (prev.sessions ?? 1) + 1;
    absorbed.add(prev.id);
    entries = entries.filter((_, i) => i !== prevIdx);
  }
  entries = capped([...entries, entry]);
  persistNow();
  notify();
}

/** Two entries describe the same problem (level, area, message, details and operation). */
function sameProblem(a: LogEntry, b: LogEntry): boolean {
  return a.level === b.level && a.area === b.area && a.message === b.message && (a.detail ?? '') === (b.detail ?? '') && (a.context?.op ?? '') === (b.context?.op ?? '');
}

function safely(fn: () => void): void {
  try {
    fn();
  } catch {
    /* logging must never throw */
  }
}

// ---------- public API ----------

/** Log an error. Returns `err` unchanged, so it can wrap a throw: `throw logError('ai', e)`. */
export function logError<T>(area: LogArea, err: T, context?: LogContext, extraDetail?: string): T {
  safely(() => add(softAiCode(err) ? 'warn' : 'error', area, err, context, extraDetail));
  return err;
}

export function logWarn(area: LogArea, err: unknown, context?: LogContext, extraDetail?: string): void {
  safely(() => add('warn', area, err, context, extraDetail));
}

export function logInfo(area: LogArea, message: string, context?: LogContext): void {
  safely(() => add('info', area, message, context));
}

/**
 * Log a caught failure: programming errors (TypeError, RangeError...) as errors, the messages the app
 * raises on purpose (a file it cannot read, a formula with a typo) as warnings. Returns `err`.
 */
export function logFailure<T>(area: LogArea, err: T, context?: LogContext): T {
  const level: LogLevel = typeof err === 'string' ? 'warn' : isLikelyBug(err) || !(err instanceof Error) ? 'error' : 'warn';
  safely(() => add(level, area, err, context));
  return err;
}

/** Record an operation that took longer than 5 seconds (as info). `op` is a code identifier. */
export function logSlow(area: LogArea, op: string, ms: number, context?: LogContext): void {
  if (!(ms > SLOW_MS)) return;
  safely(() => add('info', area, `Slow: ${op} took ${(ms / 1000).toFixed(1)} s`, { ...context, op, ms }));
}

/** All entries, newest first. */
export function getLog(): LogEntry[] {
  return entries.slice().reverse();
}

export function clearLog(): void {
  safely(() => {
    entries = [];
    lastRaw = '';
    seenCount = 0;
    absorbed.clear();
    try {
      storage()?.removeItem(ERROR_LOG_KEY);
    } catch {
      /* storage unavailable */
    }
    notify();
  });
}

/** Notified whenever the log changes. */
export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function sessionErrors(): number {
  return entries.filter((e) => e.session === SESSION_ID && e.level === 'error').length;
}

/** Errors logged in this session since the log was last opened (drives the Help menu dot). */
export function unseenErrorCount(): number {
  try {
    return Math.max(0, sessionErrors() - seenCount);
  } catch {
    return 0;
  }
}

/** The user opened the log: clear the "new errors" indicator. */
export function markLogSeen(): void {
  safely(() => {
    const n = sessionErrors();
    if (n !== seenCount) {
      seenCount = n;
      notify();
    }
  });
}

/** True when the log is kept in memory only (storage unavailable or full). */
export function logIsMemoryOnly(): boolean {
  return !persist;
}

// ---------- reports ----------

/** "Chrome 140 on Windows" from a user-agent string (no other details). */
export function describeBrowser(ua: string): string {
  const s = String(ua ?? '');
  const pick = (re: RegExp) => re.exec(s)?.[1]?.split('.')[0];
  let browser = 'Unknown browser';
  let v: string | undefined;
  if ((v = pick(/Edg(?:e|A|iOS)?\/([\d.]+)/))) browser = `Edge ${v}`;
  else if ((v = pick(/OPR\/([\d.]+)/))) browser = `Opera ${v}`;
  else if ((v = pick(/Firefox\/([\d.]+)/)) || (v = pick(/FxiOS\/([\d.]+)/))) browser = `Firefox ${v}`;
  else if ((v = pick(/(?:Chrome|CriOS)\/([\d.]+)/))) browser = `Chrome ${v}`;
  else if ((v = pick(/Version\/([\d.]+).*Safari/))) browser = `Safari ${v}`;
  const os = /Windows/.test(s) ? 'Windows' : /iPhone|iPad|iPod/.test(s) ? 'iOS' : /Mac OS X|Macintosh/.test(s) ? 'macOS' : /Android/.test(s) ? 'Android' : /CrOS/.test(s) ? 'ChromeOS' : /Linux/.test(s) ? 'Linux' : 'unknown system';
  return `${browser} on ${os}`;
}

function envLines(): string[] {
  const lines = [`Version: ${BUILD_INFO.label}`];
  try {
    if (typeof navigator !== 'undefined') {
      lines.push(`Browser: ${describeBrowser(navigator.userAgent)}`);
      if (navigator.language) lines.push(`Language: ${navigator.language}`);
    }
    if (typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) lines.push(`Page: ${location.origin}${location.pathname}`);
    else if (typeof location !== 'undefined') lines.push(`Page: ${location.protocol.replace(':', '')} (saved or embedded copy)`);
    if (typeof window !== 'undefined' && window.innerWidth) lines.push(`Window: ${window.innerWidth} x ${window.innerHeight}`);
  } catch {
    /* no browser details */
  }
  if (!persist) lines.push('Log storage: memory only (browser storage unavailable or full)');
  return lines;
}

function contextText(c: LogContext | undefined): string {
  if (!c) return '';
  const parts: string[] = [];
  if (c.tab) parts.push(`tab ${c.tab}`);
  if (c.dataset) parts.push(`data ${c.dataset}`);
  if (c.op) parts.push(`operation ${c.op}`);
  if (c.file) parts.push(`file type ${c.file}`);
  if (c.provider) parts.push(`AI ${c.provider}${c.model ? ` (${c.model})` : ''}`);
  if (c.ms != null) parts.push(`${(c.ms / 1000).toFixed(1)} s`);
  if (c.version) parts.push(`version ${c.version}`);
  return parts.join('; ');
}

/** One entry as plain text (used by the report and the Error log dialog). */
export function formatEntry(e: LogEntry, index?: number): string {
  const times = e.count && e.count > 1 ? `  (x${e.count}${e.sessions && e.sessions > 1 ? ` in ${e.sessions} sessions, first ${e.first ?? '?'}` : ''})` : '';
  const head = `${index != null ? `${index}. ` : ''}${e.time}  ${e.level.toUpperCase()}  ${e.area}${times}${e.session === SESSION_ID ? '  (this session)' : ''}`;
  const lines = [head, `   ${e.message}`];
  if (e.detail) lines.push(...e.detail.split('\n').map((l) => `   ${l}`));
  const ctx = contextText(e.context);
  if (ctx) lines.push(`   Context: ${ctx}`);
  return lines.join('\n');
}

/** The whole log as a plain-text report to paste into feedback. */
export function formatReport(opts: { entries?: LogEntry[] } = {}): string {
  try {
    const list = opts.entries ?? getLog();
    const nSession = list.filter((e) => e.session === SESSION_ID).length;
    const out = [
      'Socius error report',
      '===================',
      ...envLines(),
      `Report created: ${new Date().toISOString()}`,
      `Entries: ${list.length}${list.length ? ` (${nSession} from this session), newest first` : ''}`,
      '',
      'Privacy: this report has error messages and technical details only. Socius removes data values, variable names and labels, file names, text excerpts and keys before anything is logged.',
      '',
    ];
    if (!list.length) out.push('No problems have been logged.');
    list.forEach((e, i) => out.push(formatEntry(e, i + 1), ''));
    return out.join('\n').trimEnd() + '\n';
  } catch {
    return 'Socius error report\nThe report could not be created.\n';
  }
}

/** A short summary (version, browser, the last few errors) for prefilling a feedback form. */
export function formatSummary(limit = 5): string {
  try {
    const lines = envLines().filter((l) => /^(Version|Browser|Page):/.test(l));
    const recent = getLog().filter((e) => e.level !== 'info').slice(0, limit);
    if (!recent.length) lines.push('Error log: no errors logged.');
    else {
      lines.push(`Recent problems (newest first, ${recent.length} of ${entries.filter((e) => e.level !== 'info').length}):`);
      for (const e of recent) {
        const tags = [/^Code: (.+)$/m.exec(e.detail ?? '')?.[1], /^HTTP status: (\d+)$/m.exec(e.detail ?? '')?.[1] ? `HTTP ${/^HTTP status: (\d+)$/m.exec(e.detail ?? '')![1]}` : '', e.context?.op].filter(Boolean);
        lines.push(`- ${e.time.slice(0, 16).replace('T', ' ')} ${e.level} ${e.area}: ${truncate(e.message, 160)}${tags.length ? ` [${tags.join(', ')}]` : ''}${e.count && e.count > 1 ? ` (x${e.count})` : ''}`);
      }
    }
    return lines.join('\n');
  } catch {
    return `Version: ${BUILD_INFO.label}`;
  }
}

/** Test hook: forget everything and optionally re-read storage. */
export function __resetErrorLogForTests(opts: { reload?: boolean } = {}): void {
  entries = [];
  persist = true;
  seq = 0;
  seenCount = 0;
  lastRaw = '';
  contextProvider = null;
  termsProvider = null;
  if (opts.reload) load();
  notify();
}
