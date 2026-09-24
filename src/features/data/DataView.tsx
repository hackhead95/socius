// Data View: toolbar, virtualised grid, find bar, context menus and quick column statistics.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../core/store';
import type { Dataset } from '../../core/types';
import { activeCaseMask, formatCell, formatRawValue } from '../../core/data';
import { DataGrid, selRect, type EditCommit, type Rect, type Sel } from './DataGrid';
import { parseCellInput, parseTsv, toTsv } from './gridEdit';
import { clearRange, looksLikeHeader, nameVariablesFromHeader, newDefaultVariable, writeTexts } from './mutations';
import { findNext, summarizeColumn, type ColumnSummary } from './find';
import { useUi } from '../../app/ui-store';
import { ContextMenu, type MenuItem } from '../../ui/Menu';
import { Icon } from '../../ui/Icon';
import { sortCases, transformLogItem } from '../../lib/transform';
import { copyToClipboard } from '../../platform/host';

const MAX_COPY_CELLS = 2_000_000;

export function DataView() {
  const ds = useStore((s) => s.dataset);
  if (!ds) return null;
  return <DataViewInner ds={ds} />;
}

function DataViewInner({ ds }: { ds: Dataset }) {
  const showLabels = useStore((s) => s.showValueLabels);
  const setShowLabels = useStore((s) => s.setShowValueLabels);
  const mutate = useStore((s) => s.mutateDataset);
  const toast = useStore((s) => s.toast);
  const [sel, setSelState] = useState<Sel>({ r: 0, c: 0, ar: 0, ac: 0 });
  const [focusSeq, setFocusSeq] = useState(0);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const [findOpen, setFindOpen] = useState(false);
  const [hit, setHit] = useState<{ row: number; col: number } | null>(null);
  const [stats, setStats] = useState<{ col: number; summary: ColumnSummary } | null>(null);
  const [gotoOpen, setGotoOpen] = useState(false);
  const gridTarget = useUi((s) => s.gridTarget);
  const findSeq = useUi((s) => s.findSeq);
  const gotoSeq = useUi((s) => s.gotoSeq);
  const setCurrentVarId = useUi((s) => s.setCurrentVarId);
  const focusVariableView = useUi((s) => s.focusVariableView);
  const setTab = useStore((s) => s.setTab);

  const nVars = ds.variables.length;
  const setSel = useCallback((s: Sel) => setSelState(s), []);

  // Keep selection inside the grid when the dataset shrinks.
  useEffect(() => {
    setSelState((s) => {
      const maxR = ds.nCases, maxC = ds.variables.length;
      if (s.r <= maxR && s.c <= maxC && s.ar <= maxR && s.ac <= maxC) return s;
      const r = Math.min(s.r, maxR), c = Math.min(s.c, maxC);
      return { r, c, ar: r, ac: c };
    });
  }, [ds.nCases, ds.variables.length]);

  useEffect(() => {
    setCurrentVarId(ds.variables[sel.c]?.id ?? null);
  }, [sel.c, ds.variables, setCurrentVarId]);

  useEffect(() => {
    if (!gridTarget) return;
    const c = gridTarget.varId ? ds.variables.findIndex((v) => v.id === gridTarget.varId) : sel.c;
    const r = gridTarget.row ?? sel.r;
    if (c < 0) return;
    setSelState({ r, c, ar: r, ac: c });
    setFocusSeq((n) => n + 1);
  }, [gridTarget?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (findSeq) setFindOpen(true);
  }, [findSeq]);
  useEffect(() => {
    if (gotoSeq) setGotoOpen(true);
  }, [gotoSeq]);

  const rect = selRect(sel);
  const curVar = ds.variables[sel.c];
  const nActive = useMemo(() => (ds.filterVarId ? activeCaseMask(ds).reduce((a, b) => a + b, 0) : ds.nCases), [ds]);

  // ---------- edits ----------

  const onCommit = ({ row, col, text }: EditCommit): boolean | string => {
    if (col >= nVars || row >= ds.nCases) {
      if (text.trim() === '') return true;
      const rep = writeTexts(ds, [{ row, col: Math.min(col, nVars), text }]);
      if (rep.rejected) {
        const v = ds.variables[col];
        const r = v ? parseCellInput(v, text) : null;
        return r && !r.ok ? r.error : 'This value cannot be stored here.';
      }
      mutate(() => rep.dataset);
      if (rep.addedVars) toast(`Added variable ${rep.dataset.variables[rep.dataset.variables.length - 1].name}. Rename it in Variable View.`, 'info');
      return true;
    }
    const v = ds.variables[col];
    if (v.type === 'string' && text.length > v.width / 3) {
      // Might not fit the declared width: writeTexts widens the variable instead of cutting the text.
      const rep = writeTexts(ds, [{ row, col, text }]);
      if (rep.widened.length) {
        mutate(() => rep.dataset);
        toast(`Widened ${v.name} to ${rep.dataset.variables[col].width} characters so the text fits.`, 'info');
        return true;
      }
    }
    const r = parseCellInput(v, text);
    if (!r.ok) return r.error;
    const old = ds.columns[v.id][row];
    if (Object.is(old, r.value)) return true;
    useStore.getState().setCell(row, v.id, r.value);
    return true;
  };

  const onClear = (r: Rect) => {
    if (r.r0 >= ds.nCases || r.c0 >= nVars) return;
    mutate((d) => clearRange(d, r.r0, r.r1, r.c0, r.c1));
  };

  const copyText = (r: Rect): string => {
    const r1 = Math.min(r.r1, ds.nCases - 1), c1 = Math.min(r.c1, nVars - 1);
    const cells = (r1 - r.r0 + 1) * (c1 - r.c0 + 1);
    if (cells > MAX_COPY_CELLS) {
      toast('That selection is too large to copy. Export the data instead (File > Save data as).', 'warning');
      return '';
    }
    const rows: string[][] = [];
    for (let i = r.r0; i <= r1; i++) {
      const row: string[] = [];
      for (let j = r.c0; j <= c1; j++) {
        const v = ds.variables[j];
        const x = ds.columns[v.id][i];
        row.push(showLabels ? formatCell(v, x, true) : formatRawValue(v, x));
      }
      rows.push(row);
    }
    return toTsv(rows);
  };

  const onPaste = (text: string) => {
    let grid = parseTsv(text.replace(/\n$/, ''));
    if (!grid.length) return;
    // Pasting a table with headings into an empty dataset: the first row names the variables.
    let headings: string[] | null = null;
    if (nVars === 0 && ds.nCases === 0 && looksLikeHeader(grid)) {
      headings = grid[0];
      grid = grid.slice(1);
    }
    const writes: Array<{ row: number; col: number; text: string }> = [];
    const r = selRect(sel);
    if (grid.length === 1 && grid[0].length === 1 && (r.r1 > r.r0 || r.c1 > r.c0)) {
      for (let i = r.r0; i <= Math.min(r.r1, ds.nCases - 1); i++) for (let j = r.c0; j <= Math.min(r.c1, nVars - 1); j++) writes.push({ row: i, col: j, text: grid[0][0] });
    } else {
      grid.forEach((row, i) => row.forEach((t, j) => writes.push({ row: r.r0 + i, col: Math.min(r.c0, nVars) + j, text: t })));
    }
    if (writes.length > 5_000_000) {
      toast('That is too much to paste at once. Open the data as a file instead.', 'warning');
      return;
    }
    const rep = writeTexts(ds, writes);
    const named = headings ? nameVariablesFromHeader(rep.dataset, 0, headings) : rep.dataset;
    mutate(() => named);
    if (headings) toast('The first row was used as variable names.', 'info');
    const parts = [`Pasted ${writes.length.toLocaleString('en-US')} value${writes.length === 1 ? '' : 's'}`];
    if (rep.addedCases) parts.push(`added ${rep.addedCases} case${rep.addedCases === 1 ? '' : 's'}`);
    if (rep.addedVars) parts.push(`added ${rep.addedVars} variable${rep.addedVars === 1 ? '' : 's'}`);
    toast(parts.join(', ') + '.', 'success');
    if (rep.widened.length) toast(`Widened ${rep.widened.join(', ')} so the pasted text fits.`, 'info');
    if (rep.rejected) toast(rep.rejected === 1 ? '1 pasted value did not fit its variable (for example text in a numeric variable) and that cell was left unchanged.' : `${rep.rejected.toLocaleString('en-US')} pasted values did not fit their variables (for example text in a numeric variable) and those cells were left unchanged.`, 'warning');
    const lastR = r.r0 + grid.length - 1, lastC = Math.min(r.c0, nVars) + Math.max(...grid.map((g) => g.length)) - 1;
    setSelState({ r: lastR, c: lastC, ar: r.r0, ac: Math.min(r.c0, nVars) });
  };

  // ---------- actions ----------

  const insertCase = () => {
    const at = Math.min(rect.r0, ds.nCases);
    useStore.getState().insertCases(at, 1);
    setSelState({ r: at, c: sel.c, ar: at, ac: sel.c });
    setFocusSeq((n) => n + 1);
  };
  const selectedCaseRows = () => {
    const rows: number[] = [];
    for (let i = rect.r0; i <= Math.min(rect.r1, ds.nCases - 1); i++) rows.push(i);
    return rows;
  };
  const deleteCases = () => {
    const rows = selectedCaseRows();
    if (!rows.length) return;
    useStore.getState().deleteCases(rows);
    toast(`Deleted ${rows.length.toLocaleString('en-US')} case${rows.length === 1 ? '' : 's'}. Press Ctrl+Z to undo.`, 'info');
    setSelState({ r: rect.r0, c: sel.c, ar: rect.r0, ac: sel.c });
  };
  const insertVariable = () => {
    const at = Math.min(rect.c0, nVars);
    useStore.getState().addVariable(newDefaultVariable(ds), undefined, at);
    setSelState({ r: sel.r, c: at, ar: sel.r, ac: at });
    setFocusSeq((n) => n + 1);
  };
  const selectedVarIds = () => ds.variables.slice(rect.c0, Math.min(rect.c1, nVars - 1) + 1).map((v) => v.id);
  const deleteVariables = () => {
    const ids = selectedVarIds();
    if (!ids.length) return;
    useStore.getState().deleteVariables(ids);
    toast(`Deleted ${ids.length} variable${ids.length === 1 ? '' : 's'}. Press Ctrl+Z to undo.`, 'info');
  };
  const sortBy = (dir: 'asc' | 'desc') => {
    if (!curVar) return;
    const res = sortCases(ds, [{ varId: curVar.id, dir }]);
    mutate(() => res.dataset);
    useStore.getState().addOutput(transformLogItem(res, ds.name), { focus: false });
    toast(res.summary, 'success');
  };
  const showStats = (col = sel.c) => {
    if (col >= nVars) return;
    setStats({ col, summary: summarizeColumn(ds, col) });
  };
  const openProps = (col = sel.c) => {
    const v = ds.variables[col];
    if (!v) return;
    focusVariableView(v.id);
    setTab('variables');
  };
  const copySelection = async () => {
    const t = copyText(rect);
    if (!t) return;
    const ok = await copyToClipboard(t);
    toast(ok ? 'Copied. Paste into Excel, Word or another cell with Ctrl+V.' : 'Copying was blocked here. Select the cells and press Ctrl+C instead.', ok ? 'success' : 'warning');
  };

  const hasCases = ds.nCases > 0;
  const hasVars = nVars > 0;
  const onVar = sel.c < nVars;

  const menuFor = (kind: 'cell' | 'header' | 'row'): MenuItem[] => {
    const nRows = Math.min(rect.r1, ds.nCases - 1) - rect.r0 + 1;
    const nCols = Math.min(rect.c1, nVars - 1) - rect.c0 + 1;
    const caseItems: MenuItem[] = [
      { id: 'ins-case', label: 'Insert case above', onSelect: insertCase },
      { id: 'del-case', label: nRows > 1 ? `Delete ${nRows} cases` : 'Delete case', disabled: nRows < 1, title: nRows < 1 ? 'Select existing cases first' : undefined, onSelect: deleteCases, danger: true },
    ];
    const varItems: MenuItem[] = [
      { id: 'sort-a', label: 'Sort ascending', disabled: !onVar || !hasCases, onSelect: () => sortBy('asc') },
      { id: 'sort-d', label: 'Sort descending', disabled: !onVar || !hasCases, onSelect: () => sortBy('desc') },
      { id: 'stats', label: 'Descriptive statistics', disabled: !onVar || !hasCases, onSelect: () => showStats() },
      { id: 'ins-var', label: 'Insert variable', separator: true, onSelect: insertVariable },
      { id: 'del-var', label: nCols > 1 ? `Delete ${nCols} variables` : 'Delete variable', disabled: nCols < 1, onSelect: deleteVariables, danger: true },
      { id: 'props', label: 'Variable properties', disabled: !onVar, onSelect: () => openProps() },
    ];
    if (kind === 'row') return caseItems;
    if (kind === 'header') return varItems;
    return [
      { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', onSelect: copySelection, disabled: !hasCases || !hasVars },
      { id: 'clear', label: 'Clear', shortcut: 'Del', onSelect: () => onClear(rect), disabled: !hasCases || !hasVars },
      { ...caseItems[0], separator: true },
      caseItems[1],
      ...varItems.map((it, i) => (i === 0 ? { ...it, separator: true } : it)),
    ];
  };

  return (
    <div className="dataview">
      <div className="view-toolbar" role="toolbar" aria-label="Data View tools">
        <button type="button" className={`btn btn-sm ${showLabels ? 'btn-toggle-on' : ''}`} aria-pressed={showLabels} onClick={() => setShowLabels(!showLabels)} title="Show value labels instead of codes">
          <Icon name="tag" size={14} /> Value labels
        </button>
        <span className="toolbar-sep" />
        <button type="button" className="btn btn-sm btn-ghost" onClick={insertCase} title="Insert a case above the selected one">
          <Icon name="insertRow" size={14} /> <span className="hide-narrow">Insert case</span>
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={insertVariable} title="Insert a variable before the selected column">
          <Icon name="insertCol" size={14} /> <span className="hide-narrow">Insert variable</span>
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={deleteCases} disabled={!hasCases || rect.r0 >= ds.nCases} title="Delete the selected cases">
          <Icon name="trash" size={14} /> <span className="hide-narrow">Delete cases</span>
        </button>
        <span className="toolbar-sep" />
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => sortBy('asc')} disabled={!onVar || !hasCases} title={curVar ? `Sort cases by ${curVar.name}, ascending` : 'Select a column to sort'} aria-label="Sort ascending">
          <Icon name="sortAsc" size={15} />
        </button>
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => sortBy('desc')} disabled={!onVar || !hasCases} title={curVar ? `Sort cases by ${curVar.name}, descending` : 'Select a column to sort'} aria-label="Sort descending">
          <Icon name="sortDesc" size={15} />
        </button>
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => showStats()} disabled={!onVar || !hasCases} title={curVar ? `Quick statistics for ${curVar.name}` : 'Select a column'} aria-label="Column statistics">
          <Icon name="sigma" size={15} />
        </button>
        <button type="button" className={`btn btn-sm btn-ghost btn-icon ${findOpen ? 'btn-toggle-on' : ''}`} onClick={() => setFindOpen((o) => !o)} title="Find (Ctrl+F)" aria-label="Find" aria-pressed={findOpen}>
          <Icon name="search" size={15} />
        </button>
        <button type="button" className={`btn btn-sm btn-ghost btn-icon ${gotoOpen ? 'btn-toggle-on' : ''}`} onClick={() => setGotoOpen((o) => !o)} title="Go to case" aria-label="Go to case" aria-pressed={gotoOpen} disabled={!hasCases}>
          <Icon name="goto" size={15} />
        </button>
        <span className="spacer" />
        <span className="toolbar-status num" aria-live="polite">
          {sel.r < ds.nCases ? `Case ${(sel.r + 1).toLocaleString('en-US')} of ${ds.nCases.toLocaleString('en-US')}` : 'New case'}
          {curVar ? (
            <>
              {' · '}
              <span className="mono">{curVar.name}</span>
              {curVar.label ? <span className="muted hide-narrow"> {curVar.label}</span> : null}
            </>
          ) : null}
          {ds.filterVarId ? <span className="muted hide-narrow"> · {nActive.toLocaleString('en-US')} selected</span> : null}
        </span>
      </div>
      {findOpen ? (
        <FindBar
          ds={ds}
          sel={sel}
          onHit={(h) => {
            setHit(h);
            if (h) {
              setSelState({ r: h.row, c: h.col, ar: h.row, ac: h.col });
              setFocusSeq((n) => n + 1);
            }
          }}
          onClose={() => {
            setFindOpen(false);
            setHit(null);
            setFocusSeq((n) => n + 1);
          }}
        />
      ) : null}
      {gotoOpen ? (
        <GotoBar
          n={ds.nCases}
          onGo={(row) => {
            setSelState({ r: row, c: sel.c, ar: row, ac: sel.c });
            setFocusSeq((k) => k + 1);
          }}
          onClose={() => {
            setGotoOpen(false);
            setFocusSeq((k) => k + 1);
          }}
        />
      ) : null}
      <div className="dataview-grid">
        <DataGrid
          ds={ds}
          showLabels={showLabels}
          sel={sel}
          setSel={setSel}
          hit={hit}
          onCommit={onCommit}
          onClear={onClear}
          onCopy={copyText}
          onPaste={onPaste}
          onContextMenu={(kind, x, y) => setMenu({ x, y, items: menuFor(kind) })}
          onHeaderDoubleClick={(c) => (c < nVars ? openProps(c) : insertVariable())}
          onFind={() => setFindOpen(true)}
          focusSeq={focusSeq}
        />
        {stats ? <StatsPopover ds={ds} col={stats.col} s={stats.summary} onClose={() => { setStats(null); setFocusSeq((n) => n + 1); }} /> : null}
        {ds.nCases === 0 && nVars === 0 ? (
          <div className="grid-empty-hint">
            <strong>This dataset is empty.</strong> Click the first cell and type to start, paste from a spreadsheet with Ctrl+V, or define variables in Variable View first.
          </div>
        ) : null}
      </div>
      {menu ? <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} label="Data View actions" /> : null}
    </div>
  );
}

