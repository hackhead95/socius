// Data > Define variable properties...: scan the values variables really have, then label values,
// mark missing codes and set the measurement level with Socius's suggestions. Every edit stays a
// draft until Apply, which makes one undoable change and logs the SPSS syntax to Output.
// The logic is in src/lib/transform/properties.ts.
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useStore } from '../../core/store';
import type { Dataset, MeasureLevel, Variable } from '../../core/types';
import { isDateFormat } from '../../core/data';
import { useUi } from '../../app/ui-store';
import { Modal } from '../../ui/Modal';
import { Icon } from '../../ui/Icon';
import { MeasureIcon, VarMeasureIcon, measureKind } from '../../ui/MeasureIcon';
import { VarPicker } from '../../ui/VarPicker';
import { transformLogItem } from '../../lib/transform/log';
import { fmtN, plural } from '../../lib/transform/dsops';
import {
  COPYABLE_PROPS, DEFAULT_MAX_VALUES, applyPropertyDrafts, applySuggestion, batterySiblings, buildRows, copyDraftProps, describeMissingSpec, displayValue,
  draftFromVariable, draftIssues, isDraftChanged, labelFor, measureName, parseValue, previewSuggestion, removeMissingRange, scanVariables, setValueLabel,
  statusOf, suggestLabels, suggestMeasure, summarise, toggleMissing, valueKey, type CopyableProp, type DraftIssue, type GridRow, type LabelSuggestion,
  type PropsDraft, type StatusInfo, type VarScan,
} from '../../lib/transform/properties';
import './DefineProperties.css';

export const DEFINE_PROPERTIES_TITLE = 'Define variable properties';

type Panel = null | 'suggest' | 'copy-from' | 'apply-to';

const MEASURES: MeasureLevel[] = ['nominal', 'ordinal', 'scale'];

function typeText(v: Variable): string {
  if (v.type === 'string') return `Text (string), ${v.width} characters`;
  if (isDateFormat(v.format)) return `Date or time (${v.format})`;
  return `Numeric (${v.format})`;
}

