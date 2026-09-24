// Variable View dialogs: Type, Value Labels, Missing Values, Copy Properties.
import { useMemo, useState } from 'react';
import { useStore } from '../../core/store';
import type { Dataset, MissingSpec, ValueLabel, Variable, VarType } from '../../core/types';
import { isDateFormat, isUserMissing } from '../../core/data';
import { Modal } from '../../ui/Modal';
import { Icon } from '../../ui/Icon';
import { VarPicker } from '../../ui/VarPicker';
import { changeType, copyProperties, COPY_PROPS, type CopyProp } from './mutations';

// ---------- Type ----------

type TypeKind = 'numeric' | 'comma' | 'dollar' | 'pct' | 'date' | 'string';

const DATE_FORMATS = [
  { f: 'DATE', w: 11, label: 'dd-mmm-yyyy (17-MAY-1990)' },
  { f: 'ADATE', w: 10, label: 'mm/dd/yyyy (05/17/1990)' },
  { f: 'EDATE', w: 10, label: 'dd.mm.yyyy (17.05.1990)' },
  { f: 'SDATE', w: 10, label: 'yyyy/mm/dd (1990/05/17)' },
  { f: 'DATETIME', w: 20, label: 'dd-mmm-yyyy hh:mm:ss' },
  { f: 'MOYR', w: 8, label: 'mmm yyyy (MAY 1990)' },
  { f: 'TIME', w: 8, label: 'hh:mm:ss (time or duration)' },
];

export function typeName(v: Variable): string {
  if (v.type === 'string') return 'String';
  const f = v.format.toUpperCase();
  if (isDateFormat(f)) return /^(TIME|DTIME)/.test(f) ? 'Time' : 'Date';
  if (f.startsWith('COMMA')) return 'Comma';
  if (f.startsWith('DOLLAR')) return 'Dollar';
  if (f.startsWith('PCT')) return 'Percent';
  return 'Numeric';
}

function kindOf(v: Variable): TypeKind {
  if (v.type === 'string') return 'string';
  const f = v.format.toUpperCase();
  if (isDateFormat(f)) return 'date';
  if (f.startsWith('COMMA')) return 'comma';
  if (f.startsWith('DOLLAR')) return 'dollar';
  if (f.startsWith('PCT')) return 'pct';
  return 'numeric';
}

/** Decimal places shown by numbers stored as text (for a sensible format when converting to numeric). */
function textDecimals(ds: Dataset, v: Variable): number {
  const col = ds.columns[v.id];
  if (!Array.isArray(col)) return v.decimals;
  let dec = 0;
  for (let i = 0; i < Math.min(col.length, 5000); i++) {
    const m = /\.(\d+)\s*$/.exec(col[i]);
    if (m && /^[\s$+-]*[\d,]*\.\d+\s*%?$/.test(col[i])) dec = Math.max(dec, Math.min(4, m[1].length));
  }
  return dec;
}

