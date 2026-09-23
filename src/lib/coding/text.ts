// Text analysis: Unicode tokeniser, stopwords, word and bigram frequencies, sentences, KWIC.
// Works for any script with letters and combining marks (Bengali, Devanagari vowel signs etc.).

import type { Range } from './segments';

/** A word: letters, combining marks and digits, allowing inner apostrophes and hyphens ("don't", "self-help"). */
const WORD_RE = /[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*/gu;
const WORD_CHAR = '[\\p{L}\\p{M}\\p{N}]';

export interface Token {
  text: string;
  /** Lower-cased form used for counting. */
  norm: string;
  start: number;
  end: number;
}

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(WORD_RE)) {
    const t = m[0];
    out.push({ text: t, norm: t.toLocaleLowerCase().replace(/’/g, "'"), start: m.index!, end: m.index! + t.length });
  }
  return out;
}

/** Length in user-perceived characters (code points, ignoring combining marks). */
export function charLength(s: string): number {
  let n = 0;
  for (const ch of s) if (!/\p{M}/u.test(ch)) n++;
  return n;
}

export const ENGLISH_STOPWORDS: ReadonlySet<string> = new Set(
  `a about above after again against all almost also am an and any are aren't as at be because been before being below
between both but by can can't cannot could couldn't did didn't do does doesn't doing don't down during each either else
even ever every few for from further get gets getting got had hadn't has hasn't have haven't having he he'd he'll he's her
here here's hers herself him himself his how how's however i i'd i'll i'm i've if in into is isn't it it's its itself
just let's like may me might more most much must mustn't my myself neither no nor not now of off often on once only or
other ought our ours ourselves out over own quite rather really same shall shan't she she'd she'll she's should shouldn't
since so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're
they've this those though through thus to too under until up upon us very was wasn't we we'd we'll we're we've were
weren't what what's when when's where where's whether which while who who's whom whose why why's will with within without
won't would wouldn't yes yet you you'd you'll you're you've your yours yourself yourselves
um uh er erm yeah ok okay oh mm hmm also actually gonna wanna kind sort thing things lot`
    .split(/\s+/)
    .filter(Boolean),
);

export interface WordFreqOptions {
  removeStopwords?: boolean;
  /** Minimum word length in characters (default 3). */
  minLength?: number;
  /** Count numbers as words (default false). */
  includeNumbers?: boolean;
  /** Extra words to ignore. */
  extraStopwords?: string[];
}

export interface WordCount {
  term: string;
  count: number;
  /** Number of texts (documents / responses) containing the term. */
  docs: number;
}

