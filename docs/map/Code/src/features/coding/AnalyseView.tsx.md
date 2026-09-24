---
id: src/features/coding/AnalyseView.tsx
type: module
file: src/features/coding/AnalyseView.tsx
area: features/coding
---

# src/features/coding/AnalyseView.tsx

*Module* · area [[features - coding|features/coding]] · 483 lines

> Analysis of the coding: frequencies, co-occurrence, codes by attribute, word frequencies, KWIC.

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[coding/analysis.ts]] · value
- [[outputs.ts]] · value
- [[coding/text.ts]] · value
- [[tree.ts]] · value

## Tested by
- [[ui-fixes.test.tsx]] · import

## Imported by
- [[CodingWorkspace.tsx]] · value
- [[ui-fixes.test.tsx]] · dynamic, value

## Private helpers
TABS (line 14) · cap() (line 480)

## Symbols

### AnalyseView
*component* · line 22 · exported · note: [[AnalyseView|<AnalyseView>]]
- Renders: [[ByAttribute|<ByAttribute>]], [[Components/Frequencies|<Frequencies>]], [[Cooccurrence|<Cooccurrence>]], [[Kwic|<Kwic>]], [[Words|<Words>]]
- Calls: [[useCodingUi]], [[useStore]]
- Uses: [[AnalyseView.tsx]]
- Reads: [[analyseSources|useCodingUi.analyseSources]], [[analyseTab|useCodingUi.analyseTab]], [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]], [[ui-fixes.test.tsx]]

### SendButton
*component* · line 93 · note: [[SendButton|<SendButton>]]
- Calls: [[useStore]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[addOutput()|useStore.addOutput()]]

### Frequencies
*component* · line 103 · note: [[Components/Frequencies|<Frequencies>]]
- Renders: [[Components/Bar|<Bar>]], [[SendButton|<SendButton>]], [[Swatch|<Swatch>]]
- Calls: [[AnalyseView.tsx]], [[coding/analysis.ts#codeFrequencies|codeFrequencies()]], [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#saveCsv|saveCsv()]], [[outputs.ts#frequenciesOutput|frequenciesOutput()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[useStore/coding|useStore.coding]]

### heatPct
*function* · line 193 · exported
> Share of the accent colour in a co-occurrence cell (10 to 70%). Capped at 70% so the cell text keeps at least 3.4:1 contrast in both themes (UI-014: white on light blue was 2.74:1); the text colour for strong cells is set per theme in co...

### Cooccurrence
*component* · line 197 · note: [[Cooccurrence|<Cooccurrence>]]
- Renders: [[SendButton|<SendButton>]], [[Swatch|<Swatch>]]
- Calls: [[AnalyseView.tsx#heatPct|heatPct()]], [[coding/analysis.ts#cooccurrence|cooccurrence()]], [[outputs.ts#cooccurrenceOutput|cooccurrenceOutput()]], [[tree.ts#descendantIds|descendantIds()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[useStore/coding|useStore.coding]]

### ByAttribute
*component* · line 269 · note: [[ByAttribute|<ByAttribute>]]
- Renders: [[SendButton|<SendButton>]], [[Swatch|<Swatch>]]
- Calls: [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#codeByAttribute|codeByAttribute()]], [[outputs.ts#codeByAttributeOutput|codeByAttributeOutput()]], [[tree.ts#descendantIds|descendantIds()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]

### Words
*component* · line 352 · note: [[Words|<Words>]]
- Renders: [[SendButton|<SendButton>]], [[WordTable|<WordTable>]]
- Calls: [[coding/hooks.ts#plural|plural()]], [[coding/text.ts#bigramFrequencies|bigramFrequencies()]], [[coding/text.ts#wordFrequencies|wordFrequencies()]], [[outputs.ts#wordFrequencyOutput|wordFrequencyOutput()]], [[tree.ts#descendantIds|descendantIds()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]

### WordTable
*component* · line 405 · note: [[WordTable|<WordTable>]]
- Renders: [[Components/Bar|<Bar>]]

### Kwic
*component* · line 433 · note: [[Kwic|<Kwic>]]
- Renders: [[SendButton|<SendButton>]]
- Calls: [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#saveCsv|saveCsv()]], [[coding/text.ts#kwic|kwic()]], [[outputs.ts#kwicOutput|kwicOutput()]], [[uiStore.ts#jumpTo|jumpTo()]], [[useCodingUi]]
- Reads: [[kwicQuery|useCodingUi.kwicQuery]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
