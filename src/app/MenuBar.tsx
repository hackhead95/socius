// Menubar with keyboard-accessible dropdowns; collapses into a menu sheet on narrow screens.
import { useEffect, useRef, useState } from 'react';
import { MenuList, type MenuItem } from '../ui/Menu';
import { Icon } from '../ui/Icon';
import { useMenus, type TopMenu } from './menus';

export function MenuBar() {
  const menus = useMenus();
  const [open, setOpen] = useState<number | null>(null);
  const [focusFirst, setFocusFirst] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (open === null) return;
    const down = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const i = open;
        setOpen(null);
        btnRefs.current[i]?.focus();
      }
    };
    window.addEventListener('mousedown', down, true);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('mousedown', down, true);
      window.removeEventListener('keydown', key);
    };
  }, [open]);

  const openAt = (i: number, focus = true) => {
    setFocusFirst(focus);
    setOpen((i + menus.length) % menus.length);
  };

  const onBtnKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAt(i);
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
              onMouseDown={(e) => {
                e.preventDefault();
                if (open === i) setOpen(null);
                else openAt(i, false);
                btnRefs.current[i]?.focus();
              }}
              onMouseEnter={() => {
                if (open !== null && open !== i) openAt(i, false);
              }}
              onKeyDown={(e) => onBtnKey(e, i)}
            >
              {m.label}
            </button>
            {open === i ? (
              <MenuList
                items={m.items}
                label={m.label}
                className="menu-dropdown"
                autoFocus={focusFirst}
                onNavigate={(dir) => {
                  openAt(i + dir);
                  btnRefs.current[(i + dir + menus.length) % menus.length]?.focus();
                }}
                onClose={(reason) => {
                  setOpen(null);
                  // After a choice, focus returns to the menu button, so a dialog it opens hands focus back there on close.
                  if (reason === 'escape' || reason === 'select') btnRefs.current[i]?.focus();
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
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
