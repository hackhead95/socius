---
id: tests/output/dialog.test.ts
type: test
file: tests/output/dialog.test.ts
area: tests
---

# tests/output/dialog.test.ts

*Test file* · area [[tests]] · 98 lines

## Test cases
- **slot rules**
  - blocks type mismatches and replaces max-1 slots
  - warns (does not block) on measure mismatch
  - picks the best slot on double-click
  - reorders within a slot
  - describes counts
- **validation**
  - checks slot counts, group pairs, numbers and def.validate
- **session memory**
  - recalls slots and options, dropping variables that no longer exist
- **options that do not apply**
  - a cut-point t test does not ask for two group values (and vice versa)

## Imports
- [[procedure.ts]] · dynamic, type-only
- [[core/types.ts]] · value
- [[varUtils.ts]] · dynamic, value
- [[procedures/index.ts]] · dynamic
- [[vitest]] · value

## Calls
- [[varUtils.ts#addToSlot|addToSlot()]]
- [[varUtils.ts#bestSlotFor|bestSlotFor()]]
- [[varUtils.ts#clearMemory|clearMemory()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[varUtils.ts#measureWarning|measureWarning()]]
- [[varUtils.ts#moveWithinSlot|moveWithinSlot()]]
- [[varUtils.ts#recall|recall()]]
- [[varUtils.ts#remember|remember()]]
- [[varUtils.ts#slotCountHint|slotCountHint()]]
- [[varUtils.ts#validate|validate()]]

## Tests
- [[Compare Means|Analyze > Compare Means]] · menu label
- [[Procedures/binomial|Binomial]] · procedure id
- [[Procedures/ttest-independent|Independent-Samples T Test]] · procedure id
- [[procedure.ts]] · import
- [[core/types.ts]] · import
- [[varUtils.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
age (line 6) · sex (line 7) · town (line 8) · ds (line 9) · def (line 11)