function keepWord(norm: string, o: Required<Omit<WordFreqOptions, 'extraStopwords'>>, extra: Set<string>): boolean {
  if (charLength(norm) < o.minLength) return false;
  if (!o.includeNumbers && /^[\p{N}.,'\-]+$/u.test(norm)) return false;
  if (o.removeStopwords && (ENGLISH_STOPWORDS.has(norm) || extra.has(norm))) return false;
  if (!o.removeStopwords && extra.has(norm)) return false;
  return true;
}

function resolve(o: WordFreqOptions) {
  return {
    opts: { removeStopwords: o.removeStopwords ?? true, minLength: o.minLength ?? 3, includeNumbers: o.includeNumbers ?? false },
    extra: new Set((o.extraStopwords ?? []).map((w) => w.toLocaleLowerCase())),
  };
}

function sortCounts(m: Map<string, { count: number; docs: number }>): WordCount[] {
  return [...m.entries()]
    .map(([term, v]) => ({ term, count: v.count, docs: v.docs }))
    .sort((a, b) => b.count - a.count || b.docs - a.docs || a.term.localeCompare(b.term));
}

/** Word frequencies over a list of texts. */
export function wordFrequencies(texts: string[], options: WordFreqOptions = {}): WordCount[] {
  const { opts, extra } = resolve(options);
  const m = new Map<string, { count: number; docs: number }>();
  for (const t of texts) {
    const seen = new Set<string>();
    for (const tok of tokenize(t)) {
      if (!keepWord(tok.norm, opts, extra)) continue;
      const e = m.get(tok.norm) ?? { count: 0, docs: 0 };
      e.count++;
      if (!seen.has(tok.norm)) {
        e.docs++;
        seen.add(tok.norm);
      }
      m.set(tok.norm, e);
    }
  }
  return sortCounts(m);
}

/**
 * Bigram frequencies: pairs of adjacent words within one sentence. With stopword removal, pairs
 * containing a stopword are skipped (they are not bridged over).
 */
export function bigramFrequencies(texts: string[], options: WordFreqOptions = {}): WordCount[] {
  const { opts, extra } = resolve(options);
  const m = new Map<string, { count: number; docs: number }>();
  for (const t of texts) {
    const seen = new Set<string>();
    for (const sent of splitSentences(t)) {
      const toks = tokenize(t.slice(sent.start, sent.end));
      for (let i = 0; i + 1 < toks.length; i++) {
        const a = toks[i].norm, b = toks[i + 1].norm;
        if (!keepWord(a, opts, extra) || !keepWord(b, opts, extra)) continue;
        const key = `${a} ${b}`;
        const e = m.get(key) ?? { count: 0, docs: 0 };
        e.count++;
        if (!seen.has(key)) {
          e.docs++;
          seen.add(key);
        }
        m.set(key, e);
      }
    }
  }
  return sortCounts(m);
}

// ---------- Sentences and paragraphs ----------

/** Abbreviations that do not end a sentence (compared lower-case, without the final dot). */
const ABBREVIATIONS = new Set([
  'dr', 'mr', 'mrs', 'ms', 'mx', 'prof', 'sr', 'jr', 'st', 'mt', 'rev', 'hon', 'gen', 'col', 'lt', 'sgt', 'capt',
  'e.g', 'i.e', 'eg', 'ie', 'vs', 'cf', 'approx', 'no', 'nos', 'vol', 'fig', 'p', 'pp', 'ca', 'viz', 'al', 'dept',
  'inc', 'ltd', 'co', 'corp', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
  'smt', 'shri', 'sri',
]);

/**
 * Split text into sentence ranges (trimmed). Boundaries: . ! ? … and the Indic danda (। ॥), followed
 * by whitespace, unless the dot ends a known abbreviation ("Dr.", "e.g.") or a single initial ("J.").
 * Line breaks always end a sentence.
 */
export function splitSentences(text: string, base = 0): Range[] {
  const out: Range[] = [];
  const push = (s: number, e: number) => {
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e > s) out.push({ start: base + s, end: base + e });
  };
  let segStart = 0;
  const n = text.length;
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (ch === '\n') {
      push(segStart, i);
      segStart = i + 1;
      continue;
    }
    if (ch === '।' || ch === '॥') {
      let j = i + 1;
      while (j < n && /[।॥"'”’)\]]/.test(text[j])) j++;
      push(segStart, j);
      segStart = j;
      i = j - 1;
      continue;
    }
    if (ch !== '.' && ch !== '!' && ch !== '?' && ch !== '…') continue;
    let j = i + 1;
    while (j < n && /[.!?…]/.test(text[j])) j++;
    while (j < n && /["'”’)\]]/.test(text[j])) j++;
    if (j < n && !/\s/.test(text[j])) {
      i = j - 1;
      continue;
    }
    if (ch === '.' && j === i + 1) {
      // Word before the dot (may itself contain dots, like "e.g").
      let k = i;
      while (k > 0 && /[\p{L}\p{M}.]/u.test(text[k - 1])) k--;
      const word = text.slice(k, i).toLowerCase();
      if (ABBREVIATIONS.has(word) || /^\p{Lu}$/u.test(text.slice(k, i))) {
        i = j - 1;
        continue;
      }
      // Next non-space character is lower case: not a boundary ("approx. ten").
      let q = j;
      while (q < n && text[q] === ' ') q++;
      if (q < n && /\p{Ll}/u.test(text[q])) {
        i = j - 1;
        continue;
      }
    }
    push(segStart, j);
    segStart = j;
    i = j - 1;
  }
  push(segStart, n);
  return out;
}

/** Paragraph ranges (trimmed): blocks separated by line breaks. */
export function splitParagraphs(text: string): Range[] {
  const out: Range[] = [];
  const re = /[^\n]+/g;
  for (const m of text.matchAll(re)) {
    let s = m.index!, e = s + m[0].length;
    while (s < e && /\s/.test(text[s])) s++;
    while (e > s && /\s/.test(text[e - 1])) e--;
    if (e > s) out.push({ start: s, end: e });
  }
  return out;
}

// ---------- KWIC ----------

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a Unicode-aware, case-insensitive search regex for a word or phrase. `*` is a wildcard for
 * any word characters ("migra*" matches migrant, migration). Whole words only unless `partial`.
 */
export function searchRegex(query: string, partial = false): RegExp | null {
  const q = query.trim();
  if (!q) return null;
  const words = q.split(/\s+/).map((w) => w.split('*').map(escapeRe).join(`${WORD_CHAR}*`));
  const body = words.join('\\s+');
  const src = partial ? body : `(?<!${WORD_CHAR})${body}(?!${WORD_CHAR})`;
  try {
    return new RegExp(src, 'giu');
  } catch {
    return null;
  }
}

export interface KwicLine {
  docIndex: number;
  start: number;
  end: number;
  left: string;
  match: string;
  right: string;
}

/** Keyword-in-context lines. `window` is the number of characters of context on each side. */
export function kwic(texts: string[], query: string, opts: { window?: number; partial?: boolean; limit?: number } = {}): KwicLine[] {
  const re = searchRegex(query, opts.partial);
  if (!re) return [];
  const w = opts.window ?? 60;
  const limit = opts.limit ?? 5000;
  const out: KwicLine[] = [];
  texts.forEach((t, docIndex) => {
    if (out.length >= limit) return;
    for (const m of t.matchAll(re)) {
      if (m[0].length === 0) continue;
      const s = m.index!, e = s + m[0].length;
      let ls = Math.max(0, s - w);
      let re2 = Math.min(t.length, e + w);
      // Do not cut words in half at the edges.
      while (ls > 0 && ls < s && /[\p{L}\p{M}\p{N}]/u.test(t[ls - 1])) ls++;
      while (re2 < t.length && re2 > e && /[\p{L}\p{M}\p{N}]/u.test(t[re2])) re2--;
      out.push({
        docIndex,
        start: s,
        end: e,
        left: t.slice(ls, s).replace(/\s+/g, ' '),
        match: m[0],
        right: t.slice(e, re2).replace(/\s+/g, ' '),
      });
      if (out.length >= limit) break;
    }
  });
  return out;
}
