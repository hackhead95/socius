---
id: src/app/Sidebar.tsx
type: module
file: src/app/Sidebar.tsx
area: app
---

# src/app/Sidebar.tsx

*Module* · area [[Areas/app|app]] · 147 lines

> Collapsible variable list: search, measure icons, click to select in the grid, double-click to open in Variable View.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Symbols

### Sidebar
*component* · line 10 · exported · note: [[Sidebar|<Sidebar>]]
- Renders: [[Icon|<Icon>]], [[VariableDrawer|<VariableDrawer>]], [[VariableList|<VariableList>]]
- Calls: [[useNarrow|useNarrow()]], [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[drawerOpen|useUi.drawerOpen]], [[sidebarOpen|useUi.sidebarOpen]]
- Store actions: [[setDrawerOpen()|useUi.setDrawerOpen()]], [[setSidebarOpen()|useUi.setSidebarOpen()]]
- Rendered by: [[Components/App|<App>]]

### VariableDrawer
*component* · line 44 · note: [[VariableDrawer|<VariableDrawer>]]
> The narrow-window variable list: a drawer over the data. Escape, a click outside or choosing a variable closes it.
- Renders: [[VariableList|<VariableList>]]
- Calls: [[useStore]]
- Uses: [[useUi]]
- Reads: [[dataset|useStore.dataset]]
- Store actions: [[setDrawerOpen()|useUi.setDrawerOpen()]]

### VariableList
*component* · line 91 · note: [[VariableList|<VariableList>]]
- Renders: [[Icon|<Icon>]], [[VarMeasureIcon|<VarMeasureIcon>]]
- Calls: [[useStore]], [[useUi]]
- Reads: [[currentVarId|useUi.currentVarId]], [[dataset|useStore.dataset]], [[useStore/tab|useStore.tab]]
- Store actions: [[focusGrid()|useUi.focusGrid()]], [[focusVariableView()|useUi.focusVariableView()]], [[setTab()|useStore.setTab()]]
