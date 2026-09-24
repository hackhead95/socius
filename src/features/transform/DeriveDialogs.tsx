// Automatic Recode, Reverse-code items, Create Scale, Standardize, Count Values, Rank Cases.
import { useEffect, useMemo, useState } from 'react';
import type { Dataset, Variable } from '../../core/types';
import { activeCaseMask, caseWeights, isMissingValue, uniqueVarName } from '../../core/data';
import {
  autoRecode, countValues, createScale, describeFrom, detectScaleRange, rankCases, reverseCode, standardize,
  type RecodeFrom, type RankSpec,
} from '../../lib/transform';
import { reliabilityAnalysis } from '../../lib/stats/reliability';
import { VarPicker } from '../../ui/VarPicker';
import { Icon } from '../../ui/Icon';
import { applyTransform, NumField, TextField, TransformModal, tryRun, useFromEditor } from './common';

const isNumeric = (v: Variable) => v.type === 'numeric';

function useSuggestedNames(ds: Dataset, ids: string[], make: (v: Variable) => string) {
  const [names, setNames] = useState<Record<string, string>>({});
  useEffect(() => {
    setNames((prev) => {
      const next: Record<string, string> = {};
      let tmp = ds;
      for (const id of ids) {
        const v = ds.variables.find((x) => x.id === id);
        if (!v) continue;
        next[id] = prev[id] ?? uniqueVarName(tmp, make(v));
        tmp = { ...tmp, variables: [...tmp.variables, { ...v, id: `tmp_${id}`, name: next[id] }] };
      }
      return next;
    });
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return [names, setNames] as const;
}

// ---------- Automatic Recode ----------

export function AutoRecodeDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [desc, setDesc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useSuggestedNames(ds, ids, (v) => `${v.name}_n`);
  const run = () =>
    tryRun(() => {
      applyTransform(autoRecode(ds, { items: ids.map((id) => ({ sourceId: id, name: names[id] ?? '' })), descending: desc }));
      onClose();
    }, setError);
  return (
    <TransformModal title="Automatic Recode" subtitle="Turn text answers (or scattered codes) into consecutive numbers 1, 2, 3... The old values become value labels." onClose={onClose} onOk={run} okDisabled={!ids.length} error={error} size="wide">
      <div className="dialog-cols">
        <VarPicker ds={ds} value={ids} onChange={setIds} multiple height={320} label="Variables" />
        <div className="stack">
          <div className="label">New variable names</div>
          {ids.length === 0 ? <div className="help">Pick variables on the left, for example a text variable with city names.</div> : null}
          <div className="out-names">
            {ids.map((id) => {
              const v = ds.variables.find((x) => x.id === id)!;
              return (
                <div key={id} className="out-name-row">
                  <span className="mono out-src">{v.name}</span>
                  <Icon name="chevronRight" size={12} />
                  <input className="input input-sm mono" aria-label={`New name for ${v.name}`} value={names[id] ?? ''} onChange={(e) => setNames({ ...names, [id]: e.target.value })} />
                </div>
              );
            })}
          </div>
          <div className="row">
            <label className="check"><input type="radio" name="ard" checked={!desc} onChange={() => setDesc(false)} /> Lowest value gets 1</label>
            <label className="check"><input type="radio" name="ard" checked={desc} onChange={() => setDesc(true)} /> Highest value gets 1</label>
          </div>
          <div className="help">User-missing values get the highest codes and stay declared as missing.</div>
        </div>
      </div>
    </TransformModal>
  );
}

// ---------- Reverse-code ----------

export function ReverseDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'new' | 'replace'>('new');
  const [suffix, setSuffix] = useState('_r');
  const [override, setOverride] = useState(false);
  const [min, setMin] = useState('1');
  const [max, setMax] = useState('5');
  const [error, setError] = useState<string | null>(null);
  const ranges = useMemo(() => ids.map((id) => {
    const v = ds.variables.find((x) => x.id === id)!;
    return { v, r: detectScaleRange(ds, v) };
  }), [ds, ids]);
  const run = () =>
    tryRun(() => {
      const range = override ? { min: Number(min), max: Number(max) } : undefined;
      if (range && !(Number.isFinite(range.min) && Number.isFinite(range.max) && range.min < range.max)) throw new Error('Enter a lowest and highest scale point, lowest first.');
      applyTransform(reverseCode(ds, { varIds: ids, mode, suffix: suffix.trim() || '_r', range }));
      onClose();
    }, setError);
  return (
    <TransformModal title="Reverse-code Items" subtitle="Flip negatively worded Likert items so that high always means the same thing (1 becomes 5, 2 becomes 4...)." onClose={onClose} onOk={run} okDisabled={!ids.length} error={error} size="wide">
      <div className="dialog-cols">
        <VarPicker ds={ds} value={ids} onChange={setIds} multiple filter={isNumeric} height={320} label="Items" />
        <div className="stack">
          <div className="label">Detected scale</div>
          {ranges.length === 0 ? <div className="help">Pick the items to reverse.</div> : null}
          <div className="out-names">
            {ranges.map(({ v, r }) => (
              <div key={v.id} className="out-name-row">
                <span className="mono out-src">{v.name}</span>
                <span className="num">{r ? `${r.min} to ${r.max}` : 'no data'}</span>
                <span className="help">{r ? (r.source === 'labels' ? 'from value labels' : 'from the data') : ''}</span>
              </div>
            ))}
          </div>
          <label className="check"><input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} /> Use these scale points for all items</label>
          {override ? (
            <div className="row">
              <NumField id="rv-min" label="Lowest" value={min} onChange={setMin} width={90} />
              <NumField id="rv-max" label="Highest" value={max} onChange={setMax} width={90} />
            </div>
          ) : null}
          <div className="stack" style={{ gap: 6 }}>
            <label className="check"><input type="radio" name="rvm" checked={mode === 'new'} onChange={() => setMode('new')} /> Create new variables, named with the suffix</label>
            {mode === 'new' ? <input className="input input-sm mono" style={{ width: 90, marginLeft: 24 }} value={suffix} onChange={(e) => setSuffix(e.target.value)} aria-label="Suffix" /> : null}
            <label className="check"><input type="radio" name="rvm" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace the original values</label>
          </div>
          <div className="help">Missing-value codes (such as 8 or 9) are kept as they are. Value labels are flipped too.</div>
        </div>
      </div>
    </TransformModal>
  );
}

