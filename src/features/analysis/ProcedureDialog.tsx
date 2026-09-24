// Generic analysis dialog rendered from a ProcedureDef: variable list on the left, target boxes
// (slots) on the right, options grouped in tabs, validation, and a Run that never crashes the app.
import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useStore } from '../../core/store';
import type { Dataset, Variable } from '../../core/types';
import type { OptionDef, OptionValues, ProcedureDef, SlotValues, VarSlot } from '../../core/procedure';
import { categoryLabel, distinctValues } from '../../core/data';
import { getProcedure } from '../../procedures';
import { startProcedureRun, StoppedError, type ProcedureRun } from './runProcedure';
import { logFailure, logSlow } from '../../platform/errorlog';
import { Modal } from '../../ui/Modal';
import { copyText } from '../output/actions';
import { IconArrowLeft, IconArrowRight, IconCopy, IconDown, IconSearch, IconUp, IconWarn, IconX } from '../output/icons';
import {
  MEASURE_LABEL, addToSlot, optionInactive, bestSlotFor, measureWarning, moveWithinSlot, parseValue, recall, remember, removeFromSlot, slotCountHint, slotSuitHint, typeFits, validate,
} from './varUtils';
import './dialog.css';

export function ProcedureDialog(props: { procedureId: string; onClose: () => void }) {
  const def = getProcedure(props.procedureId);
  const ds = useStore((s) => s.dataset);
  if (!def)
    return (
      <Modal title="Analysis not available" onClose={props.onClose} size="narrow" footer={<button className="btn" onClick={props.onClose}>Close</button>}>
        <p>This analysis is not available in this version of Socius.</p>
      </Modal>
    );
  if (!ds || !ds.variables.length)
    return (
      <Modal title={def.title} subtitle={def.description} onClose={props.onClose} size="narrow" footer={<button className="btn btn-primary" onClick={props.onClose}>Close</button>}>
        <p>Open a data file first. Use the File menu to open an SPSS .sav file, a CSV or Excel file, or the sample survey.</p>
      </Modal>
    );
  return <DialogBody def={def} ds={ds} onClose={props.onClose} />;
}

// ---------- distinct values cache ----------

const valueCache = new Map<string, Array<number | string>>();
function valuesOf(ds: Dataset, v: Variable): Array<number | string> {
  const key = `${ds.id}:${ds.version}:${v.id}`;
  let vals = valueCache.get(key);
  if (!vals) {
    vals = distinctValues(ds, v);
    if (valueCache.size > 200) valueCache.clear();
    valueCache.set(key, vals);
  }
  return vals;
}

// ---------- icons for variables ----------

export function VarIcon({ v }: { v: Variable }) {
  const label = `${v.type === 'string' ? 'String, ' : ''}${MEASURE_LABEL[v.measure]}`;
  return (
    <span className={`vi vi-${v.measure}`} title={label} aria-label={label} role="img">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
        {v.measure === 'scale' ? (
          <>
            <rect x="1.5" y="5" width="13" height="6" rx="1" />
            <path d="M4 5v2.5M6.5 5v1.6M9 5v2.5M11.5 5v1.6" />
          </>
        ) : v.measure === 'ordinal' ? (
          <>
            <rect x="2" y="9.5" width="3" height="4" rx=".5" fill="currentColor" stroke="none" />
            <rect x="6.5" y="6.5" width="3" height="7" rx=".5" fill="currentColor" stroke="none" opacity=".8" />
            <rect x="11" y="3" width="3" height="10.5" rx=".5" fill="currentColor" stroke="none" opacity=".6" />
          </>
        ) : (
          <>
            <circle cx="5.5" cy="6" r="3" />
            <circle cx="10.5" cy="6" r="3" />
            <circle cx="8" cy="10.5" r="3" />
          </>
        )}
      </svg>
      {v.type === 'string' ? <span className="vi-str">a</span> : null}
    </span>
  );
}

function varText(v: Variable) {
  return v.label ? (
    <>
      <span className="vl-label">{v.label}</span> <span className="vl-name">[{v.name}]</span>
    </>
  ) : (
    <span className="vl-label mono">{v.name}</span>
  );
}

// ---------- hover card ----------

