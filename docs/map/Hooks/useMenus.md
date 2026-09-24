---
id: "src/app/menus.ts#useMenus"
type: hook
file: src/app/menus.ts
line: 55
area: app
---

# useMenus()

*React hook* · defined in [[menus.ts]] (line 55) · area [[Areas/app|app]]

> The menus, kept up to date (menubar, phone menu sheet, search palette).

- **Exported:** yes

## Calls
- [[menus.ts#buildMenus|buildMenus()]]
- [[useNarrow|useNarrow()]]
- [[useStore]]
- [[useUi]]
- [[useUndoRedo|useUndoRedo()]]
- [[useUnseenErrors|useUnseenErrors()]]

## Reads
- [[dataset|useStore.dataset]] · selector
- [[outputs|useStore.outputs]] · selector
- [[showValueLabels|useStore.showValueLabels]] · selector
- [[useStore/tab|useStore.tab]] · selector
- [[currentVarId|useUi.currentVarId]] · selector
- [[drawerOpen|useUi.drawerOpen]] · selector
- [[sidebarOpen|useUi.sidebarOpen]] · selector
- [[useUi/theme|useUi.theme]] · selector

## Called by
- [[MenuBar|<MenuBar>]]
- [[navigation-audit.test.tsx]]
- [[search.test.ts]]
- [[useEntries|useEntries()]]