// ---------- Create Scale ----------

export function ScaleDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [method, setMethod] = useState<'mean' | 'sum'>('mean');
  const [minValid, setMinValid] = useState<string>('');
  const [name, setName] = useState('scale');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const k = ids.length;
  const effMin = minValid === '' ? Math.max(1, k - 1) : Number(minValid);

  const alpha = useMemo(() => {
    if (k < 2) return null;
    try {
      const vars = ids.map((id) => ds.variables.find((v) => v.id === id)!);
      const mask = activeCaseMask(ds);
      const w = caseWeights(ds);
      const rows: number[] = [];
      for (let i = 0; i < ds.nCases; i++) {
        if (!mask[i] || w[i] <= 0) continue;
        if (vars.every((v) => !isMissingValue(v, ds.columns[v.id][i]))) rows.push(i);
      }
      if (rows.length < 3) return { text: 'Too few complete cases to estimate reliability.', neg: [] as string[] };
      const items = vars.map((v) => Float64Array.from(rows, (i) => (ds.columns[v.id] as Float64Array)[i]));
      const res = reliabilityAnalysis(items, Float64Array.from(rows, (i) => w[i]));
      const neg = vars.filter((_, j) => res.itemTotal[j].correctedItemTotal < 0).map((v) => v.name);
      const a = res.alpha;
      const fmt = Number.isFinite(a) ? (a < 0 ? '-' : '') + Math.abs(a).toFixed(2).replace(/^0/, '') : '.';
      return { text: `Cronbach's alpha = ${fmt} (${rows.length.toLocaleString('en-US')} complete cases${ds.weightVarId ? ', weighted' : ''}).`, neg };
    } catch (e) {
      return { text: e instanceof Error ? e.message : 'Reliability could not be computed.', neg: [] as string[] };
    }
  }, [ds, ids, k]);

  const run = () =>
    tryRun(() => {
      const res = createScale(ds, { itemIds: ids, method, minValid: effMin, name, label: label.trim() || undefined });
      // Keep the reliability estimate in the output log next to the syntax.
      applyTransform(alpha && /alpha/.test(alpha.text) ? { ...res, summary: `${res.summary} ${alpha.text}` } : res);
      onClose();
    }, setError);

  return (
    <TransformModal title="Create Scale / Index" subtitle="Combine several items into one score, for example a trust index from five Likert items." onClose={onClose} onOk={run} okDisabled={k < 2 || !name.trim()} error={error} size="wide">
      <div className="dialog-cols">
        <VarPicker ds={ds} value={ids} onChange={setIds} multiple filter={isNumeric} height={320} label="Items" />
        <div className="stack">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <TextField id="sc-name" label="Name" value={name} onChange={setName} mono width={160} />
            <TextField id="sc-label" label="Label" value={label} onChange={setLabel} placeholder="e.g. Neighbourhood trust (mean of 5 items)" />
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <div className="label">Score</div>
            <label className="check"><input type="radio" name="scm" checked={method === 'mean'} onChange={() => setMethod('mean')} /> Mean of the answered items (keeps the answer scale, recommended)</label>
            <label className="check"><input type="radio" name="scm" checked={method === 'sum'} onChange={() => setMethod('sum')} /> Sum of the answered items</label>
          </div>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <NumField id="sc-min" label="Minimum answered items" value={minValid === '' ? String(Math.max(1, k - 1)) : minValid} onChange={setMinValid} width={170} />
            <span className="help" style={{ paddingBottom: 8 }}>{k ? `of ${k}. Cases with fewer get system-missing.` : ''}</span>
          </div>
          {alpha ? (
            <div className={`callout ${alpha.neg.length ? 'callout-warn' : 'callout-info'}`}>
              <div>{alpha.text}</div>
              {alpha.neg.length ? <div>{alpha.neg.join(', ')} {alpha.neg.length === 1 ? 'goes' : 'go'} against the other items. Reverse-code {alpha.neg.length === 1 ? 'it' : 'them'} first (Transform &gt; Reverse-code items).</div> : null}
            </div>
          ) : <div className="help">Pick at least two items. Reverse-code negatively worded items first.</div>}
          <div className="help mono">{k >= 2 ? `COMPUTE ${name || 'scale'}=${method.toUpperCase()}.${effMin}(${ids.map((id) => ds.variables.find((v) => v.id === id)!.name).join(', ')}).` : ''}</div>
        </div>
      </div>
    </TransformModal>
  );
}

