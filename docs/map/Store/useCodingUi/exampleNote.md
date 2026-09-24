---
id: "store-key:useCodingUi.exampleNote"
type: store-key
file: src/features/coding/uiStore.ts
line: 57
area: features/coding
---

# useCodingUi.exampleNote

*Store state key* · defined in [[uiStore.ts]] (line 57) · area [[features - coding|features/coding]]

> Memo id of the loaded worked example: its note shows above the responses while that memo exists.

- **Store:** useCodingUi

## Read by
- [[ResponsesView|<ResponsesView>]] · selector

## Written by
- [[ResponsesView|<ResponsesView>]] · getState.set, set()
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]] · getState.set, set()
- [[ui-fixes.test.tsx]] · setState

## Store
- [[useCodingUi]]
