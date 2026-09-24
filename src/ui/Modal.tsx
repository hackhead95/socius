import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

export interface ModalProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'narrow' | 'normal' | 'wide';
  /**
   * What a click on the dimmed area around the dialog does. 'auto' (default): closes dialogs that
   * only show information, and does nothing (a short nudge) in dialogs with fields, check boxes or
   * lists the user may have filled in, so a stray click never throws the choices away.
   */
  backdropClose?: 'auto' | boolean;
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
/** Controls whose state is user input (a backdrop click must not discard it). */
const INPUTS = 'input:not([type=hidden]), select, textarea, [role=option], [role=listbox], [contenteditable=true]';

// ---------------------------------------------------------------- focus return (all dialogs)
//
// Every dialog gives focus back when it closes (WAI-ARIA dialog pattern). Where to:
// 1. the element a menu asked for (a dialog chosen from the menubar returns to where the user was
//    working, or to the menu's button: see MenuBar), else
// 2. the element that had focus when the dialog opened, else
// 3. the last element that had focus in the page (not in a menu or dialog), else
// 4. the tab of the current view.
// A dialog replaced by another one (About > Error log) hands its return target to the new one
// instead of taking focus away from it.

const OVERLAY = '.modal, .menu, [role=menu], .menu-sheet, .palette, .context-menu';
let lastPageFocus: HTMLElement | null = null;
let pending: { el: HTMLElement; at: number } | null = null;

if (typeof document !== 'undefined') {
  document.addEventListener(
    'focusin',
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t !== document.body && t instanceof HTMLElement && !t.closest(OVERLAY)) lastPageFocus = t;
    },
    true,
  );
  // A dialog opened by a later click returns to what was clicked, not to an old menu request.
  document.addEventListener('pointerdown', () => (pending = null), true);
}

/** A dialog about to open (from a menu) should give focus back to `el` when it closes. */
export function setDialogReturnFocus(el: HTMLElement | null): void {
  pending = el ? { el, at: Date.now() } : null;
}

function usable(el: Element | null | undefined): el is HTMLElement {
  return !!el && el instanceof HTMLElement && el !== document.body && el.isConnected && el.getClientRects().length > 0 && !el.closest('[inert]') && !(el as HTMLButtonElement).disabled;
}

function returnTarget(opener: Element | null): HTMLElement | null {
  const p = pending;
  pending = null;
  if (p && Date.now() - p.at < 2000 && p.el.isConnected) return p.el;
  if (usable(opener) && !opener.closest('.menu, [role=menu], .menu-sheet')) return opener;
  return null;
}

/** Where focus goes when a dialog closes and its own target is gone. */
function fallbackTarget(): HTMLElement | null {
  if (usable(lastPageFocus)) return lastPageFocus;
  const tab = document.querySelector<HTMLElement>('.main-tabs [role=tab][aria-selected="true"]');
  return usable(tab) ? tab : null;
}

interface Open {
  el: HTMLElement;
  ret: HTMLElement | null;
}
const stack: Open[] = [];
const modalListeners = new Set<() => void>();
const notify = () => modalListeners.forEach((fn) => fn());

/** Subscribe to dialogs opening and closing (toasts move out of the way of the top dialog). */
export function subscribeModals(fn: () => void): () => void {
  modalListeners.add(fn);
  return () => modalListeners.delete(fn);
}

/** The top-most open dialog, or null. */
export function topModal(): HTMLElement | null {
  return stack.length ? stack[stack.length - 1].el : null;
}

/** First control to focus: an autofocus control, the chosen option of a radio group, else the first field or button. */
function initialFocus(modal: HTMLElement): HTMLElement {
  const visible = (el: HTMLElement) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const auto = modal.querySelector<HTMLElement>('[data-autofocus], [autofocus]');
  if (auto && visible(auto)) return auto;
  const cands = Array.from(modal.querySelectorAll<HTMLElement>('.modal-body input, .modal-body select, .modal-body textarea, .modal-body button, .modal-body [tabindex="0"], .modal-footer button')).filter(
    (el) => visible(el) && !(el as HTMLInputElement).disabled && el.getAttribute('tabindex') !== '-1',
  );
  for (const el of cands) {
    // A radio group: focus the option that is chosen, so Space does not change the choice.
    if (el instanceof HTMLInputElement && el.type === 'radio' && !el.checked && el.name) {
      const chosen = cands.find((c) => c instanceof HTMLInputElement && c.type === 'radio' && c.name === el.name && c.checked);
      if (chosen) return chosen;
    }
    return el;
  }
  return modal;
}

