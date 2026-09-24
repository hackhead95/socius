// Variable View: the SPSS dictionary as an editable table (one row per variable).
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../../core/store';
import type { Alignment, Dataset, MeasureLevel, Variable, VarRole } from '../../core/types';
import { isDateFormat, validateVarName } from '../../core/data';
import { useUi } from '../../app/ui-store';
import { Icon } from '../../ui/Icon';
import { MeasureIcon, measureKind } from '../../ui/MeasureIcon';
import { ContextMenu, type MenuItem } from '../../ui/Menu';
import { changeType, duplicateVariables, formatWith, newDefaultVariable } from './mutations';
import { CopyPropertiesDialog, describeMissing, describeValueLabels, MissingDialog, TypeDialog, typeName, ValueLabelsDialog } from './VarDialogs';

type ColKey = 'name' | 'type' | 'width' | 'decimals' | 'label' | 'values' | 'missing' | 'columns' | 'align' | 'measure' | 'role';

const COLS: Array<{ key: ColKey; label: string; w: number; kind: 'text' | 'num' | 'dialog' | 'select' }> = [
  { key: 'name', label: 'Name', w: 150, kind: 'text' },
  { key: 'type', label: 'Type', w: 104, kind: 'dialog' },
  { key: 'width', label: 'Width', w: 66, kind: 'num' },
  { key: 'decimals', label: 'Decimals', w: 76, kind: 'num' },
  { key: 'label', label: 'Label', w: 300, kind: 'text' },
  { key: 'values', label: 'Values', w: 200, kind: 'dialog' },
  { key: 'missing', label: 'Missing', w: 130, kind: 'dialog' },
  { key: 'columns', label: 'Columns', w: 76, kind: 'num' },
  { key: 'align', label: 'Align', w: 86, kind: 'select' },
  { key: 'measure', label: 'Measure', w: 118, kind: 'select' },
  { key: 'role', label: 'Role', w: 96, kind: 'select' },
];
const ROW_H = 30;
const NUM_W = 48;

const SELECT_OPTIONS: Record<'align' | 'measure' | 'role', Array<{ value: string; label: string }>> = {
  align: [
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'center', label: 'Center' },
  ],
  measure: [
    { value: 'scale', label: 'Scale' },
    { value: 'ordinal', label: 'Ordinal' },
    { value: 'nominal', label: 'Nominal' },
  ],
  role: [
    { value: 'input', label: 'Input' },
    { value: 'target', label: 'Target' },
    { value: 'both', label: 'Both' },
    { value: 'none', label: 'None' },
    { value: 'partition', label: 'Partition' },
    { value: 'split', label: 'Split' },
  ],
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function VariableView() {
  const ds = useStore((s) => s.dataset);
  if (!ds) return null;
  return <VariableViewInner ds={ds} />;
}

type DialogState = { kind: 'type' | 'values' | 'missing'; varId: string } | { kind: 'copy'; varId: string | null } | null;

