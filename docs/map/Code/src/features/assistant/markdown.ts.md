---
id: src/features/assistant/markdown.ts
type: module
file: src/features/assistant/markdown.ts
area: features/assistant
---

# src/features/assistant/markdown.ts

*Module* · area [[features - assistant|features/assistant]] · 298 lines

> A small Markdown parser for assistant answers: headings, paragraphs, bold/italic, inline code, links (http, https and mailto only), bullet and numbered lists (nested), code blocks, tables, block quotes and rules. It builds a tree that the React renderer turns into elements, so no model text is ever inserted as HTML. Tolerates half-finished input while an answer streams in.

## Tested by
- [[units.test.ts]] · import

## Imported by
- [[Markdown.tsx]] · value
- [[units.test.ts]] · value

## Types
Inline (line 6) · Block (line 14)

## Private helpers
SAFE_URL (line 23) · findClosing() (line 135) · RE_FENCE (line 153) · RE_HEADING (line 154) · RE_HR (line 155) · RE_LIST (line 156) · RE_QUOTE (line 157) · RE_TABLE_SEP (line 158) · splitRow() (line 160) · startsBlock() (line 184) · parseLines() (line 193)

## Symbols

### safeHref
*function* · line 25 · exported
- Uses: [[markdown.ts]]
- Used in: [[units.test.ts]]

### parseInline
*function* · line 32 · exported
> ---------- inline ----------
- Calls: [[markdown.ts#safeHref|safeHref()]], [[markdown.ts]]
- Used in: [[units.test.ts]]

### parseMarkdown
*function* · line 188 · exported
- Calls: [[markdown.ts]]
- Used in: [[Markdown.tsx]], [[units.test.ts]]

### inlineText
*function* · line 295 · exported
> Plain text of an answer (for "Copy answer" as text and for tests).
