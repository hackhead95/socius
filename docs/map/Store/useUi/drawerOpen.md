---
id: "store-key:useUi.drawerOpen"
type: store-key
file: src/app/ui-store.ts
line: 32
area: app
---

# useUi.drawerOpen

*Store state key* · defined in [[ui-store.ts]] (line 32) · area [[Areas/app|app]]

> Narrow windows (below NARROW_PX): the variable list is an overlay drawer, closed until asked for.

- **Store:** useUi

## Read by
- [[Sidebar|<Sidebar>]] · selector
- [[menus.ts#buildMenus|buildMenus()]] · getState
- [[useMenus|useMenus()]] · selector
- [[setDrawerOpen()|useUi.setDrawerOpen()]]
- [[toggleVariableList()|useUi.toggleVariableList()]]

## Written by
- [[setDrawerOpen()|useUi.setDrawerOpen()]]

## Store
- [[useUi]]
