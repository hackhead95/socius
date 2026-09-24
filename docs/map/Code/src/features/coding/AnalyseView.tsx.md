---
id: src/features/coding/AnalyseView.tsx
type: module
file: src/features/coding/AnalyseView.tsx
area: features/coding
---

# src/features/coding/AnalyseView.tsx

*Module* · area [[features - coding|features/coding]] · 459 lines

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
- [[text.ts]] · value
- [[tree.ts]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Private helpers
TABS (line 14) · cap() (line 456)

## Symbols

### AnalyseView
*component* · line 22 · exported · note: [[AnalyseView|<AnalyseView>]]
- Renders: [[ByAttribute|<ByAttribute>]], [[Components/Frequencies|<Frequencies>]], [[Cooccurrence|<Cooccurrence>]], [[Kwic|<Kwic>]], [[Words|<Words>]]
- Calls: [[useCodingUi]], [[useStore]]
- Uses: [[AnalyseView.tsx]]
- Reads: [[analyseSources|useCodingUi.analyseSources]], [[analyseTab|useCodingUi.analyseTab]], [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]

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

### Cooccurrence
*component* · line 173 · note: [[Cooccurrence|<Cooccurrence>]]
- Renders: [[SendButton|<SendButton>]], [[Swatch|<Swatch>]]
- Calls: [[coding/analysis.ts#cooccurrence|cooccurrence()]], [[outputs.ts#cooccurrenceOutput|cooccurrenceOutput()]], [[tree.ts#descendantIds|descendantIds()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[useStore/coding|useStore.coding]]

### ByAttribute
*component* · line 245 · note: [[ByAttribute|<ByAttribute>]]
- Renders: [[SendButton|<SendButton>]], [[Swatch|<Swatch>]]
- Calls: [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#codeByAttribute|codeByAttribute()]], [[outputs.ts#codeByAttributeOutput|codeByAttributeOutput()]], [[tree.ts#descendantIds|descendantIds()]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[dataset|useStore.dataset]], [[useStore/coding|useStore.coding]]

### Words
*component* · line 328 · note: [[Words|<Words>]]
- Renders: [[SendButton|<SendButton>]], [[WordTable|<WordTable>]]
- Calls: [[coding/hooks.ts#plural|plural()]], [[outputs.ts#wordFrequencyOutput|wordFrequencyOutput()]], [[text.ts#bigramFrequencies|bigramFrequencies()]], [[text.ts#wordFrequencies|wordFrequencies()]], [[tree.ts#descendantIds|descendantIds()]], [[useCodingUi]], [[useOrderedCodes|useOrderedCodes()]], [[useStore]], [[useVisibleSegments|useVisibleSegments()]]
- Reads: [[useStore/coding|useStore.coding]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]

### WordTable
*component* · line 381 · note: [[WordTable|<WordTable>]]
- Renders: [[Components/Bar|<Bar>]]

### Kwic
*component* · line 409 · note: [[Kwic|<Kwic>]]
- Renders: [[SendButton|<SendButton>]]
- Calls: [[coding/hooks.ts#plural|plural()]], [[coding/hooks.ts#saveCsv|saveCsv()]], [[outputs.ts#kwicOutput|kwicOutput()]], [[text.ts#kwic|kwic()]], [[uiStore.ts#jumpTo|jumpTo()]], [[useCodingUi]]
- Reads: [[kwicQuery|useCodingUi.kwicQuery]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
