---
id: tests/coding/rules.test.ts
type: test
file: tests/coding/rules.test.ts
area: tests
---

# tests/coding/rules.test.ts

*Test file* · area [[tests]] · 50 lines

## Test cases
- **rule parsing**
  - reads regex with flags and plain words
  - plain words are case-insensitive whole words with * wildcard
- **findRuleMatches**
  - sentence scope codes each matching sentence
  - paragraph scope
  - whole-response scope spans 0..length for responses
  - flags units already coded by the same coder

## Imports
- [[coding-types.ts]] · type-only
- [[rules.ts]] · value
- [[vitest]] · value

## Calls
- [[rules.ts#findRuleMatches|findRuleMatches()]]
- [[rules.ts#parseRule|parseRule()]]

## Tests
- [[coding-types.ts]] · import
- [[rules.ts]] · import

## Private helpers
code() (line 5)
