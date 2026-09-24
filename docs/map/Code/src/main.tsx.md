---
id: src/main.tsx
type: module
file: src/main.tsx
area: app
---

# src/main.tsx

*Module* · area [[Areas/app|app]] · 24 lines

## Imports
- [[react]] · value
- [[react-dom]] · value
- [[App.tsx]] · value
- [[ErrorBoundary.tsx]] · value
- [[ui-store.ts]] · value
- [[install.ts]] · value
- `src/styles/base.css` · side-effect
- `src/styles/components.css` · side-effect
- `src/styles/tokens.css` · side-effect

## Calls
- [[ui-store.ts#applyTheme|applyTheme()]]
- [[install.ts#installErrorLog|installErrorLog()]]

## Renders
- [[Components/App|<App>]]
- [[AppErrorBoundary|<AppErrorBoundary>]]

## Uses
- [[useUi]]

## Reads
- [[useUi/theme|useUi.theme]] · getState

## Referenced by (build config)
- `index.html`
