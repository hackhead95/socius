// Small UI pieces shared by the coding workspace.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { CodeDef } from '../../core/coding-types';
import { fillOf } from './hooks';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  /** Tooltip on a disabled item saying why it is unavailable (and what to do first). */
  disabledReason?: string;
  danger?: boolean;
  hint?: string;
  separator?: boolean;
}

export interface MenuPlacement {
  /** Left edge of the menu relative to the trigger's left edge, in px. */
  left: number;
  /** Open upwards (above the trigger) because there is no room below. */
  up: boolean;
  /** Height limit so the menu stays on screen (it scrolls inside). */
  maxHeight: number;
  /** Viewport position of the menu (it is position: fixed, so no panel's overflow clips it). */
  x: number;
  y: number;
}

const EDGE = 8;
const GAP = 4;

/**
 * Where to put a dropdown so it stays on screen. It prefers `prefer` alignment ('right': the menu's
 * right edge on the trigger's right edge, as in a toolbar at the right; 'left': left edges aligned),
 * uses the other alignment when the preferred one would cross a screen edge, and as a last resort
 * shifts it to keep an 8 px margin. It opens above the trigger when there is not enough room below
 * and more room above. Pure, so tests can check every case.
 */
export function placeMenu(
  anchor: { left: number; right: number; top: number; bottom: number },
  menu: { width: number; height: number },
  viewport: { width: number; height: number },
  prefer: 'left' | 'right' = 'right',
): MenuPlacement {
  const w = Math.min(menu.width, viewport.width - 2 * EDGE);
  const rightAligned = anchor.right - w;
  const leftAligned = anchor.left;
  const fits = (x: number) => x >= EDGE && x + w <= viewport.width - EDGE;
  let x = prefer === 'right' ? rightAligned : leftAligned;
  if (!fits(x)) {
    const other = prefer === 'right' ? leftAligned : rightAligned;
    x = fits(other) ? other : Math.max(EDGE, Math.min(x, viewport.width - EDGE - w));
  }
  const below = viewport.height - anchor.bottom - GAP - EDGE;
  const above = anchor.top - GAP - EDGE;
  const up = menu.height > below && above > below;
  const maxHeight = Math.floor(Math.max(120, up ? above : below));
  const h = Math.min(menu.height, maxHeight);
  const y = up ? anchor.top - GAP - h : anchor.bottom + GAP;
  return { left: Math.round(x - anchor.left), up, maxHeight, x: Math.round(x), y: Math.round(Math.max(EDGE, y)) };
}

