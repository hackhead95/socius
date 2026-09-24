---
id: "src/app/Sidebar.tsx#Sidebar"
type: component
file: src/app/Sidebar.tsx
line: 9
area: app
---

# <Sidebar>

*React component* · defined in [[Sidebar.tsx]] (line 9) · area [[Areas/app|app]]

- **Exported:** yes

## Calls
- [[useStore]]
- [[useUi]]

## Renders
- [[Icon|<Icon>]]
- [[VarMeasureIcon|<VarMeasureIcon>]]

## Reads
- [[dataset|useStore.dataset]] · selector
- [[useStore/tab|useStore.tab]] · selector
- [[currentVarId|useUi.currentVarId]] · selector
- [[sidebarOpen|useUi.sidebarOpen]] · selector

## Calls store actions
- [[setTab()|useStore.setTab()]] · selector
- [[focusGrid()|useUi.focusGrid()]] · selector
- [[focusVariableView()|useUi.focusVariableView()]] · selector
- [[setSidebarOpen()|useUi.setSidebarOpen()]] · selector

## Rendered by
- [[Components/App|<App>]]
