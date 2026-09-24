---
id: src/lib/coding/rules.ts
type: module
file: src/lib/coding/rules.ts
area: lib/coding
---

# src/lib/coding/rules.ts

*Module* · area [[lib - coding|lib/coding]] · 134 lines

> Auto-coding: keyword / regex rules per code, applied to whole texts, sentences or paragraphs. Rule syntax (one rule per line): /regex/flags a JavaScript regular expression, e.g. /\bjob(s)?\b/i plain words case-insensitive whole-word match; * is a wildcard ("migra*"); several words form a phrase ("public transport"). Lines starting with # are comments.

## Imports
- [[coding-types.ts]] · type-only
- [[segments.ts]] · type-only, value
- [[coding/text.ts]] · value

## Calls
- [[coding/text.ts#splitParagraphs|splitParagraphs()]]
- [[coding/text.ts#splitSentences|splitSentences()]]
- [[segments.ts#trimRange|trimRange()]]

## Tested by
- [[example.test.ts]] · import
- [[rules.test.ts]] · import

## Imported by
- [[AutoCodeDialog.tsx]] · value
- [[SmallDialogs.tsx]] · value
- [[example.ts]] · value
- [[example.test.ts]] · value
- [[rules.test.ts]] · value

## Types
AutoScope (line 14) · ParsedRule (line 16) · RuleMatch (line 50)

## Private helpers
unitsFor() (line 64)

## Symbols

### parseRule
*function* · line 22 · exported
- Calls: [[coding/text.ts#searchRegex|searchRegex()]]
- Used in: [[rules.test.ts]]

### parseRules
*function* · line 41 · exported
- Uses: [[rules.ts#parseRule|parseRule()]]
- Used in: [[AutoCodeDialog.tsx]], [[SmallDialogs.tsx]], [[example.test.ts]]

### rulesFromText
*function* · line 46 · exported
> Split a rules textarea into lines.
- Used in: [[AutoCodeDialog.tsx]], [[SmallDialogs.tsx]]

### findRuleMatches
*function* · line 76 · exported
> Find auto-coding matches. For each code with valid rules and each document, every unit (whole text, sentence or paragraph) containing at least one match yields one RuleMatch. For whole-text scope on survey responses the unit spans 0..tex...
- Calls: [[rules.ts#parseRules|parseRules()]], [[rules.ts]]
- Used in: [[AutoCodeDialog.tsx]], [[example.ts]], [[rules.test.ts]]
