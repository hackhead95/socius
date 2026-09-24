---
id: e2e/shell-fixes.spec.ts
type: e2e-spec
file: e2e/shell-fixes.spec.ts
area: e2e
---

# e2e/shell-fixes.spec.ts

*End-to-end spec* · area [[e2e]] · 322 lines

> Regression tests for the owner's reports of September 2026: menus with real mouse movement, the Home button (Socius logo), renaming variables, Undo that follows the tab, and one "Load sample interviews..." command. The GitHub Pages sub-path checks are in subpath.spec.ts.

## Test cases
  - hover switches menus, the highlight follows the pointer, submenus survive a diagonal move, and a tab click leaves nothing open
  - choosing an item with the mouse leaves no menu button focused or highlighted
  - keyboard navigation still works
  - the phone menu sheet opens, lists every menu and closes
  - the Socius logo shows the start screen over open data, and Back returns
  - rename in Variable View: fixing a typo with the mouse, invalid names, clicking away, and from a Data View heading
  - in Text coding, Ctrl+Z and Edit > Undo undo coding changes and leave the data alone

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value

## Calls
- [[e2e/helpers.ts#openWithSample|openWithSample()]]

## Tests
- [[Compare Means|Analyze > Compare Means]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[New dataset|File > New dataset]] · menu label
- [[Load sample interviews|Text coding > Load sample interviews...]] · menu label
- [[Output|View > Output]] · menu label
- [[View/Text coding|View > Text coding]] · menu label

## Private helpers
glide() (line 10) · centre() (line 15) · highlighted() (line 21) · openMenus() (line 32)
