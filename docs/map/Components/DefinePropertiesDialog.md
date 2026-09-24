---
id: "src/features/data/DefineProperties.tsx#DefinePropertiesDialog"
type: component
file: src/features/data/DefineProperties.tsx
line: 36
area: features/data
---

# <DefinePropertiesDialog>

*React component* · defined in [[DefineProperties.tsx]] (line 36) · area [[features - data|features/data]]

- **Exported:** yes

## Calls
- [[properties.ts#applyPropertyDrafts|applyPropertyDrafts()]]
- [[properties.ts#copyDraftProps|copyDraftProps()]]
- [[properties.ts#draftFromVariable|draftFromVariable()]]
- [[properties.ts#draftIssues|draftIssues()]]
- [[dsops.ts#fmtN|fmtN()]]
- [[properties.ts#isDraftChanged|isDraftChanged()]]
- [[dsops.ts#plural|plural()]]
- [[properties.ts#scanVariables|scanVariables()]]
- [[properties.ts#statusOf|statusOf()]]
- [[log.ts#transformLogItem|transformLogItem()]]

## Renders
- [[Icon|<Icon>]]
- [[Modal|<Modal>]]
- [[StatusGlyph|<StatusGlyph>]]
- [[VariableEditor|<VariableEditor>]]
- [[VarMeasureIcon|<VarMeasureIcon>]]
- [[VarPicker|<VarPicker>]]

## Uses
- [[properties.ts#COPYABLE_PROPS|COPYABLE_PROPS]]
- [[properties.ts#DEFAULT_MAX_VALUES|DEFAULT_MAX_VALUES]]
- [[DefineProperties.tsx#DEFINE_PROPERTIES_TITLE|DEFINE_PROPERTIES_TITLE]]
- [[useStore]]
- [[useUi]]

## Reads
- [[dataset|useStore.dataset]] · alias

## Calls store actions
- [[addOutput()|useStore.addOutput()]] · alias
- [[mutateDataset()|useStore.mutateDataset()]] · alias
- [[toast()|useStore.toast()]] · alias
- [[confirm()|useUi.confirm()]] · getState

## Rendered by
- [[DialogHost|<DialogHost>]]

## Renders
- [[transform/define-properties|transform: define-properties]]

## Logs
- [[Transforms/define-properties|define-properties]]
