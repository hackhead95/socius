// Virtualised Data View grid (rows AND columns), SPSS-style: sticky variable-name header, sticky
// case numbers (struck through when filtered out), keyboard navigation, type-to-edit, value-label
// dropdown, TSV copy/paste, and one extra "ghost" row and column for adding data.
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Dataset, Variable } from '../../core/types';
import { activeCaseMask, formatCell, formatRawValue, isUserMissing } from '../../core/data';
import { editText, parseCellInput } from './gridEdit';
import { MeasureIcon, measureKind } from '../../ui/MeasureIcon';

export const ROW_H = 26;
export const HEAD_H = 30;
const GHOST_W = 76;

export interface Sel {
  r: number;
  c: number;
  ar: number;
  ac: number;
}

export interface Rect {
  r0: number;
  r1: number;
  c0: number;
  c1: number;
}

export function selRect(s: Sel): Rect {
  return { r0: Math.min(s.r, s.ar), r1: Math.max(s.r, s.ar), c0: Math.min(s.c, s.ac), c1: Math.max(s.c, s.ac) };
}

export function colWidth(v: Variable): number {
  const byColumns = v.columns * 7.6 + 22;
  const byName = v.name.length * 7.4 + 38;
  return Math.max(64, Math.min(420, Math.round(Math.max(byColumns, byName))));
}

export interface EditCommit {
  row: number;
  col: number;
  text: string;
}

interface Props {
  ds: Dataset;
  showLabels: boolean;
  sel: Sel;
  setSel: (s: Sel) => void;
  /** Cell to highlight as a find result. */
  hit: { row: number; col: number } | null;
  onCommit: (c: EditCommit) => boolean | string;
  onClear: (rect: Rect) => void;
  onCopy: (rect: Rect) => string;
  onPaste: (text: string) => void;
  onContextMenu: (kind: 'cell' | 'header' | 'row', x: number, y: number) => void;
  onHeaderDoubleClick: (col: number) => void;
  onFind: () => void;
  /** Bumped from outside to scroll the active cell into view and focus the grid. */
  focusSeq: number;
}

interface EditState {
  row: number;
  col: number;
  text: string;
  error: string | null;
  hi: number;
}

