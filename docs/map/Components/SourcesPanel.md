---
id: "src/features/coding/SourcesPanel.tsx#SourcesPanel"
type: component
file: src/features/coding/SourcesPanel.tsx
line: 12
area: features/coding
---

# <SourcesPanel>

*React component* · defined in [[SourcesPanel.tsx]] (line 12) · area [[features - coding|features/coding]]

- **Exported:** yes

## Calls
- [[coding/analysis.ts#attributeKeys|attributeKeys()]]
- [[coding/analysis.ts#attributeValues|attributeValues()]]
- [[coding/analysis.ts#constantAttributeKeys|constantAttributeKeys()]]
- [[coding/actions.ts#deleteDocs|deleteDocs()]]
- [[uiStore.ts#openLocalDialog|openLocalDialog()]]
- [[coding/analysis.ts#orderedAttributes|orderedAttributes()]]
- [[coding/hooks.ts#plural|plural()]]
- [[useCodingUi]]
- [[useSegmentIndex|useSegmentIndex()]]
- [[useStore]]

## Renders
- [[ConfirmDialog|<ConfirmDialog>]]
- [[MenuButton|<MenuButton>]]

## Reads
- [[activeDocId|useCodingUi.activeDocId]] · hook (destructured)
- [[docAttr|useCodingUi.docAttr]] · hook (destructured)
- [[docFilter|useCodingUi.docFilter]] · hook (destructured)
- [[docSearch|useCodingUi.docSearch]] · hook (destructured)
- [[useStore/coding|useStore.coding]] · selector

## Writes
- [[activeDocId|useCodingUi.activeDocId]] · set alias
- [[docAttr|useCodingUi.docAttr]] · set alias
- [[docFilter|useCodingUi.docFilter]] · set alias
- [[docSearch|useCodingUi.docSearch]] · set alias
- [[useCodingUi/view|useCodingUi.view]] · set alias

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · hook (destructured)

## Opens
- [[doc-edit|coding: doc-edit]] · openLocalDialog
- [[coding/import|coding: import]] · openLocalDialog

## Rendered by
- [[CodingWorkspace|<CodingWorkspace>]]
