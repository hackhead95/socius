// Data > Merge Files (Add Cases / Add Variables) and Data > Aggregate.
import { useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import type { Dataset } from '../../core/types';
import { importFile } from '../../lib/io';
import { addCases, addVariables, aggregate, AGG_FUNCTIONS, pairVariables, type AggFunction, type AggItem } from '../../lib/transform';
import { useUi } from '../../app/ui-store';
import { DATA_ACCEPT, pickFile } from '../project/fileActions';
import { VarPicker } from '../../ui/VarPicker';
import { Icon } from '../../ui/Icon';
import { applyTransform, TextField, TransformModal, tryRun, VarSelect } from './common';
import { logFailure } from '../../platform/errorlog';

const fmtN = (n: number) => n.toLocaleString('en-US');

function useOtherFile() {
  const [other, setOther] = useState<{ ds: Dataset; name: string; warnings: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const choose = async () => {
    const f = await pickFile(DATA_ACCEPT);
    if (!f) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await importFile(f.name, new Uint8Array(await f.arrayBuffer()));
      setOther({ ds: res.dataset, name: f.name, warnings: res.warnings });
    } catch (e) {
      logFailure('import', e, { file: f.name, op: 'merge: open file' });
      setErr(e instanceof Error ? e.message : `Could not open ${f.name}.`);
    } finally {
      setLoading(false);
    }
  };
  const ui = (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row">
        <button type="button" className="btn" onClick={choose} disabled={loading}><Icon name="folder" size={14} /> {other ? 'Choose another file' : 'Choose the second file'}</button>
        {loading ? <span className="help">Reading...</span> : null}
        {other ? <span className="help num"><strong className="mono">{other.name}</strong>: {fmtN(other.ds.nCases)} cases, {other.ds.variables.length} variables</span> : <span className="help">.sav, .zsav, .csv or .xlsx</span>}
      </div>
      {err ? <div className="callout callout-bad">{err}</div> : null}
    </div>
  );
  return { other, ui };
}

export function MergeCasesDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const { other, ui } = useOtherFile();
  const [keepUnpaired, setKeepUnpaired] = useState(true);
  const [indicator, setIndicator] = useState(false);
  const [indName, setIndName] = useState('source01');
  const [error, setError] = useState<string | null>(null);
  const pairing = useMemo(() => (other ? pairVariables(ds, other.ds) : null), [ds, other]);
  const run = () =>
    tryRun(() => {
      if (!other) throw new Error('Choose the file whose cases you want to add.');
      applyTransform(addCases(ds, other.ds, { keepUnpaired, sourceVar: indicator ? indName : undefined, otherName: other.name }));
      onClose();
    }, setError);
  return (
    <TransformModal title="Merge Files: Add Cases" subtitle="Append the cases of another file (for example a second wave or another city) below the current cases. Variables are matched by name." onClose={onClose} onOk={run} okDisabled={!other} error={error}>
      <div className="stack">
        {ui}
        {pairing ? (
          <>
            <div className="callout callout-info">
              {pairing.paired.length} variable{pairing.paired.length === 1 ? '' : 's'} matched by name.
              {pairing.onlyActive.length ? ` ${pairing.onlyActive.length} only in the open file.` : ''}
              {pairing.onlyOther.length ? ` ${pairing.onlyOther.length} only in ${other!.name}.` : ''}
            </div>
            {pairing.typeConflicts.length ? (
              <div className="callout callout-warn">
                Same name, different type (kept as separate variables): {pairing.typeConflicts.map((c) => c.active.name).join(', ')}.
              </div>
            ) : null}
            {pairing.onlyOther.length || pairing.onlyActive.length ? (
              <details className="details">
                <summary>Variables found in only one file</summary>
                <div className="help mono" style={{ marginTop: 6 }}>
                  {pairing.onlyActive.length ? <div>Open file: {pairing.onlyActive.map((v) => v.name).join(', ')}</div> : null}
                  {pairing.onlyOther.length ? <div>{other!.name}: {pairing.onlyOther.map((v) => v.name).join(', ')}</div> : null}
                </div>
              </details>
            ) : null}
            <label className="check"><input type="checkbox" checked={keepUnpaired} onChange={(e) => setKeepUnpaired(e.target.checked)} /> Keep variables found in only one file (their other cases become missing)</label>
            <div className="row">
              <label className="check"><input type="checkbox" checked={indicator} onChange={(e) => setIndicator(e.target.checked)} /> Mark where each case came from, in a variable named</label>
              <input className="input input-sm mono" style={{ width: 120 }} value={indName} onChange={(e) => setIndName(e.target.value)} disabled={!indicator} aria-label="Source variable name" />
            </div>
            {other!.warnings.length ? <div className="help">{other!.warnings.slice(0, 3).join(' ')}</div> : null}
          </>
        ) : null}
      </div>
    </TransformModal>
  );
}

