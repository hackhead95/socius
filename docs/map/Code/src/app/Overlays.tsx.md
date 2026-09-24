---
id: src/app/Overlays.tsx
type: module
file: src/app/Overlays.tsx
area: app
---

# src/app/Overlays.tsx

*Module* · area [[Areas/app|app]] · 280 lines

> Toasts, global confirm dialog, busy overlay and the drag-and-drop target.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[format-date.ts]] · value
- [[store.ts]] · value
- [[fileActions.ts]] · value
- [[Icon.tsx]] · value
- [[Modal.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Private helpers
placeAroundModal() (line 17) · INTERACTIVE (line 34) · controlsUnder() (line 37) · placeAvoidingControls() (line 62)

## Symbols

### useToastPlacement
*hook* · line 101 · note: [[useToastPlacement|useToastPlacement()]]
- Calls: [[Modal.tsx#topModal|topModal()]], [[Overlays.tsx]], [[useStore]]
- Uses: [[Modal.tsx#subscribeModals|subscribeModals()]]
- Reads: [[useStore/tab|useStore.tab]]

### Toasts
*component* · line 147 · exported · note: [[Components/Toasts|<Toasts>]]
> Notifications. They never cover controls: the toast itself lets clicks through to whatever is underneath (only its own buttons take clicks), while a dialog is open they move beside it, and otherwise they leave their corner when page cont...
- Renders: [[Icon|<Icon>]]
- Calls: [[fileActions.ts#startFresh|startFresh()]], [[format-date.ts#formatDateTime|formatDateTime()]], [[useStore]], [[useToastPlacement|useToastPlacement()]], [[useUi]]
- Uses: [[useUi]]
- Reads: [[restoredAt|useUi.restoredAt]], [[useStore/toasts|useStore.toasts]]
- Store actions: [[confirm()|useUi.confirm()]], [[dismissToast()|useStore.dismissToast()]], [[setRestoredAt()|useUi.setRestoredAt()]]
- Rendered by: [[Components/App|<App>]]

### ConfirmHost
*component* · line 208 · exported · note: [[ConfirmHost|<ConfirmHost>]]
- Renders: [[ConfirmDialog|<ConfirmDialog>]]
- Calls: [[useUi]]
- Reads: [[confirmReq|useUi.confirmReq]]
- Store actions: [[settleConfirm()|useUi.settleConfirm()]]
- Rendered by: [[Components/App|<App>]]

### BusyOverlay
*component* · line 215 · exported · note: [[BusyOverlay|<BusyOverlay>]]
- Calls: [[useUi]]
- Reads: [[busy|useUi.busy]]
- Rendered by: [[Components/App|<App>]]

### DropOverlay
*component* · line 229 · exported · note: [[DropOverlay|<DropOverlay>]]
> Full-window drop target shown while files are dragged over the page.
- Renders: [[Icon|<Icon>]]
- Calls: [[fileActions.ts#openDroppedFile|openDroppedFile()]]
- Rendered by: [[Components/App|<App>]]
