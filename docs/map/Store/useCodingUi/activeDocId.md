---
id: "store-key:useCodingUi.activeDocId"
type: store-key
file: src/features/coding/uiStore.ts
line: 35
area: features/coding
---

# useCodingUi.activeDocId

*Store state key* · defined in [[uiStore.ts]] (line 35) · area [[features - coding|features/coding]]

- **Store:** useCodingUi

## Read by
- [[CodingWorkspace|<CodingWorkspace>]] · hook (destructured)
- [[SourcesPanel|<SourcesPanel>]] · hook (destructured)
- [[coding/actions.ts#deleteDocs|deleteDocs()]] · alias

## Written by
- [[CodingWorkspace|<CodingWorkspace>]] · set alias
- [[SourcesPanel|<SourcesPanel>]] · set alias
- [[coding/actions.ts#deleteDocs|deleteDocs()]] · alias.set, set()
- [[uiStore.ts#jumpTo|jumpTo()]] · alias.set, set()
- [[ImportDialog.tsx]] · alias.set, set()
- [[ui-fixes.test.tsx]] · setState

## Store
- [[useCodingUi]]
