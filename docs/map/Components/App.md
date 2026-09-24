---
id: "src/app/App.tsx#App"
type: component
file: src/app/App.tsx
line: 102
area: app
---

# <App>

*React component* · defined in [[App.tsx]] (line 102) · area [[Areas/app|app]]

- **Exported:** yes

## Calls
- [[ui-store.ts#applyTheme|applyTheme()]]
- [[useAutosave|useAutosave()]]
- [[useStartup|useStartup()]]
- [[useStore]]
- [[useUi]]

## Renders
- [[AiSettingsHost|<AiSettingsHost>]]
- [[AssistantRoot|<AssistantRoot>]]
- [[BusyOverlay|<BusyOverlay>]]
- [[CodingWorkspace|<CodingWorkspace>]]
- [[CommandPaletteHost|<CommandPaletteHost>]]
- [[ConfirmHost|<ConfirmHost>]]
- [[DataView|<DataView>]]
- [[DialogHost|<DialogHost>]]
- [[DropOverlay|<DropOverlay>]]
- [[GuardedDialogs|<GuardedDialogs>]]
- [[OutputViewer|<OutputViewer>]]
- [[PanelBoundary|<PanelBoundary>]]
- [[QuietBoundary|<QuietBoundary>]]
- [[Components/SampleBanner|<SampleBanner>]]
- [[Sidebar|<Sidebar>]]
- [[Components/Toasts|<Toasts>]]
- [[TopBar|<TopBar>]]
- [[VariableView|<VariableView>]]
- [[Welcome (app-Welcome)|<Welcome>]]

## Uses
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[useStore]]
- [[useUi]]

## Reads
- [[useStore/coding|useStore.coding]] · subscribe
- [[dataset|useStore.dataset]] · selector, subscribe
- [[outputs|useStore.outputs]] · selector, subscribe
- [[useStore/tab|useStore.tab]] · selector, subscribe
- [[home (store-key)|useUi.home]] · selector
- [[useUi/theme|useUi.theme]] · selector

## Calls store actions
- [[setTab()|useStore.setTab()]] · selector
- [[setHome()|useUi.setHome()]] · getState

## Rendered by
- [[main.tsx]]

## Binds shortcut
- [[ArrowRight (App)]]
