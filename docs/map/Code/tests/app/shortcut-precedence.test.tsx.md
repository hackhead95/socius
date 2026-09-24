---
id: tests/app/shortcut-precedence.test.tsx
type: test
file: tests/app/shortcut-precedence.test.tsx
area: tests
---

# tests/app/shortcut-precedence.test.tsx

*Test file* · area [[tests]] · 105 lines

> @vitest-environment jsdom Keys bound both globally (handleGlobalKey, on window) and by a view: "/" (Text coding Responses view), Ctrl/Cmd+F (Data View grid) and Ctrl/Cmd+K (inside the search palette). The view wins while it has focus, the global meaning applies elsewhere, and a key is never acted on twice.

## Test cases
- **handleGlobalKey precedence**
  - leaves a key alone once a view has handled it (preventDefault)
  - applies the global meaning when no view handled the key
- **Ctrl+F: Data View grid vs global**
  - in the focused grid, the grid opens Find once and the global handler stays out
  - elsewhere on the Data View tab, the global Ctrl+F asks the Data View to open Find
- **Ctrl+K: inside the search palette vs global**
  - inside the open palette it closes the palette (once, not closed and reopened)
- **"/": Text coding Responses view vs global**
  - in the focused Responses view, "/" finds a code for the response and does not open Search
  - outside the Responses view, "/" opens Search

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[CommandPalette.tsx]] · value
- [[shortcuts.ts]] · value
- [[ui-store.ts]] · value
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[ResponsesView.tsx]] · value
- [[DataView.tsx]] · value
- [[vitest]] · value

## Calls
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]

## Renders
- [[CommandPaletteHost|<CommandPaletteHost>]]
- [[DataView|<DataView>]]
- [[ResponsesView|<ResponsesView>]]

## Uses
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[useStore]]
- [[useUi]]

## Reads
- [[findSeq|useUi.findSeq]] · getState
- [[paletteOpen|useUi.paletteOpen]] · getState

## Writes
- [[useStore/coding|useStore.coding]] · setState
- [[dataset|useStore.dataset]] · setState
- [[useStore/dialog|useStore.dialog]] · setState
- [[outputs|useStore.outputs]] · setState
- [[useStore/tab|useStore.tab]] · setState
- [[findSeq|useUi.findSeq]] · setState
- [[paletteOpen|useUi.paletteOpen]] · setState

## Tests
- [[CommandPalette.tsx]] · import
- [[shortcuts.ts]] · import
- [[ui-store.ts]] · import
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[ResponsesView.tsx]] · import
- [[DataView.tsx]] · import
- [[Data View|View > Data View]] · menu label

## Private helpers
age (line 16) · ds (line 17) · responses() (line 19) · press() (line 34)
