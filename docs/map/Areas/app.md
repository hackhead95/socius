---
id: "area:app"
type: area
area: app
---

# Area: app

18 files, 2835 lines.

## Depends on (module imports)
- [[core]]: 17
- [[ui]]: 13
- [[features - project|features/project]]: 11
- [[features - errorlog|features/errorlog]]: 8
- [[features - coding|features/coding]]: 6
- [[features - ai|features/ai]]: 5
- [[features - data|features/data]]: 4
- [[features - transform|features/transform]]: 3
- [[platform]]: 3
- [[features - analysis|features/analysis]]: 2
- [[features - assistant|features/assistant]]: 2
- [[features - output|features/output]]: 2
- [[procedures]]: 2
- [[samples]]: 2

## Used by areas
- [[features - data|features/data]]: 3
- [[features - output|features/output]]: 2
- [[features - transform|features/transform]]: 2
- [[features - ai|features/ai]]: 1
- [[features - coding|features/coding]]: 1
- [[features - errorlog|features/errorlog]]: 1
- [[features - project|features/project]]: 1
- [[lib - assistant|lib/assistant]]: 1

## Files
- [[App.tsx]]: App shell: top bar + menubar, main tabs, variable sidebar, dialogs, toasts, drag-and-drop, session restore (else the welcome screen) and aut…
- [[CommandPalette.tsx]]: Search palette (Ctrl+K / Cmd+K, "/" or the search field in the top bar): one box that finds menu commands, variables, results in Output, hel…
- [[DialogHost.tsx]]: Renders the dialog requested in the store (procedure, transform, file, coding, help).
- [[ErrorBoundary.tsx]]: Error boundaries: a render error shows a friendly screen instead of a white page, and is written to the error log (Help > Error log). - AppE…
- [[HelpDialogs.tsx]]: Help menu dialogs: Getting started, Keyboard shortcuts, About Socius.
- [[helpTopics.ts]]: Sections of the beginner's guide (public/guide/index.html, built from docs/guide/guide.md) offered by the search palette. Each `anchor` must…
- [[links.ts]]: Links out of the app: the website, the user guide and the feedback form (GitHub issues). On GitHub Pages (https://<owner>.github.io/<repo>/)…
- [[MenuBar.tsx]]: Menubar with keyboard-accessible dropdowns; collapses into a menu sheet on narrow screens.
- [[menus.ts]]: Menubar model: File, Edit, View, Data, Transform, Analyze, Graphs, Text coding, AI, Help. The search palette (CommandPalette) searches these…
- [[Overlays.tsx]]: Toasts, global confirm dialog, busy overlay and the drag-and-drop target.
- [[search.ts]]: Matching and ranking for the search palette (Ctrl+K). Pure: no React, no store. Matching works on words: every word of the query must match …
- [[shortcuts.ts]]: Global keyboard shortcuts (undo/redo/open/save) and platform helpers.
- [[Sidebar.tsx]]: Collapsible variable list: search, measure icons, click to select in the grid, double-click to open in Variable View.
- [[TopBar.tsx]]: Top bar: product mark, menus, search, AI status, dataset name and size, weight / filter / sample chips, undo/redo, theme.
- [[ui-store.ts]]: App-shell UI state that is not part of the saved project: theme, sidebar, cross-view navigation requests, the global confirm dialog, and "mo…
- [[undo.ts]]: Undo and Redo follow the tab you are in (Edit > Undo / Redo, Ctrl+Z / Ctrl+Y, the top-bar icons): - Text coding: the last coding change (cod…
- [[Welcome.tsx]]: Welcome screen (no dataset open) and the sample-data banner.
- [[main.tsx]]

## Components
[[AboutDialog|<AboutDialog>]] · [[Components/App|<App>]] · [[AppErrorBoundary|<AppErrorBoundary>]] · [[BusyOverlay|<BusyOverlay>]] · [[CommandPalette|<CommandPalette>]] · [[CommandPaletteHost|<CommandPaletteHost>]] · [[ConfirmHost|<ConfirmHost>]] · [[CrashScreen|<CrashScreen>]] · [[DatasetName|<DatasetName>]] · [[DialogHost|<DialogHost>]] · [[DropOverlay|<DropOverlay>]] · [[GettingStartedDialog|<GettingStartedDialog>]] · [[GuardedDialogs|<GuardedDialogs>]] · [[Mark|<Mark>]] · [[MenuBar|<MenuBar>]] · [[MenuSheetButton|<MenuSheetButton>]] · [[PanelBoundary|<PanelBoundary>]] · [[QuietBoundary|<QuietBoundary>]] · [[Components/SampleBanner|<SampleBanner>]] · [[ShortcutsDialog|<ShortcutsDialog>]] · [[Sidebar|<Sidebar>]] · [[Components/Toasts|<Toasts>]] · [[TopBar|<TopBar>]] · [[Welcome (app-Welcome)|<Welcome>]]

## Hooks
[[useAutosave|useAutosave()]] · [[useEntries|useEntries()]] · [[useMenus|useMenus()]] · [[useStartup|useStartup()]] · [[useUndoRedo|useUndoRedo()]]

## Stores
[[useUi]]