export function DefinePropertiesDialog({ ds, initialIds, onClose }: { ds: Dataset; initialIds?: string[]; onClose: () => void }) {
  const byId = useMemo(() => new Map(ds.variables.map((v) => [v.id, v])), [ds.variables]);
  const [step, setStep] = useState<'choose' | 'edit'>('choose');
  const [pick, setPick] = useState<string[]>(() => (initialIds ?? []).filter((id) => byId.has(id)));
  const [limitCases, setLimitCases] = useState(false);
  const [maxCases, setMaxCases] = useState('1000');
  const [limitValues, setLimitValues] = useState(true);
  const [maxValues, setMaxValues] = useState(String(DEFAULT_MAX_VALUES));
  const [scans, setScans] = useState<Record<string, VarScan>>({});
  const [order, setOrder] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PropsDraft>>({});
  const [pinned, setPinned] = useState<Record<string, Array<number | string>>>({});
  const [current, setCurrent] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [notice, setNotice] = useState<{ varId: string; key?: string; text: string; tone: 'bad' | 'good' | 'info' } | null>(null);

  const caseLimit = limitCases ? Math.max(1, Math.floor(Number(maxCases)) || 0) : null;
  const valueLimit = limitValues ? Math.max(1, Math.floor(Number(maxValues)) || DEFAULT_MAX_VALUES) : null;

  const dirtyIds = order.filter((id) => drafts[id] && byId.has(id) && isDraftChanged(byId.get(id)!, drafts[id]));
  const dirty = dirtyIds.length > 0;

  const requestClose = async () => {
    if (!dirty) return onClose();
    const ok = await useUi.getState().confirm({
      title: 'Discard your changes?',
      message: `You changed the properties of ${plural(dirtyIds.length, 'variable')} (${dirtyIds.slice(0, 4).map((id) => byId.get(id)!.name).join(', ')}${dirtyIds.length > 4 ? ', ...' : ''}). Close without applying them?`,
      confirmLabel: 'Discard changes',
      danger: true,
    });
    if (ok) onClose();
  };

  /** Scan (or re-scan) variables and give each one a draft if it has none yet. */
  const scan = (ids: string[], keepOrder: string[] = []) => {
    const fresh = scanVariables(ds, ids, { maxCases: caseLimit });
    const nextScans = { ...scans };
    for (const s of fresh) nextScans[s.varId] = s;
    const nextDrafts = { ...drafts };
    const nextPinned = { ...pinned };
    for (const id of ids) {
      const v = byId.get(id)!;
      if (!nextDrafts[id]) nextDrafts[id] = draftFromVariable(v);
      if (!nextPinned[id]) nextPinned[id] = v.valueLabels.map((l) => l.value);
    }
    setScans(nextScans);
    setDrafts(nextDrafts);
    setPinned(nextPinned);
    const merged = [...keepOrder, ...ids.filter((id) => !keepOrder.includes(id))];
    setOrder(merged);
    return merged;
  };

  const startScan = () => {
    if (!pick.length) return;
    // Variables with unapplied edits stay in the list even if they were unticked.
    const ids = [...pick, ...dirtyIds.filter((id) => !pick.includes(id))];
    const merged = scan(ids);
    setCurrent((c) => (c && merged.includes(c) ? c : merged[0]));
    setPanel(null);
    setNotice(null);
    setStep('edit');
  };

  const apply = () => {
    const st = useStore.getState();
    const cur = st.dataset;
    if (!cur) return;
    const res = applyPropertyDrafts(cur, drafts);
    if (!res.changed.length) {
      onClose();
      return;
    }
    st.mutateDataset(() => res.dataset, { label: 'Define variable properties' });
    st.addOutput(transformLogItem(res, cur.name), { focus: false });
    st.toast(`Updated the properties of ${plural(res.changed.length, 'variable')}. The SPSS syntax is in Output; Ctrl+Z undoes it.`, 'success');
    onClose();
  };

  // Issues per variable (SPSS limits); any issue blocks Apply.
  const issues = useMemo(() => {
    const out: Record<string, DraftIssue[]> = {};
    for (const id of order) {
      const v = byId.get(id);
      if (v && drafts[id]) {
        const list = draftIssues(v, drafts[id]);
        if (list.length) out[id] = list;
      }
    }
    return out;
  }, [order, drafts, byId]);
  const issueIds = Object.keys(issues);

  // Status per variable, cached by draft object so typing in one variable does not recompute the others.
  const statusCache = useRef(new WeakMap<PropsDraft, { scan: VarScan; info: StatusInfo }>());
  const statusFor = (id: string): StatusInfo | null => {
    const v = byId.get(id), d = drafts[id], s = scans[id];
    if (!v || !d || !s) return null;
    const hit = statusCache.current.get(d);
    if (hit && hit.scan === s) return hit.info;
    const info = statusOf(v.type, s, d);
    statusCache.current.set(d, { scan: s, info });
    return info;
  };

  const footer =
    step === 'choose' ? (
      <>
        <button className="btn" onClick={() => void requestClose()}>Cancel</button>
        <button className="btn btn-primary" onClick={startScan} disabled={!pick.length} title={pick.length ? undefined : 'Choose at least one variable'}>
          {pick.length ? `Scan ${plural(pick.length, 'variable')}` : 'Scan'}
        </button>
      </>
    ) : (
      <>
        {issueIds.length ? (
          <div className="footer-error dvp-footer-error" role="alert">
            <Icon name="warn" size={14} /> Fix {issueIds.map((id) => byId.get(id)?.name).join(', ')} before applying (marked Needs a fix): {issues[issueIds[0]][0].message}
          </div>
        ) : null}
        <button className="btn dvp-footer-back" onClick={() => { setPick(order); setStep('choose'); }}>Choose variables</button>
        <button className="btn" onClick={() => void requestClose()}>Cancel</button>
        <button className="btn btn-primary" onClick={apply} disabled={!dirty || issueIds.length > 0} title={!dirty ? 'Nothing has changed yet' : issueIds.length ? 'Fix the problems first' : `Apply the changes to ${plural(dirtyIds.length, 'variable')}`}>
          {dirty ? `Apply (${plural(dirtyIds.length, 'variable')})` : 'Apply'}
        </button>
      </>
    );

  return (
    <Modal
      title={DEFINE_PROPERTIES_TITLE}
      subtitle={step === 'choose' ? 'Step 1 of 2: choose the variables to scan. Socius reads their values so you can label them, mark missing codes and set the measurement level.' : 'Step 2 of 2: check each variable. Nothing changes until you press Apply.'}
      size="wide"
      onClose={() => void requestClose()}
      footer={footer}
    >
      {step === 'choose' ? (
        <div className="dvp-choose">
          <div className="stack">
            <div className="label" id="dvp-pick-label">Variables to scan</div>
            <VarPicker ds={ds} value={pick} onChange={setPick} multiple height={320} label="Variables to scan" />
          </div>
          <div className="stack dvp-options">
            <div className="label">Options</div>
            <label className="check">
              <input type="checkbox" checked={limitCases} onChange={(e) => setLimitCases(e.target.checked)} />
              Limit the number of cases scanned
            </label>
            {limitCases ? (
              <div className="dvp-indent field">
                <label htmlFor="dvp-max-cases">Scan the first</label>
                <span className="row" style={{ gap: 6 }}>
                  <input id="dvp-max-cases" className="input input-sm num" inputMode="numeric" value={maxCases} onChange={(e) => setMaxCases(e.target.value)} style={{ width: 100 }} />
                  <span className="help">of {fmtN(ds.nCases)} cases</span>
                </span>
              </div>
            ) : <div className="help dvp-indent">All {fmtN(ds.nCases)} cases are scanned.</div>}
            <label className="check">
              <input type="checkbox" checked={limitValues} onChange={(e) => setLimitValues(e.target.checked)} />
              Limit the number of values displayed
            </label>
            {limitValues ? (
              <div className="dvp-indent field">
                <label htmlFor="dvp-max-values">Show at most</label>
                <span className="row" style={{ gap: 6 }}>
                  <input id="dvp-max-values" className="input input-sm num" inputMode="numeric" value={maxValues} onChange={(e) => setMaxValues(e.target.value)} style={{ width: 100 }} />
                  <span className="help">values per variable</span>
                </span>
              </div>
            ) : null}
            <div className="callout callout-info dvp-tip">
              Good first choices: questions imported from CSV or Excel without labels, and rating-scale items such as a Likert battery.
              {ds.weightVarId ? ' Counts are shown weighted too, because a weight is on.' : ''}
              {ds.filterVarId ? ' All cases are scanned: the filter does not hide values from the variable definitions.' : ''}
            </div>
          </div>
        </div>
      ) : (
        <div className="dvp">
          <nav className="dvp-vars" aria-label="Scanned variables">
            <div className="label dvp-vars-head">Scanned variables ({order.length})</div>
            <ul>
              {order.map((id) => {
                const v = byId.get(id);
                const info = statusFor(id);
                if (!v || !info) return null;
                const edited = drafts[id] && isDraftChanged(v, drafts[id]);
                const bad = !!issues[id];
                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`dvp-var ${id === current ? 'on' : ''}`}
                      aria-current={id === current ? 'true' : undefined}
                      data-status={info.status}
                      onClick={() => { setCurrent(id); setPanel(null); setNotice(null); }}
                    >
                      <span className="dvp-var-top">
                        <VarMeasureIcon v={{ ...v, measure: drafts[id].measure }} />
                        <span className="mono dvp-var-name">{v.name}</span>
                        {edited ? <span className="dvp-edited" title="Changed, not applied yet">edited</span> : null}
                      </span>
                      <span className={`dvp-var-status dvp-st-${bad ? 'bad' : info.status}`}>
                        <StatusGlyph status={bad ? 'bad' : info.status} />
                        {bad ? 'Needs a fix' : info.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          {current && byId.get(current) && drafts[current] && scans[current] ? (
            <VariableEditor
              key={current}
              ds={ds}
              v={byId.get(current)!}
              scan={scans[current]}
              draft={drafts[current]}
              pinned={pinned[current] ?? []}
              valueLimit={valueLimit}
              panel={panel}
              setPanel={setPanel}
              notice={notice && notice.varId === current ? notice : null}
              setNotice={(n) => setNotice(n ? { ...n, varId: current } : null)}
              issues={issues[current] ?? []}
              drafts={drafts}
              onDraft={(d) => setDrafts((all) => ({ ...all, [current]: d }))}
              onPin={(value) => setPinned((p) => ({ ...p, [current]: [...(p[current] ?? []), value] }))}
              onApplyToOthers={(targets, props) => {
                const src = drafts[current];
                const nextDrafts = { ...drafts };
                const newIds = targets.filter((id) => !order.includes(id));
                if (newIds.length) {
                  const fresh = scanVariables(ds, newIds, { maxCases: caseLimit });
                  setScans((s) => ({ ...s, ...Object.fromEntries(fresh.map((x) => [x.varId, x])) }));
                  setPinned((p) => ({ ...p, ...Object.fromEntries(newIds.map((id) => [id, byId.get(id)!.valueLabels.map((l) => l.value)])) }));
                  setOrder([...order, ...newIds]);
                }
                for (const id of targets) nextDrafts[id] = copyDraftProps(src, nextDrafts[id] ?? draftFromVariable(byId.get(id)!), props);
                setDrafts(nextDrafts);
                setPanel(null);
                setNotice({
                  varId: current,
                  tone: 'good',
                  text: `Copied ${props.map((p) => COPYABLE_PROPS.find((c) => c.id === p)!.label.toLowerCase()).join(', ')} to ${targets.map((id) => byId.get(id)!.name).join(', ')}. They are in the list on the left; press Apply to save everything.`,
                });
              }}
            />
          ) : null}
        </div>
      )}
    </Modal>
  );
}

function StatusGlyph({ status }: { status: string }) {
  const name = status === 'complete' ? 'check' : status === 'empty' ? 'info' : 'warn';
  return <Icon name={name} size={12} />;
}

// ---------- one variable ----------

interface EditorProps {
  ds: Dataset;
  v: Variable;
  scan: VarScan;
  draft: PropsDraft;
  pinned: Array<number | string>;
  valueLimit: number | null;
  panel: Panel;
  setPanel: (p: Panel) => void;
  notice: { key?: string; text: string; tone: 'bad' | 'good' | 'info' } | null;
  setNotice: (n: { key?: string; text: string; tone: 'bad' | 'good' | 'info' } | null) => void;
  issues: DraftIssue[];
  drafts: Record<string, PropsDraft>;
  onDraft: (d: PropsDraft) => void;
  onPin: (value: number | string) => void;
  onApplyToOthers: (targets: string[], props: CopyableProp[]) => void;
}

function VariableEditor(props: EditorProps) {
  const { ds, v, scan, draft, pinned, valueLimit, panel, setPanel, notice, setNotice, issues, onDraft } = props;
  const weighted = scan.weighted;
  const grid = useMemo(() => {
    const g = buildRows(v.type, scan, draft, valueLimit);
    // Values the user added (or that had labels when the dialog opened) keep their row while it is open.
    const have = new Set(g.rows.map((r) => r.key));
    const extra: GridRow[] = pinned
      .filter((x) => !have.has(valueKey(x)))
      .map((x) => ({ value: x, key: valueKey(x), count: 0, weighted: 0, observed: false, label: labelFor(draft, x) ?? '', missing: false, flags: [] }));
    if (!extra.length) return g;
    const rows = [...g.rows, ...extra].sort((a, b) => (typeof a.value === 'number' && typeof b.value === 'number' ? a.value - b.value : String(a.value).localeCompare(String(b.value))));
    return { ...g, rows, total: g.total + extra.length };
  }, [v.type, scan, draft, valueLimit, pinned]);
  const summary = summarise(scan, draft);
  const suggestion = useMemo(() => suggestMeasure(v.type, scan, draft, { name: v.name, label: draft.label, format: v.format }), [v.type, v.name, v.format, scan, draft]);
  const labelIssue = issues.find((i) => i.where === 'label');
  const missingIssue = issues.find((i) => i.where === 'missing');
  const formatIssue = issues.find((i) => i.where === 'format');
  const numericFormat = v.type === 'numeric' && !isDateFormat(v.format);
  const [newValue, setNewValue] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [addError, setAddError] = useState('');

  const setMissing = (row: GridRow, on: boolean) => {
    const r = toggleMissing(draft, v.type, row.value, on);
    if (r.draft !== draft) onDraft(r.draft);
    setNotice(r.problem ? { key: row.key, text: r.problem, tone: 'bad' } : null);
  };

  const addValue = () => {
    const value = parseValue(v.type, newValue);
    if (value === null) return setAddError(v.type === 'numeric' ? 'Type a number in Value.' : 'Type a value.');
    if (!newLabel.trim()) return setAddError('Type a label for this value.');
    onDraft(setValueLabel(draft, value, newLabel.trim()));
    props.onPin(value);
    setNewValue('');
    setNewLabel('');
    setAddError('');
    requestAnimationFrame(() => document.getElementById('dvp-new-value')?.focus());
  };

  const onLabelKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = Array.from(document.querySelectorAll<HTMLInputElement>('.dvp-grid input[data-label-input]'));
    const i = all.indexOf(e.currentTarget);
    const next = e.key === 'ArrowUp' ? all[i - 1] : all[i + 1];
    if (next) {
      e.preventDefault();
      next.focus();
      next.select();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('dvp-new-value')?.focus();
    }
  };

  const fmt = (n: number) => (Number.isInteger(n) ? fmtN(n) : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  return (
    <section className="dvp-main" aria-label={`Properties of ${v.name}`}>
      <div className="dvp-head">
        <h3 className="mono">{v.name}</h3>
        <span className="help">{typeText(v)}</span>
      </div>

      <div className="field">
        <label htmlFor="dvp-varlabel">Variable label (the question wording)</label>
        <input id="dvp-varlabel" className={`input ${labelIssue ? 'dvp-input-bad' : ''}`} value={draft.label} placeholder="For example: Most people in this neighbourhood can be trusted" onChange={(e) => onDraft({ ...draft, label: e.target.value })} />
        {labelIssue ? <div className="dvp-inline-bad" role="alert">{labelIssue.message}</div> : null}
      </div>

      <div className="dvp-props">
        <div className="field dvp-measure">
          <label htmlFor="dvp-measure">Measurement level</label>
          <select id="dvp-measure" className="select" value={draft.measure} onChange={(e) => onDraft({ ...draft, measure: e.target.value as MeasureLevel })}>
            {MEASURES.map((m) => <option key={m} value={m}>{measureName(m)}</option>)}
          </select>
        </div>
        <div className={`dvp-suggest ${suggestion.level === draft.measure ? 'same' : ''}`} data-testid="measure-suggestion">
          <MeasureIcon kind={measureKind({ type: v.type, measure: suggestion.level })} />
          <span>
            {suggestion.reason}
            {suggestion.level === draft.measure ? <span className="muted"> (the current setting)</span> : null}
          </span>
          {suggestion.level !== draft.measure ? (
            <button type="button" className="btn btn-sm" onClick={() => onDraft({ ...draft, measure: suggestion.level })}>Use {measureName(suggestion.level)}</button>
          ) : null}
        </div>
        {numericFormat ? (
          <div className="dvp-format">
            <div className="field">
              <label htmlFor="dvp-width">Width</label>
              <input id="dvp-width" className="input input-sm num" inputMode="numeric" value={String(draft.width)} onChange={(e) => onDraft({ ...draft, width: Math.round(Number(e.target.value)) || 0 })} />
            </div>
            <div className="field">
              <label htmlFor="dvp-dec">Decimals</label>
              <input id="dvp-dec" className="input input-sm num" inputMode="numeric" value={String(draft.decimals)} onChange={(e) => onDraft({ ...draft, decimals: e.target.value.trim() === '' ? -1 : Math.round(Number(e.target.value)) })} />
            </div>
          </div>
        ) : null}
      </div>
      {formatIssue ? <div className="dvp-inline-bad" role="alert">{formatIssue.message}</div> : null}

      <dl className="dvp-summary">
        <div><dt>Valid</dt><dd>{fmt(summary.valid)}{weighted ? <span className="muted"> (weighted {fmt(summary.validWeighted)})</span> : null}</dd></div>
        <div><dt>Missing</dt><dd>{fmt(summary.userMissing + summary.sysmis)}<span className="muted"> ({fmt(summary.userMissing)} marked missing, {fmt(summary.sysmis)} empty)</span></dd></div>
        <div><dt>Unique values</dt><dd>{fmt(summary.unique)}</dd></div>
        <div><dt>Cases scanned</dt><dd>{fmt(scan.casesScanned)}{scan.casesScanned < ds.nCases ? <span className="muted"> of {fmt(ds.nCases)}</span> : null}</dd></div>
      </dl>

      <div className="dvp-actions">
        <button type="button" className={`btn btn-sm ${panel === 'suggest' ? 'btn-toggle-on' : ''}`} aria-expanded={panel === 'suggest'} onClick={() => setPanel(panel === 'suggest' ? null : 'suggest')}>
          <Icon name="tag" size={14} /> Suggest labels
        </button>
        <button type="button" className={`btn btn-sm ${panel === 'copy-from' ? 'btn-toggle-on' : ''}`} aria-expanded={panel === 'copy-from'} onClick={() => setPanel(panel === 'copy-from' ? null : 'copy-from')}>
          Copy properties from another variable...
        </button>
        <button type="button" className={`btn btn-sm ${panel === 'apply-to' ? 'btn-toggle-on' : ''}`} aria-expanded={panel === 'apply-to'} onClick={() => setPanel(panel === 'apply-to' ? null : 'apply-to')}>
          Apply these properties to other variables...
        </button>
      </div>

      {panel === 'suggest' ? <SuggestPanel v={v} scan={scan} draft={draft} onClose={() => setPanel(null)} onAccept={(d, text) => { onDraft(d); setPanel(null); setNotice({ text, tone: 'good' }); }} /> : null}
      {panel === 'copy-from' ? (
        <CopyFromPanel
          ds={ds}
          v={v}
          drafts={props.drafts}
          onClose={() => setPanel(null)}
          onCopy={(src, ps) => {
            const from = props.drafts[src.id] ?? draftFromVariable(src);
            onDraft(copyDraftProps(from, draft, ps));
            for (const l of from.valueLabels) if (!pinned.some((x) => valueKey(x) === valueKey(l.value))) props.onPin(l.value);
            setPanel(null);
            setNotice({ text: `Copied ${ps.map((p) => COPYABLE_PROPS.find((c) => c.id === p)!.label.toLowerCase()).join(', ')} from ${src.name}.`, tone: 'good' });
          }}
        />
      ) : null}
      {panel === 'apply-to' ? <ApplyToPanel ds={ds} v={v} onClose={() => setPanel(null)} onApply={props.onApplyToOthers} /> : null}

      {notice && !notice.key ? <div className={`callout callout-${notice.tone === 'bad' ? 'bad' : notice.tone === 'good' ? 'good' : 'info'} dvp-notice`} role="status">{notice.text}</div> : null}

      <div className="dvp-missing-line">
        <span><strong>Missing values:</strong> <span className="mono">{describeMissingSpec(draft.missing)}</span></span>
        {draft.missing.range ? <button type="button" className="linkish" onClick={() => onDraft(removeMissingRange(draft))}>Remove the range</button> : null}
        <span className="help">Tick Missing for codes like Don&apos;t know or Refused: they stay in the data but analyses leave them out. SPSS allows 3 single missing values, or a range plus 1.</span>
      </div>
      {missingIssue ? <div className="dvp-inline-bad" role="alert">{missingIssue.message}</div> : null}

      <div className="dvp-grid" role="table" aria-label={`Values of ${v.name}`} data-weighted={weighted ? 'true' : undefined}>
        <div className="dvp-row dvp-row-head" role="row">
          <span role="columnheader" className="dvp-c-value">Value</span>
          <span role="columnheader" className="dvp-c-label">Label</span>
          <span role="columnheader" className="dvp-c-missing">Missing</span>
          <span role="columnheader" className="dvp-c-count">Count</span>
          {weighted ? <span role="columnheader" className="dvp-c-wcount">Weighted</span> : null}
          <span role="columnheader" className="dvp-c-flags">Notes</span>
        </div>
        {grid.rows.length === 0 ? <div className="dvp-empty help">This variable has no values in the scanned cases. You can still add labels below.</div> : null}
        {grid.rows.map((r) => {
          const labelBad = issues.find((i) => i.where === 'valueLabel' && i.value !== undefined && valueKey(i.value) === r.key);
          return (
            <div key={r.key} className={`dvp-row ${r.missing ? 'is-missing' : ''} ${r.observed ? '' : 'is-unobserved'}`} role="row" data-value={String(r.value)}>
              <span role="cell" className="dvp-c-value mono">{displayValue(r.value)}</span>
              <span role="cell" className="dvp-c-label">
                <input
                  className={`input input-sm ${labelBad ? 'dvp-input-bad' : ''}`}
                  data-label-input
                  aria-label={`Label for ${displayValue(r.value)}`}
                  value={labelFor(draft, r.value) ?? ''}
                  placeholder={r.observed ? 'Add a label' : ''}
                  onChange={(e) => onDraft(setValueLabel(draft, r.value, e.target.value))}
                  onKeyDown={onLabelKey}
                />
              </span>
              <span role="cell" className="dvp-c-missing">
                <label className="check">
                  <input type="checkbox" checked={r.missing} aria-label={`${displayValue(r.value)} is missing`} onChange={(e) => setMissing(r, e.target.checked)} />
                  <span className="dvp-narrow-only">Missing</span>
                </label>
              </span>
              <span role="cell" className="dvp-c-count num"><span className="dvp-narrow-only">Count </span>{r.observed ? fmt(r.count) : <span className="faint" title="Not in the scanned cases">0</span>}</span>
              {weighted ? <span role="cell" className="dvp-c-wcount num"><span className="dvp-narrow-only">Weighted </span>{fmt(r.weighted)}</span> : null}
              <span role="cell" className="dvp-c-flags">
                {r.flags.map((f) => (
                  <span key={f.kind} className={`badge badge-${f.tone === 'good' ? 'good' : f.tone === 'warn' ? 'warn' : 'accent'}`} data-flag={f.kind} title={f.reason}>
                    {f.text}
                    <span className="sr-only">: {f.reason}</span>
                  </span>
                ))}
              </span>
              {labelBad ? <div className="dvp-row-note dvp-inline-bad" role="alert">{labelBad.message}</div> : null}
              {notice && notice.key === r.key ? <div className={`dvp-row-note ${notice.tone === 'bad' ? 'dvp-inline-bad' : 'help'}`} role="alert">{notice.text}</div> : null}
            </div>
          );
        })}
        <div className="dvp-row dvp-row-add" role="row">
          <span role="cell" className="dvp-c-value">
            <input id="dvp-new-value" className="input input-sm mono" aria-label="New value" placeholder="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addValue()} />
          </span>
          <span role="cell" className="dvp-c-label">
            <input className="input input-sm" aria-label="Label for the new value" placeholder="Label for a value not in the data" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addValue()} />
          </span>
          <span role="cell" className="dvp-c-addbtn">
            <button type="button" className="btn btn-sm" onClick={addValue}><Icon name="plus" size={13} /> Add</button>
          </span>
          {addError ? <div className="dvp-row-note dvp-inline-bad" role="alert">{addError}</div> : null}
        </div>
      </div>
      {grid.hidden ? (
        <div className="help">
          Showing {fmtN(grid.rows.length)} of {fmtN(grid.total)} values: every labelled, missing or flagged value, then the most common others. Raise the limit in step 1 (Choose variables) to see more.
        </div>
      ) : null}
    </section>
  );
}

// ---------- panels ----------

function SuggestPanel({ v, scan, draft, onClose, onAccept }: { v: Variable; scan: VarScan; draft: PropsDraft; onClose: () => void; onAccept: (d: PropsDraft, text: string) => void }) {
  const options = useMemo(() => suggestLabels(v, scan, draft), [v, scan, draft]);
  const [pickId, setPickId] = useState<string | null>(options[0]?.id ?? null);
  const [onlyUnlabelled, setOnlyUnlabelled] = useState(true);
  const chosen: LabelSuggestion | undefined = options.find((o) => o.id === pickId);
  const preview = chosen ? previewSuggestion(draft, chosen, onlyUnlabelled) : [];
  const changes = preview.filter((p) => p.action === 'add' || p.action === 'replace').length + (chosen?.missing.length ?? 0);
  const accept = () => {
    if (!chosen) return;
    const r = applySuggestion(draft, v.type, chosen, onlyUnlabelled);
    const bits = [r.added ? `added ${plural(r.added, 'label')}` : '', r.replaced ? `replaced ${plural(r.replaced, 'label')}` : ''].filter(Boolean);
    const skipped = r.skippedMissing.length ? ` ${r.skippedMissing.map(displayValue).join(', ')} could not be marked missing: SPSS allows 3 missing values.` : '';
    onAccept(r.draft, `${chosen.title}: ${bits.join(' and ') || 'labels unchanged'}.${skipped} Check them in the grid below.`);
  };
  return (
    <div className="dvp-panel" role="region" aria-label="Suggested labels">
      <div className="dvp-panel-head">
        <strong>Suggested labels</strong>
        <span className="help">Nothing changes until you press Use these labels.</span>
      </div>
      {!options.length && scan.values.every((c) => labelFor(draft, c.value) !== undefined) ? (
        <div className="help">Every value already has a label, so there is nothing to suggest. You can still edit the labels in the grid.</div>
      ) : !options.length ? (
        <div className="help">
          No common pattern fits these values. Socius suggests labels for agreement scales coded 1 to 5 or 1 to 7, yes/no coded 0/1 or 1/2, sex or gender coded 1/2, and codes that look like missing answers. Type labels in the grid instead.
        </div>
      ) : (
        <>
          <div className="radio-list" role="radiogroup" aria-label="Label patterns">
            {options.map((o) => (
              <label key={o.id} className="check">
                <input type="radio" name="dvp-sugg" checked={pickId === o.id} onChange={() => setPickId(o.id)} />
                <span>{o.title}</span>
              </label>
            ))}
          </div>
          {chosen ? (
            <>
              <div className="help">{chosen.note}</div>
              <table className="table dvp-preview">
                <thead>
                  <tr><th>Value</th><th>Now</th><th>Suggested</th><th>What happens</th></tr>
                </thead>
                <tbody>
                  {preview.map((p) => (
                    <tr key={valueKey(p.value)}>
                      <td className="mono">{displayValue(p.value)}</td>
                      <td>{p.current || <span className="faint">no label</span>}</td>
                      <td>{p.suggested}</td>
                      <td className={p.action === 'add' || p.action === 'replace' ? '' : 'muted'}>
                        {p.action === 'add' ? 'Added' : p.action === 'replace' ? 'Replaced' : p.action === 'keep' ? 'Kept (has a label)' : 'Already the same'}
                        {chosen.missing.some((x) => valueKey(x) === valueKey(p.value)) ? ', marked missing' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {draft.valueLabels.length ? (
                <label className="check">
                  <input type="checkbox" checked={onlyUnlabelled} onChange={(e) => setOnlyUnlabelled(e.target.checked)} />
                  Only fill values that have no label yet
                </label>
              ) : null}
            </>
          ) : null}
        </>
      )}
      <div className="dvp-panel-foot">
        <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
        {options.length ? <button type="button" className="btn btn-sm btn-primary" onClick={accept} disabled={!chosen || !changes} title={chosen && !changes ? 'These labels are already in place' : undefined}>Use these labels</button> : null}
      </div>
    </div>
  );
}

function PropChecks({ value, onChange }: { value: CopyableProp[]; onChange: (p: CopyableProp[]) => void }) {
  return (
    <div className="dvp-propchecks" role="group" aria-label="Properties">
      {COPYABLE_PROPS.map((p) => (
        <label key={p.id} className="check">
          <input type="checkbox" checked={value.includes(p.id)} onChange={(e) => onChange(e.target.checked ? [...value, p.id] : value.filter((x) => x !== p.id))} />
          {p.label}
        </label>
      ))}
    </div>
  );
}

function CopyFromPanel({ ds, v, drafts, onClose, onCopy }: { ds: Dataset; v: Variable; drafts: Record<string, PropsDraft>; onClose: () => void; onCopy: (src: Variable, props: CopyableProp[]) => void }) {
  const [src, setSrc] = useState<string[]>([]);
  const [ps, setPs] = useState<CopyableProp[]>(COPYABLE_PROPS.filter((p) => p.defaultOn).map((p) => p.id));
  const filter = useMemo(() => (x: Variable) => x.id !== v.id && x.type === v.type, [v]);
  const source = ds.variables.find((x) => x.id === src[0]);
  const sd = source ? drafts[source.id] ?? draftFromVariable(source) : null;
  return (
    <div className="dvp-panel" role="region" aria-label="Copy properties from another variable">
      <div className="dvp-panel-head">
        <strong>Copy properties from another variable</strong>
        <span className="help">Only {v.type === 'string' ? 'text' : 'numeric'} variables are listed. Unapplied edits of scanned variables are copied too.</span>
      </div>
      <div className="dvp-panel-cols">
        <VarPicker ds={ds} value={src} onChange={setSrc} filter={filter} height={180} label="Copy from" />
        <div className="stack" style={{ gap: 8 }}>
          <PropChecks value={ps} onChange={setPs} />
          {sd ? <div className="help">{source!.name}: {plural(sd.valueLabels.length, 'value label')}, missing {describeMissingSpec(sd.missing)}, {measureName(sd.measure)}.</div> : null}
        </div>
      </div>
      <div className="dvp-panel-foot">
        <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={!source || !ps.length} title={!source ? 'Choose a variable to copy from' : !ps.length ? 'Tick at least one property' : undefined} onClick={() => source && onCopy(source, ps)}>
          Copy to {v.name}
        </button>
      </div>
    </div>
  );
}

function ApplyToPanel({ ds, v, onClose, onApply }: { ds: Dataset; v: Variable; onClose: () => void; onApply: (targets: string[], props: CopyableProp[]) => void }) {
  const [targets, setTargets] = useState<string[]>([]);
  const [ps, setPs] = useState<CopyableProp[]>(COPYABLE_PROPS.filter((p) => p.defaultOn).map((p) => p.id));
  const filter = useMemo(() => (x: Variable) => x.id !== v.id && x.type === v.type, [v]);
  const siblings = useMemo(() => batterySiblings(ds, v), [ds, v]);
  return (
    <div className="dvp-panel" role="region" aria-label="Apply these properties to other variables">
      <div className="dvp-panel-head">
        <strong>Apply the properties of {v.name} to other variables</strong>
        <span className="help">Useful for a battery of items with the same answer scale.</span>
      </div>
      {siblings.length ? (
        <div>
          <button type="button" className="linkish" onClick={() => setTargets([...new Set([...targets, ...siblings.map((x) => x.id)])])}>
            Select the other items like {v.name}: {siblings.length <= 5 ? siblings.map((x) => x.name).join(', ') : `${siblings.length} variables`}
          </button>
        </div>
      ) : null}
      <div className="dvp-panel-cols">
        <VarPicker ds={ds} value={targets} onChange={setTargets} multiple filter={filter} height={180} label="Apply to" />
        <PropChecks value={ps} onChange={setPs} />
      </div>
      <div className="dvp-panel-foot">
        <button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button>
        <button type="button" className="btn btn-sm btn-primary" disabled={!targets.length || !ps.length} title={!targets.length ? 'Choose the variables to apply to' : !ps.length ? 'Tick at least one property' : undefined} onClick={() => onApply(targets, ps)}>
          {targets.length ? `Apply to ${plural(targets.length, 'variable')}` : 'Apply to variables'}
        </button>
      </div>
    </div>
  );
}
