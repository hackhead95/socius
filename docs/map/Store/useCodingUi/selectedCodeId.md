---
id: "store-key:useCodingUi.selectedCodeId"
type: store-key
file: src/features/coding/uiStore.ts
line: 31
area: features/coding
---

# useCodingUi.selectedCodeId

*Store state key* · defined in [[uiStore.ts]] (line 31) · area [[features - coding|features/coding]]

- **Store:** useCodingUi

## Read by
- [[CodebookPanel|<CodebookPanel>]] · hook (destructured)
- [[ResponsesView|<ResponsesView>]] · selector
- [[RetrievalView|<RetrievalView>]] · hook (destructured)
- [[coding/actions.ts#deleteCode|deleteCode()]] · alias
- [[coding/actions.ts#mergeCode|mergeCode()]] · alias
- [[features.ts#runAiFeature|runAiFeature()]] · alias

## Written by
- [[CodebookPanel|<CodebookPanel>]] · set alias
- [[CodeEditDialog|<CodeEditDialog>]] · getState.set, set()
- [[RetrievalView|<RetrievalView>]] · set alias
- [[Summarise a code|AI > Summarise a code...]] · runAiFeature
- [[coding/actions.ts#deleteCode|deleteCode()]] · alias.set, set()
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]] · getState.set, set()
- [[coding/actions.ts#mergeCode|mergeCode()]] · alias.set, set()
- [[features.ts#runAiFeature|runAiFeature()]] · alias.set, set()
- [[summarise|Summarise a code]]
- [[useEntries|useEntries()]] · getState.set, set()

## Store
- [[useCodingUi]]
