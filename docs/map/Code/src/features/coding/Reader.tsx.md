---
id: src/features/coding/Reader.tsx
type: module
file: src/features/coding/Reader.tsx
area: features/coding
---

# src/features/coding/Reader.tsx

*Module* · area [[features - coding|features/coding]] · 503 lines

> Reading view: a transcript with coded passages as highlighter marks, coding stripes in the margin, a quick-code popover on selection, and a segment popover on click. Paragraphs are memoised on a signature of their own segments, so coding one passage re-renders only the paragraphs it touches (fast for 10,000-word transcripts).

## Imports
- [[react]] · value
- [[coding-types.ts]] · type-only
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[QuickCode.tsx]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[coding/analysis.ts]] · value
- [[exports.ts]] · value
- [[segments.ts]] · value
- [[coding/text.ts]] · value
- [[tree.ts]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Private helpers
EMPTY (line 20) · ZWSP (line 21) · LANE_W (line 22) · MAX_LANES (line 23) · SPEAKER_RE (line 24) · clip() (line 48) · pointToOffset() (line 154) · clipText() (line 499)

## Symbols

### Para
*component* · line 53 · note: [[Para|<Para>]]
- Calls: [[coding/hooks.ts#fillOf|fillOf()]]
- Uses: [[Reader.tsx]]

### Reader
*component* · line 183 · exported · note: [[Reader|<Reader>]]
- Renders: [[CodeChip|<CodeChip>]], [[Floating|<Floating>]], [[Para|<Para>]], [[QuickCode|<QuickCode>]], [[Swatch|<Swatch>]]
- Calls: [[Reader.tsx]], [[coding/actions.ts#applyCode|applyCode()]], [[coding/actions.ts#createCode|createCode()]], [[coding/actions.ts#createMemo|createMemo()]], [[coding/actions.ts#removeSegment|removeSegment()]], [[coding/actions.ts#setSegmentMemo|setSegmentMemo()]], [[coding/actions.ts#uncodeRange|uncodeRange()]], [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]], [[coding/analysis.ts#orderedAttributes|orderedAttributes()]], [[coding/hooks.ts#plural|plural()]], [[coding/text.ts#tokenize|tokenize()]], [[exports.ts#originLabel|originLabel()]], [[segments.ts#assignLanes|assignLanes()]], [[segments.ts#splitLines|splitLines()]], [[segments.ts#trimRange|trimRange()]], [[tree.ts#codePath|codePath()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useCodeMap|useCodeMap()]], [[useCodingUi]], [[useSegmentIndex|useSegmentIndex()]], [[useStore]]
- Uses: [[Reader.tsx]], [[useCodingUi]]
- Reads: [[jump|useCodingUi.jump]], [[pending|useCodingUi.pending]], [[useStore/coding|useStore.coding]]
- Writes: [[pending|useCodingUi.pending]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[doc-edit|coding: doc-edit]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]
