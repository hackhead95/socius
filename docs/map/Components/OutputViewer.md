---
id: "src/features/output/OutputViewer.tsx#OutputViewer"
type: component
file: src/features/output/OutputViewer.tsx
line: 63
area: features/output
---

# <OutputViewer>

*React component* · defined in [[OutputViewer.tsx]] (line 63) · area [[features - output|features/output]]

- **Exported:** yes

## Calls
- [[OutputViewer.tsx#blockLabel|blockLabel()]]
- [[output/actions.ts#confirmAndClearOutputs|confirmAndClearOutputs()]]
- [[output/actions.ts#copyItem|copyItem()]]
- [[output/actions.ts#exportReport|exportReport()]]
- [[format-date.ts#formatDateTime|formatDateTime()]]
- [[format-date.ts#formatTime|formatTime()]]
- [[shortcuts.ts#modKey|modKey()]]
- [[useNumbering|useNumbering()]]
- [[useOutputPrefs]]
- [[useStore]]
- [[useUi]]

## Renders
- [[EmptyState|<EmptyState>]]
- [[ExportMenu|<ExportMenu>]]
- [[IconChart|<IconChart>]]
- [[IconOutline|<IconOutline>]]
- [[IconTable|<IconTable>]]
- [[IconText|<IconText>]]
- [[IconX|<IconX>]]
- [[OutputItemView|<OutputItemView>]]

## Uses
- [[useStore]]

## Reads
- [[showInterpretations|useOutputPrefs.showInterpretations]] · alias
- [[showSyntax|useOutputPrefs.showSyntax]] · alias
- [[tableStyle|useOutputPrefs.tableStyle]] · alias
- [[useStore/focusOutputId|useStore.focusOutputId]] · selector
- [[outputs|useStore.outputs]] · selector
- [[outputTarget|useUi.outputTarget]] · selector

## Writes
- [[showInterpretations|useOutputPrefs.showInterpretations]] · alias.set, set()
- [[showSyntax|useOutputPrefs.showSyntax]] · alias.set, set()
- [[tableStyle|useOutputPrefs.tableStyle]] · alias.set, set()

## Calls store actions
- [[useOutputPrefs/set()|useOutputPrefs.set()]] · alias
- [[clearOutputs()|useStore.clearOutputs()]] · selector
- [[moveOutput()|useStore.moveOutput()]] · selector
- [[removeOutput()|useStore.removeOutput()]] · selector
- [[restoreOutput()|useStore.restoreOutput()]] · getState
- [[toast()|useStore.toast()]] · getState

## Handles
- [[Blocks/chart|chart]] · renderer
- [[table]] · renderer

## Rendered by
- [[Components/App|<App>]]

## Binds shortcut
- [[Mod+C (OutputViewer)]]
