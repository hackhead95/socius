---
id: src/app/App.tsx
type: module
file: src/app/App.tsx
area: app
---

# src/app/App.tsx

*Module* · area [[Areas/app|app]] · 208 lines

> App shell: top bar + menubar, main tabs, variable sidebar, dialogs, toasts, drag-and-drop, session restore (else the welcome screen) and autosave.

## Imports
- [[react]] · value
- `src/app/app.css` · side-effect
- [[CommandPalette.tsx]] · value
- [[DialogHost.tsx]] · value
- [[ErrorBoundary.tsx]] · value
- [[Overlays.tsx]] · value
- [[shortcuts.ts]] · value
- [[Sidebar.tsx]] · value
- [[TopBar.tsx]] · value
- [[ui-store.ts]] · value
- [[Welcome.tsx]] · value
- [[store.ts]] · value
- [[AiSettingsDialog.tsx]] · value
- [[AssistantRoot.tsx]] · value
- [[CodingWorkspace.tsx]] · value
- `src/features/data/data.css` · side-effect
- [[DataView.tsx]] · value
- [[VariableView.tsx]] · value
- [[OutputViewer.tsx]] · value
- [[fileActions.ts]] · value
- [[persistence.ts]] · value
- `src/features/transform/transform.css` · side-effect

## Imported by
- [[main.tsx]] · value

## Private helpers
AUTOSAVE_MS (line 26) · BIG_CELLS (line 27)

## Symbols

### useStartup
*hook* · line 29 · note: [[useStartup|useStartup()]]
- Calls: [[fileActions.ts#applyProject|applyProject()]], [[persistence.ts#loadSession|loadSession()]]
- Uses: [[useUi]]
- Store actions: [[markClean()|useUi.markClean()]], [[setRestoredAt()|useUi.setRestoredAt()]]

### useAutosave
*hook* · line 59 · note: [[useAutosave|useAutosave()]]
- Calls: [[fileActions.ts#currentProjectState|currentProjectState()]], [[fileActions.ts#isModified|isModified()]], [[persistence.ts#saveSession|saveSession()]]
- Uses: [[App.tsx]], [[useStore]], [[useUi]]
- Reads: [[cleanDataset|useUi.cleanDataset]], [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[showValueLabels|useStore.showValueLabels]], [[useStore/coding|useStore.coding]], [[useStore/tab|useStore.tab]]

### App
*component* · line 102 · exported · note: [[Components/App|<App>]]
- Renders: [[AiSettingsHost|<AiSettingsHost>]], [[AssistantRoot|<AssistantRoot>]], [[BusyOverlay|<BusyOverlay>]], [[CodingWorkspace|<CodingWorkspace>]], [[CommandPaletteHost|<CommandPaletteHost>]], [[Components/SampleBanner|<SampleBanner>]], [[Components/Toasts|<Toasts>]], [[ConfirmHost|<ConfirmHost>]], [[DataView|<DataView>]], [[DialogHost|<DialogHost>]], [[DropOverlay|<DropOverlay>]], [[GuardedDialogs|<GuardedDialogs>]], [[OutputViewer|<OutputViewer>]], [[PanelBoundary|<PanelBoundary>]], [[QuietBoundary|<QuietBoundary>]], [[Sidebar|<Sidebar>]], [[TopBar|<TopBar>]], [[VariableView|<VariableView>]], [[Welcome (app-Welcome)|<Welcome>]]
- Calls: [[ui-store.ts#applyTheme|applyTheme()]], [[useAutosave|useAutosave()]], [[useStartup|useStartup()]], [[useStore]], [[useUi]]
- Uses: [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]], [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[home (store-key)|useUi.home]], [[outputs|useStore.outputs]], [[useStore/coding|useStore.coding]], [[useStore/tab|useStore.tab]], [[useUi/theme|useUi.theme]]
- Store actions: [[setHome()|useUi.setHome()]], [[setTab()|useStore.setTab()]]
- Rendered by: [[main.tsx]]
