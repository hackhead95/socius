---
id: "src/app/ui-store.ts#useUi"
type: store
file: src/app/ui-store.ts
line: 77
area: app
---

# useUi

*Store* · defined in [[ui-store.ts]] (line 77) · area [[Areas/app|app]]

- **Exported:** yes

## Keys and who touches them
| key | written by | read by |
|---|---|---|
| [[busy]] | 1 ([[setBusy()\|useUi.setBusy()]]) | 1 |
| [[cleanDataset]] | 1 ([[markClean()\|useUi.markClean()]]) | 3 |
| [[confirmReq]] | 2 ([[confirm()\|useUi.confirm()]], [[settleConfirm()\|useUi.settleConfirm()]]) | 3 |
| [[currentVarId]] | 1 ([[setCurrentVarId()\|useUi.setCurrentVarId()]]) | 3 |
| [[findSeq]] | 1 ([[requestFind()\|useUi.requestFind()]]) | 2 |
| [[gotoSeq]] | 1 ([[requestGoto()\|useUi.requestGoto()]]) | 2 |
| [[gridTarget]] | 2 ([[palette.test.tsx]], [[focusGrid()\|useUi.focusGrid()]]) | 2 |
| [[home (store-key)\|home]] | 1 ([[setHome()\|useUi.setHome()]]) | 4 |
| [[outputTarget]] | 1 ([[focusOutput()\|useUi.focusOutput()]]) | 3 |
| [[paletteOpen]] | 2 ([[palette.test.tsx]], [[setPaletteOpen()\|useUi.setPaletteOpen()]]) | 3 |
| [[restoredAt]] | 1 ([[setRestoredAt()\|useUi.setRestoredAt()]]) | 1 |
| [[useUi/sampleBanner\|sampleBanner]] | 1 ([[setSampleBanner()\|useUi.setSampleBanner()]]) | 1 |
| [[sidebarOpen]] | 1 ([[setSidebarOpen()\|useUi.setSidebarOpen()]]) | 2 |
| [[useUi/theme\|theme]] | 1 ([[setTheme()\|useUi.setTheme()]]) | 4 |
| [[varViewTarget]] | 1 ([[focusVariableView()\|useUi.focusVariableView()]]) | 1 |

## Actions
| action | writes | callers |
|---|---|---|
| [[confirm()]] | [[confirmReq]] | 9 |
| [[focusGrid()]] | [[gridTarget]] | 3 |
| [[focusOutput()]] | [[outputTarget]] | 4 |
| [[focusVariableView()]] | [[varViewTarget]] | 3 |
| [[markClean()]] | [[cleanDataset]] | 5 |
| [[requestFind()]] | [[findSeq]] | 4 |
| [[requestGoto()]] | [[gotoSeq]] | 3 |
| [[setBusy()]] | [[busy]] | 3 |
| [[setCurrentVarId()]] | [[currentVarId]] | 1 |
| [[setHome()]] | [[home (store-key)\|home]] | 3 |
| [[setPaletteOpen()]] | [[paletteOpen]] | 5 |
| [[setRestoredAt()]] | [[restoredAt]] | 2 |
| [[setSampleBanner()]] | [[useUi/sampleBanner\|sampleBanner]] | 7 |
| [[setSidebarOpen()]] | [[sidebarOpen]] | 4 |
| [[setTheme()]] | [[useUi/theme\|theme]] | 6 |
| [[settleConfirm()]] | [[confirmReq]] | 1 |

## Calls
- [[persistence.ts#readPref|readPref()]]
- [[persistence.ts#writePref|writePref()]]

## Reads
- [[socius.sidebar]] · readPref

## Writes
- [[socius.sidebar]] · writePref
- [[socius.theme]] · writePref

## State keys
- [[busy|useUi.busy]]
- [[cleanDataset|useUi.cleanDataset]]
- [[confirmReq|useUi.confirmReq]]
- [[currentVarId|useUi.currentVarId]]
- [[findSeq|useUi.findSeq]]
- [[gotoSeq|useUi.gotoSeq]]
- [[gridTarget|useUi.gridTarget]]
- [[home (store-key)|useUi.home]]
- [[outputTarget|useUi.outputTarget]]
- [[paletteOpen|useUi.paletteOpen]]
- [[restoredAt|useUi.restoredAt]]
- [[useUi/sampleBanner|useUi.sampleBanner]]
- [[sidebarOpen|useUi.sidebarOpen]]
- [[useUi/theme|useUi.theme]]
- [[varViewTarget|useUi.varViewTarget]]

## Actions
- [[confirm()|useUi.confirm()]]
- [[focusGrid()|useUi.focusGrid()]]
- [[focusOutput()|useUi.focusOutput()]]
- [[focusVariableView()|useUi.focusVariableView()]]
- [[markClean()|useUi.markClean()]]
- [[requestFind()|useUi.requestFind()]]
- [[requestGoto()|useUi.requestGoto()]]
- [[setBusy()|useUi.setBusy()]]
- [[setCurrentVarId()|useUi.setCurrentVarId()]]
- [[setHome()|useUi.setHome()]]
- [[setPaletteOpen()|useUi.setPaletteOpen()]]
- [[setRestoredAt()|useUi.setRestoredAt()]]
- [[setSampleBanner()|useUi.setSampleBanner()]]
- [[setSidebarOpen()|useUi.setSidebarOpen()]]
- [[setTheme()|useUi.setTheme()]]
- [[settleConfirm()|useUi.settleConfirm()]]

## Called by
- [[Components/App|<App>]]
- [[BusyOverlay|<BusyOverlay>]]
- [[CommandPaletteHost|<CommandPaletteHost>]]
- [[ConfirmHost|<ConfirmHost>]]
- [[DataViewInner|<DataViewInner>]]
- [[Mark|<Mark>]]
- [[OutputViewer|<OutputViewer>]]
- [[Components/SampleBanner|<SampleBanner>]]
- [[Sidebar|<Sidebar>]]
- [[Components/Toasts|<Toasts>]]
- [[TopBar|<TopBar>]]
- [[VariableViewInner|<VariableViewInner>]]
- [[Welcome (app-Welcome)|<Welcome>]]
- [[useMenus|useMenus()]]

## Used by
- [[AggregateDialog|<AggregateDialog>]]
- [[Components/App|<App>]]
- [[CommandPalette|<CommandPalette>]]
- [[DefinePropertiesDialog|<DefinePropertiesDialog>]]
- [[Mark|<Mark>]]
- [[SelectCasesDialog|<SelectCasesDialog>]]
- [[Components/Toasts|<Toasts>]]
- [[Welcome (app-Welcome)|<Welcome>]]
- [[fileActions.ts#activateDataset|activateDataset()]]
- [[fileActions.ts#applyProject|applyProject()]]
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]]
- [[fileActions.ts#confirmReplace|confirmReplace()]]
- [[fileActions.ts#exportXlsxFile|exportXlsxFile()]]
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[fileActions.ts#importBytes|importBytes()]]
- [[fileActions.ts#isModified|isModified()]]
- [[fileActions.ts#loadSample|loadSample()]]
- [[CommandPalette.tsx#openPalette|openPalette()]]
- [[fileActions.ts#saveProject|saveProject()]]
- [[main.tsx]]
- [[features.ts#startExplain|startExplain()]]
- [[fileActions.ts#startFresh|startFresh()]]
- [[features.test.ts]]
- [[navigation-audit.test.tsx]] · whole-state
- [[palette.test.tsx]]
- [[useAutosave|useAutosave()]]
- [[useEntries|useEntries()]]
- [[useMenus|useMenus()]]
- [[useStartup|useStartup()]]
