---
id: src/app/MenuBar.tsx
type: module
file: src/app/MenuBar.tsx
area: app
---

# src/app/MenuBar.tsx

*Module* · area [[Areas/app|app]] · 272 lines

> Menubar with keyboard-accessible dropdowns; collapses into a menu sheet on narrow screens.

## Imports
- [[react]] · value
- [[menus.ts]] · value
- [[store.ts]] · value
- [[errorlog/actions.ts]] · value
- [[Icon.tsx]] · value
- [[Menu.tsx]] · value

## Imported by
- [[TopBar.tsx]] · value

## Private helpers
flatten() (line 168)

## Symbols

### MenuBar
*component* · line 9 · exported · note: [[MenuBar|<MenuBar>]]
- Renders: [[MenuList|<MenuList>]], [[MenuSheetButton|<MenuSheetButton>]]
- Calls: [[useMenus|useMenus()]], [[useStore]], [[useUnseenErrors|useUnseenErrors()]]
- Reads: [[useStore/tab|useStore.tab]]
- Rendered by: [[TopBar|<TopBar>]]

### MenuSheetButton
*component* · line 180 · note: [[MenuSheetButton|<MenuSheetButton>]]
> Narrow screens: one "Menu" button opening a full-height sheet with every menu.
- Renders: [[Icon|<Icon>]]
- Calls: [[MenuBar.tsx]]
