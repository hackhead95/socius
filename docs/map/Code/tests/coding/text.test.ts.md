---
id: tests/coding/text.test.ts
type: test
file: tests/coding/text.test.ts
area: tests
---

# tests/coding/text.test.ts

*Test file* · area [[tests]] · 101 lines

## Test cases
- **tokenizer**
  - handles English contractions and hyphens
  - keeps Bengali and Devanagari words whole, with vowel signs
  - counts characters without combining marks
- **word frequencies**
  - removes stopwords, applies min length and counts documents
  - keeps stopwords when asked
  - ignores numbers by default
  - bigrams within sentences, skipping stopword pairs
- **sentence splitting**
  - handles abbreviations, initials and decimals
  - splits at line breaks, closing quotes and the danda
  - does not split before a lower-case word
  - paragraphs
- **KWIC**
  - finds whole words with wildcard and gives context
  - phrase search with flexible whitespace
  - works for Bengali
  - escapes regex characters in queries
- **bigrams and punctuation**
  - does not pair words across a comma, dash or bracket

## Imports
- [[coding/text.ts]] · value
- [[vitest]] · value

## Calls
- [[coding/text.ts#bigramFrequencies|bigramFrequencies()]]
- [[coding/text.ts#charLength|charLength()]]
- [[coding/text.ts#kwic|kwic()]]
- [[coding/text.ts#searchRegex|searchRegex()]]
- [[coding/text.ts#splitParagraphs|splitParagraphs()]]
- [[coding/text.ts#splitSentences|splitSentences()]]
- [[coding/text.ts#tokenize|tokenize()]]
- [[coding/text.ts#wordFrequencies|wordFrequencies()]]

## Tests
- [[coding/text.ts]] · import

## Private helpers
sentences() (line 4)