export function MergeVariablesDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const { other, ui } = useOtherFile();
  const [mode, setMode] = useState<'key' | 'order'>('key');
  const [key, setKey] = useState('');
  const [lookup, setLookup] = useState(false);
  const [keepOther, setKeepOther] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const common = useMemo(() => {
    if (!other) return [];
    const names = new Map(other.ds.variables.map((v) => [v.name.toLowerCase(), v] as const));
    return ds.variables.filter((v) => names.get(v.name.toLowerCase())?.type === v.type);
  }, [ds, other]);
  const keyName = ds.variables.find((v) => v.id === key)?.name ?? common[0]?.name ?? '';
  const incoming = useMemo(() => {
    if (!other) return { add: [] as string[], skip: [] as string[] };
    const have = new Set(ds.variables.map((v) => v.name.toLowerCase()));
    const k = mode === 'key' ? keyName.toLowerCase() : '';
    const add: string[] = [], skip: string[] = [];
    for (const v of other.ds.variables) {
      if (v.name.toLowerCase() === k) continue;
      (have.has(v.name.toLowerCase()) ? skip : add).push(v.name);
    }
    return { add, skip };
  }, [ds, other, mode, keyName]);
  const run = () =>
    tryRun(() => {
      if (!other) throw new Error('Choose the file whose variables you want to add.');
      const res =
        mode === 'order'
          ? addVariables(ds, other.ds, { mode: 'order', otherName: other.name })
          : addVariables(ds, other.ds, { mode: 'key', key: keyName, lookup, keepUnmatchedOther: lookup ? false : keepOther, otherName: other.name });
      applyTransform(res);
      onClose();
    }, setError);
  return (
    <TransformModal title="Merge Files: Add Variables" subtitle="Add the variables of another file to the same cases, matched on an ID variable (or by case order)." onClose={onClose} onOk={run} okDisabled={!other || (mode === 'key' && !keyName)} error={error}>
      <div className="stack">
        {ui}
        {other ? (
          <>
            <div className="stack" style={{ gap: 6 }}>
              <label className="check"><input type="radio" name="mv" checked={mode === 'key'} onChange={() => setMode('key')} /> Match cases on a key variable (recommended)</label>
              {mode === 'key' ? (
                <div className="stack" style={{ paddingLeft: 24, gap: 6 }}>
                  {common.length ? (
                    <VarSelect ds={{ ...ds, variables: common }} value={key || common[0].id} onChange={setKey} label="Key variable" />
                  ) : (
                    <div className="callout callout-warn">No variable has the same name and type in both files. Rename the ID variable so it matches, or match by case order.</div>
                  )}
                  <label className="check"><input type="checkbox" checked={lookup} onChange={(e) => setLookup(e.target.checked)} /> The second file is a lookup table (one row per key, shared by many cases, e.g. household or district data)</label>
                  {!lookup ? <label className="check"><input type="checkbox" checked={keepOther} onChange={(e) => setKeepOther(e.target.checked)} /> Also add cases whose key is only in the second file</label> : null}
                </div>
              ) : null}
              <label className="check"><input type="radio" name="mv" checked={mode === 'order'} onChange={() => setMode('order')} /> Match by case order (row 1 with row 1)</label>
            </div>
            <div className="callout callout-info">
              {incoming.add.length} variable{incoming.add.length === 1 ? '' : 's'} will be added{incoming.add.length ? `: ${incoming.add.slice(0, 10).join(', ')}${incoming.add.length > 10 ? ', ...' : ''}` : ''}.
              {incoming.skip.length ? ` ${incoming.skip.length} already exist here and will be skipped.` : ''}
            </div>
          </>
        ) : null}
      </div>
    </TransformModal>
  );
}