function HoverCard({ ds, v, rect }: { ds: Dataset; v: Variable; rect: DOMRect }) {
  const vals = v.valueLabels.length ? null : v.measure !== 'scale' ? valuesOf(ds, v) : null;
  const narrow = window.innerWidth < 720;
  const style = narrow
    ? { left: 12, right: 12, top: Math.min(rect.bottom + 6, window.innerHeight - 220) }
    : { left: Math.min(rect.right + 10, window.innerWidth - 330), top: Math.max(8, Math.min(rect.top - 6, window.innerHeight - 260)) };
  const missing = [...v.missing.discrete.map(String), ...(v.missing.range ? [`${v.missing.range.lo} to ${v.missing.range.hi}`] : [])];
  return (
    <div className="vh" style={style} role="tooltip">
      <div className="vh-head">
        <VarIcon v={v} />
        <strong className="mono">{v.name}</strong>
        <span className="badge">{v.type === 'string' ? 'String' : 'Numeric'}</span>
        <span className="badge">{MEASURE_LABEL[v.measure]}</span>
      </div>
      {v.label ? <p className="vh-label">{v.label}</p> : null}
      {v.valueLabels.length ? (
        <ul className="vh-values">
          {v.valueLabels.slice(0, 8).map((vl, i) => (
            <li key={i}>
              <span className="mono num">{String(vl.value)}</span>
              <span>{vl.label}</span>
            </li>
          ))}
          {v.valueLabels.length > 8 ? <li className="faint">and {v.valueLabels.length - 8} more</li> : null}
        </ul>
      ) : vals ? (
        <p className="vh-note">
          {vals.length} distinct value{vals.length === 1 ? '' : 's'}
          {vals.length ? `: ${vals.slice(0, 6).map(String).join(', ')}${vals.length > 6 ? ', …' : ''}` : ''}
        </p>
      ) : (
        <p className="vh-note">No value labels.</p>
      )}
      {missing.length ? <p className="vh-note">Missing values: {missing.join(', ')}</p> : null}
    </div>
  );
}

// ---------- the dialog ----------

type Drag = { from: 'source' | string; ids: string[] };

