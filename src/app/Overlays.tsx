// Toasts, global confirm dialog, busy overlay and the drag-and-drop target.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useStore } from '../core/store';
import { ConfirmDialog, subscribeModals, topModal } from '../ui/Modal';
import { Icon } from '../ui/Icon';
import { useUi } from './ui-store';
import { openDroppedFile, startFresh } from '../features/project/fileActions';
import { formatDateTime } from '../core/format-date';

type Placement = { style: React.CSSProperties; passive: boolean } | null;

/**
 * Where the toasts go while a dialog is open, so they never cover its controls: above the dialog,
 * below it, or beside it, whichever has room. When nothing has room (a full-screen dialog on a phone),
 * they sit at the top and let every click through.
 */
function placeAroundModal(modal: HTMLElement, box: HTMLElement): Placement {
  const m = modal.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const h = box.offsetHeight;
  const gap = 8;
  const width = Math.min(440, vw - 32);
  const centred = { left: '50%', right: 'auto', transform: 'translateX(-50%)', width, maxWidth: 'none' } as const;
  if (!h) return { style: { top: gap, bottom: 'auto', ...centred }, passive: false };
  if (m.top >= h + 2 * gap) return { style: { top: Math.max(gap, m.top - h - gap), bottom: 'auto', ...centred }, passive: false };
  if (vh - m.bottom >= h + 2 * gap) return { style: { top: m.bottom + gap, bottom: 'auto', ...centred }, passive: false };
  const right = vw - m.right - 2 * gap;
  if (right >= 240) return { style: { right: gap, left: 'auto', bottom: gap, top: 'auto', width: Math.min(440, right), maxWidth: 'none', transform: 'none' }, passive: false };
  if (m.left - 2 * gap >= 240) return { style: { left: gap, right: 'auto', bottom: gap, top: 'auto', width: Math.min(440, m.left - 2 * gap), maxWidth: 'none', transform: 'none' }, passive: false };
  return { style: { top: gap, bottom: 'auto', ...centred }, passive: true };
}

const INTERACTIVE = 'button, a[href], input, select, textarea, summary, [role=button], [role=option], [role=tab], [role=menuitem], [role=checkbox], [tabindex]:not([tabindex="-1"])';

/** Controls of the page lying under `r` (sampled on a grid; the toasts themselves do not count). */
function controlsUnder(r: { left: number; top: number; width: number; height: number }): number {
  const seen = new Set<Element>();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cols = Math.max(4, Math.round(r.width / 28));
  const rows = Math.max(2, Math.round(r.height / 20));
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = r.left + ((i + 0.5) * r.width) / cols;
      const y = r.top + ((j + 0.5) * r.height) / rows;
      if (x < 0 || y < 0 || x >= vw || y >= vh) continue;
      const hit = document.elementsFromPoint(x, y).find((e) => !e.closest('.toasts'));
      const c = hit?.closest(INTERACTIVE);
      // A focusable list or panel as a whole (the responses list) is not a control to keep clear.
      const cr = c?.getBoundingClientRect();
      if (c && cr && cr.width * cr.height < 0.15 * vw * vh) seen.add(c);
    }
  return seen.size;
}

/**
 * Where the toasts go with no dialog open: their usual corner (bottom right), unless controls of the
 * page lie under it (codebook actions, Output item buttons); then the free-est of bottom left,
 * bottom centre and top right (under the tabs). null keeps the usual corner.
 */
