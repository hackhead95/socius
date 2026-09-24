// Top bar: product mark, menus, search, AI status, dataset name and size, weight / filter / sample
// chips, undo/redo, theme.
import { useMemo, useState } from 'react';
import { useStore } from '../core/store';
import { activeCaseMask } from '../core/data';
import { Icon } from '../ui/Icon';
import { useUi, type ThemePref } from './ui-store';
import { MenuBar } from './MenuBar';
import { modKey } from './shortcuts';
import { nothingTo, runRedo, runUndo, useUndoRedo } from './undo';
import { isModified } from '../features/project/fileActions';
import { turnFilterOff, turnWeightOff } from '../features/transform/common';
import { FEEDBACK_URL } from './links';
import { openFeedback } from '../features/errorlog/actions';
import { openPalette } from './CommandPalette';
import { AiChip } from '../features/ai/AiFeatureDialogs';

const fmtN = (n: number) => n.toLocaleString('en-US');

/**
 * The Socius logo is the Home button: it shows the start screen (open a file, recent projects,
 * getting started) over whatever is open; "Back to your data" there (or any tab) returns.
 */
export function Mark() {
  const home = useUi((s) => s.home);
  return (
    <button
      type="button"
      className="mark"
      aria-label="Socius home: start screen and recent projects"
      aria-pressed={home}
      title="Home: start screen and recent projects"
      onClick={() => useUi.getState().setHome(true)}
    >
      <span className="mark-glyph" aria-hidden="true">S</span>
      <span className="mark-word">Socius</span>
    </button>
  );
}

export function TopBar() {
  const ds = useStore((s) => s.dataset);
  // Same as Edit > Undo / Redo: they follow the tab you are in.
  const { undo, redo, tab } = useUndoRedo();
  const openDialog = useStore((s) => s.openDialog);
  const theme = useUi((s) => s.theme);
  const setTheme = useUi((s) => s.setTheme);
  useUi((s) => s.cleanDataset);
  const mod = modKey();

  const nActive = useMemo(() => (ds?.filterVarId ? activeCaseMask(ds).reduce((a, b) => a + b, 0) : ds?.nCases ?? 0), [ds]);
  const weightVar = ds?.weightVarId ? ds.variables.find((v) => v.id === ds.weightVarId) : null;
  const filterVar = ds?.filterVarId ? ds.variables.find((v) => v.id === ds.filterVarId) : null;
  const nextTheme: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
  // Same wording as View > Theme (this button is a shortcut to it).
  const themeLabel: Record<ThemePref, string> = { system: 'Theme: Match my system', light: 'Theme: Light', dark: 'Theme: Dark' };
  const modified = ds ? isModified() : false;

  return (
    <header className="topbar">
      <div className="topbar-row">
        <Mark />
        <MenuBar />
        <button type="button" className="topbar-search" onClick={openPalette} aria-label="Search Socius" aria-keyshortcuts={mod === 'Cmd' ? 'Meta+K' : 'Control+K'} title={`Search commands, variables, results and help (${mod}+K)`}>
          <Icon name="search" size={14} />
          <span className="topbar-search-text">Search Socius</span>
          <kbd className="kbd">{mod}+K</kbd>
        </button>
        <div className="topbar-right">
          <button type="button" className="btn btn-sm btn-ghost btn-icon topbar-search-btn" onClick={openPalette} aria-label="Search Socius" title="Search Socius">
            <Icon name="search" />
          </button>
          <AiChip />
          <a className="btn btn-sm btn-ghost topbar-feedback" href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" onClick={(e) => { e.preventDefault(); openFeedback(); }} title="Send feedback or report a problem (offers to include the error report, then opens GitHub; also Help > Send feedback or report a problem)">
            Feedback
          </a>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => runUndo()} disabled={!undo} aria-label="Undo" title={undo ? `${undo.label} (${mod}+Z)` : nothingTo('undo', tab)}>
            <Icon name="undo" />
          </button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => runRedo()} disabled={!redo} aria-label="Redo" title={redo ? `${redo.label} (${mod}+Y)` : nothingTo('redo', tab)}>
            <Icon name="redo" />
          </button>
          <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setTheme(nextTheme[theme])} aria-label={themeLabel[theme]} title={`${themeLabel[theme]}. Click to change.`}>
            <Icon name={theme === 'system' ? 'monitor' : theme === 'light' ? 'sun' : 'moon'} />
          </button>
        </div>
      </div>
      {ds ? (
        <div className="datasetbar">
          <DatasetName name={ds.name} />
          {modified ? <span className="modified-dot" title="Changed since it was opened or saved" aria-label="Unsaved changes" /> : null}
          <span className="dataset-size num">
            {fmtN(ds.nCases)} case{ds.nCases === 1 ? '' : 's'} · {fmtN(ds.variables.length)} variable{ds.variables.length === 1 ? '' : 's'}
          </span>
          <span className="chips">
            {ds.source?.kind === 'sample' ? (
              <span className="chip chip-sample" title="A fictional survey bundled with Socius for practice">Sample data</span>
            ) : null}
            {weightVar ? (
              <span className="chip chip-weight">
                <button type="button" className="chip-main" onClick={() => openDialog({ kind: 'transform', id: 'weight' })} title="Change weighting">
                  <Icon name="weight" size={13} /> Weighted by <span className="mono">{weightVar.name}</span>
                </button>
                <button type="button" className="chip-x" onClick={turnWeightOff} aria-label="Turn weighting off" title="Turn weighting off"><Icon name="x" size={12} /></button>
              </span>
            ) : null}
            {filterVar ? (
              <span className="chip chip-filter">
                <button type="button" className="chip-main num" onClick={() => openDialog({ kind: 'transform', id: 'select' })} title={`Filter variable ${filterVar.name}. Click to change.`}>
                  <Icon name="filter" size={13} /> Filter on: {fmtN(nActive)} of {fmtN(ds.nCases)} cases
                </button>
                <button type="button" className="chip-x" onClick={turnFilterOff} aria-label="Turn filter off" title="Use all cases"><Icon name="x" size={12} /></button>
              </span>
            ) : null}
          </span>
        </div>
      ) : null}
    </header>
  );
}

function DatasetName({ name }: { name: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(name);
  const mutate = useStore((s) => s.mutateDataset);
  if (editing)
    return (
      <input
        className="input input-sm dataset-name-input"
        value={text}
        autoFocus
        aria-label="Dataset name"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const t = text.trim();
          if (t && t !== name) mutate((d) => ({ ...d, name: t, version: d.version + 1 }));
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') {
            setText(name);
            setEditing(false);
          }
        }}
      />
    );
  return (
    <button type="button" className="dataset-name" onClick={() => { setText(name); setEditing(true); }} title="Rename (used as the file name when you save)">
      {name}
    </button>
  );
}
