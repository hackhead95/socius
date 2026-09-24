// Visual Binning, Select Cases, Weight Cases, Sort Cases.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dataset, Variable } from '../../core/types';
import { uniqueVarName } from '../../core/data';
import {
  checkWeightVariable, previewBins, selectCasesTransform, selectionValues, sortCases, visualBin, weightCases, weightWarnings,
  CasesError, type BinMethod, type SelectMethod, type SortKey,
} from '../../lib/transform';
import { useUi } from '../../app/ui-store';
import { VarPicker } from '../../ui/VarPicker';
import { Icon } from '../../ui/Icon';
import { applyTransform, ExpressionField, ExpressionHelper, insertAtCursor, NumField, TextField, TransformModal, tryRun, VarSelect } from './common';
import { logFailure } from '../../platform/errorlog';

const isNumeric = (v: Variable) => v.type === 'numeric';
const fmtN = (n: number) => n.toLocaleString('en-US');

// ---------- Visual Binning ----------

export function BinningDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [src, setSrc] = useState<string[]>([]);
  const [method, setMethod] = useState<'custom' | 'width' | 'widthFrom' | 'count'>('custom');
  const [cuts, setCuts] = useState('');
  const [intervals, setIntervals] = useState('4');
  const [first, setFirst] = useState('');
  const [width, setWidth] = useState('');
  const [groups, setGroups] = useState('4');
  const [upper, setUpper] = useState(true);
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const v = ds.variables.find((x) => x.id === src[0]);

  useEffect(() => {
    if (v) {
      setName(uniqueVarName(ds, `${v.name}_grp`));
      setLabel(`${v.label || v.name} (grouped)`);
    }
  }, [v?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const spec: BinMethod | null = useMemo(() => {
    switch (method) {
      case 'custom': {
        const parts = cuts.split(/[,;\s]+/).filter(Boolean).map(Number);
        return parts.length ? { kind: 'custom', cuts: parts } : null;
      }
      case 'width': return { kind: 'width', intervals: Number(intervals) };
      case 'widthFrom': return first.trim() && width.trim() ? { kind: 'widthFrom', first: Number(first), width: Number(width) } : null;
      case 'count': return { kind: 'count', groups: Number(groups) };
    }
  }, [method, cuts, intervals, first, width, groups]);

  const preview = useMemo(() => {
    if (!v || !spec) return null;
    try {
      if (spec.kind === 'custom' && spec.cuts.some((c) => !Number.isFinite(c))) return { err: 'Cutpoints must be numbers separated by commas, e.g. 29, 44, 64.' };
      return { p: previewBins(ds, { sourceId: v.id, method: spec, upperIncluded: upper }) };
    } catch (e) {
      return { err: e instanceof Error ? e.message : String(e) };
    }
  }, [ds, v, spec, upper]);

  const maxCount = preview?.p ? Math.max(1, ...preview.p.bins.map((b) => b.count)) : 1;
  const run = () =>
    tryRun(() => {
      if (!v || !spec) throw new Error('Choose a variable and how to cut it.');
      applyTransform(visualBin(ds, { sourceId: v.id, name, label: label.trim() || undefined, method: spec, upperIncluded: upper }));
      onClose();
    }, setError);

  return (
    <TransformModal title="Visual Binning" subtitle="Group a scale variable into ordered categories, for example age into 18-29, 30-44, 45-64, 65+." onClose={onClose} onOk={run} okDisabled={!v || !spec || !!preview?.err || !name.trim()} error={error} size="wide">
      <div className="dialog-cols">
        <div className="stack">
          <div className="label">Variable to group</div>
          <VarPicker ds={ds} value={src} onChange={setSrc} filter={isNumeric} height={260} label="Variable" />
          {preview?.p ? <div className="help num">Range {preview.p.min} to {preview.p.max}, {fmtN(preview.p.n)} valid cases{ds.filterVarId ? ' (filtered)' : ''}.</div> : null}
        </div>
        <div className="stack">
          <div className="field">
            <label htmlFor="bn-method">How to cut</label>
            <select id="bn-method" className="select" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="custom">My own cutpoints</option>
              <option value="width">Equal-width intervals</option>
              <option value="widthFrom">Intervals of a fixed width from a starting point</option>
              <option value="count">Equal-size groups (percentiles)</option>
            </select>
          </div>
          {method === 'custom' ? <TextField id="bn-cuts" label="Cutpoints (upper end of each group except the last)" value={cuts} onChange={setCuts} mono placeholder="29, 44, 64" /> : null}
          {method === 'width' ? <NumField id="bn-int" label="Number of intervals" value={intervals} onChange={setIntervals} /> : null}
          {method === 'widthFrom' ? (
            <div className="row">
              <NumField id="bn-first" label="First cutpoint" value={first} onChange={setFirst} />
              <NumField id="bn-width" label="Width" value={width} onChange={setWidth} />
            </div>
          ) : null}
          {method === 'count' ? <NumField id="bn-groups" label="Number of groups" value={groups} onChange={setGroups} help="4 = quartiles, 5 = quintiles" /> : null}
          <label className="check"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} /> A cutpoint belongs to the lower group (29 is in 18-29)</label>
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <TextField id="bn-name" label="New variable" value={name} onChange={setName} mono width={160} />
            <TextField id="bn-label" label="Label" value={label} onChange={setLabel} />
          </div>
          {preview?.err ? <div className="callout callout-warn">{preview.err}</div> : null}
          {preview?.p ? (
            <table className="table preview-table">
              <thead><tr><th className="num">Code</th><th>Label</th><th className="num">Cases</th><th style={{ width: '35%' }} /></tr></thead>
              <tbody>
                {preview.p.bins.map((b) => (
                  <tr key={b.code}>
                    <td className="num">{b.code}</td>
                    <td>{b.label}</td>
                    <td className="num">{fmtN(b.count)}</td>
                    <td><span className="stats-bar" aria-hidden="true"><span style={{ width: `${(b.count / maxCount) * 100}%` }} /></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </TransformModal>
  );
}

// ---------- Select Cases ----------

export function SelectCasesDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [kind, setKind] = useState<SelectMethod['kind']>('if');
  const [cond, setCond] = useState('');
  const [sampleMode, setSampleMode] = useState<'percent' | 'exact'>('percent');
  const [pct, setPct] = useState('25');
  const [nExact, setNExact] = useState('100');
  const [ofFirst, setOfFirst] = useState(String(ds.nCases));
  const [seed, setSeed] = useState(String(20250101));
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState(String(Math.min(ds.nCases, 100)));
  const [filterVar, setFilterVar] = useState<string>(ds.variables.find(isNumeric)?.id ?? '');
  const [output, setOutput] = useState<'filter' | 'delete'>('filter');
  const [error, setError] = useState<string | null>(null);
  const condRef = useRef<HTMLTextAreaElement>(null);

  const method: SelectMethod | null = useMemo(() => {
    switch (kind) {
      case 'all': return { kind: 'all' };
      case 'if': return cond.trim() ? { kind: 'if', condition: cond } : null;
      case 'percent':
      case 'exact':
        return sampleMode === 'percent' ? { kind: 'percent', percent: Number(pct), seed: Number(seed) || 1 } : { kind: 'exact', n: Number(nExact), ofFirst: Number(ofFirst), seed: Number(seed) || 1 };
      case 'range': return { kind: 'range', from: Number(from), to: Number(to) };
      case 'variable': return filterVar ? { kind: 'variable', varId: filterVar } : null;
    }
  }, [kind, cond, sampleMode, pct, nExact, ofFirst, seed, from, to, filterVar]);

  const preview = useMemo(() => {
    if (!method) return null;
    if (method.kind === 'all') return { n: ds.nCases };
    try {
      const sel = selectionValues(ds, method);
      let n = 0;
      for (let i = 0; i < sel.length; i++) if (sel[i] === 1) n++;
      return { n };
    } catch (e) {
      return { err: e instanceof CasesError ? e : new CasesError(e instanceof Error ? e.message : String(e)) };
    }
  }, [ds, method]);

  const run = async () => {
    if (!method) return setError(kind === 'if' ? 'Type a condition, for example age >= 18.' : 'Complete the settings first.');
    let res;
    try {
      res = selectCasesTransform(ds, method, method.kind === 'all' || method.kind === 'variable' ? 'filter' : output);
    } catch (e) {
      logFailure('transform', e, { op: 'select-cases' });
      return setError(e instanceof Error ? e.message : String(e));
    }
    if (output === 'delete' && method.kind !== 'all' && method.kind !== 'variable') {
      const nDel = ds.nCases - res.dataset.nCases;
      const ok = await useUi.getState().confirm({
        title: 'Delete unselected cases?',
        message: `${fmtN(nDel)} of ${fmtN(ds.nCases)} cases will be removed from the data. You can undo this with Ctrl+Z while the file is open, but once you save, they are gone.`,
        confirmLabel: `Delete ${fmtN(nDel)} cases`,
        danger: true,
      });
      if (!ok) return;
    }
    applyTransform(res);
    onClose();
  };

  const condErr = preview?.err && kind === 'if' ? { message: preview.err.message, pos: preview.err.pos, end: preview.err.end } : null;

  return (
    <TransformModal
      title="Select Cases"
      subtitle="Analyse only some cases, for example women over 30, or a random subsample. By default the others are filtered out, not deleted."
      onClose={onClose}
      onOk={run}
      error={error}
      okDisabled={!method || !!preview?.err}
      size="wide"
    >
      <div className="dialog-cols dialog-cols-main">
        <div className="stack">
          <div className="stack" style={{ gap: 6 }} role="radiogroup" aria-label="Which cases">
            <label className="check"><input type="radio" name="sc" checked={kind === 'all'} onChange={() => setKind('all')} /> All cases (turn the filter off)</label>
            <label className="check"><input type="radio" name="sc" checked={kind === 'if'} onChange={() => setKind('if')} /> Cases that meet a condition</label>
            {kind === 'if' ? (
              <div style={{ paddingLeft: 24 }}>
                <ExpressionField id="sc-cond" label="Condition" value={cond} onChange={(s) => { setCond(s); setError(null); }} inputRef={condRef} rows={3} error={condErr} placeholder="e.g. gender = 2 AND age > 30" help="Cases where the condition is missing are not selected." />
              </div>
            ) : null}
            <label className="check"><input type="radio" name="sc" checked={kind === 'percent' || kind === 'exact'} onChange={() => setKind('percent')} /> A random sample</label>
            {kind === 'percent' || kind === 'exact' ? (
              <div className="stack" style={{ paddingLeft: 24, gap: 8 }}>
                <div className="row">
                  <label className="check"><input type="radio" name="sm" checked={sampleMode === 'percent'} onChange={() => setSampleMode('percent')} /> About</label>
                  <input className="input input-sm num" style={{ width: 64 }} value={pct} onChange={(e) => setPct(e.target.value)} aria-label="Percent" disabled={sampleMode !== 'percent'} />
                  <span>% of all cases</span>
                </div>
                <div className="row">
                  <label className="check"><input type="radio" name="sm" checked={sampleMode === 'exact'} onChange={() => setSampleMode('exact')} /> Exactly</label>
                  <input className="input input-sm num" style={{ width: 72 }} value={nExact} onChange={(e) => setNExact(e.target.value)} aria-label="Number of cases" disabled={sampleMode !== 'exact'} />
                  <span>cases from the first</span>
                  <input className="input input-sm num" style={{ width: 80 }} value={ofFirst} onChange={(e) => setOfFirst(e.target.value)} aria-label="From the first N cases" disabled={sampleMode !== 'exact'} />
                </div>
                <div className="row">
                  <span className="help">Random seed</span>
                  <input className="input input-sm num mono" style={{ width: 110 }} value={seed} onChange={(e) => setSeed(e.target.value)} aria-label="Random seed" />
                  <button type="button" className="btn btn-sm btn-ghost" onClick={() => setSeed(String(Math.floor(Math.random() * 1e8)))}>New seed</button>
                  <span className="help">Same seed, same sample.</span>
                </div>
              </div>
            ) : null}
            <label className="check"><input type="radio" name="sc" checked={kind === 'range'} onChange={() => setKind('range')} /> A range of case numbers</label>
            {kind === 'range' ? (
              <div className="row" style={{ paddingLeft: 24 }}>
                <NumField id="sc-from" label="First case" value={from} onChange={setFrom} width={110} />
                <NumField id="sc-to" label="Last case" value={to} onChange={setTo} width={110} />
              </div>
            ) : null}
            <label className="check"><input type="radio" name="sc" checked={kind === 'variable'} onChange={() => setKind('variable')} /> Use a filter variable (cases where it is not 0)</label>
            {kind === 'variable' ? (
              <div style={{ paddingLeft: 24 }}>
                <VarSelect ds={ds} value={filterVar} onChange={setFilterVar} filter={isNumeric} label="Filter variable" />
              </div>
            ) : null}
          </div>
          {kind !== 'all' && kind !== 'variable' ? (
            <div className="stack" style={{ gap: 6 }}>
              <div className="label">Unselected cases are</div>
              <label className="check"><input type="radio" name="so" checked={output === 'filter'} onChange={() => setOutput('filter')} /> Filtered out: kept in the file, left out of analyses (creates filter_$)</label>
              <label className="check"><input type="radio" name="so" checked={output === 'delete'} onChange={() => setOutput('delete')} /> Deleted from the file</label>
            </div>
          ) : null}
          <div className="callout callout-info num" aria-live="polite">
            {preview && 'n' in preview && preview.n !== undefined
              ? `${fmtN(preview.n)} of ${fmtN(ds.nCases)} cases would be selected.`
              : preview?.err && kind !== 'if'
                ? preview.err.message
                : 'Choose which cases to use.'}
          </div>
        </div>
        {kind === 'if' ? <ExpressionHelper ds={ds} onInsert={(t) => insertAtCursor(condRef.current, cond, t, setCond)} /> : <div />}
      </div>
    </TransformModal>
  );
}

// ---------- Weight Cases ----------

export function WeightDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [on, setOn] = useState(!!ds.weightVarId);
  const [ids, setIds] = useState<string[]>(ds.weightVarId ? [ds.weightVarId] : []);
  const [error, setError] = useState<string | null>(null);
  const check = useMemo(() => {
    if (!on || !ids[0]) return null;
    try {
      return checkWeightVariable(ds, ids[0]);
    } catch {
      return null;
    }
  }, [ds, on, ids]);
  const warns = check ? weightWarnings(check) : [];
  const run = () =>
    tryRun(() => {
      applyTransform(weightCases(ds, on ? ids[0] ?? null : null));
      onClose();
    }, setError);
  return (
    <TransformModal title="Weight Cases" subtitle="Use a design or frequency weight so each case counts as many times as its weight, like SPSS WEIGHT BY." onClose={onClose} onOk={run} okDisabled={on && !ids.length} error={error}>
      <div className="stack">
        <label className="check"><input type="radio" name="wt" checked={!on} onChange={() => setOn(false)} /> Do not weight cases</label>
        <label className="check"><input type="radio" name="wt" checked={on} onChange={() => setOn(true)} /> Weight cases by</label>
        {on ? <VarPicker ds={ds} value={ids} onChange={setIds} filter={isNumeric} height={220} label="Weight variable" /> : null}
        {check ? (
          <div className="callout callout-info num">
            Weighted N = {check.sum.toLocaleString('en-US', { maximumFractionDigits: 2 })} from {fmtN(check.valid)} cases with a positive weight.
            {check.fractional ? ` ${fmtN(check.fractional)} weights have decimals; that is fine for design weights.` : ''}
          </div>
        ) : null}
        {warns.map((w) => <div key={w} className="callout callout-warn">{w}</div>)}
      </div>
    </TransformModal>
  );
}

// ---------- Sort Cases ----------

export function SortDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [keys, setKeys] = useState<SortKey[]>([]);
  const [pick, setPick] = useState<string>(ds.variables[0]?.id ?? '');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    if (!pick || keys.some((k) => k.varId === pick)) return;
    setKeys([...keys, { varId: pick, dir }]);
  };
  const run = () =>
    tryRun(() => {
      applyTransform(sortCases(ds, keys));
      onClose();
    }, setError);
  return (
    <TransformModal title="Sort Cases" subtitle="Reorder the cases by one or more variables. Ties keep their current order." onClose={onClose} onOk={run} okDisabled={!keys.length} error={error}>
      <div className="stack">
        <div className="row">
          <div style={{ flex: '1 1 180px', minWidth: 0 }}><VarSelect ds={ds} value={pick} onChange={setPick} label="Sort variable" /></div>
          <select className="select" value={dir} onChange={(e) => setDir(e.target.value as 'asc' | 'desc')} aria-label="Direction">
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
          <button type="button" className="btn" onClick={add}><Icon name="plus" size={14} /> Add</button>
        </div>
        <div className="rule-list">
          {keys.length === 0 ? <div className="help" style={{ padding: 10 }}>Add the first sort variable. Add more to break ties.</div> : null}
          {keys.map((k, i) => {
            const v = ds.variables.find((x) => x.id === k.varId)!;
            return (
              <div key={k.varId} className="rule-row">
                <span className="num muted">{i + 1}.</span>
                <span className="mono">{v.name}</span>
                <button type="button" className="btn btn-sm" onClick={() => setKeys(keys.map((x, j) => (j === i ? { ...x, dir: x.dir === 'asc' ? 'desc' : 'asc' } : x)))}>
                  <Icon name={k.dir === 'asc' ? 'sortAsc' : 'sortDesc'} size={13} /> {k.dir === 'asc' ? 'Ascending' : 'Descending'}
                </button>
                <span className="spacer" />
                <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label="Move up" disabled={i === 0} onClick={() => { const n = keys.slice(); [n[i - 1], n[i]] = [n[i], n[i - 1]]; setKeys(n); }}><Icon name="up" size={13} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label="Remove" onClick={() => setKeys(keys.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button>
              </div>
            );
          })}
        </div>
        <div className="help">Empty numeric values sort first when ascending, as in SPSS.</div>
      </div>
    </TransformModal>
  );
}