export function TypeDialog({ ds, v, onClose }: { ds: Dataset; v: Variable; onClose: () => void }) {
  const mutate = useStore((s) => s.mutateDataset);
  const [kind, setKind] = useState<TypeKind>(kindOf(v));
  const [width, setWidth] = useState(String(v.width));
  const [dec, setDec] = useState(String(v.decimals));
  const curDate = DATE_FORMATS.find((d) => v.format.toUpperCase().startsWith(d.f)) ?? DATE_FORMATS[0];
  const [dateF, setDateF] = useState(curDate.f);
  const [err, setErr] = useState('');

  const apply = () => {
    const w = Math.round(Number(width));
    const d = Math.round(Number(dec));
    let type: VarType = 'numeric';
    let format: string;
    let fw = w, fd = d;
    if (kind === 'string') {
      if (!(w >= 1 && w <= 32767)) return setErr('Text width must be between 1 and 32767 characters.');
      type = 'string';
      format = `A${w}`;
      fd = 0;
    } else if (kind === 'date') {
      const df = DATE_FORMATS.find((x) => x.f === dateF)!;
      fw = df.w;
      fd = 0;
      format = `${df.f}${df.w}`;
    } else {
      if (!(w >= 1 && w <= 40)) return setErr('Width must be between 1 and 40.');
      if (!(d >= 0 && d <= 16 && d < w)) return setErr('Decimals must be between 0 and 16 and smaller than the width.');
      const fam = { numeric: 'F', comma: 'COMMA', dollar: 'DOLLAR', pct: 'PCT' }[kind];
      format = `${fam}${w}.${d}`;
    }
    const lossy = type !== v.type || (type === 'string' && w < v.width);
    mutate((cur) => changeType(cur, v.id, type, format, fw, fd));
    if (lossy) useStore.getState().toast(`Changed ${v.name} to ${kind === 'string' ? 'text' : kind}. Values were converted; press Ctrl+Z to undo.`, 'info');
    onClose();
  };

  const kinds: Array<{ k: TypeKind; label: string; help: string }> = [
    { k: 'numeric', label: 'Numeric', help: '1234.56' },
    { k: 'comma', label: 'Comma', help: '1,234.56' },
    { k: 'dollar', label: 'Dollar', help: '$1,234.56' },
    { k: 'pct', label: 'Percent', help: '12.5%' },
    { k: 'date', label: 'Date / time', help: 'Stored as seconds, shown as a date' },
    { k: 'string', label: 'String (text)', help: 'Letters, open answers, IDs' },
  ];
  return (
    <Modal
      title={`Variable type: ${v.name}`}
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={apply}>OK</button>
        </>
      }
    >
      <div className="stack">
        <div className="radio-list" role="radiogroup" aria-label="Type">
          {kinds.map((x) => (
            <label key={x.k} className="check">
              <input type="radio" name="vtype" checked={kind === x.k} onChange={() => { setKind(x.k); setErr(''); if (x.k === 'string' && v.type !== 'string') setWidth('24'); else if (x.k !== 'string' && v.type === 'string') { setWidth('8'); setDec(String(textDecimals(ds, v))); } }} />
              <span>{x.label}</span>
              <span className="help">{x.help}</span>
            </label>
          ))}
        </div>
        {kind === 'date' ? (
          <div className="field">
            <label htmlFor="datefmt">Date format</label>
            <select id="datefmt" className="select" value={dateF} onChange={(e) => setDateF(e.target.value)}>
              {DATE_FORMATS.map((d) => <option key={d.f} value={d.f}>{d.label}</option>)}
            </select>
          </div>
        ) : (
          <div className="row">
            <div className="field" style={{ width: 110 }}>
              <label htmlFor="tw">{kind === 'string' ? 'Characters' : 'Width'}</label>
              <input id="tw" className="input num" inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
            {kind !== 'string' ? (
              <div className="field" style={{ width: 110 }}>
                <label htmlFor="td">Decimal places</label>
                <input id="td" className="input num" inputMode="numeric" value={dec} onChange={(e) => setDec(e.target.value)} />
              </div>
            ) : null}
          </div>
        )}
        {kind === 'string' && v.type === 'numeric' ? <div className="callout callout-warn">Numbers will become text. Value labels and missing values are converted too.</div> : null}
        {kind !== 'string' && v.type === 'string' ? <div className="callout callout-warn">Text that is not a {kind === 'date' ? 'date' : 'number'} will become empty (system-missing).</div> : null}
        {err ? <div className="callout callout-bad" role="alert">{err}</div> : null}
        <div className="help">Current format: <span className="mono">{v.format}</span>. {ds.nCases.toLocaleString('en-US')} cases.</div>
      </div>
    </Modal>
  );
}

// ---------- Value labels ----------

export function describeValueLabels(v: Variable): string {
  if (!v.valueLabels.length) return 'None';
  const first = v.valueLabels[0];
  const more = v.valueLabels.length > 1 ? ` +${v.valueLabels.length - 1}` : '';
  return `${typeof first.value === 'string' ? `'${first.value}'` : first.value} = ${first.label}${more}`;
}

/** Parse pasted lines like "1=Male", "2 Female", "3<TAB>Other", "'a' = Yes". */
export function parseLabelLines(text: string, type: VarType): { labels: ValueLabel[]; bad: string[] } {
  const labels: ValueLabel[] = [];
  const bad: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^(?:'([^']*)'|"([^"]*)"|([^\s=:\t]+))\s*(?:=|:|\t|\s)\s*(.+)$/.exec(line);
    if (!m) {
      bad.push(line);
      continue;
    }
    let valText = m[1] ?? m[2] ?? m[3];
    // Questionnaire styles: "1) Yes", "1. Yes", "1 - Yes", "1 – Yes".
    const label = m[4].trim().replace(/^[-–—]\s+/, '').replace(/^(['"])(.*)\1$/, '$2');
    if (type === 'numeric') {
      if (m[3] && /^-?\d+(\.\d+)?[).]$/.test(valText)) valText = valText.slice(0, -1);
      const n = Number(valText);
      if (!Number.isFinite(n)) {
        bad.push(line);
        continue;
      }
      labels.push({ value: n, label });
    } else labels.push({ value: valText, label });
  }
  return { labels, bad };
}

