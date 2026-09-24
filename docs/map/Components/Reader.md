---
id: "src/features/coding/Reader.tsx#Reader"
type: component
file: src/features/coding/Reader.tsx
line: 183
area: features/coding
---

# <Reader>

*React component* · defined in [[Reader.tsx]] (line 183) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[coding/actions.ts#applyCode|applyCode()]]
- [[segments.ts#assignLanes|assignLanes()]]
- [[tree.ts#codePath|codePath()]]
- [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[coding/actions.ts#createMemo|createMemo()]]
- [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- [[coding/analysis.ts#orderedAttributes|orderedAttributes()]]
- [[exports.ts#originLabel|originLabel()]]
- [[coding/hooks.ts#plural|plural()]]
- [[coding/actions.ts#removeSegment|removeSegment()]]
- [[coding/actions.ts#setSegmentMemo|setSegmentMemo()]]
- [[segments.ts#splitLines|splitLines()]]
- [[text.ts#tokenize|tokenize()]]
- [[segments.ts#trimRange|trimRange()]]
- [[coding/actions.ts#uncodeRange|uncodeRange()]]
- [[useCodeMap|useCodeMap()]]
- [[useCodingUi]]
- [[useSegmentIndex|useSegmentIndex()]]
- [[useStore]]

## Renders
- [[CodeChip|<CodeChip>]]
- [[Floating|<Floating>]]
- [[Para|<Para>]]
- [[QuickCode|<QuickCode>]]
- [[Swatch|<Swatch>]]

## Uses
- [[useCodingUi]]

## Reads
- [[jump|useCodingUi.jump]] · selector
- [[pending|useCodingUi.pending]] · alias, selector
- [[useStore/coding|useStore.coding]] · selector

## Writes
- [[pending|useCodingUi.pending]] · alias.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · alias, selector

## Opens
- [[doc-edit|coding: doc-edit]] · openLocalDialog

## Rendered by
- [[CodingWorkspace|<CodingWorkspace>]]

## Binds shortcut
- [[Enter (Reader)]]
- [[Space (Reader)]]
