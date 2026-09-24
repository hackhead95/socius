// Shared building blocks for transformation dialogs.
import { useMemo, useState, type ReactNode, type RefObject } from 'react';
import { useStore } from '../../core/store';
import type { Dataset, Variable } from '../../core/types';
import { selectCasesTransform, transformLogItem, weightCases, type TransformResult, FUNCTION_DOCS, OPERATOR_DOCS, SYSTEM_VARIABLES, type FunctionCategory, type RecodeFrom } from '../../lib/transform';
import { Modal } from '../../ui/Modal';
import { VarMeasureIcon } from '../../ui/MeasureIcon';
import { Icon } from '../../ui/Icon';

/** Apply a transformation: undoable dataset change + quiet log entry + summary toast. */
export function applyTransform(res: TransformResult) {
  const st = useStore.getState();
  const name = st.dataset?.name;
  st.mutateDataset(() => res.dataset);
  st.addOutput(transformLogItem(res, name), { focus: false });
  st.toast(res.summary, 'success');
  for (const w of res.warnings.slice(0, 3)) st.toast(w, 'warning');
}

/** FILTER OFF / WEIGHT OFF from a chip or menu, logged like the dialogs so the syntax log stays complete. */
export function turnFilterOff() {
  const ds = useStore.getState().dataset;
  if (ds?.filterVarId) applyTransform(selectCasesTransform(ds, { kind: 'all' }, 'filter'));
}
export function turnWeightOff() {
  const ds = useStore.getState().dataset;
  if (ds?.weightVarId) applyTransform(weightCases(ds, null));
}

