---
id: src/app/Overlays.tsx
type: module
file: src/app/Overlays.tsx
area: app
---

# src/app/Overlays.tsx

*Module* · area [[Areas/app|app]] · 127 lines

> Toasts, global confirm dialog, busy overlay and the drag-and-drop target.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[fileActions.ts]] · value
- [[Icon.tsx]] · value
- [[Modal.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Symbols

### Toasts
*component* · line 9 · exported · note: [[Components/Toasts|<Toasts>]]
- Renders: [[Icon|<Icon>]]
- Calls: [[fileActions.ts#startFresh|startFresh()]], [[useStore]], [[useUi]]
- Uses: [[useUi]]
- Reads: [[restoredAt|useUi.restoredAt]], [[useStore/toasts|useStore.toasts]]
- Store actions: [[confirm()|useUi.confirm()]], [[dismissToast()|useStore.dismissToast()]], [[setRestoredAt()|useUi.setRestoredAt()]]
- Rendered by: [[Components/App|<App>]]

### ConfirmHost
*component* · line 55 · exported · note: [[ConfirmHost|<ConfirmHost>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]]
- Calls: [[useUi]]
- Reads: [[confirmReq|useUi.confirmReq]]
- Store actions: [[settleConfirm()|useUi.settleConfirm()]]
- Rendered by: [[Components/App|<App>]]

### BusyOverlay
*component* · line 62 · exported · note: [[BusyOverlay|<BusyOverlay>]]
- Calls: [[useUi]]
- Reads: [[busy|useUi.busy]]
- Rendered by: [[Components/App|<App>]]

### DropOverlay
*component* · line 76 · exported · note: [[DropOverlay|<DropOverlay>]]
> Full-window drop target shown while files are dragged over the page.
- Renders: [[Icon|<Icon>]]
- Calls: [[fileActions.ts#openDroppedFile|openDroppedFile()]]
- Rendered by: [[Components/App|<App>]]