// ---------- Standardize ----------

export function StandardizeDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const run = () =>
    tryRun(() => {
      applyTransform(standardize(ds, ids));
      onClose();
    }, setError);
  return (
    <TransformModal title="Standardize (z-scores)" subtitle="Save z-scores: how many standard deviations each case is above or below the mean. Same as SPSS DESCRIPTIVES /SAVE." onClose={onClose} onOk={run} okDisabled={!ids.length} error={error}>
      <div className="stack">
        <VarPicker ds={ds} value={ids} onChange={setIds} multiple filter={isNumeric} height={280} label="Variables" />
        <div className="help">
          New variables are named Z plus the original name{ids.length ? `: ${ids.map((id) => 'Z' + ds.variables.find((v) => v.id === id)!.name).join(', ')}` : ''}.
          {ds.weightVarId ? ' The mean and standard deviation are weighted.' : ''}
          {ds.filterVarId ? ' Filtered-out cases get system-missing.' : ''}
        </div>
      </div>
    </TransformModal>
  );
}

// ---------- Count ----------

export function CountDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [values, setValues] = useState<RecodeFrom[]>([]);
  const [name, setName] = useState('count');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const first = ds.variables.find((v) => v.id === ids[0]);
  const type = first?.type ?? 'numeric';
  const from = useFromEditor(type, false);
  const add = () => {
    const f = from.build();
    if (typeof f === 'string') return setError(f);
    setValues([...values, f]);
    from.reset();
    setError(null);
  };
  const run = () =>
    tryRun(() => {
      applyTransform(countValues(ds, { varIds: ids, values, name, label: label.trim() || undefined }));
      onClose();
    }, setError);
  return (
    <TransformModal title="Count Values within Cases" subtitle="For each case, count how many of the chosen variables have certain values, for example how many of six civic activities a respondent did." onClose={onClose} onOk={run} okDisabled={!ids.length || !values.length || !name.trim()} error={error} size="wide">
      <div className="dialog-cols">
        <VarPicker ds={ds} value={ids} onChange={setIds} multiple height={320} label="Variables" />
        <div className="stack">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <TextField id="ct-name" label="New variable" value={name} onChange={setName} mono width={160} />
            <TextField id="ct-label" label="Label" value={label} onChange={setLabel} placeholder="e.g. Number of civic activities" />
          </div>
          <div className="label">Values to count</div>
          <div className="row">
            {from.ui}
            <button type="button" className="btn" onClick={add}><Icon name="plus" size={14} /> Add</button>
          </div>
          <div className="rule-list">
            {values.length === 0 ? <div className="help" style={{ padding: 10 }}>For yes/no items coded 1 = yes, add the value 1.</div> : null}
            {values.map((f, i) => (
              <div key={i} className="rule-row">
                <span className="mono">{describeFrom(f)}</span>
                <span className="spacer" />
                <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label="Remove" onClick={() => setValues(values.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TransformModal>
  );
}

// ---------- Rank ----------

export function RankDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [ids, setIds] = useState<string[]>([]);
  const [order, setOrder] = useState<RankSpec['order']>('asc');
  const [ties, setTies] = useState<RankSpec['ties']>('mean');
  const [type, setType] = useState<RankSpec['type']>('rank');
  const [k, setK] = useState('4');
  const [error, setError] = useState<string | null>(null);
  const run = () =>
    tryRun(() => {
      applyTransform(rankCases(ds, { varIds: ids, order, ties, type, ntiles: Number(k) }));
      onClose();
    }, setError);
  return (
    <TransformModal title="Rank Cases" subtitle="Save the rank of each case, its percentile rank, or its quartile / percentile group." onClose={onClose} onOk={run} okDisabled={!ids.length} error={error} size="wide">
      <div className="dialog-cols">
        <VarPicker ds={ds} value={ids} onChange={setIds} multiple height={300} label="Variables" />
        <div className="stack">
          <div className="field">
            <label htmlFor="rk-type">Save</label>
            <select id="rk-type" className="select" value={type} onChange={(e) => setType(e.target.value as RankSpec['type'])}>
              <option value="rank">Rank (R + name)</option>
              <option value="percent">Percent rank (P + name)</option>
              <option value="ntiles">Groups of equal size, e.g. quartiles (N + name)</option>
            </select>
          </div>
          {type === 'ntiles' ? <NumField id="rk-k" label="Number of groups" value={k} onChange={setK} width={140} help="4 = quartiles, 5 = quintiles, 10 = deciles" /> : null}
          <div className="field">
            <label htmlFor="rk-order">Rank 1 goes to</label>
            <select id="rk-order" className="select" value={order} onChange={(e) => setOrder(e.target.value as RankSpec['order'])}>
              <option value="asc">The smallest value</option>
              <option value="desc">The largest value</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="rk-ties">Tied values get</label>
            <select id="rk-ties" className="select" value={ties} onChange={(e) => setTies(e.target.value as RankSpec['ties'])}>
              <option value="mean">The mean of their ranks (SPSS default)</option>
              <option value="low">The lowest of their ranks</option>
              <option value="high">The highest of their ranks</option>
              <option value="condense">Consecutive ranks (1, 2, 2, 3)</option>
            </select>
          </div>
        </div>
      </div>
    </TransformModal>
  );
}