export function TransformModal(props: {
  title: string;
  subtitle?: ReactNode;
  onClose: () => void;
  onOk: () => void;
  okLabel?: string;
  okDisabled?: boolean;
  error?: string | null;
  size?: 'narrow' | 'normal' | 'wide';
  children: ReactNode;
  extraFooter?: ReactNode;
}) {
  return (
    <Modal
      title={props.title}
      subtitle={props.subtitle}
      onClose={props.onClose}
      size={props.size ?? 'normal'}
      footer={
        <>
          {props.error ? (
            <div className="footer-error" role="alert">
              <Icon name="warn" size={14} /> {props.error}
            </div>
          ) : null}
          {props.extraFooter}
          <button className="btn" onClick={props.onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={props.onOk} disabled={props.okDisabled}>{props.okLabel ?? 'OK'}</button>
        </>
      }
    >
      {props.children}
    </Modal>
  );
}

/** Run `fn`, showing its error message instead of throwing. Returns true on success. */
export function tryRun(fn: () => void, setError: (s: string | null) => void): boolean {
  try {
    fn();
    setError(null);
    return true;
  } catch (e) {
    setError(e instanceof Error ? e.message : String(e));
    return false;
  }
}

/** Insert text at the cursor of a textarea/input and keep focus there. */
export function insertAtCursor(el: HTMLTextAreaElement | HTMLInputElement | null, value: string, text: string, set: (s: string) => void) {
  if (!el) {
    set(value + text);
    return;
  }
  const start = el.selectionStart ?? value.length;
  const end = el.selectionEnd ?? value.length;
  const before = value.slice(0, start);
  const needsSpace = before && !/[\s(,]$/.test(before) && !/^[),]/.test(text);
  const ins = (needsSpace ? ' ' : '') + text;
  const next = before + ins + value.slice(end);
  set(next);
  requestAnimationFrame(() => {
    el.focus();
    const p = start + ins.length;
    el.setSelectionRange(p, p);
  });
}

/** Expression textarea that shows the error position underneath. */
export function ExpressionField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (s: string) => void;
  error?: { message: string; pos?: number; end?: number } | null;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  onFocus?: () => void;
  rows?: number;
  placeholder?: string;
  help?: ReactNode;
}) {
  const { error, value } = props;
  const hasPos = error && error.pos !== undefined && value.length > 0;
  const pos = hasPos ? Math.min(error!.pos!, value.length) : 0;
  const end = hasPos ? Math.min(Math.max(error!.end ?? pos + 1, pos + 1), Math.max(value.length, pos + 1)) : 0;
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <textarea
        id={props.id}
        ref={props.inputRef}
        className={`textarea mono expr-input ${error ? 'has-error' : ''}`}
        rows={props.rows ?? 3}
        value={value}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={props.placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${props.id}-err` : undefined}
        onFocus={props.onFocus}
        onChange={(e) => props.onChange(e.target.value)}
      />
      {error ? (
        <div className="expr-error" id={`${props.id}-err`} role="alert">
          {hasPos ? (
            <code className="expr-mirror">
              {value.slice(0, pos)}
              <mark>{value.slice(pos, end) || ' '}</mark>
              {value.slice(end)}
            </code>
          ) : null}
          <span>{error.message}</span>
        </div>
      ) : props.help ? (
        <div className="help">{props.help}</div>
      ) : null}
    </div>
  );
}

/** Variables + functions reference panel that inserts into the active expression field. */
export function ExpressionHelper({ ds, onInsert, showFunctions = true }: { ds: Dataset; onInsert: (text: string) => void; showFunctions?: boolean }) {
  const [tab, setTab] = useState<'vars' | 'funcs'>('vars');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FunctionCategory | 'All'>('All');
  const [hover, setHover] = useState<string | null>(null);
  const vars = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? ds.variables.filter((v) => v.name.toLowerCase().includes(t) || v.label.toLowerCase().includes(t)) : ds.variables;
  }, [ds.variables, q]);
  const funcs = useMemo(() => {
    const t = q.trim().toLowerCase();
    return FUNCTION_DOCS.filter((f) => (cat === 'All' || f.cat === cat) && (!t || f.name.toLowerCase().includes(t) || f.desc.toLowerCase().includes(t)));
  }, [q, cat]);
  const cats: Array<FunctionCategory | 'All'> = ['All', 'Arithmetic', 'Statistical', 'Missing values', 'Search', 'Text', 'Conversion', 'Dates'];
  const hoverDoc = FUNCTION_DOCS.find((f) => f.name === hover);
  return (
    <div className="expr-helper">
      {showFunctions ? (
        <div className="tabs" role="tablist">
          <button type="button" role="tab" className="tab" aria-selected={tab === 'vars'} onClick={() => setTab('vars')}>Variables</button>
          <button type="button" role="tab" className="tab" aria-selected={tab === 'funcs'} onClick={() => setTab('funcs')}>Functions</button>
        </div>
      ) : null}
      <div className="varpicker-search">
        <Icon name="search" size={14} />
        <input className="varpicker-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === 'vars' ? 'Search variables' : 'Search functions'} aria-label="Search" />
      </div>
      {tab === 'vars' ? (
        <div className="varpicker-list expr-list">
          {vars.map((v) => (
            <button key={v.id} type="button" className="varpicker-item" onClick={() => onInsert(v.name)} title={`Insert ${v.name}${v.label ? `: ${v.label}` : ''}`}>
              <VarMeasureIcon v={v} />
              <span className="varpicker-name mono">{v.name}</span>
              <span className="varpicker-label">{v.label}</span>
            </button>
          ))}
          {SYSTEM_VARIABLES.map((s) => (
            <button key={s.name} type="button" className="varpicker-item" onClick={() => onInsert(s.name)} title={s.desc}>
              <span className="measure-wrap" />
              <span className="varpicker-name mono">{s.name}</span>
              <span className="varpicker-label">{s.desc}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <select className="select input-sm" value={cat} onChange={(e) => setCat(e.target.value as FunctionCategory | 'All')} aria-label="Function group" style={{ margin: '6px 0' }}>
            {cats.map((c) => <option key={c} value={c}>{c === 'All' ? 'All functions' : c}</option>)}
          </select>
          <div className="varpicker-list expr-list" onMouseLeave={() => setHover(null)}>
            {funcs.map((f) => (
              <button key={f.name} type="button" className="varpicker-item" onClick={() => onInsert(f.insert)} onMouseEnter={() => setHover(f.name)} onFocus={() => setHover(f.name)} title={f.desc}>
                <span className="varpicker-name mono">{f.sig}</span>
              </button>
            ))}
          </div>
          <div className="expr-doc help">{hoverDoc ? <><strong className="mono">{hoverDoc.sig}</strong><br />{hoverDoc.desc}</> : 'Point at a function to see what it does. Click to insert it.'}</div>
        </>
      )}
      <div className="expr-ops" aria-label="Operators">
        {['+', '-', '*', '/', '**', '(', ')', '=', '<>', '<', '<=', '>', '>=', 'AND', 'OR', 'NOT'].map((op) => (
          <button key={op} type="button" className="btn btn-sm mono" onClick={() => onInsert(op)} title={OPERATOR_DOCS.find((d) => d.sym.split(' ').includes(op))?.desc}>{op}</button>
        ))}
      </div>
    </div>
  );
}

/** Numeric text input helper. */
export function NumField(props: { id: string; label: string; value: string; onChange: (s: string) => void; width?: number; help?: string; disabled?: boolean }) {
  return (
    <div className="field" style={{ width: props.width ?? 120 }}>
      <label htmlFor={props.id}>{props.label}</label>
      <input id={props.id} className="input num mono" inputMode="decimal" value={props.value} disabled={props.disabled} onChange={(e) => props.onChange(e.target.value)} />
      {props.help ? <div className="help">{props.help}</div> : null}
    </div>
  );
}

export function TextField(props: { id: string; label: string; value: string; onChange: (s: string) => void; mono?: boolean; placeholder?: string; help?: string; width?: number | string; list?: string }) {
  return (
    <div className="field" style={{ width: props.width, flex: props.width ? undefined : 1, minWidth: props.width ? undefined : 160 }}>
      <label htmlFor={props.id}>{props.label}</label>
      <input id={props.id} className={`input ${props.mono ? 'mono' : ''}`} value={props.value} list={props.list} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} spellCheck={!props.mono} />
      {props.help ? <div className="help">{props.help}</div> : null}
    </div>
  );
}

// ---------- old-value specification editor (Recode, Count) ----------

export type FromKind = RecodeFrom['kind'];

export const FROM_KINDS: Array<{ k: FromKind; label: string; numericOnly?: boolean }> = [
  { k: 'value', label: 'Value' },
  { k: 'range', label: 'Range', numericOnly: true },
  { k: 'lowest', label: 'Lowest through', numericOnly: true },
  { k: 'highest', label: 'through Highest', numericOnly: true },
  { k: 'sysmis', label: 'System-missing', numericOnly: true },
  { k: 'missing', label: 'System- or user-missing' },
  { k: 'else', label: 'All other values' },
];

export function useFromEditor(type: 'numeric' | 'string', allowElse = true) {
  const [kind, setKind] = useState<FromKind>('value');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const build = (): RecodeFrom | string => {
    const num = (s: string) => {
      const n = Number(s.trim());
      return s.trim() !== '' && Number.isFinite(n) ? n : null;
    };
    switch (kind) {
      case 'value': {
        if (type === 'string') return { kind: 'value', value: a };
        const n = num(a);
        return n === null ? 'The old value must be a number.' : { kind: 'value', value: n };
      }
      case 'range': {
        const x = num(a), y = num(b);
        if (x === null || y === null) return 'Enter both ends of the range.';
        if (x > y) return 'The start of the range is above its end.';
        return { kind: 'range', lo: x, hi: y };
      }
      case 'lowest': {
        const y = num(a);
        return y === null ? 'Enter the upper end.' : { kind: 'lowest', hi: y };
      }
      case 'highest': {
        const x = num(a);
        return x === null ? 'Enter the lower end.' : { kind: 'highest', lo: x };
      }
      default:
        return { kind } as RecodeFrom;
    }
  };
  const reset = () => {
    setA('');
    setB('');
  };
  const ui = (
    <div className="from-editor">
      <select className="select" value={kind} onChange={(e) => setKind(e.target.value as FromKind)} aria-label="Old value type">
        {FROM_KINDS.filter((f) => (type === 'numeric' || !f.numericOnly) && (allowElse || f.k !== 'else')).map((f) => (
          <option key={f.k} value={f.k}>{f.label}</option>
        ))}
      </select>
      {kind === 'value' || kind === 'lowest' || kind === 'highest' || kind === 'range' ? (
        <input className="input mono" style={{ width: 90 }} value={a} onChange={(e) => setA(e.target.value)} aria-label={kind === 'range' ? 'From' : 'Value'} placeholder={kind === 'range' ? 'from' : 'value'} />
      ) : null}
      {kind === 'range' ? (
        <>
          <span className="muted">to</span>
          <input className="input mono" style={{ width: 90 }} value={b} onChange={(e) => setB(e.target.value)} aria-label="To" placeholder="to" />
        </>
      ) : null}
    </div>
  );
  return { ui, build, reset, kind };
}

/** Compact variable select (for a single choice inside rows). */
export function VarSelect({ ds, value, onChange, filter, id, label, allowNone }: { ds: Dataset; value: string; onChange: (id: string) => void; filter?: (v: Variable) => boolean; id?: string; label: string; allowNone?: string }) {
  const vars = filter ? ds.variables.filter(filter) : ds.variables;
  return (
    <select id={id} className="select" style={{ width: '100%', minWidth: 0 }} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {allowNone !== undefined ? <option value="">{allowNone}</option> : null}
      {vars.map((v) => (
        <option key={v.id} value={v.id}>{v.name}{v.label ? ` (${v.label.slice(0, 40)})` : ''}</option>
      ))}
    </select>
  );
}
