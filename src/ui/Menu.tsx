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
  /**
   * Where focus goes when the menu opens: the first item (true, keyboard), the last item ('last'),
   * the menu itself with no item highlighted ('menu', opened with the mouse), or nowhere (false).
   */
  autoFocus?: boolean | 'last' | 'menu';
  className?: string;
  style?: CSSProperties;
  label?: string;
  isSubmenu?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

/** Delay before a submenu opens under a resting pointer (ms), and how long a diagonal move towards an open submenu may take. */
export const SUBMENU_OPEN_MS = 120;
export const SUBMENU_AIM_MS = 350;

/**
 * Is the pointer, moving from `from` to `to`, heading into the open submenu `rect` (which sits on
 * the right of the menu, or on the left when `side` is 'left')? True when `to` lies in the triangle
 * between `from` and the submenu's near edge, so crossing other items on the way does not switch
 * submenus ("menu aim", as in desktop menus).
 */
export function aimsAtSubmenu(from: Point, to: Point, rect: { left: number; right: number; top: number; bottom: number }, side: 'left' | 'right' = 'right'): boolean {
  const edgeX = side === 'right' ? rect.left : rect.right;
  if (side === 'right' ? to.x < from.x : to.x > from.x) return false;
  const a = from;
  const b = { x: edgeX, y: rect.top - 8 };
  const c = { x: edgeX, y: rect.bottom + 8 };
  const sign = (p: Point, q: Point, r: Point) => (p.x - r.x) * (q.y - r.y) - (q.x - r.x) * (p.y - r.y);
  const d1 = sign(to, a, b);
  const d2 = sign(to, b, c);
  const d3 = sign(to, c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * One menu (and its submenus). The highlighted item is the focused item: moving the pointer over an
 * item focuses it, so the pointer and the arrow keys share one highlight and it never sticks.
 * Submenus open on hover after a short delay and stay open while the pointer moves diagonally
 * towards them.
 */
export function MenuList({ items, onClose, onNavigate, autoFocus = true, className, style, label, isSubmenu }: MenuListProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);
  const [subFocus, setSubFocus] = useState(false);
  const openSubRef = useRef<string | null>(null);
  openSubRef.current = openSub;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hovered = useRef<string | null>(null);
  const pointer = useRef<{ prev: Point | null; cur: Point | null; at: number }>({ prev: null, cur: null, at: 0 });

  const buttons = () => Array.from(ref.current?.querySelectorAll<HTMLButtonElement>(':scope > .menu-item-wrap > [role^="menuitem"]') ?? []);

  useLayoutEffect(() => {
    if (!autoFocus) return;
    if (autoFocus === 'menu') {
      ref.current?.focus({ preventScroll: true });
      return;
    }
    const bs = buttons();
    const enabled = bs.filter((b) => b.getAttribute('aria-disabled') !== 'true');
    const target = autoFocus === 'last' ? enabled[enabled.length - 1] : enabled[0];
    (target ?? bs[0])?.focus({ preventScroll: true });
  }, [autoFocus]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const move = (delta: number) => {
    const bs = buttons();
    if (!bs.length) return;
    const i = bs.indexOf(document.activeElement as HTMLButtonElement);
    // Nothing highlighted yet (opened with the mouse): Down starts at the first item, Up at the last.
    let j = i < 0 ? (delta > 0 ? -1 : bs.length) : i;
    for (let k = 0; k < bs.length; k++) {
      j = (j + delta + bs.length) % bs.length;
      if (bs[j].getAttribute('aria-disabled') !== 'true') break;
    }
    // Moving on with the keyboard closes a submenu opened by pointing: one item is active at a time.
    if (timer.current) clearTimeout(timer.current);
    if (openSubRef.current && bs[j]?.dataset.itemId !== openSubRef.current) setOpenSub(null);
    hovered.current = null;
    bs[j]?.focus();
  };

  const activate = (it: MenuItem) => {
    if (it.disabled) return;
    if (it.children) {
      if (timer.current) clearTimeout(timer.current);
      setOpenSub(it.id);
      setSubFocus(true);
      return;
    }
    onClose('select');
    it.onSelect?.();
  };

  /** Is the pointer on its way into the submenu that is open now? */
  const aiming = (): boolean => {
    const { prev, cur, at } = pointer.current;
    // A pointer that has stopped is not on its way anywhere.
    if (!openSubRef.current || !prev || !cur || performance.now() - at > 100) return false;
    const sub = ref.current?.querySelector<HTMLElement>(':scope > .menu-item-wrap > .menu-submenu');
    if (!sub) return false;
    const r = sub.getBoundingClientRect();
    const own = ref.current!.getBoundingClientRect();
    return aimsAtSubmenu(prev, cur, r, r.left >= own.left ? 'right' : 'left');
  };

  /** Show the submenu of the item under the pointer (or none), unless the pointer is heading into the open one. */
  const settleSubmenu = (delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      const id = hovered.current;
      if (id === openSubRef.current) return;
      const btn = id ? ref.current?.querySelector<HTMLButtonElement>(`:scope > .menu-item-wrap > [data-item-id="${CSS.escape(id)}"]`) : null;
      // Already inside the open submenu: leave it open.
      if (ref.current?.querySelector(':scope > .menu-item-wrap > .menu-submenu')?.matches(':hover')) return;
      if (aiming()) {
        settleSubmenu(SUBMENU_AIM_MS);
        return;
      }
      const it = items.find((x) => x.id === id);
      if (btn && document.activeElement !== btn && !ref.current?.querySelector('.menu-submenu')?.contains(document.activeElement)) btn.focus({ preventScroll: true });
      setSubFocus(false);
      setOpenSub(it?.children && !it.disabled ? it.id : null);
    }, delay);
  };

  /** The pointer moved over an item (a real move: a menu opening under a resting pointer changes nothing). */
  const onItemPointer = (it: MenuItem, el: HTMLButtonElement) => {
    if (hovered.current === it.id && document.activeElement === el) return;
    hovered.current = it.id;
    if (it.id === openSubRef.current) {
      if (timer.current) clearTimeout(timer.current);
      if (document.activeElement !== el) el.focus({ preventScroll: true });
      return;
    }
    // Crossing items on the way into an open submenu: leave the highlight and the submenu alone, and
    // look again shortly (the pointer may stop here, then this item wins).
    if (openSubRef.current && aiming()) {
      settleSubmenu(SUBMENU_AIM_MS);
      return;
    }
    if (document.activeElement !== el) el.focus({ preventScroll: true });
    const wantsSub = !!it.children && !it.disabled;
    settleSubmenu(wantsSub || openSubRef.current ? SUBMENU_OPEN_MS : 0);
  };

  const onItemLeave = (it: MenuItem, el: HTMLButtonElement) => {
    if (hovered.current === it.id) hovered.current = null;
    // Leaving the menu for empty space: drop the highlight (keep it on an item whose submenu is open).
    if (document.activeElement === el && openSubRef.current !== it.id) ref.current?.focus({ preventScroll: true });
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
        if (it?.children && !it.disabled) { if (timer.current) clearTimeout(timer.current); setOpenSub(it.id); setSubFocus(true); }
        else onNavigate?.(1);
        break;
      case 'ArrowLeft':
        e.preventDefault(); e.stopPropagation();
        if (isSubmenu) onClose('escape');
        else onNavigate?.(-1);
        break;
      case 'Enter':
      case ' ':
        // The menu itself has focus (opened with the mouse, nothing highlighted): nothing to choose.
        if (!it) { e.preventDefault(); e.stopPropagation(); }
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
            const b = bs[(i + k + bs.length) % bs.length];
            if ((b.dataset.label ?? '').toLowerCase().startsWith(lower)) { b.focus(); e.preventDefault(); e.stopPropagation(); break; }
          }
        }
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      className={`menu ${items.some((it) => it.children) ? '' : 'menu-scroll'} ${className ?? ''}`}
      style={style}
      onKeyDown={onKeyDown}
      onPointerMove={(e) => {
        const p = pointer.current;
        p.prev = p.cur;
        p.cur = { x: e.clientX, y: e.clientY };
        p.at = performance.now();
      }}
    >
      {items.map((it) => (
        <div key={it.id} className="menu-item-wrap">
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
            tabIndex={-1}
            className={`menu-item ${it.danger ? 'menu-item-danger' : ''}`}
            onClick={() => activate(it)}
            onPointerMove={(e) => {
              if (e.pointerType !== 'touch') onItemPointer(it, e.currentTarget);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType !== 'touch') onItemLeave(it, e.currentTarget);
            }}
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
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('resize', esc);
    window.addEventListener('blur', esc);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('resize', esc);
      window.removeEventListener('blur', esc);
      prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div ref={ref} className="context-menu" style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 120 }}>
      <MenuList items={items} onClose={() => onClose()} label={label} autoFocus="menu" />
    </div>
  );
}