export function ValueLabelsDialog({ v, onClose }: { v: Variable; onClose: () => void }) {
  const update = useStore((s) => s.updateVariable);
  const [rows, setRows] = useState<Array<{ value: string; label: string }>>(v.valueLabels.map((l) => ({ value: String(l.value), label: l.label })));
  const [nv, setNv] = useState('');
  const [nl, setNl] = useState('');
  const [paste, setPaste] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const validValue = (s: string) => (v.type === 'numeric' ? s.trim() !== '' && Number.isFinite(Number(s)) : true);
  const add = () => {
    if (!validValue(nv)) return setErr(v.type === 'numeric' ? 'The value must be a number.' : 'Enter a value.');
    if (!nl.trim()) return setErr('Enter a label for this value.');
    const key = v.type === 'numeric' ? String(Number(nv)) : nv;
    const idx = rows.findIndex((r) => (v.type === 'numeric' ? String(Number(r.value)) : r.value) === key);
    const next = rows.slice();
    if (idx >= 0) next[idx] = { value: key, label: nl.trim() };
    else next.push({ value: key, label: nl.trim() });
    if (v.type === 'numeric') next.sort((a, b) => Number(a.value) - Number(b.value));
    setRows(next);
    setNv('');
    setNl('');
    setErr('');
    document.getElementById('vl-new-value')?.focus();
  };
  const save = () => {
    const out: ValueLabel[] = [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (!validValue(r.value)) return setErr(`"${r.value}" is not a number.`);
      const value = v.type === 'numeric' ? Number(r.value) : r.value;
      const key = String(value);
      if (seen.has(key)) return setErr(`The value ${key} has two labels.`);
      seen.add(key);
      if (!r.label.trim()) return setErr(`The value ${key} has an empty label.`);
      out.push({ value, label: r.label.trim() });
    }
    update(v.id, { valueLabels: out });
    onClose();
  };
  const applyPaste = () => {
    if (paste === null) return;
    const { labels, bad } = parseLabelLines(paste, v.type);
    const map = new Map(rows.map((r) => [v.type === 'numeric' ? String(Number(r.value)) : r.value, r] as const));
    for (const l of labels) map.set(String(l.value), { value: String(l.value), label: l.label });
    const next = [...map.values()];
    if (v.type === 'numeric') next.sort((a, b) => Number(a.value) - Number(b.value));
    setRows(next);
    setPaste(null);
    setErr(bad.length ? `${bad.length} line${bad.length === 1 ? ' was' : 's were'} not understood: ${bad.slice(0, 2).join('; ')}` : '');
  };

  return (
    <Modal
      title={`Value labels: ${v.name}`}
      subtitle={v.label || undefined}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>OK</button>
        </>
      }
    >
      <div className="stack">
        <div className="vl-add">
          <div className="field" style={{ width: 110 }}>
            <label htmlFor="vl-new-value">Value</label>
            <input id="vl-new-value" className="input mono" value={nv} onChange={(e) => setNv(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="vl-new-label">Label</label>
            <input id="vl-new-label" className="input" value={nl} onChange={(e) => setNl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          </div>
          <button className="btn" onClick={add} style={{ alignSelf: 'flex-end' }}><Icon name="plus" size={14} /> Add</button>
        </div>
        {err ? <div className="callout callout-bad" role="alert">{err}</div> : null}
        <div className="vl-list" role="table" aria-label="Value labels">
          {rows.length === 0 ? <div className="help" style={{ padding: 12 }}>No value labels yet. Add them above, or paste a list.</div> : null}
          {rows.map((r, i) => (
            <div key={i} className="vl-row" role="row">
              <input className="input input-sm mono num" aria-label="Value" value={r.value} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} style={{ width: 90 }} />
              <input className="input input-sm" aria-label="Label" value={r.label} onChange={(e) => setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} style={{ flex: 1 }} />
              {validValue(r.value) && isUserMissing(v.missing, v.type === 'numeric' ? Number(r.value) : r.value) ? <span className="badge badge-warn" title="Declared as a missing value">missing</span> : null}
              <button className="btn btn-sm btn-ghost btn-icon" aria-label={`Remove label for ${r.value}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
            </div>
          ))}
        </div>
        {paste === null ? (
          <div className="row">
            <button className="btn btn-sm" onClick={() => setPaste('')}>Paste a list</button>
            <span className="help">One per line, like <span className="mono">1=Male</span> or <span className="mono">2 Female</span>.</span>
          </div>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            <label className="label" htmlFor="vl-paste">Paste lines (value, then label)</label>
            <textarea id="vl-paste" className="textarea mono" rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={v.type === 'numeric' ? '1=Strongly disagree\n2=Disagree\n3=Neither\n4=Agree\n5=Strongly agree' : "'m'=Male\n'f'=Female"} />
            <div className="row">
              <button className="btn btn-sm btn-primary" onClick={applyPaste}>Add these labels</button>
              <button className="btn btn-sm" onClick={() => setPaste(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Missing values ----------

export function describeMissing(v: Variable): string {
  const m = v.missing;
  const parts: string[] = [];
  if (m.range) parts.push(`${m.range.lo === -Infinity ? 'LO' : m.range.lo} - ${m.range.hi === Infinity ? 'HI' : m.range.hi}`);
  for (const d of m.discrete) parts.push(typeof d === 'string' ? `'${d}'` : String(d));
  return parts.length ? parts.join(', ') : 'None';
}

export function MissingDialog({ v, onClose }: { v: Variable; onClose: () => void }) {
  const update = useStore((s) => s.updateVariable);
  const m = v.missing;
  const [mode, setMode] = useState<'none' | 'discrete' | 'range'>(m.range ? 'range' : m.discrete.length ? 'discrete' : 'none');
  const [d, setD] = useState<string[]>(() => {
    const arr = m.discrete.map(String);
    return m.range ? [arr[0] ?? '', '', ''] : [arr[0] ?? '', arr[1] ?? '', arr[2] ?? ''];
  });
  const [lo, setLo] = useState(m.range ? (m.range.lo === -Infinity ? 'LO' : String(m.range.lo)) : '');
  const [hi, setHi] = useState(m.range ? (m.range.hi === Infinity ? 'HI' : String(m.range.hi)) : '');
  const [err, setErr] = useState('');
  const numeric = v.type === 'numeric';

  const parseNum = (s: string, which: 'lo' | 'hi' | 'value'): number | null => {
    const t = s.trim().toUpperCase();
    if (which === 'lo' && (t === 'LO' || t === 'LOWEST')) return -Infinity;
    if (which === 'hi' && (t === 'HI' || t === 'HIGHEST')) return Infinity;
    const n = Number(t);
    return t !== '' && Number.isFinite(n) ? n : null;
  };

  const save = () => {
    let spec: MissingSpec = { discrete: [] };
    if (mode === 'discrete' || mode === 'range') {
      const vals = (mode === 'range' ? d.slice(0, 1) : d).filter((s) => s.trim() !== '' || (!numeric && s !== ''));
      const discrete: Array<number | string> = [];
      for (const s of vals) {
        if (numeric) {
          const n = parseNum(s, 'value');
          if (n === null) return setErr(`"${s}" is not a number.`);
          discrete.push(n);
        } else discrete.push(s.slice(0, 8));
      }
      spec = { discrete };
      if (mode === 'range') {
        const a = parseNum(lo, 'lo'), b = parseNum(hi, 'hi');
        if (a === null || b === null) return setErr('Enter both ends of the range (numbers, or LO / HI).');
        if (a > b) return setErr('The low end of the range is above the high end.');
        spec.range = { lo: a, hi: b };
      } else if (!discrete.length) return setErr('Enter at least one missing value, or choose "No missing values".');
    }
    update(v.id, { missing: spec });
    onClose();
  };

  return (
    <Modal
      title={`Missing values: ${v.name}`}
      subtitle="Codes like 8 = Don't know or 9 = Refused are kept in the data but left out of analyses."
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>OK</button>
        </>
      }
    >
      <div className="stack">
        <label className="check"><input type="radio" name="mm" checked={mode === 'none'} onChange={() => setMode('none')} /> No missing values</label>
        <label className="check"><input type="radio" name="mm" checked={mode === 'discrete'} onChange={() => setMode('discrete')} /> Discrete missing values</label>
        {mode === 'discrete' ? (
          <div className="row" style={{ paddingLeft: 24 }}>
            {[0, 1, 2].map((i) => (
              <input key={i} className="input mono num" style={{ width: 90 }} aria-label={`Missing value ${i + 1}`} value={d[i]} onChange={(e) => setD(d.map((x, j) => (j === i ? e.target.value : x)))} />
            ))}
          </div>
        ) : null}
        {numeric ? (
          <>
            <label className="check"><input type="radio" name="mm" checked={mode === 'range'} onChange={() => setMode('range')} /> Range plus one optional discrete value</label>
            {mode === 'range' ? (
              <div className="stack" style={{ paddingLeft: 24, gap: 8 }}>
                <div className="row">
                  <div className="field" style={{ width: 100 }}><label htmlFor="mlo">Low</label><input id="mlo" className="input mono" value={lo} onChange={(e) => setLo(e.target.value)} placeholder="LO" /></div>
                  <div className="field" style={{ width: 100 }}><label htmlFor="mhi">High</label><input id="mhi" className="input mono" value={hi} onChange={(e) => setHi(e.target.value)} placeholder="HI" /></div>
                  <div className="field" style={{ width: 100 }}><label htmlFor="mdv">Discrete</label><input id="mdv" className="input mono" value={d[0]} onChange={(e) => setD([e.target.value, '', ''])} /></div>
                </div>
                <div className="help">Type LO or HI for an open end, for example 90 to HI.</div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="help">Text variables can have up to three missing codes of 8 characters or fewer.</div>
        )}
        {err ? <div className="callout callout-bad" role="alert">{err}</div> : null}
      </div>
    </Modal>
  );
}

// ---------- Copy properties ----------

export function CopyPropertiesDialog({ ds, sourceId, onClose }: { ds: Dataset; sourceId: string | null; onClose: () => void }) {
  const mutate = useStore((s) => s.mutateDataset);
  const toast = useStore((s) => s.toast);
  const [src, setSrc] = useState<string[]>(sourceId ? [sourceId] : []);
  const [targets, setTargets] = useState<string[]>([]);
  const [props, setProps] = useState<CopyProp[]>(COPY_PROPS.filter((p) => p.defaultOn).map((p) => p.id));
  const source = ds.variables.find((v) => v.id === src[0]);
  const filter = useMemo(() => (source ? (v: Variable) => v.type === source.type && v.id !== source.id : () => false), [source]);
  const apply = () => {
    if (!source || !targets.length || !props.length) return;
    mutate((cur) => copyProperties(cur, source.id, targets, props));
    toast(`Copied ${props.length} propert${props.length === 1 ? 'y' : 'ies'} from ${source.name} to ${targets.length} variable${targets.length === 1 ? '' : 's'}.`, 'success');
    onClose();
  };
  return (
    <Modal
      title="Copy variable properties"
      subtitle="Give several variables the same value labels, missing values or measure, for example all items of a Likert battery."
      size="wide"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={apply} disabled={!source || !targets.length || !props.length}>
            Copy to {targets.length || ''} variable{targets.length === 1 ? '' : 's'}
          </button>
        </>
      }
    >
      <div className="dialog-cols">
        <div className="stack">
          <div className="label">1. Copy from</div>
          <VarPicker ds={ds} value={src} onChange={(ids) => { setSrc(ids); setTargets([]); }} height={200} label="Source variable" />
          <div className="label">2. Properties</div>
          <div className="stack" style={{ gap: 6 }}>
            {COPY_PROPS.map((p) => (
              <label key={p.id} className="check">
                <input type="checkbox" checked={props.includes(p.id)} onChange={(e) => setProps(e.target.checked ? [...props, p.id] : props.filter((x) => x !== p.id))} />
                {p.label}
              </label>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="label">3. Copy to {source ? <span className="muted">(other {source.type === 'string' ? 'text' : 'numeric'} variables)</span> : null}</div>
          {source ? <VarPicker ds={ds} value={targets} onChange={setTargets} multiple filter={filter} height={330} label="Target variables" /> : <div className="help">Choose a source variable first.</div>}
          {source && props.includes('valueLabels') ? <div className="help">{source.name} has {source.valueLabels.length} value label{source.valueLabels.length === 1 ? '' : 's'}.</div> : null}
        </div>
      </div>
    </Modal>
  );
}

