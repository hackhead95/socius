// Open fuzz findings (details, seeds and minimal reproductions: docs/qa/FUZZ-FINDINGS.md).
// A failure whose signature matches an entry here is reported but does not fail CI. When a finding is
// fixed, delete its entry: the fuzz suites then fail again if the problem comes back.
//
// Signature format (lib/findings.ts): `${area}|${subject}|${check}|${detail with numbers -> #,
// "quoted text" -> "…", ids -> <id>}`. Match on the stable part only.
import type { Failure } from './lib/findings';

export interface KnownIssue {
  id: string;
  area: Failure['area'];
  match: RegExp | ((f: Failure) => boolean);
}

export const KNOWN_ISSUES: KnownIssue[] = [
  // ---- P0 ----
  // ---- P1 ----
  // ---- P2 ----
];
