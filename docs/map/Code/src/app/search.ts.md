---
id: src/app/search.ts
type: module
file: src/app/search.ts
area: app
---

# src/app/search.ts

*Module* · area [[Areas/app|app]] · 336 lines

> Matching and ranking for the search palette (Ctrl+K). Pure: no React, no store. Matching works on words: every word of the query must match a word of the entry (its title, menu path, synonyms or, with less weight, its description), either exactly, as the start of a word, inside a longer word, or with a small typo. Sociological and SPSS vocabulary ("chi square", "t test", "alpha", "select cases"...

## Imports
- [[Menu.tsx]] · type-only

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[search.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[navigation-audit.test.tsx]] · value
- [[search.test.ts]] · value

## Types
SearchGroup (line 10) · SearchEntry (line 12) · SearchResultGroup (line 169) · CommandEntry (line 289)

## Private helpers
STOPWORDS (line 32) · typoAllowance() (line 81) · prepCache (line 110) · prepare() (line 112) · best() (line 128)

## Symbols

### normalise
*function* · line 34 · exported
- Used in: [[search.test.ts]]

### words
*function* · line 46 · exported
- Calls: [[search.ts#normalise|normalise()]]

### queryWords
*function* · line 52 · exported
> Query words without filler words (unless the query is only filler).
- Calls: [[search.ts#words|words()]]
- Uses: [[search.ts]]
- Used in: [[search.test.ts]]

### editDistance
*function* · line 59 · exported
> Optimal string alignment distance (Levenshtein plus adjacent swaps), capped for speed.
- Used in: [[search.test.ts]]

### wordScore
*function* · line 86 · exported
> How well one query word matches one entry word (0..1).
- Calls: [[search.ts#editDistance|editDistance()]], [[search.ts]]
- Used in: [[search.test.ts]]

### scoreEntry
*function* · line 139 · exported
> Score of an entry for a query; 0 means "does not match".
- Calls: [[search.ts#editDistance|editDistance()]], [[search.ts#normalise|normalise()]], [[search.ts#queryWords|queryWords()]], [[search.ts]]
- Used in: [[search.test.ts]]

### GROUP_LIMITS
*const* · line 175 · exported

### searchEntries
*function* · line 178 · exported
> Matching entries grouped by kind, best group first; each group sorted best first.
- Calls: [[search.ts#scoreEntry|scoreEntry()]]
- Uses: [[search.ts#GROUP_LIMITS|GROUP_LIMITS]]
- Used in: [[CommandPalette.tsx]], [[navigation-audit.test.tsx]], [[search.test.ts]]

### SYNONYMS
*const* · line 203 · exported
> Extra words people use for a command, keyed by menu item id (procedure ids for Analyze and Graphs). `boost` ranks the usual choice first when several commands match equally.

### cleanLabel
*function* · line 297 · exported
> Menu label without the trailing "..." / "…" that means "opens a dialog".
- Used in: [[navigation-audit.test.tsx]], [[search.test.ts]]

### commandsFromMenus
*function* · line 302 · exported
> Every runnable menu item as a search entry (disabled ones keep their reason).
- Calls: [[search.ts#cleanLabel|cleanLabel()]]
- Uses: [[search.ts#SYNONYMS|SYNONYMS]]
- Used in: [[CommandPalette.tsx]], [[navigation-audit.test.tsx]], [[search.test.ts]]
