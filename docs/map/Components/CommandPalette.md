---
id: "src/app/CommandPalette.tsx#CommandPalette"
type: component
file: src/app/CommandPalette.tsx
line: 160
area: app
---

# <CommandPalette>

*React component* · defined in [[CommandPalette.tsx]] (line 160) · area [[Areas/app|app]]

## Calls
- [[shortcuts.ts#isMac|isMac()]]
- [[open.ts#openAssistant|openAssistant()]]
- [[search.ts#searchEntries|searchEntries()]]
- [[useEntries|useEntries()]]
- [[useStore]]

## Renders
- [[Icon|<Icon>]]
- [[VarMeasureIcon|<VarMeasureIcon>]]

## Uses
- [[CommandPalette.tsx#SUGGESTED|SUGGESTED]]
- [[useCodingUi]]
- [[useStore]]
- [[useUi]]

## Reads
- [[useStore/coding|useStore.coding]] · selector

## Writes
- [[analyseTab|useCodingUi.analyseTab]] · getState.set, set()
- [[kwicQuery|useCodingUi.kwicQuery]] · getState.set, set()
- [[useCodingUi/view|useCodingUi.view]] · getState.set, set()

## Calls store actions
- [[useCodingUi/set()|useCodingUi.set()]] · getState
- [[setTab()|useStore.setTab()]] · getState
- [[setPaletteOpen()|useUi.setPaletteOpen()]] · getState

## Defines
- [[Palette/assistant|Search palette: assistant]]
- [[Palette/coding|Search palette: coding]]

## Rendered by
- [[CommandPaletteHost|<CommandPaletteHost>]]

## Binds shortcut
- [[ArrowDown (CommandPalette)]]
- [[ArrowUp (CommandPalette)]]
- [[Enter (CommandPalette)]]
- [[Escape (CommandPalette)]]
- [[Mod+K (CommandPalette)]]
- [[PageDown (CommandPalette)]]
- [[PageUp (CommandPalette)]]
- [[Tab (CommandPalette)]]
