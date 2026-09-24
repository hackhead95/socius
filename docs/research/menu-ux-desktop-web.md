# Desktop-style menubars in a web app: behaviour, timing, keyboard, and React pitfalls

## What to do (for implementers)

1. **Model:** clicking a top-level item (on **pointerdown**, left button only) opens its menu. While any menu is open, **hovering another top-level item switches to it immediately**, with no delay. Clicking the open item again, pressing Escape, clicking outside, window blur, tab hidden, resize or scroll closes everything. Hover never opens the bar from closed. This is Radix Menubar's behaviour, verified from its source.
2. **Submenus:** open on hover after **100–200 ms** (Radix 100 ms, React Aria 200 ms; Windows' native default is 400 ms). Use a **safe triangle** so diagonal movement toward the open submenu does not switch it (Radix: a polygon from the exit point to the submenu's near edge, kept for 300 ms; React Aria: angle test with 2 allowed stray moves and a 1 s timeout; menu-aim: 300 ms delay, 75 px tolerance). Open immediately on click, Enter, Space or →.
3. **Keyboard (WAI-ARIA APG menubar):**
   - A single tab stop with roving tabindex.
   - ←/→ move across the bar. When a menu is open, ←/→ move to the neighbouring menu and open it; the recommended variant opens it without moving focus in.
   - ↓ (and Enter/Space) opens a menu and focuses its first item. ↑ may focus the last item.
   - In menus: ↑/↓ move (optionally wrapping), Home/End, type-ahead. Enter activates and closes.
   - Escape closes one level and returns focus to the parent. Tab closes everything and moves on.
   - Disabled items stay focusable but cannot be activated. Separators are not focusable.
4. **Only a pointer that actually moves may change the active item.** Use `pointermove`, not `pointerenter`/`mouseenter`, for highlighting, so a menu that opens under a resting cursor or scrolls does not steal the keyboard's position. Keep a single `activeIndex` state as the only source of highlight, not CSS `:hover`. Style focus with `:focus-visible`, and guard hover styles with `@media (hover: hover)`.
5. **Stuck-state fixes:**
   - Never rely on `mouseleave` of an element that re-renders or unmounts; it will not fire.
   - Close on `window` `blur` and on `document.visibilitychange` (hidden), and cancel all timers there.
   - Keep timers in refs and clear them on close or unmount.
   - Detect outside interaction with a capture-phase `pointerdown` using `event.composedPath()` against the bar **and** the portal roots.
   - Never call `setPointerCapture` inside menus, and release implicit touch capture if a drag starts.
   - Make effects idempotent under StrictMode's double mount.

Labels: **[verified]** = spec or library source read directly; **[reported]** = articles or issues; **[inferred]** = ours.

---

## 1. Pointer behaviour of real desktop menubars

| Behaviour | Windows / macOS native | Radix Menubar (source) | Recommendation |
|---|---|---|---|
| Open top-level menu | mouse down (macOS: press-drag-release also selects) | `onPointerDown`, button 0, not Ctrl-click (macOS right click); `preventDefault()` so the trigger does not grab focus [verified: `packages/react/menubar/src/menubar.tsx`] | pointerdown |
| Hover switches menus | only while one is open | `onPointerEnter`: `if (menubarOpen && !open) onMenuOpen(value); focus trigger` [verified] | same, no delay |
| Click open trigger | closes | toggle | toggle |
| Focus on pointer-open | stays on the bar; the menu gets focus but no item is highlighted | `onEntryFocus`: prevent focusing the first item unless opened by keyboard (`wasKeyboardTriggerOpenRef`) [verified] | first-item highlight only for keyboard opens |
| Submenu open by hover | Windows `MenuShowDelay` **400 ms** default [reported: Microsoft Learn `SystemParameters.MenuShowDelay`] | **100 ms** timer on sub-trigger `pointermove` [verified: `packages/react/menu/src/menu.tsx`] | 100–200 ms |
| Submenu close when leaving toward it | macOS uses motion heuristics | grace polygon from exit point (±5 px bleed) to submenu rect, cleared after **300 ms**; items ignore pointer moves while `isPointerMovingToSubmenu` [verified] | safe triangle |
| Type-ahead | yes | 1 s buffer reset [verified: `setTimeout(() => updateSearch(''), 1000)`] | 1 s |

