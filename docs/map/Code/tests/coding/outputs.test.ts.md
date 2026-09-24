---
id: tests/coding/outputs.test.ts
type: test
file: tests/coding/outputs.test.ts
area: tests
---

# tests/coding/outputs.test.ts

*Test file* · area [[tests]] · 43 lines

## Test cases
- **output items**
  - frequencies, co-occurrence, attribute, words, KWIC and reliability items are well formed

## Imports
- [[coding-types.ts]] · type-only
- [[coding/analysis.ts]] · value
- [[outputs.ts]] · value
- [[coding/reliability.ts]] · value
- [[text.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/analysis.ts#codeByAttribute|codeByAttribute()]]
- [[outputs.ts#codeByAttributeOutput|codeByAttributeOutput()]]
- [[coding/analysis.ts#codeFrequencies|codeFrequencies()]]
- [[coding/reliability.ts#compareCoders|compareCoders()]]
- [[coding/analysis.ts#cooccurrence|cooccurrence()]]
- [[outputs.ts#cooccurrenceOutput|cooccurrenceOutput()]]
- [[outputs.ts#frequenciesOutput|frequenciesOutput()]]
- [[text.ts#kwic|kwic()]]
- [[outputs.ts#kwicOutput|kwicOutput()]]
- [[outputs.ts#reliabilityOutput|reliabilityOutput()]]
- [[text.ts#wordFrequencies|wordFrequencies()]]
- [[outputs.ts#wordFrequencyOutput|wordFrequencyOutput()]]

## Tests
- [[coding-types.ts]] · import
- [[coding/analysis.ts]] · import
- [[outputs.ts]] · import
- [[coding/reliability.ts]] · import
- [[text.ts]] · import

## Private helpers
codes (line 8) · docs (line 9) · seg() (line 10) · segments (line 11) · isPlainJson() (line 13)
