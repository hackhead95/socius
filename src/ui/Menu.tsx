// Keyboard-accessible menus: used by the menubar dropdowns, the narrow-screen menu sheet and
// right-click context menus.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from './Icon';

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  disabled?: boolean;
  /** Tooltip; for disabled items, say why. */
  title?: string;
  /** Show as a check item. */
  checked?: boolean;
  /** Draw a separator above this item. */
  separator?: boolean;
  danger?: boolean;
  onSelect?: () => void;
  children?: MenuItem[];
  /** Optional small heading above the item (group label). */
  group?: string;
}

interface MenuListProps {
  items: MenuItem[];
  onClose: (reason: 'select' | 'escape' | 'tab') => void;
  /** Left/right arrow outside a submenu (menubar uses it to switch menus). */
  onNavigate?: (dir: -1 | 1) => void;
  autoFocus?: boolean | 'last';
  className?: string;
  style?: CSSProperties;
  label?: string;
  isSubmenu?: boolean;
}

export function MenuList({ items, onClose, onNavigate, autoFocus = true, className, style, label, isSubmenu }: MenuListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [subFocus, setSubFocus] = useState(false);

  const buttons = () => Array.from(ref.current?.querySelectorAll<HTMLButtonElement>(':scope > .menu-item-wrap > [role^="menuitem"]') ?? []);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    const bs = buttons();
    const enabled = bs.filter((b) => b.getAttribute('aria-disabled') !== 'true');
    const target = autoFocus === 'last' ? enabled[enabled.length - 1] : enabled[0];
    (target ?? bs[0])?.focus({ preventScroll: true });
  }, [autoFocus]);

  const move = (delta: number) => {
    const bs = buttons();
    if (!bs.length) return;
    const i = bs.indexOf(document.activeElement as HTMLButtonElement);
    let j = i;
    for (let k = 0; k < bs.length; k++) {
      j = (j + delta + bs.length) % bs.length;
      if (bs[j].getAttribute('aria-disabled') !== 'true') break;
    }
    bs[j]?.focus();
  };

  const activate = (it: MenuItem) => {
    if (it.disabled) return;
    if (it.children) {
      setOpenSub(it.id);
      setSubFocus(true);
      return;
    }
    onClose('select');
    it.onSelect?.();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLElement && !e.currentTarget.contains(e.target)) return;
    const active = document.activeElement as HTMLElement | null;
    const id = active?.dataset.itemId;
    const it = items.find((x) => x.id === id);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); e.stopPropagation(); move(1); break;
      case 'ArrowUp': e.preventDefault(); e.stopPropagation(); move(-1); break;
      case 'Home': e.preventDefault(); e.stopPropagation(); buttons()[0]?.focus(); move(0); break;
      case 'End': e.preventDefault(); e.stopPropagation(); { const bs = buttons(); bs[bs.length - 1]?.focus(); } break;
      case 'ArrowRight':
        e.preventDefault(); e.stopPropagation();
        if (it?.children && !it.disabled) { setOpenSub(it.id); setSubFocus(true); }
        else onNavigate?.(1);
        break;
      case 'ArrowLeft':
        e.preventDefault(); e.stopPropagation();
        if (isSubmenu) onClose('escape');
        else onNavigate?.(-1);
        break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); onClose('escape'); break;
      case 'Tab': onClose('tab'); break;
      default:
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // Type-ahead: jump to the next item starting with the letter.
          const bs = buttons();
          const i = bs.indexOf(active as HTMLButtonElement);
          const lower = e.key.toLowerCase();
          for (let k = 1; k <= bs.length; k++) {
            const b = bs[(i + k) % bs.length];
            if ((b.dataset.label ?? '').toLowerCase().startsWith(lower)) { b.focus(); e.preventDefault(); e.stopPropagation(); break; }
          }
        }
    }
  };

  return (
    <div ref={ref} role="menu" aria-label={label} className={`menu ${items.some((it) => it.children) ? '' : 'menu-scroll'} ${className ?? ''}`} style={style} onKeyDown={onKeyDown}>
      {items.map((it) => (
        <div key={it.id} className="menu-item-wrap" onMouseEnter={() => { if (it.children && !it.disabled) { setOpenSub(it.id); setSubFocus(false); } else setOpenSub(null); }}>
          {it.separator ? <div className="menu-sep" role="separator" /> : null}
          {it.group ? <div className="menu-group">{it.group}</div> : null}
          <button
            type="button"
            role={it.checked !== undefined ? 'menuitemcheckbox' : 'menuitem'}
            aria-checked={it.checked !== undefined ? it.checked : undefined}
            aria-disabled={it.disabled ? 'true' : undefined}
            aria-haspopup={it.children ? 'menu' : undefined}
            aria-expanded={it.children ? openSub === it.id : undefined}
            data-item-id={it.id}
            data-label={it.label}
            title={it.title}
            className={`menu-item ${it.danger ? 'menu-item-danger' : ''}`}
            onClick={() => activate(it)}
          >
            <span className="menu-check" aria-hidden="true">{it.checked ? <Icon name="check" size={14} /> : null}</span>
            <span className="menu-label">{it.label}</span>
            {it.shortcut ? <span className="menu-shortcut">{it.shortcut}</span> : null}
            {it.children ? <Icon name="chevronRight" size={14} className="menu-sub-arrow" /> : null}
          </button>
          {it.children && openSub === it.id ? (
            <MenuList
              items={it.children}
              isSubmenu
              autoFocus={subFocus}
              className="menu-submenu"
              label={it.label}
              onClose={(reason) => {
                setOpenSub(null);
                if (reason === 'select') onClose('select');
                else ref.current?.querySelector<HTMLButtonElement>(`[data-item-id="${CSS.escape(it.id)}"]`)?.focus();
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Context menu at a viewport position; closes on outside click, scroll or Escape. */
export function ContextMenu({ x, y, items, onClose, label }: { x: number; y: number; items: MenuItem[]; onClose: () => void; label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(4, Math.min(x, window.innerWidth - r.width - 4));
    const top = Math.max(4, Math.min(y, window.innerHeight - r.height - 4));
    setPos({ left, top });
  }, [x, y]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const down = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = () => onClose();
    window.addEventListener('mousedown', down, true);
    window.addEventListener('resize', esc);
    window.addEventListener('blur', esc);
    return () => {
      window.removeEventListener('mousedown', down, true);
      window.removeEventListener('resize', esc);
      window.removeEventListener('blur', esc);
      prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div ref={ref} className="context-menu" style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 120 }}>
      <MenuList items={items} onClose={() => onClose()} label={label} />
    </div>
  );
}

/** A button that opens a dropdown menu below it. */
export function MenuButton({ label, items, className, title, children, align = 'left' }: { label: string; items: MenuItem[]; className?: string; title?: string; children?: React.ReactNode; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', down, true);
    return () => window.removeEventListener('mousedown', down, true);
  }, [open]);
  return (
    <div ref={wrap} className="menu-button-wrap">
      <button
        ref={btn}
        type="button"
        className={className ?? 'btn btn-sm'}
        aria-haspopup="menu"
        aria-expanded={open}
        title={title}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children ?? label}
      </button>
      {open ? (
        <MenuList
          items={items}
          label={label}
          className={`menu-dropdown ${align === 'right' ? 'menu-dropdown-right' : ''}`}
          onClose={(reason) => {
            setOpen(false);
            if (reason !== 'select') btn.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
