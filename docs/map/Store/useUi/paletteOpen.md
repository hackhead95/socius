---
id: "store-key:useUi.paletteOpen"
type: store-key
file: src/app/ui-store.ts
line: 66
area: app
---

# useUi.paletteOpen

*Store state key* · defined in [[ui-store.ts]] (line 66) · area [[Areas/app|app]]

> Search palette (Ctrl+K).

- **Store:** useUi

## Read by
- [[CommandPaletteHost|<CommandPaletteHost>]] · selector
- [[shortcuts.ts#handleGlobalKey|handleGlobalKey()]] · alias
- [[palette.test.tsx]] · getState
- [[shortcut-precedence.test.tsx]] · getState

## Written by
- [[palette.test.tsx]] · setState
- [[shortcut-precedence.test.tsx]] · setState
- [[setPaletteOpen()|useUi.setPaletteOpen()]]

## Store
- [[useUi]]
