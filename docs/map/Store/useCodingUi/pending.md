---
id: "store-key:useCodingUi.pending"
type: store-key
file: src/features/coding/uiStore.ts
line: 38
area: features/coding
---

# useCodingUi.pending

*Store state key* · defined in [[uiStore.ts]] (line 38) · area [[features - coding|features/coding]]

> Text selected in the reader, waiting for a code.

- **Store:** useCodingUi

## Read by
- [[CodebookPanel|<CodebookPanel>]] · hook (destructured)
- [[Reader|<Reader>]] · alias, selector

## Written by
- [[CodebookPanel|<CodebookPanel>]] · set alias
- [[Reader|<Reader>]] · alias.set, set()
- [[coding/actions.ts#deleteDocs|deleteDocs()]] · alias.set, set()

## Store
- [[useCodingUi]]
