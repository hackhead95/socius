---
id: "src/features/coding/hooks.ts#useVisibleSegments"
type: hook
file: src/features/coding/hooks.ts
line: 13
area: features/coding
---

# useVisibleSegments()

*React hook* · defined in [[coding/hooks.ts]] (line 13) · area [[features - coding|features/coding]]

> Segments shown in the UI: all coders, or only the active coder when "show all" is off.

- **Exported:** yes

## Calls
- [[useCodingUi]]
- [[useStore]]

## Reads
- [[showAllCoders|useCodingUi.showAllCoders]] · selector
- [[useStore/coding|useStore.coding]] · selector

## Called by
- [[ByAttribute|<ByAttribute>]]
- [[CodebookPanel|<CodebookPanel>]]
- [[Cooccurrence|<Cooccurrence>]]
- [[Components/Frequencies|<Frequencies>]]
- [[RetrievalView|<RetrievalView>]]
- [[Words|<Words>]]
- [[useSegmentIndex|useSegmentIndex()]]
