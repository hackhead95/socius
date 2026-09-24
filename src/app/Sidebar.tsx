// Collapsible variable list: search, measure icons, click to select in the grid, double-click
// to open in Variable View.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../core/store';
import type { Variable } from '../core/types';
import { VarMeasureIcon } from '../ui/MeasureIcon';
import { Icon } from '../ui/Icon';
import { useNarrow, useUi } from './ui-store';

export function Sidebar() {
  const ds = useStore((s) => s.dataset);
  const open = useUi((s) => s.sidebarOpen);
  const setOpen = useUi((s) => s.setSidebarOpen);
  const narrow = useNarrow();
  const drawerOpen = useUi((s) => s.drawerOpen);
  const setDrawerOpen = useUi((s) => s.setDrawerOpen);
  const [q, setQ] = useState('');
  const vars = useMemo(() => {
    if (!ds) return [];
    const t = q.trim().toLowerCase();
    return t ? ds.variables.filter((v) => v.name.toLowerCase().includes(t) || v.label.toLowerCase().includes(t)) : ds.variables;
  }, [ds, q]);

  if (!ds) return null;
  // Narrow windows: an overlay drawer, opened from View > Variable list.
  if (narrow) return drawerOpen ? <VariableDrawer onClose={() => setDrawerOpen(false)} /> : null;
  if (!open)
    return (
      <aside className="sidebar sidebar-collapsed" aria-label="Variables">
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setOpen(true)} aria-label="Show variable list" title="Show variable list">
          <Icon name="sidebar" />
        </button>
      </aside>
    );

  return (
    <aside className="sidebar" aria-label="Variables">
      <VariableList q={q} setQ={setQ} vars={vars} onHide={() => setOpen(false)} hideLabel="Hide variable list" />
    </aside>
  );
}

/** The narrow-window variable list: a drawer over the data. Escape, a click outside or choosing a variable closes it. */
function VariableDrawer({ onClose }: { onClose: () => void }) {
  const ds = useStore((s) => s.dataset);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const vars = useMemo(() => {
    if (!ds) return [];
    const t = q.trim().toLowerCase();
    return t ? ds.variables.filter((v) => v.name.toLowerCase().includes(t) || v.label.toLowerCase().includes(t)) : ds.variables;
  }, [ds, q]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    const down = (e: PointerEvent) => {
      const t = e.target as Element | null;
      // The top bar and menus are not "outside": View > Variable list there toggles the drawer itself.
      if (!ref.current?.contains(t) && !t?.closest?.('.topbar, .menu-sheet, .sheet-backdrop, .modal-backdrop')) closeRef.current();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.modal')) {
        e.preventDefault();
        closeRef.current();
      }
    };
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('keydown', key);
      // Focus was in the drawer (now gone): it goes back to where it was before.
      if (document.activeElement === document.body && prev && prev.isConnected && prev !== document.body) prev.focus({ preventScroll: true });
      // Leaving the data views (the list shows with them) closes the drawer for good.
      useUi.getState().setDrawerOpen(false);
    };
  }, []);
  if (!ds) return null;
  return (
    <>
      <div className="sidebar-drawer-backdrop" aria-hidden="true" />
      <aside ref={ref} className="sidebar sidebar-drawer" aria-label="Variables">
        <VariableList q={q} setQ={setQ} vars={vars} onHide={onClose} hideLabel="Close variable list" onChosen={onClose} />
      </aside>
    </>
  );
}

function VariableList({ q, setQ, vars, onHide, hideLabel, onChosen }: { q: string; setQ: (q: string) => void; vars: Variable[]; onHide: () => void; hideLabel: string; onChosen?: () => void }) {
  const ds = useStore((s) => s.dataset)!;
  const setTab = useStore((s) => s.setTab);
  const tab = useStore((s) => s.tab);
  const current = useUi((s) => s.currentVarId);
  const focusGrid = useUi((s) => s.focusGrid);
  const focusVariableView = useUi((s) => s.focusVariableView);
  return (
    <>
      <div className="sidebar-head">
        <span className="eyebrow">Variables</span>
        <span className="faint num" style={{ fontSize: 'var(--fs-xs)' }}>{vars.length === ds.variables.length ? ds.variables.length : `${vars.length} of ${ds.variables.length}`}</span>
        <span className="spacer" />
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={onHide} aria-label={hideLabel} title={hideLabel}>
          <Icon name={onChosen ? 'x' : 'sidebar'} size={15} />
        </button>
      </div>
      <div className="varpicker-search sidebar-search">
        <Icon name="search" size={14} />
        <input className="varpicker-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or label" aria-label="Search variables" />
        {q ? <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setQ('')} aria-label="Clear search"><Icon name="x" size={12} /></button> : null}
      </div>
      <div className="sidebar-list" role="listbox" aria-label="Variable list">
        {vars.map((v) => (
          <button
            key={v.id}
            type="button"
            role="option"
            aria-selected={current === v.id}
            className={`sidebar-var ${current === v.id ? 'on' : ''}`}
            title={`${v.name}${v.label ? `: ${v.label}` : ''}\nClick: show in Data View. Double-click: edit in Variable View.`}
            onClick={() => {
              if (tab === 'variables') focusVariableView(v.id);
              else {
                focusGrid({ varId: v.id });
                if (tab !== 'data') setTab('data');
              }
              onChosen?.();
            }}
            onDoubleClick={() => {
              focusVariableView(v.id);
              setTab('variables');
            }}
          >
            <VarMeasureIcon v={v} />
            <span className="sidebar-var-text">
              <span className="sidebar-var-name mono">{v.name}{ds.weightVarId === v.id ? <span className="badge sidebar-tag">weight</span> : null}{ds.filterVarId === v.id ? <span className="badge sidebar-tag">filter</span> : null}</span>
              {v.label ? <span className="sidebar-var-label">{v.label}</span> : null}
            </span>
          </button>
        ))}
        {!vars.length ? <div className="help" style={{ padding: 12 }}>{ds.variables.length ? 'No variable matches.' : 'No variables yet.'}</div> : null}
      </div>
    </>
  );
}
