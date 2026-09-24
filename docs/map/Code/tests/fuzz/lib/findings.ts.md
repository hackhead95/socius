---
id: tests/fuzz/lib/findings.ts
type: test-helper
file: tests/fuzz/lib/findings.ts
area: tests
---

# tests/fuzz/lib/findings.ts

*Test helper* · area [[tests]] · 90 lines

> Failure collection, de-duplication and the known-issue gate that keeps CI green while a finding is open. Every suite collects failures, then calls `gate()`: failures matching an entry in tests/fuzz/known-issues.ts are reported (not failed); anything new fails the test with its seed and a minimal reproduction. Removing a fixed entry from known-issues.ts is all it takes to re-arm it.

## Imports
- [[node-fs|node:fs]] · value
- [[node-os|node:os]] · value
- [[node-path|node:path]] · value
- [[known-issues.ts]] · value

## Imported by
- [[ai-matrix.fuzz.test.ts]] · value
- [[io.fuzz.test.ts]] · value
- [[known-issues.ts]] · type-only
- [[proc-harness.ts]] · type-only, value
- [[procedures-oracle.fuzz.test.ts]] · value
- [[procedures-perf.fuzz.test.ts]] · value
- [[procedures.fuzz.test.ts]] · value
- [[transforms-expr.fuzz.test.ts]] · value
- [[transforms-ops.fuzz.test.ts]] · value

## Types
Failure (line 10)

## Symbols

### signature
*function* · line 23 · exported
> Normalise a failure to a stable signature for de-duplication (numbers, names and quotes elided).
- Used in: [[proc-harness.ts]]

### Collector
*class* · line 33 · exported
- Calls: [[findings.ts#matchKnown|matchKnown()]], [[findings.ts#signature|signature()]]
- Uses: [[findings.ts#describe|describe()]]
- Used in: [[ai-matrix.fuzz.test.ts]], [[io.fuzz.test.ts]], [[procedures-oracle.fuzz.test.ts]], [[procedures-perf.fuzz.test.ts]], [[procedures.fuzz.test.ts]], [[transforms-expr.fuzz.test.ts]], [[transforms-ops.fuzz.test.ts]]

### matchKnown
*function* · line 82 · exported
- Calls: [[findings.ts#signature|signature()]]
- Uses: [[known-issues.ts#KNOWN_ISSUES|KNOWN_ISSUES]]

### describe
*function* · line 87 · exported
