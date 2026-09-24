---
id: tests/coding/example.test.ts
type: test
file: tests/coding/example.test.ts
area: tests
---

# tests/coding/example.test.ts

*Test file* · area [[tests]] · 99 lines

> The Text coding worked example built from the bundled sample survey.

## Test cases
- **worked example for the sample survey**
  - is offered only for the bundled sample
  - imports every non-empty q_challenge answer with gender, city and area
  - creates about ten codes under a few themes, with descriptions and valid rules
  - auto-codes most answers, each code at least a few times, as whole-response rule coding
  - codes the multilingual answers too
  - explains itself in a memo and does not import the same answers twice

## Imports
- [[node-fs|node:fs]] · value
- [[node-url|node:url]] · value
- [[core/types.ts]] · type-only
- [[example.ts]] · value
- [[rules.ts]] · value
- [[io/index.ts]] · value
- [[samples/index.ts]] · value
- [[vitest]] · value

## Calls
- [[example.ts#buildWorkedExample|buildWorkedExample()]]
- [[example.ts#canBuildWorkedExample|canBuildWorkedExample()]]
- [[io/index.ts#importFile|importFile()]]
- [[rules.ts#parseRules|parseRules()]]

## Uses
- [[example.ts#EXAMPLE_ATTRIBUTES|EXAMPLE_ATTRIBUTES]]
- [[samples/index.ts#SAMPLE_SURVEY_FILE|SAMPLE_SURVEY_FILE]]

## Tests
- [[core/types.ts]] · import
- [[example.ts]] · import
- [[rules.ts]] · import
- [[io/index.ts]] · import
- [[samples/index.ts]] · import

## Private helpers
SAV (line 11) · ds (line 12)
