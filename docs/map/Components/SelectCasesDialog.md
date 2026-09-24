---
id: "src/features/transform/CasesDialogs.tsx#SelectCasesDialog"
type: component
file: src/features/transform/CasesDialogs.tsx
line: 127
area: features/transform
---

# <SelectCasesDialog>

*React component* · defined in [[CasesDialogs.tsx]] (line 127) · area [[features - transform|features/transform]]

> ---------- Select Cases ----------

- **Exported:** yes

## Calls
- [[transform/common.tsx#applyTransform|applyTransform()]]
- [[cases.ts#CasesError|CasesError]]
- [[transform/common.tsx#insertAtCursor|insertAtCursor()]]
- [[errorlog.ts#logFailure|logFailure()]]
- [[cases.ts#selectCasesTransform|selectCasesTransform()]]
- [[cases.ts#selectionValues|selectionValues()]]

## Renders
- [[ExpressionField|<ExpressionField>]]
- [[ExpressionHelper|<ExpressionHelper>]]
- [[NumField|<NumField>]]
- [[TransformModal|<TransformModal>]]
- [[VarSelect|<VarSelect>]]

## Uses
- [[cases.ts#CasesError|CasesError]]
- [[useUi]]

## Calls store actions
- [[confirm()|useUi.confirm()]] · getState

## Used by
- [[TransformDialogs.tsx]]

## Renders
- [[transform/select|transform: select]] · registry DIALOGS
