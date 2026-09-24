---
id: "src/app/Overlays.tsx#Toasts"
type: component
file: src/app/Overlays.tsx
line: 9
area: app
---

# <Toasts>

*React component* · defined in [[Overlays.tsx]] (line 9) · area [[Areas/app|app]]

- **Exported:** yes

## Calls
- [[fileActions.ts#startFresh|startFresh()]]
- [[useStore]]
- [[useUi]]

## Renders
- [[Icon|<Icon>]]

## Uses
- [[useUi]]

## Reads
- [[useStore/toasts|useStore.toasts]] · selector
- [[restoredAt|useUi.restoredAt]] · selector

## Calls store actions
- [[dismissToast()|useStore.dismissToast()]] · selector
- [[confirm()|useUi.confirm()]] · getState
- [[setRestoredAt()|useUi.setRestoredAt()]] · selector

## Rendered by
- [[Components/App|<App>]]
