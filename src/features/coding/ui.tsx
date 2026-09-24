// Small UI pieces shared by the coding workspace.

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { CodeDef } from '../../core/coding-types';
import { fillOf } from './hooks';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
  hint?: string;
  separator?: boolean;
}

/** A button that opens a small dropdown menu (keyboard: arrows, Enter, Escape). */
export function MenuButton(props: { label: ReactNode; items: MenuItem[]; className?: string; title?: string; align?: 'left' | 'right'; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
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
        <div className={`cw-menu-list ${props.align === 'left' ? 'cw-menu-left' : ''}`} role="menu">
          {props.items.map((it, i) => (
            <div key={i}>
              {it.separator ? <div className="cw-menu-sep" /> : null}
              <button
                role="menuitem"
                className={`cw-menu-item ${it.danger ? 'cw-danger' : ''}`}
                disabled={it.disabled}
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
