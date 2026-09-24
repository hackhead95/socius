// Failure collection, de-duplication and the known-issue gate that keeps CI green while a finding is
// open. Every suite collects failures, then calls `gate()`: failures matching an entry in
// tests/fuzz/known-issues.ts are reported (not failed); anything new fails the test with its seed and
// a minimal reproduction. Removing a fixed entry from known-issues.ts is all it takes to re-arm it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { KNOWN_ISSUES, type KnownIssue } from '../known-issues';

export interface Failure {
  area: 'procedures' | 'transforms' | 'io' | 'ai' | 'ui';
  /** Procedure id, transform name, file kind, provider... */
  subject: string;
  /** Which invariant: throw, json, text, shape, apa, weight, filter, missing, oracle, undo, roundtrip, ... */
  check: string;
  detail: string;
  seed: number;
  /** Minimal reproduction (code snippet or steps). */
  repro?: string;
}

/** Normalise a failure to a stable signature for de-duplication (numbers, names and quotes elided). */
export function signature(f: Pick<Failure, 'area' | 'subject' | 'check' | 'detail'>): string {
  const d = f.detail
    .replace(/"[^"]{0,200}"/g, '"…"')
    .replace(/\b(v|ds|id)_[a-z0-9]+\b/gi, '<id>')
    .replace(/-?\d+(\.\d+)?(e[-+]?\d+)?/gi, '#')
    .replace(/\s+/g, ' ')
    .slice(0, 160);
  return `${f.area}|${f.subject}|${f.check}|${d}`;
}

export class Collector {
  readonly failures: Failure[] = [];
  private seen = new Map<string, number>();
  /** Histogram of user-facing error messages (numbers elided) per subject, for review. */
  readonly notes = new Map<string, number>();
  constructor(readonly suite: string) {}

  note(subject: string, message: string): void {
    const k = `${subject}: ${message.replace(/-?\d+(\.\d+)?/g, '#').slice(0, 200)}`;
    this.notes.set(k, (this.notes.get(k) ?? 0) + 1);
  }

  add(f: Failure): void {
    const sig = signature(f);
    const n = this.seen.get(sig) ?? 0;
    this.seen.set(sig, n + 1);
    if (n === 0) this.failures.push(f); // keep the first (usually the one we minimise)
  }

  count(f: Failure): number {
    return this.seen.get(signature(f)) ?? 0;
  }

  /** Split into known (matched to a FUZZ-FINDINGS id) and new failures, write a JSON report, return new ones. */
  gate(): { unknown: Failure[]; known: Array<Failure & { id: string }>; summary: string } {
    const known: Array<Failure & { id: string }> = [];
    const unknown: Failure[] = [];
    for (const f of this.failures) {
      const k = matchKnown(f);
      if (k) known.push({ ...f, id: k.id });
      else unknown.push(f);
    }
    const out = process.env.FUZZ_OUT ?? join(tmpdir(), 'socius-fuzz');
    try {
      mkdirSync(out, { recursive: true });
      writeFileSync(
        join(out, `${this.suite}.json`),
        JSON.stringify({ suite: this.suite, failures: this.failures.map((f) => ({ ...f, sig: signature(f), hits: this.count(f), known: matchKnown(f)?.id ?? null })), notes: Object.fromEntries([...this.notes].sort()) }, null, 1),
      );
    } catch {
      /* report is best-effort */
    }
    const summary =
      `[fuzz:${this.suite}] ${this.failures.length} distinct failure signature(s): ${known.length} known, ${unknown.length} new.` +
      (unknown.length ? '\n' + unknown.map(describe).join('\n\n') : '');
    return { unknown, known, summary };
  }
}

export function matchKnown(f: Failure): KnownIssue | undefined {
  const sig = signature(f);
  return KNOWN_ISSUES.find((k) => k.area === f.area && (typeof k.match === 'function' ? k.match(f) : k.match.test(sig)));
}

export function describe(f: Failure): string {
  return `- [${f.area}/${f.subject}] ${f.check}: ${f.detail}\n  seed=${f.seed}${f.repro ? `\n  repro:\n${f.repro.split('\n').map((l) => '    ' + l).join('\n')}` : ''}`;
}
