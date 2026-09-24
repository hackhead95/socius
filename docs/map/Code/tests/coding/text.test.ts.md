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
- [[text.ts]] · value
- [[vitest]] · value

## Calls
- [[text.ts#bigramFrequencies|bigramFrequencies()]]
- [[text.ts#charLength|charLength()]]
- [[text.ts#kwic|kwic()]]
- [[text.ts#searchRegex|searchRegex()]]
- [[text.ts#splitParagraphs|splitParagraphs()]]
- [[text.ts#splitSentences|splitSentences()]]
- [[text.ts#tokenize|tokenize()]]
- [[text.ts#wordFrequencies|wordFrequencies()]]

## Tests
- [[text.ts]] · import

## Private helpers
sentences() (line 4)