function DialogBody({ def, ds, onClose }: { def: ProcedureDef; ds: Dataset; onClose: () => void }) {
  const addOutput = useStore((s) => s.addOutput);
  const outputs = useStore((s) => s.outputs);
  const initial = useMemo(() => recall(def, ds), [def]); // eslint-disable-line react-hooks/exhaustive-deps
  const [slots, setSlots] = useState<SlotValues>(initial.slots);
  const [options, setOptions] = useState<OptionValues>(initial.options);
  const [search, setSearch] = useState('');
  const [sel, setSel] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [slotSel, setSlotSel] = useState<{ slot: string; id: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[] | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ started: number; background: boolean; elapsed: number } | null>(null);
  const runHandle = useRef<ProcedureRun | null>(null);
  const [showSyntax, setShowSyntax] = useState(false);
  const [hover, setHover] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const hoverTimer = useRef<number | undefined>(undefined);
  const noticeTimer = useRef<number | undefined>(undefined);
  // Modal re-runs its focus effect when onClose changes, so hand it a stable function.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const runningRef = useRef(false);
  runningRef.current = running;
  const stableClose = useCallback(() => {
    if (!runningRef.current) closeRef.current();
  }, []);

  const byId = useMemo(() => new Map(ds.variables.map((v) => [v.id, v])), [ds.variables]);
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ds.variables;
    return ds.variables.filter((v) => v.name.toLowerCase().includes(q) || v.label.toLowerCase().includes(q));
  }, [ds.variables, search]);
  const used = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of def.slots) for (const id of slots[s.key] ?? []) m.set(id, [...(m.get(id) ?? []), s.label]);
    return m;
  }, [slots, def.slots]);

  const lastSyntax = initial.syntax ?? [...outputs].reverse().find((o) => o.procedure === def.id && o.syntax)?.syntax ?? null;

  const flashNotice = (msgs: string[]) => {
    if (!msgs.length) return;
    setNotice(msgs.join(' '));
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000);
  };
  useEffect(() => () => { window.clearTimeout(noticeTimer.current); window.clearTimeout(hoverTimer.current); }, []);

  // Re-validate live once the user has tried to run.
  useEffect(() => {
    if (problems !== null) setProblems(validate(def, ds, slots, options));
  }, [slots, options]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (next: SlotValues) => {
    setSlots(next);
    setError(null);
  };

  const add = (slot: VarSlot, ids: string[], at?: number) => {
    const vars = ids.map((id) => byId.get(id)).filter((v): v is Variable => !!v);
    const r = addToSlot(slots, slot, vars, at);
    update(r.slots);
    flashNotice(r.messages);
    setSel([]);
  };

  const onSourceClick = (e: React.MouseEvent, id: string) => {
    if (e.shiftKey && anchor) {
      const ids = visible.map((v) => v.id);
      const a = ids.indexOf(anchor);
      const b = ids.indexOf(id);
      setSel(ids.slice(Math.min(a, b), Math.max(a, b) + 1));
    } else if (e.metaKey || e.ctrlKey) {
      setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
      setAnchor(id);
    } else {
      setSel([id]);
      setAnchor(id);
    }
    setSlotSel(null);
  };

  const onSourceDouble = (id: string) => {
    const v = byId.get(id);
    if (!v) return;
    const s = bestSlotFor(def, slots, v);
    if (!s) {
      flashNotice([def.slots.every((x) => !typeFits(x, v)) ? `${v.name} (${v.type}) does not fit any box in this dialog.` : 'All boxes are full. Remove a variable first.']);
      return;
    }
    add(s, [id]);
  };

  const onSourceKey = (e: ReactKeyboardEvent, id: string, index: number) => {
    const move = (d: number) => {
      const next = visible[index + d];
      if (!next) return;
      e.preventDefault();
      const el = document.getElementById(`src-${next.id}`);
      el?.focus();
      if (e.shiftKey) setSel((s) => (s.includes(next.id) ? s : [...s, next.id]));
      else {
        setSel([next.id]);
        setAnchor(next.id);
      }
    };
    if (e.key === 'ArrowDown') move(1);
    else if (e.key === 'ArrowUp') move(-1);
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (sel.length > 1 && sel.includes(id)) {
        const v = byId.get(sel[0]);
        const s = v ? bestSlotFor(def, slots, v) : null;
        if (s) add(s, sel);
      } else onSourceDouble(id);
    } else if (e.key === ' ') {
      e.preventDefault();
      setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    }
  };

  // Drag and drop
  const startDrag = (e: DragEvent, d: Drag) => {
    drag.current = d;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', d.ids.map((id) => byId.get(id)?.name ?? id).join(' '));
    setHover(null);
  };
  const endDrag = () => {
    drag.current = null;
    setDragOver(null);
  };
  const dropOnSlot = (slot: VarSlot, beforeId?: string) => {
    const d = drag.current;
    endDrag();
    if (!d) return;
    if (d.from === slot.key) {
      if (beforeId && d.ids[0] !== beforeId) {
        const idx = (slots[slot.key] ?? []).indexOf(beforeId);
        update(moveWithinSlot(slots, slot.key, d.ids[0], idx));
      } else if (!beforeId) update(moveWithinSlot(slots, slot.key, d.ids[0], (slots[slot.key] ?? []).length));
      return;
    }
    const base = d.from === 'source' ? slots : removeFromSlot(slots, d.from, d.ids);
    const at = beforeId ? (base[slot.key] ?? []).indexOf(beforeId) : undefined;
    const vars = d.ids.map((id) => byId.get(id)).filter((v): v is Variable => !!v);
    const r = addToSlot(base, slot, vars, at !== undefined && at >= 0 ? at : undefined);
    if (r.slots === base && d.from !== 'source') {
      flashNotice(r.messages);
      return;
    }
    update(r.slots);
    flashNotice(r.messages);
    setSel([]);
  };
  const dropOnSource = () => {
    const d = drag.current;
    endDrag();
    if (d && d.from !== 'source') update(removeFromSlot(slots, d.from, d.ids));
  };

  const showHover = (id: string, el: HTMLElement) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHover({ id, rect: el.getBoundingClientRect() }), 380);
  };
  const hideHover = () => {
    window.clearTimeout(hoverTimer.current);
    setHover(null);
  };

  const reset = () => {
    const emptySlots: SlotValues = {};
    for (const s of def.slots) emptySlots[s.key] = [];
    setSlots(emptySlots);
    const o: OptionValues = {};
    for (const opt of def.options) o[opt.key] = 'default' in opt ? opt.default : null;
    setOptions(o);
    setError(null);
    setProblems(null);
    setSel([]);
    setSlotSel(null);
  };

  const run = () => {
    if (running) return;
    const probs = validate(def, ds, slots, options);
    setProblems(probs);
    if (probs.length) {
      requestAnimationFrame(() => alertRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
      return;
    }
    setError(null);
    setRunning(true);
    setProgress({ started: performance.now(), background: false, elapsed: 0 });
    const snapshot = { slots, options };
    // Let the "Running" state paint first; large analyses then run in a worker (runProcedure.ts), so the
    // page stays responsive and the elapsed time and Stop button below keep working.
    requestAnimationFrame(() => {
      window.setTimeout(() => {
        const cur = useStore.getState().dataset ?? ds;
        const t0 = performance.now();
        const handle = startProcedureRun(def, cur, snapshot.slots, snapshot.options);
        runHandle.current = handle;
        if (handle.background) setProgress({ started: t0, background: true, elapsed: 0 });
        handle.result.then(
          (item) => {
            runHandle.current = null;
            logSlow('analysis', def.id, performance.now() - t0);
            remember(def.id, { ...snapshot, syntax: item.syntax });
            addOutput(item);
            setProgress(null);
            onClose();
          },
          (e) => {
            runHandle.current = null;
            setProgress(null);
            setRunning(false);
            remember(def.id, snapshot);
            if (e instanceof StoppedError) return;
            logFailure('analysis', e, { op: def.id });
            const msg = e instanceof Error ? e.message : String(e);
            setError(msg || 'The analysis could not be completed.');
            requestAnimationFrame(() => alertRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
          },
        );
      }, 0);
    });
  };
  const stopRun = () => runHandle.current?.stop();
  // Elapsed time while a background run is in progress.
  useEffect(() => {
    if (!progress?.background) return;
    const t = window.setInterval(() => setProgress((p) => (p ? { ...p, elapsed: performance.now() - p.started } : p)), 250);
    return () => window.clearInterval(t);
  }, [progress?.background]);
  // Closing the dialog (or unmounting) stops a background run.
  useEffect(() => () => runHandle.current?.stop(), []);

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, OptionDef[]>();
    for (const o of def.options) {
      const g = o.group ?? 'Options';
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g)!.push(o);
    }
    return order.map((g) => ({ name: g, options: map.get(g)! }));
  }, [def.options]);
  const [tab, setTab] = useState(0);

  const hoverVar = hover ? byId.get(hover.id) : undefined;

  return (
    <Modal
      title={def.title}
      subtitle={def.description}
      onClose={stableClose}
      size="wide"
      footer={
        <div className="pd-footer">
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSyntax((s) => !s)} disabled={!lastSyntax} aria-expanded={showSyntax} title={lastSyntax ? undefined : 'Run this analysis once to see its SPSS syntax'}>
            {showSyntax ? 'Hide syntax' : 'Show syntax'}
          </button>
          <span className="spacer" />
          <button className="btn" onClick={reset} disabled={running}>Reset</button>
          {progress?.background ? (
            <span className="pd-progress" role="status" aria-live="polite">
              <span className="pd-progress-bar" role="progressbar" aria-label="Analysis in progress" />
              Running in the background: {Math.floor(progress.elapsed / 1000)} s
            </span>
          ) : null}
          {progress?.background ? (
            <button className="btn" onClick={stopRun}>Stop</button>
          ) : (
            <button className="btn" onClick={onClose} disabled={running}>Cancel</button>
          )}
          <button className="btn btn-primary pd-run" onClick={run} disabled={running} aria-busy={running}>
            {running ? <span className="pd-spinner" aria-hidden="true" /> : null}
            {running ? 'Running…' : 'Run'}
          </button>
        </div>
      }
    >
      <div
        className="pd"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            run();
          }
        }}
      >
        {def.guidance ? (
          <details className="pd-guide">
            <summary>When to use this</summary>
            <p>{def.guidance}</p>
          </details>
        ) : null}

        <div className="pd-vars">
          <section
            className={`pd-source ${dragOver === '__source' ? 'drop' : ''}`}
            aria-label="Variables"
            onDragOver={(e) => {
              if (drag.current && drag.current.from !== 'source') {
                e.preventDefault();
                setDragOver('__source');
              }
            }}
            onDragLeave={() => setDragOver((d) => (d === '__source' ? null : d))}
            onDrop={(e) => {
              e.preventDefault();
              dropOnSource();
            }}
          >
            <div className="pd-search">
              <IconSearch />
              <input className="input input-sm" type="search" placeholder={`Search ${ds.variables.length} variables`} value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search variables" />
            </div>
            <ul className="pd-list" role="listbox" aria-multiselectable="true" aria-label="Variables in the dataset">
              {visible.map((v, i) => {
                const inUse = used.get(v.id);
                return (
                  <li
                    key={v.id}
                    id={`src-${v.id}`}
                    role="option"
                    aria-selected={sel.includes(v.id)}
                    tabIndex={i === 0 || sel[0] === v.id ? 0 : -1}
                    className={`pd-var ${sel.includes(v.id) ? 'sel' : ''} ${inUse ? 'used' : ''}`}
                    draggable
                    onDragStart={(e) => startDrag(e, { from: 'source', ids: sel.includes(v.id) ? sel : [v.id] })}
                    onDragEnd={endDrag}
                    onClick={(e) => onSourceClick(e, v.id)}
                    onDoubleClick={() => onSourceDouble(v.id)}
                    onKeyDown={(e) => onSourceKey(e, v.id, i)}
                    onMouseEnter={(e) => showHover(v.id, e.currentTarget)}
                    onMouseLeave={hideHover}
                    onFocus={(e) => { if (e.currentTarget.matches(':focus-visible')) showHover(v.id, e.currentTarget); }}
                    onBlur={hideHover}
                  >
                    <VarIcon v={v} />
                    <span className="pd-var-text">{varText(v)}</span>
                    {inUse ? <span className="pd-used" title={`In: ${inUse.join(', ')}`}>✓</span> : null}
                  </li>
                );
              })}
              {!visible.length ? <li className="pd-empty">No variables match “{search}”.</li> : null}
            </ul>
            <p className="help pd-howto">Double-click, press Enter, drag, or select and use an arrow to move variables.</p>
          </section>

          <div className="pd-slots">
            {def.slots.map((s) => {
              const ids = slots[s.key] ?? [];
              const selectedHere = slotSel?.slot === s.key ? slotSel.id : null;
              const canAdd = sel.length > 0;
              const suit = slotSuitHint(s);
              const warnings = ids.map((id) => byId.get(id)).filter((v): v is Variable => !!v).map((v) => measureWarning(s, v)).filter(Boolean) as string[];
              return (
                <div key={s.key} className="pd-slot-row">
                  <button
                    className="btn btn-icon pd-arrow"
                    disabled={!canAdd && !selectedHere}
                    onClick={() => {
                      if (canAdd) add(s, sel);
                      else if (selectedHere) {
                        update(removeFromSlot(slots, s.key, [selectedHere]));
                        setSlotSel(null);
                      }
                    }}
                    aria-label={canAdd ? `Move selected variables to ${s.label}` : `Remove selected variable from ${s.label}`}
                    title={canAdd ? `Move to ${s.label}` : selectedHere ? `Remove from ${s.label}` : 'Select a variable first'}
                  >
                    {canAdd || !selectedHere ? <IconArrowRight /> : <IconArrowLeft />}
                  </button>
                  <div
                    className={`pd-slot ${dragOver === s.key ? 'drop' : ''} ${ids.length < s.min && problems ? 'invalid' : ''}`}
                    onDragOver={(e) => {
                      const d = drag.current;
                      if (!d) return;
                      const okType = d.ids.some((id) => { const v = byId.get(id); return v && typeFits(s, v); });
                      if (okType) {
                        e.preventDefault();
                        setDragOver(s.key);
                      }
                    }}
                    onDragLeave={(e) => {
                      if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver((d) => (d === s.key ? null : d));
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      dropOnSlot(s);
                    }}
                  >
                    <div className="pd-slot-head">
                      <span className="pd-slot-label" id={`slot-${s.key}`}>{s.label}</span>
                      <span className="pd-slot-hint">
                        {slotCountHint(s)}
                        {suit ? ` · ${suit}` : ''}
                      </span>
                    </div>
                    <ul className="pd-slot-list" role="listbox" aria-labelledby={`slot-${s.key}`}>
                      {ids.map((id, idx) => {
                        const v = byId.get(id);
                        if (!v) return null;
                        const warn = measureWarning(s, v);
                        const isSel = selectedHere === id;
                        return (
                          <li
                            key={id}
                            role="option"
                            aria-selected={isSel}
                            tabIndex={0}
                            className={`pd-chip ${isSel ? 'sel' : ''} ${warn ? 'warn' : ''}`}
                            draggable
                            onDragStart={(e) => startDrag(e, { from: s.key, ids: [id] })}
                            onDragEnd={endDrag}
                            onDragOver={(e) => {
                              if (drag.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                setDragOver(s.key);
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dropOnSlot(s, id);
                            }}
                            onClick={() => { setSlotSel({ slot: s.key, id }); setSel([]); }}
                            onDoubleClick={() => { update(removeFromSlot(slots, s.key, [id])); setSlotSel(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Delete' || e.key === 'Backspace') {
                                e.preventDefault();
                                update(removeFromSlot(slots, s.key, [id]));
                                setSlotSel(null);
                              } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                                e.preventDefault();
                                update(moveWithinSlot(slots, s.key, id, e.key === 'ArrowUp' ? idx - 1 : idx + 2));
                              } else if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSlotSel({ slot: s.key, id });
                              }
                            }}
                          >
                            <VarIcon v={v} />
                            <span className="pd-var-text">{varText(v)}</span>
                            {warn ? (
                              <span className="pd-warn-icon" title={warn}>
                                <IconWarn />
                              </span>
                            ) : null}
                            {isSel && ids.length > 1 ? (
                              <span className="pd-chip-move">
                                <button className="btn btn-ghost btn-sm btn-icon" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); update(moveWithinSlot(slots, s.key, id, idx - 1)); }} aria-label="Move up">
                                  <IconUp />
                                </button>
                                <button className="btn btn-ghost btn-sm btn-icon" disabled={idx === ids.length - 1} onClick={(e) => { e.stopPropagation(); update(moveWithinSlot(slots, s.key, id, idx + 2)); }} aria-label="Move down">
                                  <IconDown />
                                </button>
                              </span>
                            ) : null}
                            <button
                              className="btn btn-ghost btn-sm btn-icon pd-chip-x"
                              onClick={(e) => {
                                e.stopPropagation();
                                update(removeFromSlot(slots, s.key, [id]));
                                setSlotSel(null);
                              }}
                              aria-label={`Remove ${v.name}`}
                              tabIndex={-1}
                            >
                              <IconX />
                            </button>
                          </li>
                        );
                      })}
                      {!ids.length ? <li className="pd-slot-empty">{s.help ?? 'Drop a variable here'}</li> : null}
                    </ul>
                    {ids.length && s.help ? <p className="pd-slot-help">{s.help}</p> : null}
                    {warnings.length ? (
                      <p className="pd-slot-warn">
                        <IconWarn /> {warnings[0]}
                        {warnings.length > 1 ? ` (${warnings.length - 1} more)` : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {notice ? (
          <p className="pd-notice" role="status">
            {notice}
          </p>
        ) : null}

        {groups.length ? (
          <section className="pd-options" aria-label="Options">
            {groups.length > 1 ? (
              <div className="tabs" role="tablist">
                {groups.map((g, i) => (
                  <button key={g.name} role="tab" id={`pdt-${i}`} aria-controls={`pdp-${i}`} aria-selected={tab === i} className="tab" onClick={() => setTab(i)}>
                    {g.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="eyebrow">{groups[0].name}</p>
            )}
            {groups.map((g, i) => (
              <div key={g.name} role={groups.length > 1 ? 'tabpanel' : undefined} id={`pdp-${i}`} aria-labelledby={groups.length > 1 ? `pdt-${i}` : undefined} hidden={groups.length > 1 && tab !== i} className="pd-option-grid">
                {g.options.filter((o) => !optionInactive(o, options)).map((o) => (
                  <OptionField key={o.key} def={o} value={options[o.key]} onChange={(v) => { setOptions((p) => ({ ...p, [o.key]: v })); setError(null); }} ds={ds} slots={slots} byId={byId} />
                ))}
              </div>
            ))}
          </section>
        ) : null}

        {showSyntax && lastSyntax ? (
          <div className="pd-syntax">
            <div className="row">
              <span className="eyebrow">Syntax from the last run</span>
              <span className="spacer" />
              <button className="btn btn-sm" onClick={() => copyText(lastSyntax, 'Syntax')}>
                <IconCopy /> Copy
              </button>
            </div>
            <pre>{lastSyntax}</pre>
          </div>
        ) : null}

        {problems && problems.length ? (
          <div className="callout callout-warn pd-problems" role="alert" ref={alertRef}>
            {problems.length === 1 ? problems[0] : (
              <ul>
                {problems.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            )}
          </div>
        ) : null}
        {error ? (
          <div className="callout callout-bad pd-error" role="alert" ref={problems && problems.length ? undefined : alertRef}>
            <b>The analysis could not run.</b> {error}
          </div>
        ) : null}
      </div>
      {hoverVar && hover ? <HoverCard ds={ds} v={hoverVar} rect={hover.rect} /> : null}
    </Modal>
  );
}

// ---------- options ----------

function OptionField({ def, value, onChange, ds, slots, byId }: { def: OptionDef; value: unknown; onChange: (v: unknown) => void; ds: Dataset; slots: SlotValues; byId: Map<string, Variable> }) {
  const id = `opt-${def.key}`;
  const help = def.help ? <span className="help" id={`${id}-h`}>{def.help}</span> : null;
  switch (def.type) {
    case 'checkbox':
      return (
        <div className="pd-field-check">
          <label className="check">
            <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} aria-describedby={def.help ? `${id}-h` : undefined} />
            {def.label}
          </label>
          {help}
        </div>
      );
    case 'select':
      return (
        <div className="field">
          <label htmlFor={id}>{def.label}</label>
          <select id={id} className="select" value={String(value ?? def.default)} onChange={(e) => onChange(e.target.value)} aria-describedby={def.help ? `${id}-h` : undefined}>
            {def.choices.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {help}
        </div>
      );
    case 'number':
      return (
        <div className="field">
          <label htmlFor={id}>{def.label}</label>
          <input
            id={id}
            className="input num"
            type="number"
            min={def.min}
            max={def.max}
            step={def.step ?? 'any'}
            value={typeof value === 'number' && Number.isFinite(value) ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
            aria-describedby={def.help ? `${id}-h` : undefined}
          />
          {help}
        </div>
      );
    case 'text':
      return (
        <div className="field">
          <label htmlFor={id}>{def.label}</label>
          <input id={id} className="input" type="text" placeholder={def.placeholder} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} aria-describedby={def.help ? `${id}-h` : undefined} />
          {help}
        </div>
      );
    case 'groupPair':
      return <GroupPairField def={def} value={value} onChange={onChange} ds={ds} v={byId.get(slots[def.slot]?.[0] ?? '')} />;
    case 'valueList':
      return <ValueListField def={def} value={value} onChange={onChange} ds={ds} v={byId.get(slots[def.slot]?.[0] ?? '')} />;
  }
}

function valueOptions(ds: Dataset, v: Variable) {
  const vals = valuesOf(ds, v).slice(0, 200);
  // Include labelled values even if absent from the data (SPSS lists defined groups).
  for (const vl of v.valueLabels) if (!vals.some((x) => String(x) === String(vl.value))) vals.push(vl.value);
  if (v.type === 'numeric') (vals as number[]).sort((a, b) => a - b);
  return vals.map((x) => ({ value: x, text: `${categoryLabel(v, x)}${v.valueLabels.length && categoryLabel(v, x) !== String(x) ? ` (${x})` : ''}` }));
}

function GroupPairField({ def, value, onChange, ds, v }: { def: Extract<OptionDef, { type: 'groupPair' }>; value: unknown; onChange: (v: unknown) => void; ds: Dataset; v?: Variable }) {
  const pair = Array.isArray(value) ? (value as Array<number | string | null>) : [null, null];
  const opts = useMemo(() => (v ? valueOptions(ds, v) : []), [ds, v]);
  const [custom, setCustom] = useState<[boolean, boolean]>([false, false]);
  const lastVar = useRef<string | undefined>(v?.id);
  // New grouping variable: clear the pair, and pre-fill when there are exactly two values.
  useEffect(() => {
    if (!v) return;
    const changed = lastVar.current !== v.id;
    lastVar.current = v.id;
    const valid = pair.every((p) => p !== null && opts.some((o) => String(o.value) === String(p)));
    if ((changed || !Array.isArray(value)) && opts.length === 2) onChange([opts[0].value, opts[1].value]);
    else if (changed && !valid) onChange(null);
  }, [v?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v)
    return (
      <div className="field pd-wide">
        <span className="label">{def.label}</span>
        <p className="help">Choose the grouping variable first; its values will be listed here.</p>
      </div>
    );
  const set = (i: 0 | 1, x: number | string | null) => {
    const next = [pair[0] ?? null, pair[1] ?? null];
    next[i] = x;
    onChange(next);
  };
  return (
    <fieldset className="field pd-wide pd-pair">
      <legend className="label">{def.label}</legend>
      <div className="pd-pair-row">
        {([0, 1] as const).map((i) => (
          <div key={i} className="field">
            <label htmlFor={`${def.key}-${i}`} className="help">Group {i + 1}</label>
            {custom[i] || !opts.length ? (
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <input id={`${def.key}-${i}`} className="input" placeholder={v.type === 'numeric' ? 'Value, e.g. 1' : 'Value'} value={pair[i] === null || pair[i] === undefined ? '' : String(pair[i])} onChange={(e) => set(i, parseValue(v, e.target.value))} />
                {opts.length ? <button className="btn btn-sm btn-ghost" onClick={() => setCustom((c) => (i === 0 ? [false, c[1]] : [c[0], false]))}>List</button> : null}
              </div>
            ) : (
              <select
                id={`${def.key}-${i}`}
                className="select"
                value={pair[i] === null || pair[i] === undefined ? '' : String(pair[i])}
                onChange={(e) => {
                  if (e.target.value === '__other') {
                    setCustom((c) => (i === 0 ? [true, c[1]] : [c[0], true]));
                    return;
                  }
                  const o = opts.find((x) => String(x.value) === e.target.value);
                  set(i, o ? o.value : null);
                }}
              >
                <option value="">Choose…</option>
                {opts.map((o) => (
                  <option key={String(o.value)} value={String(o.value)}>{o.text}</option>
                ))}
                <option value="__other">Type a value…</option>
              </select>
            )}
          </div>
        ))}
      </div>
      {def.help ? <span className="help">{def.help}</span> : null}
    </fieldset>
  );
}

function ValueListField({ def, value, onChange, ds, v }: { def: Extract<OptionDef, { type: 'valueList' }>; value: unknown; onChange: (v: unknown) => void; ds: Dataset; v?: Variable }) {
  const opts = useMemo(() => (v ? valueOptions(ds, v).slice(0, 60) : []), [ds, v]);
  if (!v)
    return (
      <div className="field pd-wide">
        <span className="label">{def.label}</span>
        <p className="help">Choose the variable first; its values will be listed here.</p>
      </div>
    );
  const list = Array.isArray(value) ? (value as Array<number | string>) : null;
  const order = list ? [...list.filter((x) => opts.some((o) => String(o.value) === String(x))), ...opts.map((o) => o.value).filter((x) => !list.some((y) => String(y) === String(x)))] : opts.map((o) => o.value);
  const checked = (x: number | string) => (list ? list.some((y) => String(y) === String(x)) : true);
  const emit = (ord: Array<number | string>, isChecked: (x: number | string) => boolean) => onChange(ord.filter(isChecked));
  const textOf = (x: number | string) => opts.find((o) => String(o.value) === String(x))?.text ?? String(x);
  return (
    <fieldset className="field pd-wide">
      <legend className="label">{def.label}</legend>
      {def.help ? <span className="help">{def.help}</span> : null}
      <ul className="pd-vlist">
        {order.map((x, i) => (
          <li key={String(x)}>
            <label className="check">
              <input type="checkbox" checked={checked(x)} onChange={(e) => emit(order, (y) => (String(y) === String(x) ? e.target.checked : checked(y)))} />
              {textOf(x)}
            </label>
            <span className="spacer" />
            <button className="btn btn-ghost btn-sm btn-icon" disabled={i === 0} aria-label={`Move ${textOf(x)} up`} onClick={() => { const o = order.slice(); [o[i - 1], o[i]] = [o[i], o[i - 1]]; emit(o, checked); }}>
              <IconUp />
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" disabled={i === order.length - 1} aria-label={`Move ${textOf(x)} down`} onClick={() => { const o = order.slice(); [o[i + 1], o[i]] = [o[i], o[i + 1]]; emit(o, checked); }}>
              <IconDown />
            </button>
          </li>
        ))}
      </ul>
      {list ? (
        <button className="btn btn-sm btn-ghost" style={{ alignSelf: 'flex-start' }} onClick={() => onChange(null)}>
          Use all values in their usual order
        </button>
      ) : (
        <span className="help">All values, in their usual order.</span>
      )}
    </fieldset>
  );
}
