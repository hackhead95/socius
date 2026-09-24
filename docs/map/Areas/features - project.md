---
id: "area:features/project"
type: area
area: features/project
---

# Area: features/project

4 files, 1273 lines.

## Depends on (module imports)
- [[core]]: 10
- [[platform]]: 5
- [[ui]]: 3
- [[lib - io|lib/io]]: 2
- [[Areas/app|app]]: 1
- [[samples]]: 1

## Used by areas
- [[Areas/app|app]]: 12
- [[features - ai|features/ai]]: 3
- [[features - transform|features/transform]]: 1

## Files
- [[fileActions.ts]]: File menu actions: open data / projects, save, export, sample data, new dataset. UI-facing but component-free, so menus, shortcuts, drag-and…
- [[FileDialogs.tsx]]: File dialogs: text/Excel import options with a live preview, and recent projects.
- [[persistence.ts]]: Browser persistence: autosaved session and recent projects in IndexedDB, small prefs in localStorage. Every access is wrapped: storage can b…
- [[projectFile.ts]]: Socius project file (<name>.socius.json): dataset + output log + text-coding project + UI prefs. Numeric columns are stored as base64 of the…

## Components
[[ImportDialog (features-project-FileDialogs)|<ImportDialog>]] · [[RecentProjectsDialog|<RecentProjectsDialog>]]