function FindBar({ ds, sel, onHit, onClose }: { ds: Dataset; sel: Sel; onHit: (h: { row: number; col: number } | null) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [scope, setScope] = useState<'all' | 'col'>('all');
  const [labels, setLabels] = useState(true);
  const [whole, setWhole] = useState(false);
  const [status, setStatus] = useState('');
  const pos = useRef({ row: sel.r, col: sel.c });
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => {
    pos.current = { row: sel.r, col: sel.c };
  }, [sel.r, sel.c]);
  const go = (dir: 1 | -1) => {
    if (!text.trim()) return;
    const colIndex = scope === 'col' && sel.c < ds.variables.length ? sel.c : null;
    const h = findNext(ds, pos.current, { text, colIndex, labels, whole }, dir);
    if (!h) {
      setStatus('No matches');
      onHit(null);
      return;
    }
    pos.current = h;
    setStatus(`Case ${h.row + 1}, ${ds.variables[h.col].name}`);
    onHit(h);
  };
  return (
    <div className="findbar" role="search">
      <Icon name="search" size={14} />
      <input
        ref={input}
        className="input input-sm"
        placeholder="Find a value or label"
        value={text}
        aria-label="Find"
        onChange={(e) => {
          setText(e.target.value);
          setStatus('');
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            go(e.shiftKey ? -1 : 1);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
          }
        }}
      />
      <select className="select input-sm" value={scope} onChange={(e) => setScope(e.target.value as 'all' | 'col')} aria-label="Where to search">
        <option value="all">All variables</option>
        <option value="col">Current variable{ds.variables[sel.c] ? ` (${ds.variables[sel.c].name})` : ''}</option>
      </select>
      <label className="check"><input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} /> Labels</label>
      <label className="check"><input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} /> Whole cell</label>
      <button type="button" className="btn btn-sm" onClick={() => go(-1)} disabled={!text.trim()} aria-label="Previous match"><Icon name="up" size={14} /></button>
      <button type="button" className="btn btn-sm" onClick={() => go(1)} disabled={!text.trim()} aria-label="Next match"><Icon name="down" size={14} /></button>
      <span className="help num" aria-live="polite">{status}</span>
      <span className="spacer" />
      <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={onClose} aria-label="Close find"><Icon name="x" size={14} /></button>
    </div>
  );
}