function placeAvoidingControls(box: HTMLElement): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const h = box.offsetHeight;
  if (!h || typeof document.elementsFromPoint !== 'function') return null;
  const root = getComputedStyle(document.documentElement);
  const body = document.body.classList;
  const phone = vw <= 760;
  const side = phone ? 12 : 16;
  const panel = body.contains('as-panel-open') && vw > 640 ? parseFloat(root.getPropertyValue('--as-panel-w')) || 440 : 0;
  const shellTop = parseFloat(root.getPropertyValue('--shell-top')) || 0;
  const width = phone ? vw - 2 * side : Math.min(440, vw - 2 * side - panel);
  const bottom = side;
  const right = side + panel;
  const box0 = { width, height: h };
  const fixed = { width, maxWidth: 'none', transform: 'none' } as const;
  type Cand = { rect: { left: number; top: number; width: number; height: number }; style: React.CSSProperties | null };
  const at = (left: number, top: number, style: React.CSSProperties | null): Cand => ({ rect: { ...box0, left, top }, style });
  const usual = at(vw - right - width, vh - bottom - h, null);
  const firstHits = controlsUnder(usual.rect);
  if (!firstHits) return null;
  // Other places along the bottom edge (right to left), then the top right under the view tabs.
  const candidates: Cand[] = [];
  for (let left = vw - right - width - 80; left >= side - 1; left -= 80) candidates.push(at(left, vh - side - h, { ...fixed, left, right: 'auto', bottom: side, top: 'auto' }));
  if (vw - right - width > side) candidates.push(at(side, vh - side - h, { ...fixed, left: side, right: 'auto', bottom: side, top: 'auto' }));
  candidates.push(at(vw - right - width, shellTop + 8, { ...fixed, right, left: 'auto', top: shellTop + 8, bottom: 'auto' }));
  let best = usual;
  let bestHits = firstHits;
  for (const c of candidates) {
    const hits = controlsUnder(c.rect);
    if (hits < bestHits) {
      best = c;
      bestHits = hits;
      if (!hits) break;
    }
  }
  return best.style ? { style: best.style, passive: false } : null;
}

function useToastPlacement(box: React.RefObject<HTMLDivElement | null>, n: number, sig: string): Placement {
  const topEl = useSyncExternalStore(subscribeModals, () => topModal(), () => null);
  const tab = useStore((s) => s.tab);
  const [place, setPlace] = useState<Placement>(null);
  useLayoutEffect(() => {
    const modal = topEl;
    const el = box.current;
    if (!el || !n) {
      setPlace(null);
      return;
    }
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Only a real change of place re-renders (a new but equal style object would loop with the observer).
    const update = () => {
      const next = modal ? placeAroundModal(modal, el) : placeAvoidingControls(el);
      setPlace((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    // Scrolling moves the page's controls under the toasts: look again when it settles.
    const later = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(update, 150);
    };
    // Beside a dialog: at once. Otherwise a moment later (while the toast slides in), which also keeps
    // this layout work out of the task that shows a toast (a file chooser opened then was dropped).
    if (modal) update();
    else later();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(later) : null;
    if (modal) ro?.observe(modal);
    ro?.observe(el);
    window.addEventListener('resize', later);
    window.addEventListener('scroll', later, true);
    return () => {
      if (timer) clearTimeout(timer);
      ro?.disconnect();
      window.removeEventListener('resize', later);
      window.removeEventListener('scroll', later, true);
    };
  }, [topEl, n, sig, tab, box]);
  return place;
}

/**
 * Notifications. They never cover controls: the toast itself lets clicks through to whatever is
 * underneath (only its own buttons take clicks), while a dialog is open they move beside it, and
 * otherwise they leave their corner when page controls lie under it.
 */
export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);
  const restoredAt = useUi((s) => s.restoredAt);
  const setRestoredAt = useUi((s) => s.setRestoredAt);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!restoredAt) return;
    const t = setTimeout(() => setRestoredAt(null), 12000);
    return () => clearTimeout(t);
  }, [restoredAt, setRestoredAt]);
  const shown = toasts.slice(-3);
  const place = useToastPlacement(box, shown.length + (restoredAt ? 1 : 0), shown.map((t) => t.id).join(','));
  return (
    <div ref={box} className={`toasts ${place ? 'toasts-by-modal' : ''} ${place?.passive ? 'toasts-passive' : ''}`} style={place?.style} role="status" aria-live="polite">
      {restoredAt ? (
        <div className="toast toast-info">
          <Icon name="info" size={15} />
          <span className="toast-text">Restored your last session from {formatDateTime(restoredAt)}.</span>
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
      {shown.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`} role={t.tone === 'error' ? 'alert' : undefined}>
          <Icon name={t.tone === 'error' || t.tone === 'warning' ? 'warn' : t.tone === 'success' ? 'check' : 'info'} size={15} />
          <span className="toast-text">{t.text}</span>
          {t.action ? (
            <button
              type="button"
              className="btn btn-sm toast-action"
              onClick={() => {
                dismiss(t.id);
                t.action!.run();
              }}
            >
              {t.action.label}
            </button>
          ) : null}
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