function VariableViewInner({ ds }: { ds: Dataset }) {
  const mutate = useStore((s) => s.mutateDataset);
  const updateVariable = useStore((s) => s.updateVariable);
  const toast = useStore((s) => s.toast);
  const setTab = useStore((s) => s.setTab);
  const focusGrid = useUi((s) => s.focusGrid);
  const target = useUi((s) => s.varViewTarget);
  const [active, setActive] = useState({ r: 0, c: 0 });
  const [selRows, setSelRows] = useState<Set<string>>(new Set());
  const [anchor, setAnchor] = useState(0);
  type Editing = { r: number; c: number; text: string; error: string | null; typed?: boolean };
  const [editing, setEditingState] = useState<Editing | null>(null);
  const editRef = useRef<Editing | null>(null);
  const setEditing = (e: Editing | null) => {
    editRef.current = e;
    setEditingState(e);
  };
  const [dialog, setDialog] = useState<DialogState>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  const n = ds.variables.length;
  const rowCount = n + 1; // ghost row adds a variable
  const rowV = useVirtualizer({ count: rowCount, getScrollElement: () => scrollRef.current, estimateSize: () => ROW_H, overscan: 10, paddingStart: ROW_H, scrollPaddingStart: ROW_H });
  const totalW = NUM_W + COLS.reduce((s, c) => s + c.w, 0);

  useEffect(() => {
    if (!target) return;
    const i = ds.variables.findIndex((v) => v.id === target.varId);
    if (i < 0) return;
    setActive({ r: i, c: 0 });
    setSelRows(new Set([target.varId!]));
    setAnchor(i);
    requestAnimationFrame(() => {
      rowV.scrollToIndex(i, { align: 'center' });
      scrollRef.current?.focus({ preventScroll: true });
    });
  }, [target?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (active.r > n) setActive({ r: n, c: active.c });
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
      if (inputRef.current instanceof HTMLInputElement) {
        if (editing.typed) {
          const n = inputRef.current.value.length;
          inputRef.current.setSelectionRange(n, n);
        } else inputRef.current.select();
      }
    }
  }, [editing?.r, editing?.c]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIds = (): string[] => {
    const ids = ds.variables.filter((v) => selRows.has(v.id)).map((v) => v.id);
    if (ids.length) return ids;
    const v = ds.variables[active.r];
    return v ? [v.id] : [];
  };

  const focusGridEl = () => requestAnimationFrame(() => scrollRef.current?.focus({ preventScroll: true }));

  const move = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(rowCount - 1, r));
    const cc = Math.max(0, Math.min(COLS.length - 1, c));
    setActive({ r: rr, c: cc });
    rowV.scrollToIndex(rr, { align: 'auto' });
    const el = scrollRef.current;
    if (el) {
      let x = NUM_W;
      for (let i = 0; i < cc; i++) x += COLS[i].w;
      if (x < el.scrollLeft + NUM_W) el.scrollLeft = x - NUM_W;
      else if (x + COLS[cc].w > el.scrollLeft + el.clientWidth) el.scrollLeft = x + COLS[cc].w - el.clientWidth;
    }
  };

  const addVariableAt = (index: number) => {
    const v = newDefaultVariable(ds);
    useStore.getState().addVariable(v, undefined, index);
    setActive({ r: index, c: 0 });
    setSelRows(new Set([v.id]));
    setEditing({ r: index, c: 0, text: v.name, error: null });
  };

  const startEdit = (r: number, c: number, initial?: string) => {
    if (r >= n) {
      addVariableAt(n);
      return;
    }
    const v = ds.variables[r];
    const col = COLS[c];
    if (col.kind === 'dialog') {
      setDialog({ kind: col.key as 'type' | 'values' | 'missing', varId: v.id });
      return;
    }
    if ((col.key === 'decimals' && (v.type === 'string' || isDateFormat(v.format))) || (col.key === 'width' && isDateFormat(v.format))) {
      setDialog({ kind: 'type', varId: v.id });
      return;
    }
    const cur = cellValue(v, col.key);
    setEditing({ r, c, text: initial ?? cur, error: null, typed: initial !== undefined });
  };

  function cellValue(v: Variable, key: ColKey): string {
    switch (key) {
      case 'name': return v.name;
      case 'label': return v.label;
      case 'width': return String(v.width);
      case 'decimals': return String(v.decimals);
      case 'columns': return String(v.columns);
      case 'align': return v.align;
      case 'measure': return v.measure;
      case 'role': return v.role;
      default: return '';
    }
  }

  const commit = (dr: number, dc: number, valueOverride?: string): boolean => {
    const editing = editRef.current;
    if (!editing) return true;
    const v = ds.variables[editing.r];
    const col = COLS[editing.c];
    const text = (valueOverride ?? editing.text).trim();
    const fail = (msg: string) => {
      setEditing({ ...editing, error: msg });
      return false;
    };
    if (v) {
      const many = selRows.has(v.id) && selRows.size > 1 ? ds.variables.filter((x) => selRows.has(x.id)) : [v];
      switch (col.key) {
        case 'name': {
          if (text !== v.name) {
            const err = validateVarName(ds, text, v.id);
            if (err) return fail(err);
            updateVariable(v.id, { name: text });
          }
          break;
        }
        case 'label':
          if ((valueOverride ?? editing.text) !== v.label) updateVariable(v.id, { label: (valueOverride ?? editing.text).slice(0, 255) });
          break;
        case 'width': {
          const w = Math.round(Number(text));
          if (v.type === 'string') {
            if (!(w >= 1 && w <= 32767)) return fail('Text width must be between 1 and 32767.');
            if (w !== v.width) mutate((cur) => changeType(cur, v.id, 'string', `A${w}`, w, 0));
          } else {
            if (!(w >= 1 && w <= 40)) return fail('Width must be between 1 and 40.');
            if (v.decimals >= w) return fail(`Width must be larger than the ${v.decimals} decimals.`);
            if (w !== v.width) updateVariable(v.id, { width: w, format: formatWith(v, w, v.decimals) });
          }
          break;
        }
        case 'decimals': {
          const d = Math.round(Number(text));
          if (!(d >= 0 && d <= 16) || text === '') return fail('Decimals must be between 0 and 16.');
          if (d >= v.width) return fail(`Decimals must be smaller than the width (${v.width}).`);
          if (d !== v.decimals) updateVariable(v.id, { decimals: d, format: formatWith(v, v.width, d) });
          break;
        }
        case 'columns': {
          const k = Math.round(Number(text));
          if (!(k >= 1 && k <= 255)) return fail('Columns must be between 1 and 255.');
          if (many.length > 1) mutate((cur) => ({ ...cur, variables: cur.variables.map((x) => (selRows.has(x.id) ? { ...x, columns: k } : x)), version: cur.version + 1 }));
          else if (k !== v.columns) updateVariable(v.id, { columns: k });
          break;
        }
        case 'align':
        case 'measure':
        case 'role': {
          const key = col.key;
          if (many.length > 1) {
            mutate((cur) => ({
              ...cur,
              variables: cur.variables.map((x) => (selRows.has(x.id) && !(key === 'measure' && x.type === 'string' && text === 'scale') ? { ...x, [key]: text } : x)),
              version: cur.version + 1,
            }));
          } else if (text !== cellValue(v, key)) {
            if (key === 'measure' && v.type === 'string' && text === 'scale') return fail('Text variables cannot be Scale.');
            const patch: Partial<Variable> = key === 'align' ? { align: text as Alignment } : key === 'measure' ? { measure: text as MeasureLevel } : { role: text as VarRole };
            updateVariable(v.id, patch);
          }
          break;
        }
      }
    }
    const { r, c } = editing;
    setEditing(null);
    scrollRef.current?.focus({ preventScroll: true });
    move(r + dr, c + dc);
    return true;
  };

  const onEditKey = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(e.shiftKey ? -1 : 1, 0);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commit(0, e.shiftKey ? -1 : 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditing(null);
      scrollRef.current?.focus({ preventScroll: true });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing || dialog) return;
    const { r, c } = active;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); move(r + 1, c); return;
      case 'ArrowUp': e.preventDefault(); move(r - 1, c); return;
      case 'ArrowRight': e.preventDefault(); move(r, c + 1); return;
      case 'ArrowLeft': e.preventDefault(); move(r, c - 1); return;
      case 'Tab': e.preventDefault(); move(r, c + (e.shiftKey ? -1 : 1)); return;
      case 'Home': e.preventDefault(); move(e.ctrlKey ? 0 : r, 0); return;
      case 'End': e.preventDefault(); move(e.ctrlKey ? n - 1 : r, COLS.length - 1); return;
      case 'PageDown': e.preventDefault(); move(r + 15, c); return;
      case 'PageUp': e.preventDefault(); move(r - 15, c); return;
      case 'Enter':
      case 'F2':
      case ' ':
        e.preventDefault();
        startEdit(r, c);
        return;
      case 'Delete':
        if (selRows.size) {
          e.preventDefault();
          deleteSelected();
        }
        return;
    }
    if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1 && r < n && (COLS[c].kind === 'text' || COLS[c].kind === 'num')) {
      e.preventDefault();
      startEdit(r, c, e.key);
    }
  };

  // ---------- row operations ----------

  const deleteSelected = () => {
    const ids = selectedIds();
    if (!ids.length) return;
    useStore.getState().deleteVariables(ids);
    setSelRows(new Set());
    toast(`Deleted ${ids.length} variable${ids.length === 1 ? '' : 's'}. Press Ctrl+Z to undo.`, 'info');
  };
  const duplicate = () => {
    const ids = selectedIds();
    if (!ids.length) return;
    mutate((cur) => duplicateVariables(cur, ids));
    toast(`Duplicated ${ids.length} variable${ids.length === 1 ? '' : 's'}.`, 'success');
  };
  const moveSelected = (dir: -1 | 1) => {
    const ids = selectedIds();
    if (!ids.length) return;
    mutate((cur) => {
      const vars = cur.variables.slice();
      const set = new Set(ids);
      const idxs = vars.map((v, i) => (set.has(v.id) ? i : -1)).filter((i) => i >= 0);
      if (dir < 0 ? idxs[0] === 0 : idxs[idxs.length - 1] === vars.length - 1) return cur;
      const order = dir < 0 ? idxs : idxs.slice().reverse();
      for (const i of order) {
        const j = i + dir;
        [vars[i], vars[j]] = [vars[j], vars[i]];
      }
      return { ...cur, variables: vars, version: cur.version + 1 };
    });
    setActive((a) => ({ r: Math.max(0, Math.min(n - 1, a.r + dir)), c: a.c }));
  };
  const moveTo = (from: number, to: number) => {
    const v = ds.variables[from];
    if (!v || from === to || from + 1 === to) return;
    useStore.getState().moveVariable(v.id, to > from ? to - 1 : to);
  };

  const onRowNumClick = (e: React.MouseEvent, i: number) => {
    const v = ds.variables[i];
    if (!v) return;
    if (e.shiftKey) {
      const [a, b] = [Math.min(anchor, i), Math.max(anchor, i)];
      setSelRows(new Set(ds.variables.slice(a, b + 1).map((x) => x.id)));
    } else if (e.ctrlKey || e.metaKey) {
      const next = new Set(selRows);
      if (next.has(v.id)) next.delete(v.id);
      else next.add(v.id);
      setSelRows(next);
      setAnchor(i);
    } else {
      setSelRows(new Set([v.id]));
      setAnchor(i);
    }
    setActive({ r: i, c: active.c });
  };

  const onCellMouseDown = (e: React.MouseEvent, r: number, c: number) => {
    if (e.button !== 0) return;
    const ed = editRef.current;
    if (ed && !(ed.r === r && ed.c === c)) {
      if (!commit(0, 0)) return;
    }
    const wasActive = active.r === r && active.c === c;
    setActive({ r, c });
    if (r < n && !selRows.has(ds.variables[r].id) && !e.shiftKey && !e.ctrlKey && !e.metaKey) setSelRows(new Set());
    if (r >= n) {
      e.preventDefault();
      addVariableAt(n);
      return;
    }
    const col = COLS[c];
    if (col.kind === 'select' || (wasActive && col.kind !== 'dialog')) {
      e.preventDefault();
      startEdit(r, c);
    }
  };

  const nSel = selectedIds().length;
  const curVar = ds.variables[active.r];

  const menuItems: MenuItem[] = [
    { id: 'ins', label: 'Insert variable above', onSelect: () => addVariableAt(Math.min(active.r, n)) },
    { id: 'dup', label: nSel > 1 ? `Duplicate ${nSel} variables` : 'Duplicate', disabled: !nSel, onSelect: duplicate },
    { id: 'copyp', label: 'Copy variable properties...', disabled: !curVar, onSelect: () => setDialog({ kind: 'copy', varId: curVar?.id ?? null }) },
    { id: 'up', label: 'Move up', separator: true, disabled: !nSel, onSelect: () => moveSelected(-1) },
    { id: 'down', label: 'Move down', disabled: !nSel, onSelect: () => moveSelected(1) },
    { id: 'goto', label: 'Show in Data View', separator: true, disabled: !curVar, onSelect: () => { if (curVar) { focusGrid({ varId: curVar.id }); setTab('data'); } } },
    { id: 'del', label: nSel > 1 ? `Delete ${nSel} variables` : 'Delete variable', separator: true, danger: true, disabled: !nSel, onSelect: deleteSelected },
  ];

  const dialogVar = dialog && dialog.kind !== 'copy' ? ds.variables.find((v) => v.id === dialog.varId) : null;

  return (
    <div className="varview">
      <div className="view-toolbar" role="toolbar" aria-label="Variable View tools">
        <button type="button" className="btn btn-sm" onClick={() => addVariableAt(n)}><Icon name="plus" size={14} /> Add variable</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => addVariableAt(Math.min(active.r, n))} title="Insert a new variable above the selected one"><Icon name="insertRow" size={14} /> <span className="hide-narrow">Insert</span></button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={duplicate} disabled={!nSel}><Icon name="copy" size={14} /> <span className="hide-narrow">Duplicate</span></button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={deleteSelected} disabled={!nSel}><Icon name="trash" size={14} /> <span className="hide-narrow">Delete</span></button>
        <span className="toolbar-sep" />
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => moveSelected(-1)} disabled={!nSel} aria-label="Move up" title="Move up"><Icon name="up" size={15} /></button>
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => moveSelected(1)} disabled={!nSel} aria-label="Move down" title="Move down"><Icon name="down" size={15} /></button>
        <span className="toolbar-sep" />
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setDialog({ kind: 'copy', varId: curVar?.id ?? null })} disabled={!n} title="Copy value labels, missing values or measure to other variables">
          <Icon name="copy" size={14} /> Copy properties
        </button>
        <span className="spacer" />
        <span className="toolbar-status">{n} variable{n === 1 ? '' : 's'}{selRows.size > 1 ? ` · ${selRows.size} selected` : ''}</span>
      </div>
      <div
        ref={scrollRef}
        className="vv-scroll"
        tabIndex={0}
        role="grid"
        aria-label="Variable View"
        aria-rowcount={rowCount + 1}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => {
          const el = (e.target as HTMLElement).closest<HTMLElement>('[data-vr]');
          if (!el) return;
          e.preventDefault();
          const r = Number(el.dataset.vr);
          if (r < n && !selRows.has(ds.variables[r].id)) {
            setSelRows(new Set([ds.variables[r].id]));
            setActive({ r, c: active.c });
          }
          setMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div style={{ height: rowV.getTotalSize(), width: totalW, position: 'relative' }}>
          <div className="vv-head" style={{ width: totalW, height: ROW_H }} role="row">
            <div className="vv-num vv-hcell" style={{ width: NUM_W }} />
            {COLS.map((c) => (
              <div key={c.key} className="vv-hcell" role="columnheader" style={{ width: c.w }}>{c.label}</div>
            ))}
          </div>
          {rowV.getVirtualItems().map((vr) => {
            const r = vr.index;
            const v = ds.variables[r];
            if (!v)
              return (
                <div key="ghost" className="vv-row vv-ghost" style={{ top: vr.start, height: ROW_H, width: totalW }} role="row" data-vr={r}>
                  <div className="vv-num" style={{ width: NUM_W }} />
                  <div className={`vv-cell ${active.r === r ? 'active' : ''}`} style={{ width: COLS[0].w + COLS[1].w + COLS[2].w }} onMouseDown={(e) => onCellMouseDown(e, r, 0)}>
                    <Icon name="plus" size={13} /> Add a variable
                  </div>
                </div>
              );
            const sel = selRows.has(v.id);
            return (
              <div
                key={v.id}
                className={`vv-row ${sel ? 'is-sel' : ''} ${dropAt === r ? 'drop-before' : ''}`}
                style={{ top: vr.start, height: ROW_H, width: totalW }}
                role="row"
                data-vr={r}
                onDragOver={(e) => {
                  if (dragFrom === null) return;
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  setDropAt(e.clientY > rect.top + rect.height / 2 ? r + 1 : r);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFrom !== null && dropAt !== null) moveTo(dragFrom, dropAt);
                  setDragFrom(null);
                  setDropAt(null);
                }}
              >
                <div
                  className="vv-num num"
                  style={{ width: NUM_W }}
                  draggable
                  onDragStart={(e) => {
                    setDragFrom(r);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', v.name);
                  }}
                  onDragEnd={() => {
                    setDragFrom(null);
                    setDropAt(null);
                  }}
                  onClick={(e) => onRowNumClick(e, r)}
                  title="Click to select, drag to reorder"
                >
                  {r + 1}
                </div>
                {COLS.map((col, c) => {
                  const isActive = active.r === r && active.c === c;
                  const isEditing = editing && editing.r === r && editing.c === c;
                  const disabled = (col.key === 'decimals' && (v.type === 'string' || isDateFormat(v.format)));
                  return (
                    <div
                      key={col.key}
                      className={`vv-cell vv-${col.key} ${isActive ? 'active' : ''} ${disabled ? 'vv-disabled' : ''} ${col.kind === 'num' ? 'num' : ''}`}
                      style={{ width: col.w }}
                      role="gridcell"
                      onMouseDown={(e) => onCellMouseDown(e, r, c)}
                      onDoubleClick={() => startEdit(r, c)}
                    >
                      {isEditing ? (
                        col.kind === 'select' ? (
                          <select
                            ref={(el) => { inputRef.current = el; }}
                            className="vv-input"
                            value={editing.text}
                            aria-label={`${col.label} of ${v.name}`}
                            onChange={(e) => commit(0, 0, e.target.value)}
                            onKeyDown={onEditKey}
                            onBlur={() => editRef.current && setEditing(null)}
                          >
                            {SELECT_OPTIONS[col.key as 'align' | 'measure' | 'role'].map((o) => (
                              <option key={o.value} value={o.value} disabled={col.key === 'measure' && v.type === 'string' && o.value === 'scale'}>{o.label}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <input
                              ref={(el) => { inputRef.current = el; }}
                              className={`vv-input ${col.key === 'name' ? 'mono' : ''} ${editing.error ? 'has-error' : ''}`}
                              value={editing.text}
                              aria-label={`${col.label} of ${v.name}`}
                              aria-invalid={!!editing.error}
                              inputMode={col.kind === 'num' ? 'numeric' : undefined}
                              onChange={(e) => setEditing({ ...editing, text: e.target.value, error: null })}
                              onKeyDown={onEditKey}
                              onBlur={() => editRef.current && !editRef.current.error && commit(0, 0)}
                            />
                            {editing.error ? <div className="vv-error" role="alert">{editing.error}</div> : null}
                          </>
                        )
                      ) : (
                        <CellDisplay v={v} k={col.key} onOpen={() => startEdit(r, c)} />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} label="Variable actions" /> : null}
      {dialog?.kind === 'type' && dialogVar ? <TypeDialog ds={ds} v={dialogVar} onClose={() => { setDialog(null); focusGridEl(); }} /> : null}
      {dialog?.kind === 'values' && dialogVar ? <ValueLabelsDialog v={dialogVar} onClose={() => { setDialog(null); focusGridEl(); }} /> : null}
      {dialog?.kind === 'missing' && dialogVar ? <MissingDialog v={dialogVar} onClose={() => { setDialog(null); focusGridEl(); }} /> : null}
      {dialog?.kind === 'copy' ? <CopyPropertiesDialog ds={ds} sourceId={dialog.varId} onClose={() => { setDialog(null); focusGridEl(); }} /> : null}
    </div>
  );
}

function CellDisplay({ v, k, onOpen }: { v: Variable; k: ColKey; onOpen: () => void }) {
  switch (k) {
    case 'name':
      return <span className="mono vv-text">{v.name}</span>;
    case 'type':
      return <DialogCell text={typeName(v)} onOpen={onOpen} label={`Change type of ${v.name}`} />;
    case 'width':
      return <span className="vv-text">{v.width}</span>;
    case 'decimals':
      return <span className="vv-text">{v.type === 'string' || isDateFormat(v.format) ? '' : v.decimals}</span>;
    case 'label':
      return <span className="vv-text" title={v.label}>{v.label}</span>;
    case 'values':
      return <DialogCell text={describeValueLabels(v)} muted={!v.valueLabels.length} onOpen={onOpen} label={`Edit value labels of ${v.name}`} />;
    case 'missing':
      return <DialogCell text={describeMissing(v)} muted={!v.missing.discrete.length && !v.missing.range} onOpen={onOpen} label={`Edit missing values of ${v.name}`} />;
    case 'columns':
      return <span className="vv-text">{v.columns}</span>;
    case 'align':
      return <span className="vv-text">{cap(v.align)}</span>;
    case 'measure':
      return (
        <span className="vv-text vv-measure-val">
          <MeasureIcon kind={measureKind(v)} size={13} /> {cap(v.measure)}
        </span>
      );
    case 'role':
      return <span className="vv-text">{cap(v.role)}</span>;
  }
}

function DialogCell({ text, muted, onOpen, label }: { text: string; muted?: boolean; onOpen: () => void; label: string }) {
  return (
    <>
      <span className={`vv-text ${muted ? 'faint' : ''}`} title={text}>{text}</span>
      <button
        type="button"
        className="vv-dots"
        tabIndex={-1}
        aria-label={label}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }}
      >
        <Icon name="more" size={14} />
      </button>
    </>
  );
}