**React Aria** (`packages/react-aria/src/menu/useSubmenuTrigger.ts`, `useSafelyMouseToSubmenu.ts`) [verified]:
- Submenu hover `delay = 200` ms.
- The safe-area test compares the pointer's movement angle against the angles to the submenu's top and bottom corners (`ANGLE_PADDING`), and allows `ALLOWED_INVALID_MOVEMENTS = 2` stray moves.
- While the pointer is "on its way", it sets `pointer-events: none` on the parent menu so items underneath do not steal hover, and prevents mousedown on the triangle. It auto-releases after `TIMEOUT_TIME = 1000` ms if the pointer stops.

**Menu aim** (Ben Kamens, Amazon mega-dropdown analysis) [verified: `kamens/jQuery-menu-aim` source constants `DELAY = 300`, `tolerance: 75`, `MOUSE_LOCS_TRACKED = 3`; [article](https://bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown)]. The triangle runs from the cursor to the submenu's upper and lower near corners. Moving inside it delays switching; moving outside it switches immediately. This beats pure delays because down-the-list movement switches instantly.

**Recommendation for Socius** [inferred]: implement the Radix approach (a polygon plus a 300 ms expiry). It is simple, deterministic and testable with synthetic pointer coordinates in Playwright or vitest. Add the React Aria idea of ignoring item `pointermove` while inside the grace polygon.

## 2. Keyboard: WAI-ARIA APG Menu and Menubar pattern [verified: w3c/aria-practices `content/patterns/menubar/menu-and-menubar-pattern.html`]

- **Tab/Shift+Tab**: moving into the menubar focuses the first item, or optionally the last-focused one. From any item, Tab leaves the bar and **closes all menus**. Tab never moves into a menu.
- **Enter**: on an item with a submenu, opens it and focuses its first item. Otherwise it activates and closes.
- **Space** (optional behaviours): toggles a checkbox or radio item without closing, or acts like Enter.
- **Down**: on a menubar item, opens its submenu and focuses the first item. In a menu, moves to the next item (optional wrap).
- **Up**: in a menu, moves to the previous item. On a menubar item it may optionally open the menu and focus the last item.
- **Right**: in the menubar, moves to the next item. On a submenu parent, opens it and focuses the first item. On a plain item inside a menu, closes the menus, moves to the next menubar item, and (recommended) **opens that menu without moving focus into it**.
- **Left**: mirror of Right. In a nested submenu it closes that level and returns to the parent item.
- **Home/End** (when not wrapping); **type-ahead** (optional).
- **Escape**: closes the menu that contains focus and returns focus to the invoking item.
- ARIA:
  - `role="menubar"` with an `aria-label`.
  - Items `role="menuitem"` / `menuitemcheckbox` / `menuitemradio`.
  - Parent items have `aria-haspopup="menu"` and `aria-expanded`.
  - Submenus use `role="menu"` with `aria-labelledby` pointing to the parent item.
  - Use a **roving tabindex** (only one item `tabindex=0`) or `aria-activedescendant`.
  - Disabled items: `aria-disabled="true"`, still focusable.
  - Separators: `role="separator"`, not focusable.
- Desktop conventions outside APG [reported/inferred]: **F10** or **Alt** alone focuses the menubar (Windows); Alt+letter mnemonics. In a browser, Alt+letter often collides with browser menus (Firefox/Edge), and F10 is taken by some browsers. Offer a documented shortcut instead (Socius has Ctrl+K for the palette).

## 3. Closing rules checklist [inferred from Radix, React Aria and native behaviour]

Close everything on:
1. Activation of a leaf item.
2. Escape at top level (focus returns to the trigger).
3. `pointerdown` outside the bar and every open menu portal.
4. `focusout` to outside (Tab away).
5. `window` `blur` (Alt-Tab, clicking into an iframe or DevTools).
6. `visibilitychange` → hidden (switching browser tab).
7. `resize`, and scroll of an ancestor (or reposition instead).
8. Route or view change.
9. A modal dialog opening.

Do **not** close on the `mouseleave` of the bar: native menus stay open until you click elsewhere.

## 4. React bugs that cause stuck hover or open states, and fixes

| Symptom | Cause | Fix |
|---|---|---|
| Item stays highlighted after the menu re-renders | `mouseleave`/`mouseout` **do not fire when the element under the cursor is removed or replaced**. Chrome may also drop them when a node is replaced in the same tick [reported: [MDN mouseleave](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event), [react #4492](https://github.com/facebook/react/issues/4492)] | derive highlight from a single `activeIndex` state set on `pointermove`. Reset it on open, close and items-change. Give stable `key`s so nodes are not replaced |
| Highlight "sticks" after a tap on a touch laptop or tablet | CSS `:hover` emulation after touch | wrap hover styles in `@media (hover: hover) and (pointer: fine)`. Socius already does this for `.menubar-btn` |
| Trigger looks "selected" after closing with the mouse | styling `:focus` instead of `:focus-visible`; focus returns to the trigger on close | style `:focus-visible` only. Returning focus to the trigger is correct for keyboard use |
| Moving the pointer across other triggers does nothing after touch-dragging | **implicit pointer capture**: on touch, `pointerdown` captures the pointer to its target, so `pointerenter/leave/over/out` do not fire elsewhere until `pointerup` [reported: MDN PointerEvent] | do not implement "hover switch" for `pointerType === 'touch'`; switch on tap. Never call `setPointerCapture` in menu code; if needed, call `releasePointerCapture(e.pointerId)` in `pointerdown` |
| Menu stays open after Alt-Tab or switching browser tabs, and hover timers fire later | no `blur`/`visibilitychange` handling; timers not cleared | close and clear timers on `window` `blur` and `document.visibilitychange` (hidden). Also cancel pending submenu-open timers in `pointerleave` of the whole menu layer |
| Opening click instantly closes the menu | the outside-click listener is registered during the same click, or uses `click` while opening uses `pointerdown` | use a **capture-phase `pointerdown`** listener, installed while open, and ignore events whose `composedPath()` includes the bar or a menu portal |
| Clicks inside a portal-rendered submenu count as "outside" | `barRef.contains(target)` misses the portal | check all open menu roots, or mark them with a data attribute and use `target.closest('[data-menu-root]')` |
| Keyboard highlight jumps when the pointer rests over the menu and the list scrolls or opens | `pointerenter`/`mouseover` fire on layout change without real movement | use `pointermove` (Radix uses `onPointerMove` with `whenMouse`) [verified] |
| Two menus open, or a submenu from the previous menu lingers | per-menu `open` booleans instead of one `openMenuId` plus `openPath` | a single source of truth: `openPath: string[]` in one reducer |
| Handlers run twice in dev | StrictMode mounts effects twice; listeners added without cleanup | every `addEventListener` has a matching remove in the effect cleanup; use refs for timers |
| Stale state inside `setTimeout` | the closure captured an old `open` value | read from refs (`openRef.current`) or use functional `setState` |
| Hover opens a submenu after the parent menu closed | the pending open timer was not cleared on close | clear all timers in the close routine and on unmount |
| Focus lost to `<body>` after closing | the item that had focus was unmounted | move focus to the trigger **before** unmounting the menu (Radix `onCloseAutoFocus`) |

## 5. Testing recipe [inferred]

- Unit-test the reducer: open/close/switch/openPath transitions and all keys from section 2.
- Geometry-test the grace polygon: `isPointInPolygon` with fixed rects.
- Playwright:
  - `page.mouse.move` diagonally from an item with a submenu into the submenu over a sibling item, and assert the submenu stays.
  - Move straight down and assert it switches within 150 ms.
  - Alt-Tab simulation: `page.evaluate(() => window.dispatchEvent(new Event('blur')))`, then assert closed.
  - `document.visibilityState` override, then `visibilitychange`, then assert closed.
  - Touch: `page.touchscreen.tap` on triggers.
- Axe or ARIA snapshot: roles, `aria-expanded`, a single `tabindex=0` in the bar.
