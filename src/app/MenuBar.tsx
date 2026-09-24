// Menubar with keyboard-accessible dropdowns; collapses into a menu sheet on narrow screens.
import { useEffect, useRef, useState } from 'react';
import { MenuList, type MenuItem } from '../ui/Menu';
import { Icon } from '../ui/Icon';
import { useMenus, type TopMenu } from './menus';
import { useStore } from '../core/store';
import { useUnseenErrors } from '../features/errorlog/actions';

export function MenuBar() {
  const menus = useMenus();
  const unseenErrors = useUnseenErrors();
  const tab = useStore((s) => s.tab);
  const [open, setOpen] = useState<number | null>(null);
  // One tab stop for the whole bar (roving tabindex): the menu last focused.
  const [tabStop, setTabStop] = useState(0);
  // Keyboard: the first item is highlighted. Mouse: the menu has focus, nothing is highlighted until you point.
  const [focusMode, setFocusMode] = useState<true | 'menu'>(true);
  const barRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  // Where focus was before the menu opened. It goes back there when the menu closes (as in desktop
  // apps), so a menu button never keeps focus, or a focus ring, after a mouse click. A dialog opened
  // from the menu hands focus back there too. Opened from the keyboard, that is the menu button.
  const returnTo = useRef<HTMLElement | null>(null);

  const close = (restore: boolean) => {
    setOpen(null);
    const el = returnTo.current;
    returnTo.current = null;
    if (!restore) return;
    if (el && el.isConnected && el !== document.body) el.focus({ preventScroll: true });
    else if (barRef.current?.contains(document.activeElement) || document.activeElement?.closest?.('.menu-dropdown')) (document.activeElement as HTMLElement).blur();
  };
  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    if (open === null) return;
    // Pressing anywhere else (a tab, the grid, a toolbar) closes the menu and leaves focus to what was
    // pressed. Capture phase, so nothing on the page can stop it.
    const down = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) closeRef.current(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current(true);
      }
    };
    // Alt-Tab, another browser tab, a resized window: close, like desktop menus.
    const away = () => closeRef.current(false);
    const hidden = () => {
      if (document.visibilityState === 'hidden') away();
    };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key);
    window.addEventListener('blur', away);
    window.addEventListener('resize', away);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key);
      window.removeEventListener('blur', away);
      window.removeEventListener('resize', away);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [open]);

  // Switching the main tab (from the tabs, a shortcut or a command) never leaves a menu open.
  useEffect(() => {
    setOpen(null);
  }, [tab]);

  const openAt = (i: number, mode: true | 'menu') => {
    if (open === null && !returnTo.current) {
      const active = document.activeElement as HTMLElement | null;
      returnTo.current = active && !barRef.current?.contains(active) ? active : null;
    }
    setFocusMode(mode);
    setOpen((i + menus.length) % menus.length);
  };

  const onBtnKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      returnTo.current = e.currentTarget as HTMLElement;
      openAt(i, true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      btnRefs.current[(i + 1) % menus.length]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      btnRefs.current[(i - 1 + menus.length) % menus.length]?.focus();
    }
  };

  return (
    <>
      <div ref={barRef} className="menubar" role="menubar" aria-label="Main menu">
        {menus.map((m, i) => (
          <div key={m.id} className="menubar-item">
            <button
              ref={(el) => { btnRefs.current[i] = el; }}
              type="button"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={open === i}
              className={`menubar-btn ${open === i ? 'open' : ''}`}
              tabIndex={i === tabStop ? 0 : -1}
              onFocus={() => setTabStop(i)}
              onPointerDown={(e) => {
                // Opens on press, like desktop menus (left button; Ctrl+click is a right click on a Mac).
                if (e.button !== 0 || e.ctrlKey) return;
                if (open === i) close(true);
                else openAt(i, 'menu');
              }}
              // Do not move focus to the button: the menu takes it, and it goes back where it was.
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                // Enter or Space on the button (a click with no pointer): open with the first item highlighted.
                if (e.detail === 0 && open !== i) {
                  returnTo.current = e.currentTarget;
                  openAt(i, true);
                }
              }}
              onPointerEnter={(e) => {
                // Once a menu is open, pointing at another menu opens it at once (as in desktop apps).
                // Not for touch, where "enter" is a tap that opens the menu anyway.
                if (e.pointerType !== 'touch' && open !== null && open !== i) openAt(i, 'menu');
              }}
              onKeyDown={(e) => onBtnKey(e, i)}
              aria-describedby={m.id === 'help' && unseenErrors ? 'help-errors-note' : undefined}
            >
              {m.label}
              {m.id === 'help' && unseenErrors ? <span className="menu-dot" aria-hidden="true" title="New problems in Help > Error log" /> : null}
            </button>
            {open === i ? (
              <MenuList
                key={m.id}
                items={m.items}
                label={m.label}
                className="menu-dropdown"
                autoFocus={focusMode}
                onNavigate={(dir) => {
                  const j = (i + dir + menus.length) % menus.length;
                  // Opened from the keyboard: Esc later returns to the menu now open, not the first one.
                  if (returnTo.current && barRef.current?.contains(returnTo.current)) returnTo.current = btnRefs.current[j];
                  openAt(j, true);
                }}
                onClose={(reason) => {
                  if (reason === 'tab') {
                    // Tab leaves the menu bar from its button, like the other controls.
                    setOpen(null);
                    returnTo.current = null;
                    btnRefs.current[i]?.focus();
                  } else close(true);
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
      {unseenErrors ? <span id="help-errors-note" className="sr-only">New problems in Help, Error log</span> : null}
      <MenuSheetButton menus={menus} />
    </>
  );
}

function flatten(items: MenuItem[], depth = 0): Array<MenuItem & { depth: number }> {
  const out: Array<MenuItem & { depth: number }> = [];
  for (const it of items) {
    if (it.children) {
      out.push({ ...it, depth, children: undefined, onSelect: undefined, disabled: true, group: undefined, title: undefined, id: `${it.id}-group` });
      out.push(...flatten(it.children, depth + 1));
    } else out.push({ ...it, depth });
  }
  return out;
}

/** Narrow screens: one "Menu" button opening a full-height sheet with every menu. */
function MenuSheetButton({ menus }: { menus: TopMenu[] }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    sheetRef.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }
      // Keep Tab inside the sheet (it is a modal dialog).
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (!items.length) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (i === items.length - 1 || i < 0)) {
        e.preventDefault();
        items[0].focus();
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      // Back to the Menu button, unless the chosen item moved focus elsewhere (a dialog).
      requestAnimationFrame(() => {
        if (!document.activeElement || document.activeElement === document.body) btnRef.current?.focus({ preventScroll: true });
      });
    };
  }, [open]);
  return (
    <>
      <button ref={btnRef} type="button" className="btn btn-sm menu-sheet-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <Icon name="menu" size={15} /> Menu
      </button>
      {open ? (
        <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div ref={sheetRef} className="menu-sheet" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="menu-sheet-head">
              <strong>Menu</strong>
              <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Close menu"><Icon name="x" size={14} /></button>
            </div>
            <div className="menu-sheet-body">
              {menus.map((m) => {
                const expanded = section === m.id;
                return (
                  <section key={m.id} className="menu-sheet-section">
                    <button type="button" className="menu-sheet-title" aria-expanded={expanded} onClick={() => setSection(expanded ? null : m.id)}>
                      {m.label}
                      <Icon name="chevron" size={14} style={{ transform: expanded ? 'rotate(180deg)' : undefined }} />
                    </button>
                    {expanded ? (
                      <div className="menu-sheet-items">
                        {flatten(m.items).map((it) =>
                          it.id.endsWith('-group') ? (
                            <div key={it.id} className="menu-group" style={{ paddingLeft: 12 + it.depth * 14 }}>{it.label}</div>
                          ) : (
                            <button
                              key={it.id}
                              type="button"
                              className="menu-item"
                              style={{ paddingLeft: 12 + it.depth * 14 }}
                              aria-disabled={it.disabled ? 'true' : undefined}
                              title={it.title}
                              onClick={() => {
                                if (it.disabled) return;
                                setOpen(false);
                                it.onSelect?.();
                              }}
                            >
                              <span className="menu-check" aria-hidden="true">{it.checked ? <Icon name="check" size={14} /> : null}</span>
                              <span className="menu-label">{it.label}</span>
                            </button>
                          ),
                        )}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
