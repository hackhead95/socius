---
id: src/ui/Menu.tsx
type: module
file: src/ui/Menu.tsx
area: ui
---

# src/ui/Menu.tsx

*Module* · area [[ui]] · 387 lines

> Keyboard-accessible menus: used by the menubar dropdowns, the narrow-screen menu sheet and right-click context menus.

## Imports
- [[react]] · value
- [[Icon.tsx]] · value

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[shell-fixes.test.ts]] · import

## Imported by
- [[MenuBar.tsx]] · value
- [[menus.ts]] · type-only
- [[search.ts]] · type-only
- [[DataView.tsx]] · value
- [[VariableView.tsx]] · value
- [[navigation-audit.test.tsx]] · type-only
- [[shell-fixes.test.ts]] · value

## Types
MenuItem (line 6) · Point (line 40)

## Symbols

### SUBMENU_OPEN_MS
*const* · line 46 · exported
> Delay before a submenu opens under a resting pointer (ms), and how long a diagonal move towards an open submenu may take.

### SUBMENU_AIM_MS
*const* · line 47 · exported

### aimsAtSubmenu
*function* · line 55 · exported
> Is the pointer, moving from `from` to `to`, heading into the open submenu `rect` (which sits on the right of the menu, or on the left when `side` is 'left')? True when `to` lies in the triangle between `from` and the submenu's near edge,...
- Used in: [[shell-fixes.test.ts]]

### MenuList
*component* · line 76 · exported · note: [[MenuList|<MenuList>]]
> One menu (and its submenus). The highlighted item is the focused item: moving the pointer over an item focuses it, so the pointer and the arrow keys share one highlight and it never sticks. Submenus open on hover after a short delay and ...
- Renders: [[Icon|<Icon>]]
- Calls: [[Menu.tsx#aimsAtSubmenu|aimsAtSubmenu()]]
- Uses: [[Menu.tsx#SUBMENU_AIM_MS|SUBMENU_AIM_MS]], [[Menu.tsx#SUBMENU_OPEN_MS|SUBMENU_OPEN_MS]]
- Rendered by: [[MenuBar|<MenuBar>]]

### ContextMenu
*component* · line 295 · exported · note: [[ContextMenu|<ContextMenu>]]
> Context menu at a viewport position; closes on outside click, scroll or Escape.
- Renders: [[MenuList|<MenuList>]]
- Rendered by: [[DataViewInner|<DataViewInner>]], [[VariableViewInner|<VariableViewInner>]]

### MenuButton
*component* · line 330 · exported · note: [[MenuButton (ui-Menu)|<MenuButton>]]
> A button that opens a dropdown menu below it.
- Renders: [[MenuList|<MenuList>]]
