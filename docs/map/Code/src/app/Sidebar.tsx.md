---
id: src/app/Sidebar.tsx
type: module
file: src/app/Sidebar.tsx
area: app
---

# src/app/Sidebar.tsx

*Module* · area [[Areas/app|app]] · 83 lines

> Collapsible variable list: search, measure icons, click to select in the grid, double-click to open in Variable View.

## Imports
- [[react]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value

## Imported by
- [[App.tsx]] · value

## Symbols

### Sidebar
*component* · line 9 · exported · note: [[Sidebar|<Sidebar>]]
- Renders: [[Icon|<Icon>]], [[VarMeasureIcon|<VarMeasureIcon>]]
- Calls: [[useStore]], [[useUi]]
- Reads: [[currentVarId|useUi.currentVarId]], [[dataset|useStore.dataset]], [[sidebarOpen|useUi.sidebarOpen]], [[useStore/tab|useStore.tab]]
- Store actions: [[focusGrid()|useUi.focusGrid()]], [[focusVariableView()|useUi.focusVariableView()]], [[setSidebarOpen()|useUi.setSidebarOpen()]], [[setTab()|useStore.setTab()]]
- Rendered by: [[Components/App|<App>]]
