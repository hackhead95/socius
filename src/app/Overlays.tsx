// Toasts, global confirm dialog, busy overlay and the drag-and-drop target.
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../core/store';
import { ConfirmDialog } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { useUi } from './ui-store';
import { openDroppedFile, startFresh } from '../features/project/fileActions';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  const restoredAt = useUi((s) => s.restoredAt);
  const setRestoredAt = useUi((s) => s.setRestoredAt);
  useEffect(() => {
    if (!restoredAt) return;
    const t = setTimeout(() => setRestoredAt(null), 12000);
    return () => clearTimeout(t);
  }, [restoredAt, setRestoredAt]);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {restoredAt ? (
        <div className="toast toast-info">
          <Icon name="info" size={15} />
          <span className="toast-text">Restored your last session from {new Date(restoredAt).toLocaleString()}.</span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={async () => {
              setRestoredAt(null);
              const ok = await useUi.getState().confirm({
                title: 'Start fresh?',
                message: 'The restored data, output and codes will be closed. Save a project first if you want to keep them.',
                confirmLabel: 'Start fresh',
                danger: true,
              });
              if (ok) await startFresh();
            }}
          >
            Start fresh
          </button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setRestoredAt(null)} aria-label="Dismiss"><Icon name="x" size={12} /></button>
        </div>
      ) : null}
      {toasts.slice(-3).map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : undefined}>
          <Icon name={t.tone === 'error' || t.tone === 'warning' ? 'warn' : t.tone === 'success' ? 'check' : 'info'} size={15} />
          <span className="toast-text">{t.text}</span>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => dismiss(t.id)} aria-label="Dismiss"><Icon name="x" size={12} /></button>
        </div>
      ))}
    </div>
  );
}

export function ConfirmHost() {
  const req = useUi((s) => s.confirmReq);
  const settle = useUi((s) => s.settleConfirm);
  if (!req) return null;
  return <ConfirmDialog title={req.title} message={req.message} confirmLabel={req.confirmLabel} danger={req.danger} onConfirm={() => settle(true)} onCancel={() => settle(false)} />;
}

export function BusyOverlay() {
  const busy = useUi((s) => s.busy);
  if (!busy) return null;
  return (
    <div className="busy" role="status" aria-live="assertive">
      <div className="busy-card">
        <span className="spinner" aria-hidden="true" />
        {busy}
      </div>
    </div>
  );
}

/** Full-window drop target shown while files are dragged over the page. */
export function DropOverlay() {
  const [active, setActive] = useState(false);
  const depth = useRef(0);
  useEffect(() => {
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const enter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current++;
      setActive(true);
    };
    const over = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const leave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (!depth.current) setActive(false);
    };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) void openDroppedFile(f);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, []);
  if (!active) return null;
  return (
    <div className="drop-overlay" aria-hidden="true">
      <div className="drop-card">
        <Icon name="upload" size={28} />
        <strong>Drop to open</strong>
        <span className="help">.sav, .zsav, .csv, .tsv, .xlsx, or a .socius.json project</span>
      </div>
    </div>
  );
}