function GotoBar({ n, onGo, onClose }: { n: number; onGo: (row: number) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);
  const go = () => {
    const k = Number(text);
    if (!Number.isInteger(k) || k < 1 || k > n) {
      setErr(`Enter a case number from 1 to ${n.toLocaleString('en-US')}.`);
      return;
    }
    setErr('');
    onGo(k - 1);
  };
  return (
    <div className="findbar">
      <label className="label" htmlFor="goto-case">Go to case</label>
      <input
        id="goto-case"
        ref={input}
        className="input input-sm num"
        style={{ width: 110 }}
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') go();
          else if (e.key === 'Escape') onClose();
        }}
      />
      <button type="button" className="btn btn-sm" onClick={go}>Go</button>
      <span className="help" role="alert">{err}</span>
      <span className="spacer" />
      <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={onClose} aria-label="Close"><Icon name="x" size={14} /></button>
    </div>
  );
}

const fmt = (x: number | undefined, d = 2) => (x === undefined || Number.isNaN(x) ? '.' : x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }));

function StatsPopover({ ds, col, s, onClose }: { ds: Dataset; col: number; s: ColumnSummary; onClose: () => void }) {
  const v = ds.variables[col];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);
  const intN = (x: number) => (Number.isInteger(x) ? x.toLocaleString('en-US') : fmt(x, 1));
  return (
    <div ref={ref} className="stats-pop" role="dialog" aria-label={`Statistics for ${v.name}`} tabIndex={-1}>
      <div className="stats-pop-head">
        <div style={{ minWidth: 0 }}>
          <div className="mono stats-pop-name">{v.name}</div>
          {v.label ? <div className="help stats-pop-label">{v.label}</div> : null}
        </div>
        <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={onClose} aria-label="Close"><Icon name="x" size={14} /></button>
      </div>
      <table className="stats-table num">
        <tbody>
          <tr><th>Valid N</th><td>{intN(s.weighted ? s.weightedN : s.n)}</td></tr>
          <tr><th>Missing</th><td>{s.missing.toLocaleString('en-US')}</td></tr>
          {s.filtered ? <tr><th>Filtered out</th><td>{s.filtered.toLocaleString('en-US')}</td></tr> : null}
          {s.kind === 'numeric' ? (
            <>
              <tr><th>Mean</th><td>{fmt(s.mean)}</td></tr>
              <tr><th>Std. deviation</th><td>{fmt(s.sd)}</td></tr>
              {s.median !== undefined ? <tr><th>Median</th><td>{fmt(s.median)}</td></tr> : null}
              <tr><th>Minimum</th><td>{fmt(s.min, v.decimals)}</td></tr>
              <tr><th>Maximum</th><td>{fmt(s.max, v.decimals)}</td></tr>
            </>
          ) : (
            <tr><th>Categories</th><td>{s.distinct?.toLocaleString('en-US')}</td></tr>
          )}
        </tbody>
      </table>
      {s.kind === 'categorical' && s.categories?.length ? (
        <div className="stats-cats">
          <div className="eyebrow">Most common</div>
          {s.categories.map((c) => (
            <div key={c.label} className="stats-cat">
              <span className="stats-cat-label" title={c.label}>{c.label}</span>
              <span className="stats-bar" aria-hidden="true"><span style={{ width: `${Math.max(2, c.pct)}%` }} /></span>
              <span className="num stats-cat-pct">{c.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="help">{s.weighted ? 'Weighted. ' : ''}{ds.filterVarId ? 'Filtered cases only. ' : ''}Run Analyze &gt; Descriptive Statistics for full tables.</div>
    </div>
  );
}
