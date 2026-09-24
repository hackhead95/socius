---
id: src/app/MenuBar.tsx
type: module
file: src/app/MenuBar.tsx
area: app
---

# src/app/MenuBar.tsx

*Module* · area [[Areas/app|app]] · 360 lines

> Menubar with keyboard-accessible dropdowns; collapses into a menu sheet on narrow screens.

## Imports
- [[react]] · value
- [[menus.ts]] · value
- [[store.ts]] · value
- [[errorlog/actions.ts]] · value
- [[Icon.tsx]] · value
- [[Menu.tsx]] · value
- [[Modal.tsx]] · value

## Tested by
- [[ui-overlays.test.tsx]] · import

## Imported by
- [[TopBar.tsx]] · value
- [[ui-overlays.test.tsx]] · value

## Private helpers
dialogReturnTarget() (line 33) · flatten() (line 254)

## Symbols

### MENUBAR_AIM_MS
*const* · line 11 · exported
> How long a pointer resting on another menu title, after heading into the open menu, waits before switching (ms).

### aimsAtDropdown
*function* · line 18 · exported
> Is the pointer, moving from `from` to `to`, heading down into the open dropdown `rect`? True when `to` lies in the triangle between `from` and the dropdown's top edge, so crossing the next menu title on the way to an item does not switch...
- Used in: [[ui-overlays.test.tsx]]

### MenuBar
*component* · line 38 · exported · note: [[MenuBar|<MenuBar>]]
- Renders: [[MenuList|<MenuList>]], [[MenuSheetButton|<MenuSheetButton>]]
- Calls: [[MenuBar.tsx#aimsAtDropdown|aimsAtDropdown()]], [[MenuBar.tsx]], [[Modal.tsx#setDialogReturnFocus|setDialogReturnFocus()]], [[useMenus|useMenus()]], [[useStore]], [[useUnseenErrors|useUnseenErrors()]]
- Uses: [[MenuBar.tsx#MENUBAR_AIM_MS|MENUBAR_AIM_MS]]
- Reads: [[useStore/tab|useStore.tab]]
- Rendered by: [[TopBar|<TopBar>]]

### MenuSheetButton
*component* · line 266 · note: [[MenuSheetButton|<MenuSheetButton>]]
> Narrow screens: one "Menu" button opening a full-height sheet with every menu.
- Renders: [[Icon|<Icon>]]
- Calls: [[MenuBar.tsx]], [[Modal.tsx#setDialogReturnFocus|setDialogReturnFocus()]]
