// Transform > Compute Variable.
import { useMemo, useRef, useState } from 'react';
import type { Dataset } from '../../core/types';
import { getVariable } from '../../core/data';
import { ComputeError, computeVariable, previewCompute, type ComputeSpec } from '../../lib/transform';
import { applyTransform, ExpressionField, ExpressionHelper, insertAtCursor, TransformModal, TextField } from './common';

export function ComputeDialog({ ds, onClose, params }: { ds: Dataset; onClose: () => void; params?: Record<string, unknown> }) {
  const [target, setTarget] = useState(typeof params?.target === 'string' ? params.target : '');
  const [label, setLabel] = useState('');
  // 'auto' follows the formula: text functions make a string variable, arithmetic a numeric one.
  const [type, setType] = useState<'auto' | 'numeric' | 'string'>('auto');
  const [expr, setExpr] = useState(typeof params?.expression === 'string' ? params.expression : '');
  const [useIf, setUseIf] = useState(false);
  const [cond, setCond] = useState('');
  const [runError, setRunError] = useState<string | null>(null);
  const exprRef = useRef<HTMLTextAreaElement>(null);
  const condRef = useRef<HTMLTextAreaElement>(null);
  const lastField = useRef<'expr' | 'cond'>('expr');

  const existing = target.trim() ? getVariable(ds, target.trim()) : undefined;
  const exists = !!existing && existing.name.toLowerCase() === target.trim().toLowerCase();
  const spec: ComputeSpec = { target: target.trim(), label: label.trim() || undefined, type: exists || type === 'auto' ? undefined : type, expression: expr, condition: useIf ? cond : undefined };

  const preview = useMemo(() => {
    if (!expr.trim()) return { rows: null, err: null as ComputeError | null };
    try {
      return { rows: previewCompute(ds, { ...spec, target: spec.target || '__preview' }, 8), err: null };
    } catch (e) {
      if (e instanceof ComputeError) return { rows: null, err: e };
      return { rows: null, err: new ComputeError('expression', e instanceof Error ? e.message : String(e)) };
    }
  }, [ds, expr, cond, useIf, target, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const exprErr = preview.err && preview.err.field === 'expression' ? { message: preview.err.message, pos: preview.err.pos, end: preview.err.end } : null;
  const condErr = preview.err && preview.err.field === 'condition' ? { message: preview.err.message, pos: preview.err.pos, end: preview.err.end } : null;
  const targetErr = preview.err && preview.err.field === 'target' ? preview.err.message : null;

  const insert = (text: string) => {
    if (lastField.current === 'cond' && useIf) insertAtCursor(condRef.current, cond, text, setCond);
    else insertAtCursor(exprRef.current, expr, text, setExpr);
  };

  const run = () => {
    if (!target.trim()) return setRunError('Enter a name for the target variable.');
    if (!expr.trim()) return setRunError('Enter an expression.');
    try {
      applyTransform(computeVariable(ds, spec));
      onClose();
    } catch (e) {
      setRunError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <TransformModal
      title="Compute Variable"
      subtitle="Create a new variable, or change an existing one, from a formula. Works like SPSS COMPUTE."
      size="wide"
      onClose={onClose}
      onOk={run}
      okDisabled={!target.trim() || !expr.trim() || !!preview.err}
      error={runError}
    >
      <div className="dialog-cols dialog-cols-main">
        <div className="stack">
          <div className="row" style={{ alignItems: 'flex-start' }}>
            <TextField id="cv-target" label="Target variable" value={target} onChange={(s) => { setTarget(s); setRunError(null); }} mono list="cv-names" width={200} placeholder="e.g. trust_idx" />
            <datalist id="cv-names">{ds.variables.map((v) => <option key={v.id} value={v.name} />)}</datalist>
            <TextField id="cv-label" label="Label (optional)" value={label} onChange={setLabel} placeholder={existing?.label || 'What the new variable measures'} />
            {!exists ? (
              <div className="field" style={{ width: 150 }}>
                <label htmlFor="cv-type">Type</label>
                <select id="cv-type" className="select" value={type} onChange={(e) => setType(e.target.value as 'auto' | 'numeric' | 'string')}>
                  <option value="auto">From the formula</option>
                  <option value="numeric">Numeric</option>
                  <option value="string">String</option>
                </select>
              </div>
            ) : null}
          </div>
          <div className="help">
            {targetErr ? <span className="text-bad">{targetErr}</span> : exists ? <>This will change the existing variable <span className="mono">{existing!.name}</span>{useIf ? ' for cases that meet the condition' : ''}.</> : target.trim() ? 'A new variable will be added at the end.' : ' '}
          </div>
          <ExpressionField
            id="cv-expr"
            label="Numeric or string expression"
            value={expr}
            onChange={(s) => { setExpr(s); setRunError(null); }}
            inputRef={exprRef}
            onFocus={() => (lastField.current = 'expr')}
            error={exprErr}
            rows={4}
            placeholder="e.g. MEAN.4(trust1 TO trust5)   or   income / hhsize"
            help={<>Missing values follow SPSS rules: arithmetic with a missing value gives system-missing; MEAN, SUM and friends skip missing values.</>}
          />
          <label className="check">
            <input type="checkbox" checked={useIf} onChange={(e) => setUseIf(e.target.checked)} />
            Only compute for cases that meet a condition (If)
          </label>
          {useIf ? (
            <ExpressionField
              id="cv-cond"
              label="Condition"
              value={cond}
              onChange={setCond}
              inputRef={condRef}
              onFocus={() => (lastField.current = 'cond')}
              error={condErr}
              rows={2}
              placeholder="e.g. age >= 18 AND gender = 2"
              help={exists ? 'Other cases keep their current value.' : 'Other cases get system-missing.'}
            />
          ) : null}
          <div>
            <div className="label" style={{ marginBottom: 4 }}>Preview (first cases)</div>
            {preview.rows ? (
              <table className="table preview-table">
                <thead>
                  <tr>
                    <th className="num">Case</th>
                    {exists ? <th className="num">Now</th> : null}
                    <th className="num">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.row} className={r.applied ? '' : 'muted'}>
                      <td className="num">{r.row + 1}</td>
                      {exists ? <td className="num mono">{r.before || '.'}</td> : null}
                      <td className="num mono">{r.after === '' ? '.' : r.after}{!r.applied ? <span className="help"> (condition false)</span> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="help">{expr.trim() ? 'Fix the expression to see a preview.' : 'Type an expression to see the result for the first cases.'}</div>
            )}
          </div>
        </div>
        <ExpressionHelper ds={ds} onInsert={insert} />
      </div>
    </TransformModal>
  );
}