export function AggregateDialog({ ds, onClose }: { ds: Dataset; onClose: () => void }) {
  const [breaks, setBreaks] = useState<string[]>([]);
  const [items, setItems] = useState<AggItem[]>([]);
  const [fn, setFn] = useState<AggFunction>('mean');
  const [src, setSrc] = useState(ds.variables.find((v) => v.type === 'numeric')?.id ?? '');
  const [output, setOutput] = useState<'add' | 'new'>('add');
  const [newName, setNewName] = useState(`${ds.name} (aggregated)`);
  const [error, setError] = useState<string | null>(null);
  const add = () => {
    const v = ds.variables.find((x) => x.id === src);
    const needsSrc = fn !== 'n' && fn !== 'nu';
    if (needsSrc && !v) return setError('Choose a variable to summarise.');
    const base = needsSrc ? `${v!.name}_${fn}` : fn === 'n' ? 'N_BREAK' : 'NU_BREAK';
    let name = base;
    for (let i = 1; items.some((it) => it.name === name) || ds.variables.some((x) => x.name.toLowerCase() === name.toLowerCase()); i++) name = `${base}_${i}`;
    setItems([...items, { fn, sourceId: needsSrc ? src : undefined, name }]);
    setError(null);
  };
  const run = async () => {
    let res;
    try {
      res = aggregate(ds, { breakIds: breaks, items, output, newName });
    } catch (e) {
      logFailure('transform', e, { op: 'aggregate' });
      return setError(e instanceof Error ? e.message : String(e));
    }
    if (output === 'new' && res.newDataset) {
      const ok = await useUi.getState().confirm({
        title: 'Replace the open data with the summary?',
        message: `The open data will be replaced by "${res.newDataset.name}" (${fmtN(res.newDataset.nCases)} groups). Press Ctrl+Z to get the original data back, or save a project first.`,
        confirmLabel: 'Replace',
      });
      if (!ok) return;
      applyTransform({ ...res, dataset: res.newDataset });
      useStore.getState().setTab('data');
    } else applyTransform(res);
    onClose();
  };
  return (
    <TransformModal title="Aggregate" subtitle="Summarise cases by group, for example the mean income per district, and add it to every case or make a file with one row per group." onClose={onClose} onOk={run} okDisabled={!items.length} error={error} size="wide">
      <div className="dialog-cols">
        <div className="stack">
          <div className="label">Group by (break variables)</div>
          <VarPicker ds={ds} value={breaks} onChange={setBreaks} multiple height={260} label="Break variables" />
          <div className="help">Leave empty to summarise the whole file.</div>
        </div>
        <div className="stack">
          <div className="label">Summaries</div>
          <div className="row">
            <select className="select" value={fn} onChange={(e) => setFn(e.target.value as AggFunction)} aria-label="Function">
              {AGG_FUNCTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            {fn !== 'n' && fn !== 'nu' ? <div style={{ flex: '1 1 160px', minWidth: 0 }}><VarSelect ds={ds} value={src} onChange={setSrc} label="Variable to summarise" /></div> : null}
            <button type="button" className="btn" onClick={add}><Icon name="plus" size={14} /> Add</button>
          </div>
          <div className="rule-list">
            {items.length === 0 ? <div className="help" style={{ padding: 10 }}>Add at least one summary.</div> : null}
            {items.map((it, i) => (
              <div key={i} className="rule-row">
                <input className="input input-sm mono" style={{ width: 150 }} value={it.name} aria-label="New variable name" onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <span className="help">= {AGG_FUNCTIONS.find((f) => f.id === it.fn)!.label}{it.sourceId ? ` of ${ds.variables.find((v) => v.id === it.sourceId)?.name}` : ''}</span>
                <span className="spacer" />
                <button type="button" className="btn btn-sm btn-ghost btn-icon" aria-label="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon name="trash" size={13} /></button>
              </div>
            ))}
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <label className="check"><input type="radio" name="ag" checked={output === 'add'} onChange={() => setOutput('add')} /> Add the summaries to every case in the open data</label>
            <label className="check"><input type="radio" name="ag" checked={output === 'new'} onChange={() => setOutput('new')} /> Replace the open data with one case per group</label>
            {output === 'new' ? <TextField id="ag-name" label="Name of the summary data" value={newName} onChange={setNewName} /> : null}
          </div>
          {ds.filterVarId || ds.weightVarId ? <div className="help">{ds.filterVarId ? 'Only selected cases are summarised. ' : ''}{ds.weightVarId ? 'Means, sums and N are weighted.' : ''}</div> : null}
        </div>
      </div>
    </TransformModal>
  );
}
