---
id: src/app/ui-store.ts
type: module
file: src/app/ui-store.ts
area: app
---

# src/app/ui-store.ts

*Module* · area [[Areas/app|app]] · 135 lines

> App-shell UI state that is not part of the saved project: theme, sidebar, cross-view navigation requests, the global confirm dialog, and "modified since saved" tracking.

## Imports
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
- [[MergeDialogs.tsx]] · value
- [[main.tsx]] · value
- [[features.test.ts]] · value
- [[navigation-audit.test.tsx]] · value
- [[palette.test.tsx]] · value

## Types
ThemePref (line 7) · ConfirmRequest (line 9) · GridTarget (line 17)

## Private helpers
seq (line 70) · initialTheme (line 72)

## Symbols

### useUi
*store* · line 77 · exported · note: [[useUi]]
- Calls: [[persistence.ts#readPref|readPref()]], [[persistence.ts#writePref|writePref()]]
- Uses: [[ui-store.ts]]
- Reads: [[socius.sidebar]]
- Writes: [[socius.sidebar]], [[socius.theme]]
- Used in: [[App.tsx]], [[CommandPalette.tsx]], [[Overlays.tsx]], [[Sidebar.tsx]], [[TopBar.tsx]], [[Welcome.tsx]], [[menus.ts]], [[shortcuts.ts]], [[features.ts]], [[DataView.tsx]], [[DefineProperties.tsx]], [[VariableView.tsx]], [[OutputViewer.tsx]], [[output/actions.ts]], [[fileActions.ts]], [[CasesDialogs.tsx]], [[MergeDialogs.tsx]], [[main.tsx]], [[features.test.ts]], [[navigation-audit.test.tsx]], [[palette.test.tsx]]

### applyTheme
*function* · line 126 · exported
- Used in: [[App.tsx]], [[main.tsx]]
