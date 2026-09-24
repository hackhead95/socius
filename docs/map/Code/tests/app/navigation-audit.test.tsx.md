---
id: tests/app/navigation-audit.test.tsx
type: test
file: tests/app/navigation-audit.test.tsx
area: tests
---

# tests/app/navigation-audit.test.tsx

*Test file* · area [[tests]] · 505 lines

> @vitest-environment jsdom Navigation audit: the rules in docs/NAVIGATION.md, checked against the real menu model (useMenus, which includes the Text coding menu built from codingMenuItems) and the search palette. Every menu item is run with its effects recorded instead of performed (dialog requests, tab switches, file actions, links, AI calls, store and UI calls). That gives each item a behaviou...

## Test cases
  - writes the navigation snapshot
- **one home per command**
  - (a) no two menu items have the same label
  - (b) no two menu items do the same thing
  - (c) every procedure appears exactly once, in Analyze or Graphs
  - (d) every disabled item says why, on a first visit and with data
  - AI features and AI assistant settings live only in the AI menu, with settings last
  - all menus mark "opens a dialog" the same way ("...")
- **nothing became unreachable**
  - the audit catches the duplicates that were there before the clean-up
  - every action that existed before has exactly one menu home now
- **search palette**
  - shows one row per command, whatever synonyms match
  - finds the one home of a removed item by its old words
- **contextual shortcuts use the menu wording**
  - the AI chip, the AI settings dialog and the coding toolbar name AI features like the AI menu
  - every contextual set-up prompt says "Set up AI", and no text points to the removed places
- **keyboard shortcuts**
  - no two menu items show the same shortcut
  - every shortcut shown in a menu does what the menu item does, and Help > Keyboard shortcuts lists it
- **Undo and Redo follow the tab (owner decision, September 2026)**
  - in Data View and Variable View, Edit > Undo undoes the data change and names it
  - in Text coding, Edit > Undo, Redo and Ctrl+Z / Ctrl+Y act on coding changes only
  - in Output, Undo brings back the last deleted result first, then undoes data changes
  - does not fire while typing in a box (the box keeps its own undo)
  - Help > Keyboard shortcuts explains that Undo follows the tab

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[node-fs|node:fs]] · value
- [[node-path|node:path]] · value
- [[HelpDialogs.tsx]] · value
- [[menus.ts]] · value
- [[search.ts]] · value
- [[shortcuts.ts]] · value
- [[ui-store.ts]] · value
- [[coding-types.ts]] · value
- [[store.ts]] · value
- [[core/types.ts]] · value
- [[features.ts]] · value
- [[AssistantRoot.tsx]] · value
- [[coding/actions.ts]] · value
- [[menu.ts]] · value
- [[uiStore.ts]] · value
- [[procedures/index.ts]] · value
- [[Menu.tsx]] · type-only
- `tests/app/navigation-before.json` · value
- [[vitest]] · value

## Calls
- [[search.ts#cleanLabel|cleanLabel()]]
- [[search.ts#commandsFromMenus|commandsFromMenus()]]
- [[coding/actions.ts#createCode|createCode()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]]
- [[AssistantRoot.tsx#isAssistantShortcut|isAssistantShortcut()]]
- [[core/types.ts#makeDataset|makeDataset()]]
- [[core/types.ts#makeVariable|makeVariable()]]
- [[search.ts#searchEntries|searchEntries()]]
- [[useMenus|useMenus()]]

## Renders
- [[ShortcutsDialog|<ShortcutsDialog>]]

## Uses
- [[features.ts#AI_FEATURES|AI_FEATURES]]
- [[menu.ts#codingMenuItems|codingMenuItems]]
- [[procedures/index.ts#procedures|procedures]]
- [[useCodingUi]]
- [[useStore]] · whole-state
- [[useUi]] · whole-state

## Reads
- [[useStore/coding|useStore.coding]] · getState
- [[dataset|useStore.dataset]] · getState
- [[outputs|useStore.outputs]] · getState

## Writes
- [[useCodingUi/future|useCodingUi.future]] · setState
- [[useCodingUi/history|useCodingUi.history]] · setState
- [[useStore/coding|useStore.coding]] · setState
- [[dataset|useStore.dataset]] · setState
- [[useStore/dialog|useStore.dialog]] · setState
- [[useStore/future|useStore.future]] · setState
- [[outputRedo|useStore.outputRedo]] · setState
- [[outputs|useStore.outputs]] · setState
- [[outputUndo|useStore.outputUndo]] · setState
- [[past|useStore.past]] · setState
- [[useStore/tab|useStore.tab]] · setState

## Calls store actions
- [[clearOutputs()|useStore.clearOutputs()]] · setState
- [[openDialog()|useStore.openDialog()]] · setState
- [[redo()|useStore.redo()]] · setState
- [[removeOutput()|useStore.removeOutput()]] · getState
- [[setShowValueLabels()|useStore.setShowValueLabels()]] · setState
- [[setTab()|useStore.setTab()]] · setState
- [[undo()|useStore.undo()]] · setState
- [[confirm()|useUi.confirm()]] · setState
- [[requestFind()|useUi.requestFind()]] · setState
- [[requestGoto()|useUi.requestGoto()]] · setState
- [[setPaletteOpen()|useUi.setPaletteOpen()]] · setState
- [[setSidebarOpen()|useUi.setSidebarOpen()]] · setState
- [[setTheme()|useUi.setTheme()]] · setState

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Suggest a codebook|AI > Suggest a codebook...]] · menu label
- [[Descriptive Statistics/Crosstabs|Analyze > Descriptive Statistics > Crosstabs...]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Procedures/crosstabs|Crosstabs]] · menu label
- [[Define variable properties|Data > Define variable properties...]] · menu label
- [[Redo|Edit > Redo]] · menu label
- [[Undo|Edit > Undo]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[HelpDialogs.tsx]] · import
- [[menus.ts]] · import
- [[search.ts]] · import
- [[shortcuts.ts]] · import
- [[ui-store.ts]] · import
- [[coding-types.ts]] · import
- [[store.ts]] · import
- [[core/types.ts]] · import
- [[features.ts]] · import
- [[AssistantRoot.tsx]] · import
- [[coding/actions.ts]] · import
- [[menu.ts]] · import
- [[uiStore.ts]] · import
- [[procedures/index.ts]] · import
- [[Menu.tsx]] · import
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
rec (line 16) · richDataset() (line 81) · setRichState() (line 96) · setEmptyState() (line 102) · buildMenus() (line 106) · STABLE_LABEL (line 124) · nodes() (line 126) · stripDots() (line 139) · pathOf() (line 140) · normLabel() (line 142) · signature() (line 145) · concept() (line 171) · rows() (line 187) · duplicateGroups() (line 197) · LABEL_ALLOW (line 210) · MOVED (line 213) · before (line 222)
