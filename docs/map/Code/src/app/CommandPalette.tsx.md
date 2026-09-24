---
id: src/app/CommandPalette.tsx
type: module
file: src/app/CommandPalette.tsx
area: app
---

# src/app/CommandPalette.tsx

*Module* · area [[Areas/app|app]] · 374 lines

> Search palette (Ctrl+K / Cmd+K, "/" or the search field in the top bar): one box that finds menu commands, variables, results in Output, help topics and coded text. Commands come from the same menu model as the menubar (useMenus), so selecting one does exactly what the menu does.

## Imports
- [[react]] · value
- [[helpTopics.ts]] · value
- [[links.ts]] · value
- [[menus.ts]] · value
- `src/app/palette.css` · side-effect
- [[search.ts]] · value
- [[shortcuts.ts]] · value
- [[ui-store.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · type-only
- [[varUtils.ts]] · value
- [[open.ts]] · value
- [[uiStore.ts]] · value
- [[persistence.ts]] · value
- [[procedures/index.ts]] · value
- [[Icon.tsx]] · value
- [[MeasureIcon.tsx]] · value

## Calls
- [[persistence.ts#readPref|readPref()]]
- [[persistence.ts#writePref|writePref()]]

## Reads
- [[socius.palette-recent]] · readPref

## Writes
- [[socius.palette-recent]] · writePref

## Tested by
- [[palette.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[TopBar.tsx]] · value
- [[palette.test.tsx]] · value

## Private helpers
GROUP_LABEL (line 34) · RECENT_KEY (line 45) · readRecent() (line 48) · pushRecent() (line 57)

## Symbols

### SUGGESTED
*const* · line 46

### openPalette
*function* · line 61 · exported
- Uses: [[useUi]]
- Store actions: [[setPaletteOpen()|useUi.setPaletteOpen()]]
- Used in: [[TopBar.tsx]]

### CommandPaletteHost
*component* · line 66 · exported · note: [[CommandPaletteHost|<CommandPaletteHost>]]
- Renders: [[CommandPalette|<CommandPalette>]]
- Calls: [[useUi]]
- Reads: [[paletteOpen|useUi.paletteOpen]]
- Rendered by: [[Components/App|<App>]], [[palette.test.tsx]]

### useEntries
*hook* · line 72 · note: [[useEntries|useEntries()]]
> Everything searchable right now.
- Calls: [[helpTopics.ts#helpTopicUrl|helpTopicUrl()]], [[links.ts#openExternal|openExternal()]], [[procedures/index.ts#getProcedure|getProcedure()]], [[search.ts#commandsFromMenus|commandsFromMenus()]], [[useMenus|useMenus()]], [[useStore]], [[varUtils.ts#prefillProcedure|prefillProcedure()]]
- Uses: [[helpTopics.ts#HELP_TOPICS|HELP_TOPICS]], [[procedures/index.ts#procedures|procedures]], [[useCodingUi]], [[useStore]], [[useUi]]
- Reads: [[dataset|useStore.dataset]], [[outputs|useStore.outputs]], [[useStore/coding|useStore.coding]]
- Writes: [[selectedCodeId|useCodingUi.selectedCodeId]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[focusGrid()|useUi.focusGrid()]], [[focusOutput()|useUi.focusOutput()]], [[focusVariableView()|useUi.focusVariableView()]], [[openDialog()|useStore.openDialog()]], [[setTab()|useStore.setTab()]], [[useCodingUi/set()|useCodingUi.set()]]

### CommandPalette
*component* · line 160 · note: [[CommandPalette|<CommandPalette>]]
- Renders: [[Icon|<Icon>]], [[VarMeasureIcon|<VarMeasureIcon>]]
- Calls: [[CommandPalette.tsx]], [[open.ts#openAssistant|openAssistant()]], [[search.ts#searchEntries|searchEntries()]], [[shortcuts.ts#isMac|isMac()]], [[useEntries|useEntries()]], [[useStore]]
- Uses: [[CommandPalette.tsx#SUGGESTED|SUGGESTED]], [[CommandPalette.tsx]], [[useCodingUi]], [[useStore]], [[useUi]]
- Reads: [[useStore/coding|useStore.coding]]
- Writes: [[analyseTab|useCodingUi.analyseTab]], [[kwicQuery|useCodingUi.kwicQuery]], [[useCodingUi/view|useCodingUi.view]]
- Store actions: [[setPaletteOpen()|useUi.setPaletteOpen()]], [[setTab()|useStore.setTab()]], [[useCodingUi/set()|useCodingUi.set()]]
