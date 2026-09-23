import { useEffect, useRef, type ReactNode } from 'react';

export interface ModalProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'narrow' | 'normal' | 'wide';
  children: ReactNode;
}

/** Accessible modal dialog. Escape and backdrop click close it. */
export function Modal({ title, subtitle, onClose, footer, size = 'normal', children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal ${size === 'wide' ? 'modal-wide' : size === 'narrow' ? 'modal-narrow' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {subtitle ? <div className="help">{subtitle}</div> : null}
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" data-close onClick={onClose} aria-label="Close">
            ✕
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
