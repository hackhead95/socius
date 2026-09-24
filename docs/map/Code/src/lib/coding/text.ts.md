---
id: src/lib/coding/text.ts
type: module
file: src/lib/coding/text.ts
area: lib/coding
---

# src/lib/coding/text.ts

*Module* · area [[lib - coding|lib/coding]] · 287 lines

> Text analysis: Unicode tokeniser, stopwords, word and bigram frequencies, sentences, KWIC. Works for any script with letters and combining marks (Bengali, Devanagari vowel signs etc.).

## Imports
- [[segments.ts]] · type-only

## Tested by
- [[outputs.test.ts]] · import
- [[text.test.ts]] · import

## Imported by
- [[AnalyseView.tsx]] · value
- [[AiDialogs.tsx]] · value
- [[Reader.tsx]] · value
- [[coding.ts]] · value
- [[outputs.ts]] · type-only
- [[coding/reliability.ts]] · value
- [[rules.ts]] · value
- [[outputs.test.ts]] · value
- [[text.test.ts]] · value

## Types
Token (line 10) · WordFreqOptions (line 50) · WordCount (line 60) · KwicLine (line 248)

## Private helpers
WORD_RE (line 7) · WORD_CHAR (line 8) · keepWord() (line 67) · resolve() (line 75) · sortCounts() (line 82) · ABBREVIATIONS (line 143) · escapeRe() (line 227)

## Symbols

### tokenize
*function* · line 18 · exported
- Uses: [[text.ts]]
- Used in: [[Reader.tsx]], [[text.test.ts]]

### charLength
*function* · line 28 · exported
> Length in user-perceived characters (code points, ignoring combining marks).
- Used in: [[text.test.ts]]

### ENGLISH_STOPWORDS
*const* · line 34 · exported

### wordFrequencies
*function* · line 89 · exported
> Word frequencies over a list of texts.
- Calls: [[text.ts#tokenize|tokenize()]], [[text.ts]]
- Used in: [[AnalyseView.tsx]], [[outputs.test.ts]], [[text.test.ts]]

### bigramFrequencies
*function* · line 113 · exported
> Bigram frequencies: pairs of adjacent words within one sentence, not separated by punctuation ("irregular, sometimes" is not a pair). With stopword removal, pairs containing a stopword are skipped (they are not bridged over).
- Calls: [[text.ts#splitSentences|splitSentences()]], [[text.ts#tokenize|tokenize()]], [[text.ts]]
- Used in: [[AnalyseView.tsx]], [[text.test.ts]]

### splitSentences
*function* · line 155 · exported
> Split text into sentence ranges (trimmed). Boundaries: . ! ? … and the Indic danda (। ॥), followed by whitespace, unless the dot ends a known abbreviation ("Dr.", "e.g.") or a single initial ("J."). Line breaks always end a sentence.
- Uses: [[text.ts]]
- Used in: [[coding/reliability.ts]], [[rules.ts]], [[text.test.ts]]

### splitParagraphs
*function* · line 213 · exported
> Paragraph ranges (trimmed): blocks separated by line breaks.
- Used in: [[AiDialogs.tsx]], [[rules.ts]], [[text.test.ts]]

### searchRegex
*function* · line 235 · exported
> Build a Unicode-aware, case-insensitive search regex for a word or phrase. `*` is a wildcard for any word characters ("migra*" matches migrant, migration). Whole words only unless `partial`.
- Uses: [[text.ts]]
- Used in: [[rules.ts]], [[text.test.ts]]

### kwic
*function* · line 258 · exported
> Keyword-in-context lines. `window` is the number of characters of context on each side.
- Calls: [[text.ts#searchRegex|searchRegex()]]
- Used in: [[AnalyseView.tsx]], [[coding.ts]], [[outputs.test.ts]], [[text.test.ts]]
