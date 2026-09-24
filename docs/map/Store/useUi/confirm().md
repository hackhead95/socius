---
id: "store-action:useUi.confirm"
type: store-action
file: src/app/ui-store.ts
line: 46
area: app
---

# useUi.confirm()

*Store action* · defined in [[ui-store.ts]] (line 46) · area [[Areas/app|app]]

- **Store:** useUi

## Reads
- [[confirmReq|useUi.confirmReq]]

## Writes
- [[confirmReq|useUi.confirmReq]]

## Called by
- [[AggregateDialog|<AggregateDialog>]] · getState
- [[DefinePropertiesDialog|<DefinePropertiesDialog>]] · getState
- [[SelectCasesDialog|<SelectCasesDialog>]] · getState
- [[Components/Toasts|<Toasts>]] · getState
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]] · getState
- [[fileActions.ts#confirmReplace|confirmReplace()]] · getState
- [[Close data and start fresh|File > Close data and start fresh...]]
- [[navigation-audit.test.tsx]] · setState
- [[useMenus|useMenus()]] · getState

## Store
- [[useUi]]
