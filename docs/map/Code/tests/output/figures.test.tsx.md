---
id: tests/output/figures.test.tsx
type: test
file: tests/output/figures.test.tsx
area: tests
---

# tests/output/figures.test.tsx

*Test file* · area [[tests]] · 136 lines

> @vitest-environment jsdom UI-026: charts are APA figures ("Figure N" in bold, the title in italics) numbered like the tables' "Table N", and the title is shown once: not again inside the chart under the caption. The same holds for the Word and HTML exports and the rich copy. Also UI-030 (item dates) and UI-015 (outline tooltips).

## Test cases
- **APA figure numbers**
  - numbers tables and figures separately across the whole output
  - shows "Figure N" and the italic title above the chart, and leaves the title out of the chart
  - in SPSS style the chart keeps its own title and there is no figure number
  - a chart can be drawn without its title
- **exports print the caption, so the chart image leaves the title out**
  - Word (always APA)
  - HTML in APA style, but not in SPSS style (no caption there)
  - the rich copy of one result
- **Output dates and outline**
  - uses the shared date format for items and a tooltip for long outline titles

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[format-date.ts]] · dynamic
- [[output.ts]] · type-only
- [[store.ts]] · dynamic
- [[Chart.tsx]] · dynamic
- [[output/actions.ts]] · dynamic
- [[OutputViewer.tsx]] · dynamic
- [[viewPrefs.ts]] · dynamic
- [[vitest]] · value

## Tests
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[format-date.ts]] · import
- [[output.ts]] · import
- [[store.ts]] · import
- [[Chart.tsx]] · import
- [[output/actions.ts]] · import
- [[OutputViewer.tsx]] · import
- [[viewPrefs.ts]] · import

## Private helpers
calls (line 9) · useStore (line 34) · outputNumbering (line 35) · OutputViewer (line 35) · useOutputPrefs (line 36) · copyItem (line 37) · exportReport (line 37) · Chart (line 38) · formatDateTime (line 39) · formatTime (line 39) · chart (line 41) · at (line 42) · items() (line 43)
