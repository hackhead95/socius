// Auto-coding: keyword / regex rules per code, applied to whole texts, sentences or paragraphs.
//
// Rule syntax (one rule per line):
//   /regex/flags   a JavaScript regular expression, e.g. /\bjob(s)?\b/i
//   plain words    case-insensitive whole-word match; * is a wildcard ("migra*"); several words
//                  form a phrase ("public transport").
// Lines starting with # are comments.

import type { CodeDef, CodedSegment, TextDoc } from '../../core/coding-types';
import { searchRegex, splitParagraphs, splitSentences } from './text';
import type { Range } from './segments';
import { trimRange } from './segments';

export type AutoScope = 'text' | 'sentence' | 'paragraph';

export interface ParsedRule {
  source: string;
  re: RegExp | null;
  error?: string;
}

export function parseRule(line: string): ParsedRule | null {
  const src = line.trim();
  if (!src || src.startsWith('#')) return null;
  const m = /^\/(.+)\/([a-z]*)$/s.exec(src);
  if (m) {
    const flags = [...new Set((m[2] + 'g').split(''))].filter((f) => 'gimsuy'.includes(f)).join('');
    try {
      const re = new RegExp(m[1], flags);
      if (re.test('')) return { source: src, re: null, error: 'This pattern matches empty text.' };
      re.lastIndex = 0;
      return { source: src, re };
    } catch (e: any) {
      return { source: src, re: null, error: `Invalid pattern: ${e?.message ?? 'syntax error'}` };
    }
  }
  const re = searchRegex(src);
  return re ? { source: src, re } : { source: src, re: null, error: 'Could not read this rule.' };
}

export function parseRules(lines: string[] | undefined): ParsedRule[] {
  return (lines ?? []).map(parseRule).filter((r): r is ParsedRule => r !== null);
}

/** Split a rules textarea into lines. */
export function rulesFromText(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter(Boolean);
}

export interface RuleMatch {
  docId: string;
  codeId: string;
  /** Unit that will be coded. */
  start: number;
  end: number;
  /** The matched words inside the unit (for preview highlighting). */
  hits: Range[];
  /** Rules that matched. */
  rules: string[];
  /** Already coded with this code by this coder (would add nothing). */
  alreadyCoded: boolean;
}

function unitsFor(text: string, scope: AutoScope): Range[] {
  if (scope === 'sentence') return splitSentences(text);
  if (scope === 'paragraph') return splitParagraphs(text);
  const r = trimRange(text, 0, text.length);
  return r ? [r] : [];
}

/**
 * Find auto-coding matches. For each code with valid rules and each document, every unit (whole text,
 * sentence or paragraph) containing at least one match yields one RuleMatch.
 * For whole-text scope on survey responses the unit spans 0..text.length, as whole-response coding does.
 */
export function findRuleMatches(
  docs: TextDoc[],
  codes: CodeDef[],
  scope: AutoScope,
  existing: CodedSegment[],
  coder: string,
): RuleMatch[] {
  const out: RuleMatch[] = [];
  const segsByDocCode = new Map<string, CodedSegment[]>();
  for (const s of existing) {
    if (s.coder !== coder) continue;
    const k = `${s.docId}\u0000${s.codeId}`;
    const arr = segsByDocCode.get(k);
    if (arr) arr.push(s);
    else segsByDocCode.set(k, [s]);
  }
  const compiled = codes
    .map((c) => ({ code: c, rules: parseRules(c.rules).filter((r) => r.re) }))
    .filter((c) => c.rules.length);
  if (!compiled.length) return out;
  for (const doc of docs) {
    const units = unitsFor(doc.text, scope);
    for (const { code, rules } of compiled) {
      const hitsByUnit = new Map<number, { hits: Range[]; rules: Set<string> }>();
      for (const rule of rules) {
        const re = new RegExp(rule.re!.source, rule.re!.flags);
        for (const m of doc.text.matchAll(re)) {
          if (!m[0]) continue;
          const s = m.index!, e = s + m[0].length;
          const ui = units.findIndex((u) => s < u.end && u.start < e);
          if (ui < 0) continue;
          const entry = hitsByUnit.get(ui) ?? { hits: [], rules: new Set<string>() };
          entry.hits.push({ start: s, end: e });
          entry.rules.add(rule.source);
          hitsByUnit.set(ui, entry);
        }
      }
      const prior = segsByDocCode.get(`${doc.id}\u0000${code.id}`) ?? [];
      for (const [ui, entry] of [...hitsByUnit.entries()].sort((a, b) => a[0] - b[0])) {
        let { start, end } = units[ui];
        if (scope === 'text' && doc.kind === 'response') {
          start = 0;
          end = doc.text.length;
        }
        out.push({
          docId: doc.id,
          codeId: code.id,
          start,
          end,
          hits: entry.hits.sort((a, b) => a.start - b.start),
          rules: [...entry.rules],
          alreadyCoded: prior.some((p) => p.start <= start && p.end >= end),
        });
      }
    }
  }
  return out;
}
