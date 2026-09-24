---
id: "src/app/Sidebar.tsx#VariableList"
type: component
file: src/app/Sidebar.tsx
line: 91
area: app
---

# <VariableList>

*React component* · defined in [[Sidebar.tsx]] (line 91) · area [[Areas/app|app]]

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

## Calls store actions
- [[setTab()|useStore.setTab()]] · selector
- [[focusGrid()|useUi.focusGrid()]] · selector
- [[focusVariableView()|useUi.focusVariableView()]] · selector

## Rendered by
- [[Sidebar|<Sidebar>]]
- [[VariableDrawer|<VariableDrawer>]]
