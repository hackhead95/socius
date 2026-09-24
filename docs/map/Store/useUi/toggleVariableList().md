---
id: "store-action:useUi.toggleVariableList"
type: store-action
file: src/app/ui-store.ts
line: 35
area: app
---

# useUi.toggleVariableList()

*Store action* · defined in [[ui-store.ts]] (line 35) · area [[Areas/app|app]]

> View > Variable list: the side panel on wide windows, the drawer on narrow ones.

- **Store:** useUi

## Reads
- [[drawerOpen|useUi.drawerOpen]]
- [[sidebarOpen|useUi.sidebarOpen]]

## Calls store actions
- [[setDrawerOpen()|useUi.setDrawerOpen()]]
- [[setSidebarOpen()|useUi.setSidebarOpen()]]

## Called by
- [[menus.ts#buildMenus|buildMenus()]] · getState
- [[Variable list|View > Variable list]]

## Store
- [[useUi]]
