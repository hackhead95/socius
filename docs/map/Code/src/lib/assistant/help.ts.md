---
id: src/lib/assistant/help.ts
type: module
file: src/lib/assistant/help.ts
area: lib/assistant
---

# src/lib/assistant/help.ts

*Module* · area [[lib - assistant|lib/assistant]] · 157 lines

> Search over the beginner's guide (docs/guide/guide.md), so "how do I ... in Socius" answers follow the real steps and menu names. The guide is bundled as raw text (a lazy chunk on the static site) and split into sections; a small keyword ranking picks the best two or three.

## Imports
- `docs/guide/guide.md` · dynamic

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[tools/help.ts]] · value
- [[units.test.ts]] · value

## Types
HelpSection (line 5)

## Symbols

### STOP
*const* · line 11
- Used in: [[tools/help.ts]]

### SYNONYMS
*const* · line 16
> Words that mean the same thing to a beginner.
- Used in: [[tools/help.ts]]

### stem
*function* · line 60
- Used in: [[tools/help.ts]]

### helpTokens
*function* · line 67 · exported
- Uses: [[assistant/help.ts#STOP|STOP]], [[assistant/help.ts#stem|stem()]]
- Used in: [[tools/help.ts]]

### cleanGuideText
*function* · line 72 · exported
> Replace the guide's own markup with plain text.
- Used in: [[tools/help.ts]], [[units.test.ts]]

### splitGuide
*function* · line 85 · exported
> Split the guide into sections (## headings; a chapter's intro is its own section).
- Calls: [[assistant/help.ts#cleanGuideText|cleanGuideText()]]
- Used in: [[tools/help.ts]], [[units.test.ts]]

### rankSections
*function* · line 113 · exported
> Rank sections for a question. Returns the best `n` with a score above zero.
- Calls: [[assistant/help.ts#helpTokens|helpTokens()]]
- Uses: [[assistant/help.ts#SYNONYMS|SYNONYMS]]
- Used in: [[tools/help.ts]], [[units.test.ts]]

### sectionsPromise
*const* · line 141
- Used in: [[tools/help.ts]]

### guideSections
*function* · line 144 · exported
> Sections of the bundled guide (loaded once, lazily).
- Calls: [[assistant/help.ts#splitGuide|splitGuide()]]
- Uses: [[assistant/help.ts#sectionsPromise|sectionsPromise]]
- Used in: [[tools/help.ts]]

### sectionText
*function* · line 153 · exported
- Used in: [[tools/help.ts]]