export function DataGrid(props: Props) {
  const { ds, showLabels, sel, setSel, hit } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [edit, setEditState] = useState<EditState | null>(null);
  // Mirror of `edit` for event handlers that may run after a commit in the same tick (blur).
  const editRef = useRef<EditState | null>(null);
  const setEdit = (e: EditState | null) => {
    editRef.current = e;
    setEditState(e);
  };
  const dragging = useRef(false);

  const nVars = ds.variables.length;
  const rowCount = ds.nCases + 1; // ghost row
  const colCount = nVars + 1; // ghost column
  const digits = String(Math.max(ds.nCases + 1, 10)).length;
  const rowNumW = Math.max(52, digits * 8 + 26);

  const widths = useMemo(() => [...ds.variables.map(colWidth), GHOST_W], [ds.variables]);
  const mask = useMemo(() => (ds.filterVarId ? activeCaseMask(ds) : null), [ds.filterVarId, ds.filterVarId ? ds.columns[ds.filterVarId] : null, ds.nCases]); // eslint-disable-line react-hooks/exhaustive-deps

  const rowV = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 6,
    paddingStart: HEAD_H,
    scrollPaddingStart: HEAD_H,
    useFlushSync: false,
  });
  const colV = useVirtualizer({
    horizontal: true,
    count: colCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => widths[i] ?? GHOST_W,
    overscan: 2,
    paddingStart: rowNumW,
    scrollPaddingStart: rowNumW,
    useFlushSync: false,
  });
  useLayoutEffect(() => {
    colV.measure();
  }, [widths, rowNumW]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollTo = useCallback(
    (r: number, c: number) => {
      rowV.scrollToIndex(Math.min(r, rowCount - 1), { align: 'auto' });
      colV.scrollToIndex(Math.min(c, colCount - 1), { align: 'auto' });
    },
    [rowV, colV, rowCount, colCount],
  );

  useEffect(() => {
    if (props.focusSeq > 0) {
      scrollTo(sel.r, sel.c);
      scrollRef.current?.focus({ preventScroll: true });
    }
  }, [props.focusSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  const clampSel = (r: number, c: number) => ({ r: Math.max(0, Math.min(rowCount - 1, r)), c: Math.max(0, Math.min(colCount - 1, c)) });

  const moveTo = (r: number, c: number, extend = false) => {
    const p = clampSel(r, c);
    setSel(extend ? { ...sel, r: p.r, c: p.c } : { r: p.r, c: p.c, ar: p.r, ac: p.c });
    scrollTo(p.r, p.c);
  };

  // ---------- editing ----------

  const startEdit = (row: number, col: number, initial?: string) => {
    if (col > nVars || row > ds.nCases) return;
    let text = initial ?? '';
    if (initial === undefined && col < nVars && row < ds.nCases) {
      const v = ds.variables[col];
      text = editText(v, ds.columns[v.id][row]);
    }
    setEdit({ row, col, text, error: null, hi: -1 });
    scrollTo(row, col);
  };

  useLayoutEffect(() => {
    if (edit && inputRef.current && document.activeElement !== inputRef.current) {
      const el = inputRef.current;
      el.focus({ preventScroll: true });
      const len = el.value.length;
      el.setSelectionRange(len, len);
    }
  }, [edit?.row, edit?.col]); // eslint-disable-line react-hooks/exhaustive-deps

  const editVar = edit && edit.col < nVars ? ds.variables[edit.col] : null;
  const labelOptions = useMemo(() => {
    if (!edit || !editVar || !editVar.valueLabels.length) return [];
    const t = edit.text.trim().toLowerCase();
    const all = editVar.valueLabels;
    if (!t) return all;
    const exact = all.filter((l) => String(l.value).toLowerCase() === t || l.label.toLowerCase() === t);
    if (exact.length && exact.length === all.filter((l) => String(l.value).toLowerCase().startsWith(t) || l.label.toLowerCase().includes(t)).length) return all;
    return all.filter((l) => String(l.value).toLowerCase().startsWith(t) || l.label.toLowerCase().includes(t));
  }, [edit, editVar]);

  const commit = (dr: number, dc: number, textOverride?: string): boolean => {
    const cur = editRef.current;
    if (!cur) return true;
    const text = textOverride ?? cur.text;
    const res = props.onCommit({ row: cur.row, col: cur.col, text });
    if (res !== true) {
      setEdit({ ...cur, error: typeof res === 'string' ? res : 'This value cannot be stored here.' });
      return false;
    }
    const { row, col } = cur;
    setEdit(null);
    scrollRef.current?.focus({ preventScroll: true });
    // Typing in the ghost row/column adds a case/variable, so the grid is one larger now.
    const maxR = rowCount - 1 + (row >= ds.nCases && text.trim() !== '' ? 1 : 0);
    const maxC = colCount - 1 + (col >= nVars && text.trim() !== '' ? 1 : 0);
    const p = { r: Math.max(0, Math.min(maxR, row + dr)), c: Math.max(0, Math.min(maxC, col + dc)) };
    setSel({ r: p.r, c: p.c, ar: p.r, ac: p.c });
    requestAnimationFrame(() => scrollTo(p.r, p.c));
    return true;
  };

  const cancelEdit = () => {
    setEdit(null);
    scrollRef.current?.focus({ preventScroll: true });
  };

  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!edit) return;
    e.stopPropagation();
    const opts = labelOptions;
    if (e.key === 'ArrowDown' && opts.length) {
      e.preventDefault();
      setEdit({ ...edit, hi: Math.min(opts.length - 1, edit.hi + 1) });
      return;
    }
    if (e.key === 'ArrowUp' && opts.length && edit.hi >= 0) {
      e.preventDefault();
      setEdit({ ...edit, hi: edit.hi - 1 });
      return;
    }
    const chosen = edit.hi >= 0 && opts[edit.hi] ? String(opts[edit.hi].value) : undefined;
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(e.shiftKey ? -1 : 1, 0, chosen);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit(0, e.shiftKey ? -1 : 1, chosen);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !opts.length) {
      e.preventDefault();
      commit(e.key === 'ArrowUp' ? -1 : 1, 0);
    }
  };

  // ---------- keyboard (not editing) ----------

  const pageRows = () => Math.max(1, Math.floor(((scrollRef.current?.clientHeight ?? 400) - HEAD_H) / ROW_H) - 1);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (edit) return;
    const mod = e.ctrlKey || e.metaKey;
    const { r, c } = sel;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moveTo(mod ? ds.nCases - 1 : r + 1, c, e.shiftKey); return;
      case 'ArrowUp': e.preventDefault(); moveTo(mod ? 0 : r - 1, c, e.shiftKey); return;
      case 'ArrowRight': e.preventDefault(); moveTo(r, mod ? nVars - 1 : c + 1, e.shiftKey); return;
      case 'ArrowLeft': e.preventDefault(); moveTo(r, mod ? 0 : c - 1, e.shiftKey); return;
      case 'Tab': {
        e.preventDefault();
        if (e.shiftKey) moveTo(c === 0 ? r - 1 : r, c === 0 ? Math.max(0, nVars - 1) : c - 1);
        else moveTo(c >= nVars - 1 && nVars > 0 ? r + 1 : r, c >= nVars - 1 && nVars > 0 ? 0 : c + 1);
        return;
      }
      case 'Enter': e.preventDefault(); moveTo(e.shiftKey ? r - 1 : r + 1, c); return;
      case 'Home': e.preventDefault(); moveTo(mod ? 0 : r, 0, e.shiftKey); return;
      case 'End': e.preventDefault(); moveTo(mod ? Math.max(0, ds.nCases - 1) : r, Math.max(0, nVars - 1), e.shiftKey); return;
      case 'PageDown': e.preventDefault(); moveTo(r + pageRows(), c, e.shiftKey); return;
      case 'PageUp': e.preventDefault(); moveTo(r - pageRows(), c, e.shiftKey); return;
      case 'F2': e.preventDefault(); startEdit(r, c); return;
      case 'Delete':
      case 'Backspace': e.preventDefault(); props.onClear(selRect(sel)); return;
      case 'Escape': setSel({ ...sel, ar: r, ac: c }); return;
    }
    if (mod && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      setSel({ r: 0, c: 0, ar: Math.max(0, ds.nCases - 1), ac: Math.max(0, nVars - 1) });
      return;
    }
    if (mod && (e.key === 'f' || e.key === 'F')) {
      e.preventDefault();
      props.onFind();
      return;
    }
    if (!mod && !e.altKey && e.key.length === 1) {
      e.preventDefault();
      startEdit(r, c, e.key);
    }
  };

  // ---------- mouse ----------

  useEffect(() => {
    const up = () => (dragging.current = false);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  const cellFromEvent = (e: React.MouseEvent): { r: number; c: number; kind: 'cell' | 'header' | 'row' | 'corner' } | null => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-r],[data-hc],[data-rn],[data-corner]');
    if (!el) return null;
    if (el.dataset.corner !== undefined) return { r: 0, c: 0, kind: 'corner' };
    if (el.dataset.hc !== undefined) return { r: -1, c: Number(el.dataset.hc), kind: 'header' };
    if (el.dataset.rn !== undefined) return { r: Number(el.dataset.rn), c: -1, kind: 'row' };
    return { r: Number(el.dataset.r), c: Number(el.dataset.c), kind: 'cell' };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.grid-editor')) return;
    const hitCell = cellFromEvent(e);
    if (!hitCell) return;
    if (editRef.current) {
      if (!commit(0, 0)) return;
    }
    if (e.button === 2) {
      // Right-click inside the selection keeps it; otherwise select the clicked cell first.
      const rect = selRect(sel);
      const inside =
        hitCell.kind === 'cell'
          ? hitCell.r >= rect.r0 && hitCell.r <= rect.r1 && hitCell.c >= rect.c0 && hitCell.c <= rect.c1
          : hitCell.kind === 'header'
            ? rect.r0 === 0 && rect.r1 >= ds.nCases - 1 && hitCell.c >= rect.c0 && hitCell.c <= rect.c1
            : hitCell.kind === 'row' && rect.c0 === 0 && rect.c1 >= nVars - 1 && hitCell.r >= rect.r0 && hitCell.r <= rect.r1;
      if (inside) return;
    }
    const last = Math.max(0, ds.nCases - 1);
    const lastC = Math.max(0, nVars - 1);
    // Whole-column / whole-row selections keep the active cell at the top / left so nothing scrolls.
    if (hitCell.kind === 'corner') setSel({ r: 0, c: 0, ar: last, ac: lastC });
    else if (hitCell.kind === 'header') {
      if (e.shiftKey) setSel({ r: 0, c: hitCell.c, ar: last, ac: sel.ac });
      else setSel({ r: 0, c: hitCell.c, ar: last, ac: hitCell.c });
    } else if (hitCell.kind === 'row') {
      if (e.shiftKey) setSel({ r: hitCell.r, c: 0, ar: sel.ar, ac: lastC });
      else setSel({ r: hitCell.r, c: 0, ar: hitCell.r, ac: lastC });
    } else {
      if (e.shiftKey) setSel({ ...sel, r: hitCell.r, c: hitCell.c });
      else setSel({ r: hitCell.r, c: hitCell.c, ar: hitCell.r, ac: hitCell.c });
      if (e.button === 0) dragging.current = true;
    }
    scrollRef.current?.focus({ preventScroll: true });
  };

  const onMouseOver = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const h = cellFromEvent(e);
    if (h && h.kind === 'cell' && (h.r !== sel.r || h.c !== sel.c)) setSel({ ...sel, r: h.r, c: h.c });
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const h = cellFromEvent(e);
    if (!h) return;
    if (h.kind === 'header') props.onHeaderDoubleClick(h.c);
    else if (h.kind === 'cell') startEdit(h.r, h.c);
  };

  const onContextMenu = (e: React.MouseEvent) => {
    const h = cellFromEvent(e);
    if (!h || h.kind === 'corner') return;
    e.preventDefault();
    props.onContextMenu(h.kind, e.clientX, e.clientY);
  };

  // ---------- clipboard ----------

  const onCopyEvt = (e: React.ClipboardEvent) => {
    if (edit) return;
    e.preventDefault();
    e.clipboardData.setData('text/plain', props.onCopy(selRect(sel)));
  };
  const onPasteEvt = (e: React.ClipboardEvent) => {
    if (edit) return;
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    e.preventDefault();
    props.onPaste(text);
  };

  // ---------- render ----------

  const vRows = rowV.getVirtualItems();
  const vCols = colV.getVirtualItems();
  const rect = selRect(sel);
  const totalW = colV.getTotalSize();
  const totalH = rowV.getTotalSize();
  const colStart = (c: number) => {
    let x = rowNumW;
    for (let i = 0; i < c; i++) x += widths[i];
    return x;
  };

  return (
    <div
      ref={scrollRef}
      className="grid-scroll"
      tabIndex={0}
      role="grid"
      aria-label="Data View"
      aria-rowcount={rowCount}
      aria-colcount={colCount}
      onKeyDown={onKeyDown}
      onMouseDown={onMouseDown}
      onMouseOver={onMouseOver}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onCopy={onCopyEvt}
      onPaste={onPasteEvt}
    >
      <div className="grid-sizer" style={{ width: totalW, height: totalH }}>
        <div className="grid-head" style={{ width: totalW, height: HEAD_H }} role="row">
          <div className="grid-corner" data-corner="" style={{ width: rowNumW, height: HEAD_H }} title="Select all" />
          {vCols.map((vc) => {
            const c = vc.index;
            const v = ds.variables[c];
            const inSel = c >= rect.c0 && c <= rect.c1;
            if (!v)
              return (
                <div key="ghost" className="grid-hcell grid-ghost" data-hc={c} style={{ left: vc.start, width: vc.size, height: HEAD_H }} title="Type in this column to add a variable">
                  var
                </div>
              );
            return (
              <div
                key={v.id}
                role="columnheader"
                className={`grid-hcell ${inSel ? 'in-sel' : ''} ${ds.weightVarId === v.id ? 'is-weight' : ''} ${ds.filterVarId === v.id ? 'is-filter' : ''}`}
                data-hc={c}
                style={{ left: vc.start, width: vc.size, height: HEAD_H }}
                title={`${v.name}${v.label ? `: ${v.label}` : ''}\nDouble-click to edit its properties`}
              >
                <MeasureIcon kind={measureKind(v)} size={12} />
                <span className="grid-hname">{v.name}</span>
              </div>
            );
          })}
        </div>
        {vRows.map((vr) => {
          const r = vr.index;
          const ghost = r >= ds.nCases;
          const off = !ghost && mask ? !mask[r] : false;
          const rowSel = r >= rect.r0 && r <= rect.r1;
          return (
            <div key={r} className={`grid-row ${ghost ? 'grid-ghost-row' : ''}`} style={{ top: vr.start, height: ROW_H, width: totalW }} role="row">
              <div className={`grid-rownum num ${rowSel ? 'in-sel' : ''} ${off ? 'filtered' : ''}`} data-rn={r} style={{ width: rowNumW, height: ROW_H }} title={off ? 'Filtered out (not selected)' : undefined}>
                {ghost ? '' : r + 1}
              </div>
              {vCols.map((vc) => (
                <GridCell
                  key={vc.index}
                  ds={ds}
                  r={r}
                  c={vc.index}
                  left={vc.start}
                  width={vc.size}
                  showLabels={showLabels}
                  selected={rowSel && vc.index >= rect.c0 && vc.index <= rect.c1}
                  active={r === sel.r && vc.index === sel.c}
                  hit={!!hit && hit.row === r && hit.col === vc.index}
                  ghost={ghost || vc.index >= nVars}
                />
              ))}
            </div>
          );
        })}
        {edit ? (
          <div className="grid-editor" style={{ top: HEAD_H + edit.row * ROW_H, left: colStart(edit.col), width: Math.max(widths[edit.col] ?? GHOST_W, 140) }}>
            <input
              ref={inputRef}
              className={`grid-input mono ${edit.error ? 'has-error' : ''}`}
              value={edit.text}
              aria-label={editVar ? `Value of ${editVar.name}, case ${edit.row + 1}` : 'New value'}
              aria-invalid={!!edit.error}
              onChange={(e) => setEdit({ ...edit, text: e.target.value, error: null, hi: -1 })}
              onKeyDown={onEditKey}
              onBlur={(e) => {
                if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest?.('.grid-editor')) return;
                if (editRef.current && !editRef.current.error) commit(0, 0);
              }}
              style={{ textAlign: editVar?.type === 'numeric' ? 'right' : 'left' }}
            />
            {edit.error ? <div className="grid-edit-error" role="alert">{edit.error}</div> : null}
            {!edit.error && labelOptions.length ? (
              <div className="grid-labels" role="listbox" aria-label="Value labels">
                {labelOptions.slice(0, 60).map((l, i) => {
                  const missing = editVar ? isUserMissing(editVar.missing, l.value) : false;
                  return (
                    <button
                      key={String(l.value)}
                      type="button"
                      role="option"
                      aria-selected={i === edit.hi}
                      className={`grid-label-opt ${i === edit.hi ? 'hi' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => commit(1, 0, String(l.value))}
                    >
                      <span className="mono num">{typeof l.value === 'number' ? l.value : `'${l.value}'`}</span>
                      <span>{l.label}</span>
                      {missing ? <span className="badge">missing</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

interface CellProps {
  ds: Dataset;
  r: number;
  c: number;
  left: number;
  width: number;
  showLabels: boolean;
  selected: boolean;
  active: boolean;
  hit: boolean;
  ghost: boolean;
}

const GridCell = memo(function GridCell({ ds, r, c, left, width, showLabels, selected, active, hit, ghost }: CellProps) {
  const cls = `grid-cell ${selected ? 'in-sel' : ''} ${active ? 'active' : ''} ${hit ? 'hit' : ''}`;
  if (ghost) return <div className={`${cls} grid-ghost`} data-r={r} data-c={c} style={{ left, width }} />;
  const v = ds.variables[c];
  const x = ds.columns[v.id][r];
  let text: string;
  let muted = false;
  let labelShown = false;
  if (typeof x === 'number') {
    if (Number.isNaN(x)) text = '';
    else {
      muted = isUserMissing(v.missing, x);
      text = formatCell(v, x, showLabels);
      labelShown = showLabels && v.valueLabels.length > 0 && text !== formatRawValue(v, x);
    }
  } else {
    muted = x !== '' && isUserMissing(v.missing, x);
    text = formatCell(v, x, showLabels);
  }
  const align = labelShown ? 'left' : v.align;
  // The full text on hover when the column is too narrow for it (an estimate: the grid is virtualised,
  // so cells are not measured). User-missing values say so.
  const cut = text.length * (v.type === 'numeric' && !labelShown ? 7.6 : 6.9) > width - 14;
  const title = muted ? `${text} (user-missing value)` : cut ? text : undefined;
  return (
    <div
      className={`${cls} ${v.type === 'numeric' && !labelShown ? 'mono num' : ''} ${muted ? 'user-missing' : ''}`}
      data-r={r}
      data-c={c}
      role="gridcell"
      aria-selected={selected}
      style={{ left, width, textAlign: align }}
      title={title}
    >
      {text}
    </div>
  );
});