/** A button that opens a small dropdown menu (keyboard: arrows, Enter, Escape). */
export function MenuButton(props: { label: ReactNode; items: MenuItem[]; className?: string; title?: string; align?: 'left' | 'right'; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState<MenuPlacement | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prefer = props.align ?? 'right';
  const nItems = props.items.length;
  // Measure after render and before paint, so the menu never shows off-screen (UI-008); again when
  // the window is resized or scrolled while it is open.
  useLayoutEffect(() => {
    if (!open) {
      setPlace(null);
      return;
    }
    const measure = () => {
      const wrap = ref.current;
      const list = listRef.current;
      if (!wrap || !list) return;
      const r = wrap.getBoundingClientRect();
      setPlace(placeMenu(r, { width: list.offsetWidth, height: list.scrollHeight }, { width: window.innerWidth, height: window.innerHeight }, prefer));
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, prefer, nItems]);
  useEffect(() => {
    if (!open) return;
    // Capture-phase pointerdown: closes on any press elsewhere (a tab, the menu bar), even where the
    // page stops the event or suppresses mouse events.
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const away = () => setOpen(false);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('blur', away);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('blur', away);
    };
  }, [open]);
  useEffect(() => {
    if (open) ref.current?.querySelectorAll<HTMLButtonElement>('.cw-menu-item')[active]?.focus();
  }, [open, active]);
  const enabled = props.items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);
  const onKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>('.cw-menu-trigger')?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const pos = enabled.indexOf(active);
      const next = e.key === 'ArrowDown' ? enabled[(pos + 1) % enabled.length] : enabled[(pos - 1 + enabled.length) % enabled.length];
      setActive(next ?? 0);
    }
  };
  // Fixed position from the measured trigger, so a panel with overflow: hidden (the codebook, the
  // source list) cannot clip the menu either.
  const listStyle: React.CSSProperties = place
    ? { position: 'fixed', left: place.x, top: place.y, right: 'auto', bottom: 'auto', maxHeight: place.maxHeight, overflowY: 'auto' }
    : // First render: measure it where it cannot be seen or cause a scrollbar.
      { position: 'fixed', visibility: 'hidden', left: 0, top: 0, right: 'auto', bottom: 'auto' };
  return (
    <div className="cw-menu" ref={ref} onKeyDown={onKey}>
      <button
        className={`btn cw-menu-trigger ${props.className ?? ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={props.title}
        disabled={props.disabled}
        onClick={() => {
          setActive(enabled[0] ?? 0);
          setOpen((o) => !o);
        }}
      >
        {props.label}
        <span aria-hidden className="cw-caret">▾</span>
      </button>
      {open ? (
        <div ref={listRef} className={`cw-menu-list ${prefer === 'left' ? 'cw-menu-left' : ''}`} role="menu" style={listStyle} data-placement={place ? (place.up ? 'up' : 'down') : undefined}>
          {props.items.map((it, i) => (
            <div key={i}>
              {it.separator ? <div className="cw-menu-sep" /> : null}
              <button
                role="menuitem"
                className={`cw-menu-item ${it.danger ? 'cw-danger' : ''}`}
                disabled={it.disabled}
                title={it.disabled ? it.disabledReason : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
              >
                <span>{it.label}</span>
                {it.hint ? <span className="cw-menu-hint">{it.hint}</span> : null}
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Which sides of a horizontal scroller have content out of view (updates on scroll and resize). */
export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setEdges((p) => (p.left === left && p.right === right ? p : { left, right }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      ro?.disconnect();
    };
  }, []);
  return { ref, ...edges };
}

export function Swatch({ color, size = 10 }: { color: string; size?: number }) {
  return <span className="cw-swatch" style={{ background: color, width: size, height: size }} aria-hidden />;
}

/** Code chip: translucent fill and solid left edge in the code colour. */
export function CodeChip(props: { code: CodeDef; onRemove?: () => void; onClick?: () => void; title?: string; small?: boolean; muted?: boolean }) {
  const { code } = props;
  return (
    <span
      className={`cw-chip ${props.small ? 'cw-chip-sm' : ''} ${props.muted ? 'cw-chip-muted' : ''}`}
      style={{ background: fillOf(code.color, 'var(--cw-chip)'), borderColor: code.color }}
      title={props.title ?? code.name}
      onClick={props.onClick}
    >
      <span className="cw-chip-label">{code.name}</span>
      {props.onRemove ? (
        <button
          className="cw-chip-x"
          aria-label={`Remove ${code.name}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onRemove!();
          }}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function Segmented<T extends string>(props: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="cw-seg" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button key={o.value} role="radio" aria-checked={props.value === o.value} className="cw-seg-btn" onClick={() => props.onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Fixed-position floating panel anchored to a viewport rectangle; flips above when there is no room
 * below and stays inside the viewport horizontally.
 */
export function Floating(props: { anchor: { left: number; top: number; bottom: number }; width?: number; children: ReactNode; onClose: () => void; className?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const width = props.width ?? 300;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.offsetHeight;
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(width, vw - 16);
    const left = Math.max(8, Math.min(props.anchor.left, vw - w - 8));
    let top = props.anchor.bottom + 6;
    if (top + h > vh - 8 && props.anchor.top - h - 6 > 8) top = props.anchor.top - h - 6;
    top = Math.max(8, Math.min(top, vh - h - 8));
    setPos({ left, top });
  }, [props.anchor.left, props.anchor.top, props.anchor.bottom, width]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (ref.current?.contains(t) || t.closest?.('[data-popover-safe]')) return;
      props.onClose();
    };
    const onScroll = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) props.onClose();
    };
    const t = setTimeout(() => {
      document.addEventListener('mousedown', onDown);
      window.addEventListener('scroll', onScroll, true);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [props.onClose]);
  return (
    <div
      ref={ref}
      className={`cw-floating ${props.className ?? ''}`}
      role="dialog"
      aria-label={props.label}
      style={{ width: Math.min(width, typeof window !== 'undefined' ? window.innerWidth - 16 : width), left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          props.onClose();
        }
      }}
    >
      {props.children}
    </div>
  );
}

/** Horizontal percentage bar used in frequency tables. */
export function Bar({ pct, color }: { pct: number; color?: string }) {
  return (
    <span className="cw-bar" aria-hidden>
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color ?? 'var(--accent)' }} />
    </span>
  );
}
