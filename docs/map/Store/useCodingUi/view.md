---
id: "store-key:useCodingUi.view"
type: store-key
file: src/features/coding/uiStore.ts
line: 28
area: features/coding
---

# useCodingUi.view

*Store state key* · defined in [[uiStore.ts]] (line 28) · area [[features - coding|features/coding]]

- **Store:** useCodingUi

## Read by
- [[CodingWorkspace|<CodingWorkspace>]] · hook (destructured)
- [[ui-fixes.test.tsx]] · getState

## Written by
- [[CodebookPanel|<CodebookPanel>]] · set alias
- [[CodingWorkspace|<CodingWorkspace>]] · set alias
- [[CommandPalette|<CommandPalette>]] · getState.set, set()
- [[ResponsesView|<ResponsesView>]] · getState.set, set()
- [[SourcesPanel|<SourcesPanel>]] · set alias
- [[Summarise a code|AI > Summarise a code...]] · runAiFeature
- [[AiFeatureDialogs.tsx#doAction|doAction()]] · getState.set, set()
- [[uiStore.ts#jumpTo|jumpTo()]] · alias.set, set()
- [[coding/actions.ts#loadWorkedExample|loadWorkedExample()]] · getState.set, set()
- [[features.ts#runAiFeature|runAiFeature()]] · alias.set, set()
- [[ImportDialog.tsx]] · alias.set, set()
- [[summarise|Summarise a code]]
- [[ui-fixes.test.tsx]] · setState
- [[useEntries|useEntries()]] · getState.set, set()
- [[CodingDialog.tsx#ViewSwitch|ViewSwitch()]] · alias.set, set()

## Store
- [[useCodingUi]]
