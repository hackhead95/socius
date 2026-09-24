---
id: src/app/ui-store.ts
type: module
file: src/app/ui-store.ts
area: app
---

# src/app/ui-store.ts

*Module* · area [[Areas/app|app]] · 175 lines

> App-shell UI state that is not part of the saved project: theme, sidebar, cross-view navigation requests, the global confirm dialog, and "modified since saved" tracking.

## Imports
- [[react]] · value
- [[core/types.ts]] · type-only
- [[persistence.ts]] · value
- [[zustand]] · value

## Calls
- [[persistence.ts#readPref|readPref()]]

## Reads
- [[socius.theme]] · readPref

## Tested by
- [[features.test.ts]] · import
- [[navigation-audit.test.tsx]] · import
- [[palette.test.tsx]] · import
- [[shortcut-precedence.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[CommandPalette.tsx]] · value
- [[menus.ts]] · value
- [[Overlays.tsx]] · value
- [[shortcuts.ts]] · value
- [[Sidebar.tsx]] · value
- [[TopBar.tsx]] · value
- [[Welcome.tsx]] · value
- [[features.ts]] · value
- [[DataView.tsx]] · value
- [[DefineProperties.tsx]] · value
- [[VariableView.tsx]] · value
- [[output/actions.ts]] · value
- [[OutputViewer.tsx]] · value
- [[fileActions.ts]] · value
- [[CasesDialogs.tsx]] · value
- [[transform/common.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[main.tsx]] · value
- [[features.test.ts]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value
- [[shortcut-precedence.test.tsx]] · value

## Types
ThemePref (line 8) · ConfirmRequest (line 10) · GridTarget (line 18)

## Private helpers
seq (line 76) · initialTheme (line 78) · NARROW_QUERY (line 150) · subscribeNarrow() (line 160)

## Symbols

### useUi
*store* · line 83 · exported · note: [[useUi]]
- Calls: [[persistence.ts#readPref|readPref()]], [[persistence.ts#writePref|writePref()]], [[ui-store.ts#isNarrow|isNarrow()]]
- Uses: [[ui-store.ts]]
- Reads: [[socius.sidebar]]
- Writes: [[socius.sidebar]], [[socius.theme]]
- Used in: [[App.tsx]], [[CommandPalette.tsx]], [[Overlays.tsx]], [[Sidebar.tsx]], [[TopBar.tsx]], [[Welcome.tsx]], [[menus.ts]], [[shortcuts.ts]], [[features.ts]], [[DataView.tsx]], [[DefineProperties.tsx]], [[VariableView.tsx]], [[OutputViewer.tsx]], [[output/actions.ts]], [[fileActions.ts]], [[CasesDialogs.tsx]], [[MergeDialogs.tsx]], [[transform/common.tsx]], [[main.tsx]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]], [[shortcut-precedence.test.tsx]]

### applyTheme
*function* · line 138 · exported
- Used in: [[App.tsx]], [[main.tsx]]

### NARROW_PX
*const* · line 149 · exported
> Below this width the variable list does not fit beside the data: it opens as a drawer.

### isNarrow
*function* · line 152 · exported
- Uses: [[ui-store.ts]]
- Used in: [[menus.ts]]

### useNarrow
*hook* · line 172 · exported · note: [[useNarrow|useNarrow()]]
> True while the window is narrower than NARROW_PX (re-renders when that changes).
- Uses: [[ui-store.ts#isNarrow|isNarrow()]], [[ui-store.ts]]
- Used in: [[Sidebar.tsx]], [[menus.ts]]
