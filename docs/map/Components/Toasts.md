---
id: "src/app/Overlays.tsx#Toasts"
type: component
file: src/app/Overlays.tsx
line: 147
area: app
---

# <Toasts>

*React component* · defined in [[Overlays.tsx]] (line 147) · area [[Areas/app|app]]

> Notifications. They never cover controls: the toast itself lets clicks through to whatever is underneath (only its own buttons take clicks), while a dialog is open they move beside it, and otherwise they leave their corner when page cont...

- **Exported:** yes

## Calls
- [[format-date.ts#formatDateTime|formatDateTime()]]
- [[fileActions.ts#startFresh|startFresh()]]
- [[useStore]]
- [[useToastPlacement|useToastPlacement()]]
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
