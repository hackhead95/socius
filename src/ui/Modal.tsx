import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface ModalProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'narrow' | 'normal' | 'wide';
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessible modal dialog. Escape and backdrop click close it; Tab stays inside. */
export function Modal({ title, subtitle, onClose, footer, size = 'normal', children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('.modal-body input, .modal-body select, .modal-body textarea, .modal-body button, .modal-footer button');
    (first ?? ref.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (!ref.current) return;
      // Only the top-most modal reacts.
      const all = document.querySelectorAll('.modal');
      if (all[all.length - 1] !== ref.current) return;
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab') {
        const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && (i <= 0)) {
          e.preventDefault();
          items[items.length - 1].focus();
        } else if (!e.shiftKey && i === items.length - 1) {
          e.preventDefault();
          items[0].focus();
        }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      if (prev && document.contains(prev)) prev.focus?.({ preventScroll: true });
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && closeRef.current()}>
      <div ref={ref} className={`modal ${size === 'wide' ? 'modal-wide' : size === 'narrow' ? 'modal-narrow' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="modal-header">
          <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <h2 id={titleId}>{title}</h2>
            {subtitle ? <div className="help">{subtitle}</div> : null}
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" data-close onClick={() => closeRef.current()} aria-label="Close">
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
