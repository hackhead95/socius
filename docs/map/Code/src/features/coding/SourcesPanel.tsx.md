---
id: src/features/coding/SourcesPanel.tsx
type: module
file: src/features/coding/SourcesPanel.tsx
area: features/coding
---

# src/features/coding/SourcesPanel.tsx

*Module* · area [[features - coding|features/coding]] · 153 lines

> Source list: documents with search, coded/uncoded and attribute filters, segment counts.

## Imports
- [[react]] · value
- [[store.ts]] · value
- [[coding/actions.ts]] · value
- [[coding/hooks.ts]] · value
- [[ui.tsx]] · value
- [[uiStore.ts]] · value
- [[coding/analysis.ts]] · value
- [[Modal.tsx]] · value

## Imported by
- [[CodingWorkspace.tsx]] · value

## Private helpers
docSummary() (line 149)

## Symbols

### SourcesPanel
*component* · line 12 · exported · note: [[SourcesPanel|<SourcesPanel>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]], [[MenuButton|<MenuButton>]]
- Calls: [[SourcesPanel.tsx]], [[coding/actions.ts#deleteDocs|deleteDocs()]], [[coding/analysis.ts#attributeKeys|attributeKeys()]], [[coding/analysis.ts#attributeValues|attributeValues()]], [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]], [[coding/analysis.ts#orderedAttributes|orderedAttributes()]], [[coding/hooks.ts#plural|plural()]], [[uiStore.ts#openLocalDialog|openLocalDialog()]], [[useCodingUi]], [[useSegmentIndex|useSegmentIndex()]], [[useStore]]
- Reads: [[activeDocId|useCodingUi.activeDocId]], [[docAttr|useCodingUi.docAttr]], [[docFilter|useCodingUi.docFilter]], [[docSearch|useCodingUi.docSearch]], [[useStore/coding|useStore.coding]]
- Writes: [[activeDocId|useCodingUi.activeDocId]], [[docAttr|useCodingUi.docAttr]], [[docFilter|useCodingUi.docFilter]], [[docSearch|useCodingUi.docSearch]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[useCodingUi/set()|useCodingUi.set()]]
- Opens: [[coding/import|coding: import]], [[doc-edit|coding: doc-edit]]
- Rendered by: [[CodingWorkspace|<CodingWorkspace>]]
