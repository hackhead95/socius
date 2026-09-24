// Transform > Recode into Same Variables / Recode into Different Variables.
import { useEffect, useMemo, useState } from 'react';
import type { Dataset, ValueLabel } from '../../core/types';
import { uniqueVarName } from '../../core/data';
import { describeFrom, describeTo, recodeDifferent, recodeSame, type RecodeRule, type RecodeTo } from '../../lib/transform';
import { VarPicker } from '../../ui/VarPicker';
import { Icon } from '../../ui/Icon';
import { applyTransform, ExpressionField, TransformModal, tryRun, useFromEditor } from './common';

export function RecodeDialog({ ds, mode, onClose }: { ds: Dataset; mode: 'same' | 'different'; onClose: () => void }) {
  const [vars, setVars] = useState<string[]>([]);
  const [names, setNames] = useState<Record<string, { name: string; label: string }>>({});
  const [outType, setOutType] = useState<'numeric' | 'string'>('numeric');
  const [outWidth, setOutWidth] = useState('8');
  const [rules, setRules] = useState<RecodeRule[]>([]);
  const [toKind, setToKind] = useState<RecodeTo['kind']>('value');
  const [toVal, setToVal] = useState('');
  const [labels, setLabels] = useState<Array<{ value: string; label: string }>>([]);
  const [useIf, setUseIf] = useState(false);
  const [cond, setCond] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selected = vars.map((id) => ds.variables.find((v) => v.id === id)!).filter(Boolean);
  const srcType = selected[0]?.type ?? 'numeric';
  const mixed = new Set(selected.map((v) => v.type)).size > 1;
  const newType = mode === 'same' ? srcType : outType;
  const from = useFromEditor(srcType);

  // Suggest output names for newly picked variables.
  useEffect(() => {
    if (mode !== 'different') return;
    setNames((prev) => {
      const next = { ...prev };
      let tmp = { ...ds, variables: ds.variables.slice() } as Dataset;
      for (const v of selected) {
        if (!next[v.id]) {
          const n = uniqueVarName(tmp, `${v.name}_rec`);
          next[v.id] = { name: n, label: v.label ? `${v.label} (recoded)` : '' };
        }
        tmp = { ...tmp, variables: [...tmp.variables, { ...v, id: `tmp_${v.id}`, name: next[v.id].name }] };
      }
      return next;
    });
  }, [vars.join(','), mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const addRule = () => {
    const f = from.build();
    if (typeof f === 'string') return setError(f);
    let to: RecodeTo;
    if (toKind === 'value') {
      if (newType === 'numeric') {
        const n = Number(toVal.trim());
        if (toVal.trim() === '' || !Number.isFinite(n)) return setError('The new value must be a number.');
        to = { kind: 'value', value: n };
      } else to = { kind: 'value', value: toVal };
    } else to = { kind: toKind } as RecodeTo;
    const dup = rules.findIndex((r) => JSON.stringify(r.from) === JSON.stringify(f));
    const next = rules.slice();
    const rule = { from: f, to };
    if (dup >= 0) next[dup] = rule;
    else if (f.kind === 'else') next.push(rule);
    else {
      const elseIdx = next.findIndex((r) => r.from.kind === 'else');
      next.splice(elseIdx >= 0 ? elseIdx : next.length, 0, rule);
    }
    setRules(next);
    from.reset();
    setToVal('');
    setError(null);
  };

  const moveRule = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= rules.length) return;
    const next = rules.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setRules(next);
  };

  // New codes that could get labels (different mode).
  const newCodes = useMemo(() => {
    const set = new Map<string, number | string>();
    for (const r of rules) if (r.to.kind === 'value') set.set(String(r.to.value), r.to.value);
    return [...set.values()];
  }, [rules]);

  useEffect(() => {
    setLabels((prev) => {
      const have = new Map(prev.map((l) => [l.value, l.label]));
      return newCodes.map((c) => ({ value: String(c), label: have.get(String(c)) ?? '' }));
    });
  }, [newCodes]);

  const run = () => {
    if (!selected.length) return setError('Choose at least one variable.');
    if (mixed) return setError('Recode numeric and string variables separately.');
    if (!rules.length) return setError('Add at least one rule with the Add button.');
    tryRun(() => {
      if (mode === 'same') {
        applyTransform(recodeSame(ds, { varIds: vars, rules, condition: useIf ? cond : undefined }), 'Recode into same variables');
      } else {
        const valueLabels: ValueLabel[] = labels
          .filter((l) => l.label.trim())
          .map((l) => ({ value: outType === 'numeric' ? Number(l.value) : l.value, label: l.label.trim() }));
        applyTransform(
          recodeDifferent(ds, {
            targets: selected.map((v) => ({ sourceId: v.id, name: names[v.id]?.name ?? '', label: names[v.id]?.label || undefined })),
            rules,
            outType,
            width: Number(outWidth) || 8,
            valueLabels,
            condition: useIf ? cond : undefined,
          }),
          'Recode into different variables',
        );
      }
      onClose();
    }, setError);
  };

  return (
    <TransformModal
      title={mode === 'same' ? 'Recode into Same Variables' : 'Recode into Different Variables'}
      subtitle={mode === 'same' ? 'Change codes in place, for example 8 and 9 to system-missing. The old values are replaced.' : 'Make new variables from old codes, for example age groups from age. The original variables stay as they are.'}
      size="wide"
      onClose={onClose}
      onOk={run}
      error={error}
    >
      <div className="dialog-cols">
        <div className="stack">
          <div className="label">Variables to recode</div>
          <VarPicker ds={ds} value={vars} onChange={(ids) => { setVars(ids); setError(null); }} multiple height={mode === 'different' ? 180 : 300} label="Variables" />
          {mixed ? <div className="callout callout-warn">You picked numeric and string variables. Recode them separately.</div> : null}
          {mode === 'different' && selected.length ? (
            <div className="stack" style={{ gap: 6 }}>
              <div className="label">New variables</div>
              <div className="out-names">
                {selected.map((v) => (
                  <div key={v.id} className="out-name-row">
                    <span className="mono out-src">{v.name}</span>
                    <Icon name="chevronRight" size={12} />
                    <input className="input input-sm mono" aria-label={`New name for ${v.name}`} value={names[v.id]?.name ?? ''} onChange={(e) => setNames({ ...names, [v.id]: { ...(names[v.id] ?? { label: '' }), name: e.target.value } })} />
                    <input className="input input-sm" aria-label={`Label for new ${v.name}`} placeholder="Label" value={names[v.id]?.label ?? ''} onChange={(e) => setNames({ ...names, [v.id]: { ...(names[v.id] ?? { name: '' }), label: e.target.value } })} />
                  </div>
                ))}
              </div>
              <div className="row">
                <label className="check"><input type="radio" name="rt" checked={outType === 'numeric'} onChange={() => { setOutType('numeric'); setRules([]); }} /> Numeric result</label>
                <label className="check"><input type="radio" name="rt" checked={outType === 'string'} onChange={() => { setOutType('string'); setRules([]); }} /> Text result, width</label>
                <input className="input input-sm num" style={{ width: 56 }} value={outWidth} onChange={(e) => setOutWidth(e.target.value)} aria-label="Text width" disabled={outType !== 'string'} />
              </div>
            </div>
          ) : null}
        </div>
        <div className="stack">
          <div className="label">Old and new values</div>
          <div className="rule-builder">
            <div className="rule-side">
              <div className="help">Old value</div>
              {from.ui}
            </div>
            <div className="rule-side">
              <div className="help">New value</div>
              <div className="from-editor">
                <select className="select" value={toKind} onChange={(e) => setToKind(e.target.value as RecodeTo['kind'])} aria-label="New value type">
                  <option value="value">Value</option>
                  <option value="sysmis">System-missing</option>
                  <option value="copy">Copy old value</option>
                </select>
                {toKind === 'value' ? <input className="input mono" style={{ width: 90 }} value={toVal} onChange={(e) => setToVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRule()} aria-label="New value" placeholder="value" /> : null}
              </div>
            </div>
            <button type="button" className="btn" onClick={addRule} style={{ alignSelf: 'flex-end' }}><Icon name="plus" size={14} /> Add</button>
          </div>
          <div className="rule-list" aria-label="Rules">
            {rules.length === 0 ? <div className="help" style={{ padding: 10 }}>No rules yet. The first matching rule wins, like in SPSS.</div> : null}
            {rules.map((r, i) => (
              <div key={i} className="rule-row">
                <span className="mono">{describeFrom(r.from)}</span>
                <Icon name="chevronRight" size={12} />
                <span className="mono">{describeTo(r.to)}</span>
                <span className="spacer" />
                <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => moveRule(i, -1)} disabled={i === 0} aria-label="Move rule up"><Icon name="up" size={13} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => moveRule(i, 1)} disabled={i === rules.length - 1} aria-label="Move rule down"><Icon name="down" size={13} /></button>
                <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={() => setRules(rules.filter((_, j) => j !== i))} aria-label="Remove rule"><Icon name="trash" size={13} /></button>
              </div>
            ))}
          </div>
          {mode === 'same' ? (
            <div className="help">Values without a rule stay unchanged.</div>
          ) : rules.length && !rules.some((r) => r.from.kind === 'else') ? (
            // Easy to miss in small print: unmatched values would silently become missing data.
            <div className="callout callout-warn" role="note">
              Values without a rule become missing in the new variable.{' '}
              {selected.length && selected.every((v) => (v.type === 'string') === (outType === 'string')) ? (
                <button type="button" className="linkish" onClick={() => setRules([...rules, { from: { kind: 'else' }, to: { kind: 'copy' } }])}>
                  Keep them: add "All other values → Copy old value"
                </button>
              ) : null}
            </div>
          ) : (
            <div className="help">Values without a rule become missing. Add "All other values" with "Copy old value" to keep them.</div>
          )}
          {mode === 'different' && labels.length ? (
            <div className="stack" style={{ gap: 6 }}>
              <div className="label">Labels for the new codes (optional)</div>
              {labels.map((l, i) => (
                <div key={l.value} className="row" style={{ flexWrap: 'nowrap' }}>
                  <span className="mono num" style={{ minWidth: 48, textAlign: 'right' }}>{l.value}</span>
                  <input className="input input-sm" style={{ flex: 1 }} aria-label={`Label for ${l.value}`} value={l.label} placeholder="e.g. 18 to 29" onChange={(e) => setLabels(labels.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                </div>
              ))}
            </div>
          ) : null}
          <label className="check"><input type="checkbox" checked={useIf} onChange={(e) => setUseIf(e.target.checked)} /> Only recode cases that meet a condition (If)</label>
          {useIf ? <ExpressionField id="rc-cond" label="Condition" value={cond} onChange={setCond} rows={2} placeholder="e.g. wave = 2" /> : null}
        </div>
      </div>
    </TransformModal>
  );
}
