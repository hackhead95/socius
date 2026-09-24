---
id: tests/fuzz/known-issues.ts
type: test-helper
file: tests/fuzz/known-issues.ts
area: tests
---

# tests/fuzz/known-issues.ts

*Test helper* · area [[tests]] · 20 lines

> Open fuzz findings (details, seeds and minimal reproductions: docs/qa/FUZZ-FINDINGS.md). A failure whose signature matches an entry here is reported but does not fail CI. When a finding is fixed, delete its entry: the fuzz suites then fail again if the problem comes back. Signature format (lib/findings.ts): `${area}|${subject}|${check}|${detail with numbers -> #, "quoted text" -> "…", ids -> <i...

## Imports
- [[findings.ts]] · type-only

## Imported by
- [[findings-repro.test.ts]] · value
- [[findings.ts]] · value

## Types
KnownIssue (line 9)

## Symbols

### KNOWN_ISSUES
*const* · line 15 · exported
- Used in: [[findings-repro.test.ts]], [[findings.ts]]