/** Accessible modal dialog. Escape closes it; Tab stays inside; focus goes back where it came from. */
export function Modal({ title, subtitle, onClose, footer, size = 'normal', backdropClose = 'auto', children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  // Read during the first render: children with autoFocus take focus before any effect runs.
  const [opener] = useState(() => (typeof document === 'undefined' ? null : document.activeElement));
  const [nudge, setNudge] = useState(0);

  useEffect(() => {
    const modal = ref.current!;
    const active = document.activeElement;
    const entry: Open = { el: modal, ret: returnTarget(opener) ?? (usable(active) && !modal.contains(active) && !active.closest(OVERLAY) ? active : null) };
    stack.push(entry);
    notify();
    if (!modal.contains(document.activeElement)) initialFocus(modal).focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      // Only the top-most modal reacts.
      if (stack[stack.length - 1] !== entry) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
        if (!items.length) {
          e.preventDefault();
          modal.focus();
          return;
        }
        const i = items.indexOf(document.activeElement as HTMLElement);
        // Focus somewhere outside (it slipped out, or was never moved in): bring it back.
        if (i < 0) {
          e.preventDefault();
          (e.shiftKey ? items[items.length - 1] : items[0]).focus();
        } else if (e.shiftKey && i === 0) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    };
    // Focus that leaves the top dialog (a click on a toast, a programmatic focus) comes back in.
    const onFocusIn = (e: FocusEvent) => {
      if (stack[stack.length - 1] !== entry) return;
      const t = e.target as Node | null;
      if (t && !modal.contains(t) && !(t instanceof Element && t.closest('.modal, .toasts, [data-allow-focus-outside-modal]'))) initialFocus(modal).focus({ preventScroll: true });
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn);
      const at = stack.indexOf(entry);
      if (at >= 0) stack.splice(at, 1);
      notify();
      // A newer dialog replaced this one: leave focus with it, and let it return where this one would have.
      const newer = at >= 0 ? stack.slice(at) : [];
      if (newer.length) {
        for (const o of newer) if (!o.ret || !o.ret.isConnected || modal.contains(o.ret)) o.ret = entry.ret;
        return;
      }
      const below = stack[stack.length - 1];
      const target = usable(entry.ret) ? entry.ret : below ? null : fallbackTarget();
      if (target) target.focus({ preventScroll: true });
      else if (below && !below.el.contains(document.activeElement)) initialFocus(below.el).focus({ preventScroll: true });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const hasInput = !!ref.current?.querySelector(`.modal-body :is(${INPUTS})`);
    if (backdropClose === true || (backdropClose === 'auto' && !hasInput)) closeRef.current();
    else {
      // Keep the dialog (and what was filled in); show that it is still waiting for Cancel or OK.
      e.preventDefault();
      setNudge((n) => n + 1);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={onBackdrop}>
      <div
        ref={ref}
        className={`modal ${size === 'wide' ? 'modal-wide' : size === 'narrow' ? 'modal-narrow' : ''} ${nudge ? `modal-nudge-${nudge % 2}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <div className="help">{subtitle}</div> : null}
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" data-close onClick={() => closeRef.current()} aria-label="Close" title="Close (Esc)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" /></svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

/** In-page confirmation (window.confirm is blocked inside the Claude artifact viewer). */
export function ConfirmDialog(props: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={props.title}
      onClose={props.onCancel}
      size="narrow"
      footer={
        <>
          <button className="btn" onClick={props.onCancel}>Cancel</button>
          <button className={`btn ${props.danger ? 'btn-danger' : 'btn-primary'}`} onClick={props.onConfirm}>
            {props.confirmLabel ?? 'Confirm'}
          </button>
        </>
      }
    >
      <div style={{ fontSize: 'var(--fs-sm)' }}>{props.message}</div>
    </Modal>
  );
}
