---
id: tests/app/palette.test.tsx
type: test
file: tests/app/palette.test.tsx
area: tests
---

# tests/app/palette.test.tsx

*Test file* · area [[tests]] · 136 lines

> @vitest-environment jsdom The search palette component: keyboard use, commands, variables with their secondary actions, results, coded text and the hand-over to the Socius assistant.

## Test cases
- **search palette**
  - opens with Ctrl+K and "/", and closes with Escape
  - shows suggestions for an empty query
  - runs a command with Enter, like the menu
  - moves with the arrow keys
  - jumps to a variable in Data View, or opens Frequencies with it (Alt+Enter)
  - finds results in Output and coded text
  - hands the query to the Socius assistant
  - shows disabled commands with the reason and does not run them

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[CommandPalette.tsx]] · value
- [[shortcuts.ts]] · value
- [[ui-store.ts]] · value
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[varUtils.ts]] · value
- [[open.ts]] · value
- [[uiStore.ts]] · value
- [[procedures/index.ts]] · value
- [[vitest]] · value

## Calls
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[procedures/index.ts#getProcedure|getProcedure()]]
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[varUtils.ts#recall|recall()]]

## Renders
- [[CommandPaletteHost|<CommandPaletteHost>]]

## Uses
- [[useAssistantUi]] · whole-state
- [[useCodingUi]] · whole-state
- [[useStore]]
- [[useUi]]

## Reads
- [[useStore/dialog|useStore.dialog]] · getState
- [[useStore/tab|useStore.tab]] · getState
- [[gridTarget|useUi.gridTarget]] · getState
- [[outputTarget|useUi.outputTarget]] · getState
- [[paletteOpen|useUi.paletteOpen]] · getState

## Writes
- [[useAssistantUi/open|useAssistantUi.open]] · setState
- [[request|useAssistantUi.request]] · setState
- [[useStore/coding|useStore.coding]] · setState
- [[dataset|useStore.dataset]] · setState
- [[useStore/dialog|useStore.dialog]] · setState
- [[outputs|useStore.outputs]] · setState
- [[useStore/tab|useStore.tab]] · setState
- [[gridTarget|useUi.gridTarget]] · setState
- [[paletteOpen|useUi.paletteOpen]] · setState

## Calls store actions
- [[setPaletteOpen()|useUi.setPaletteOpen()]] · getState

## Tests
- [[Explain a result|AI > Explain a result...]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label, procedure id
- [[Procedures/frequencies|Frequencies]] · procedure id
- [[CommandPalette.tsx]] · import
- [[shortcuts.ts]] · import
- [[ui-store.ts]] · import
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[varUtils.ts]] · import
- [[open.ts]] · import
- [[uiStore.ts]] · import
- [[procedures/index.ts]] · import

## Private helpers
gender (line 17) · ds (line 18) · open() (line 20) · type() (line 24) · options() (line 27)
