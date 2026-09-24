---
id: "store-action:useStore.setTab"
type: store-action
file: src/core/store.ts
line: 133
area: core
---

# useStore.setTab()

*Store action* · defined in [[store.ts]] (line 133) · area [[core]]

> ui

- **Store:** useStore

## Writes
- [[useStore/tab|useStore.tab]]

## Called by
- [[AggregateDialog|<AggregateDialog>]] · getState
- [[Components/App|<App>]] · selector
- [[CommandPalette|<CommandPalette>]] · getState
- [[DataViewInner|<DataViewInner>]] · selector
- [[Sidebar|<Sidebar>]] · selector
- [[VariableViewInner|<VariableViewInner>]] · selector
- [[fileActions.ts#activateDataset|activateDataset()]] · alias
- [[Explain a result|AI > Explain a result...]] · runAiFeature
- [[Suggest a codebook|AI > Suggest a codebook...]] · runAiFeature
- [[Suggest codes for open-ended answers|AI > Suggest codes for open-ended answers...]] · runAiFeature
- [[Summarise a code|AI > Summarise a code...]] · runAiFeature
- [[AiFeatureDialogs.tsx#doAction|doAction()]] · alias
- [[Find in data|Edit > Find in data...]]
- [[Go to case|Edit > Go to case...]]
- [[explain|Explain a result]]
- [[Load sample survey|File > Load sample survey]] · loadSample
- [[New dataset|File > New dataset]] · newDataset
- [[features.ts#runAiFeature|runAiFeature()]] · alias
- [[features.ts#startExplain|startExplain()]] · alias
- [[codebook|Suggest a codebook]]
- [[suggest|Suggest codes for open-ended answers]]
- [[summarise|Summarise a code]]
- [[navigation-audit.test.tsx]] · setState
- [[Auto-code with keyword rules|Text coding > Auto-code with keyword rules...]]
- [[Code co-occurrence|Text coding > Code co-occurrence]]
- [[Code frequencies|Text coding > Code frequencies]]
- [[Code open-ended responses|Text coding > Code open-ended responses]]
- [[Codebook export and import|Text coding > Codebook export and import...]]
- [[Text coding/Coders|Text coding > Coders...]]
- [[Codes by attribute|Text coding > Codes by attribute]]
- [[Export coded segments|Text coding > Export coded segments...]]
- [[Export codes to dataset|Text coding > Export codes to dataset...]]
- [[Import documents|Text coding > Import documents...]]
- [[Import open-ended answers from dataset|Text coding > Import open-ended answers from dataset...]]
- [[Intercoder reliability|Text coding > Intercoder reliability]]
- [[Keyword in context|Text coding > Keyword in context]]
- [[Load sample interviews|Text coding > Load sample interviews...]]
- [[Memos|Text coding > Memos]]
- [[Qualitative report|Text coding > Qualitative report...]]
- [[Retrieve coded segments|Text coding > Retrieve coded segments]]
- [[Word frequencies|Text coding > Word frequencies]]
- [[useEntries|useEntries()]] · getState alias
- [[useMenus|useMenus()]] · getState alias
- [[Data View|View > Data View]]
- [[Output|View > Output]]
- [[View/Text coding|View > Text coding]]
- [[Variable View|View > Variable View]]
- [[CodingDialog.tsx#ViewSwitch|ViewSwitch()]] · getState

## Store
- [[useStore]]
