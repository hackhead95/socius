// Export coded segments, the qualitative report and the codebook; import a codebook;
// export codes to the dataset as 0/1 variables (mixed-methods bridge).

import { useMemo, useRef, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { useStore } from '../../../core/store';
import type { Dataset } from '../../../core/types';
import { reportData, reportHtml, segmentTable } from '../../../lib/coding/exports';
import { codebookToCsv, codebookToJson, mergeCodebook, parseCodebookCsv, parseCodebookJson } from '../../../lib/coding/codebookIO';
import { decodeText } from '../../../lib/coding/importers';
import { applyCodeVariables, buildCodeVariables, type ExportMode } from '../../../lib/coding/toDataset';
import { descendantIds } from '../../../lib/coding/tree';
import { replaceCodebook } from '../actions';
import { useOrderedCodes, saveAndReport, saveCsv, saveXlsx, toast, plural } from '../hooks';
import { Segmented, Swatch } from '../ui';

type Tab = 'segments' | 'report' | 'codebook';

export function ExportDialog(props: { onClose: () => void; initialTab?: Tab }) {
  const project = useStore((s) => s.coding);
  const [tab, setTab] = useState<Tab>(props.initialTab ?? 'segments');
  const [coder, setCoder] = useState('');
  const [title, setTitle] = useState('Qualitative coding report');
  const [counts, setCounts] = useState(true);
  const [busy, setBusy] = useState(false);
  const [importMsg, setImportMsg] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const coders = useMemo(() => [...new Set(project.segments.map((s) => s.coder))], [project.segments]);

  const segs = coder ? project.segments.filter((s) => s.coder === coder) : project.segments;
  const scoped = { ...project, segments: segs };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      toast(`Export failed: ${e?.message ?? 'unknown error'}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const importCodebook = async (file: File) => {
    try {
      const text = decodeText(new Uint8Array(await file.arrayBuffer()));
      const raw = /\.json$/i.test(file.name) ? parseCodebookJson(text) : parseCodebookCsv(text);
      if (!raw.length) throw new Error('No codes found in the file.');
      const r = mergeCodebook(project.codes, raw);
      replaceCodebook(r.codes, 'Import codebook');
      setImportMsg({ tone: 'good', text: `Added ${plural(r.added, 'code')}${r.updated ? `, filled in details for ${plural(r.updated, 'existing code')}` : ''}.` });
    } catch (e: any) {
      setImportMsg({ tone: 'bad', text: e?.message ?? 'Could not read the codebook.' });
    }
  };

  return (
    <Modal title="Export" subtitle="Coded segments, a report for your write-up, or the codebook" onClose={props.onClose} size="wide">
      <div className="stack">
        <Segmented
          label="What to export"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'segments', label: 'Coded segments' },
            { value: 'report', label: 'Report' },
            { value: 'codebook', label: 'Codebook' },
          ]}
        />
        {tab !== 'codebook' && coders.length > 1 ? (
          <div className="field" style={{ maxWidth: 280 }}>
            <label htmlFor="cw-excoder">Coder</label>
            <select id="cw-excoder" className="select" value={coder} onChange={(e) => setCoder(e.target.value)}>
              <option value="">All coders</option>
              {coders.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        ) : null}

        {tab === 'segments' ? (
          <>
            <p className="help">
              One row per coded segment: source, attributes, code, parent code, the coded text, coder, memo and how it was coded (manual, rule, AI suggestion). {plural(segs.length, 'segment')}.
            </p>
            <div className="row">
              <button className="btn btn-primary" disabled={!segs.length || busy} onClick={() => run(async () => { const t = segmentTable(scoped); await saveXlsx('coded segments.xlsx', 'Coded segments', t.header, t.rows); })}>Excel (.xlsx)</button>
              <button className="btn" disabled={!segs.length || busy} onClick={() => run(async () => { const t = segmentTable(scoped); await saveCsv('coded segments.csv', t.header, t.rows); })}>CSV</button>
            </div>
          </>
        ) : tab === 'report' ? (
          <>
            <p className="help">The codebook with definitions, counts and up to three example quotes per code, ready to adapt for a findings chapter or appendix.</p>
            <div className="field" style={{ maxWidth: 420 }}>
              <label htmlFor="cw-rtitle">Title</label>
              <input id="cw-rtitle" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="row">
              <button className="btn btn-primary" disabled={!project.codes.length || busy} onClick={() => run(async () => { const { reportDocx } = await import('../../../lib/coding/docxExports'); const bytes = await reportDocx(reportData(scoped, title || 'Qualitative coding report')); await saveAndReport(`${title || 'report'}.docx`, bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); })}>Word (.docx)</button>
              <button className="btn" disabled={!project.codes.length || busy} onClick={() => run(async () => { await saveAndReport(`${title || 'report'}.html`, reportHtml(reportData(scoped, title || 'Qualitative coding report')), 'text/html;charset=utf-8'); })}>Web page (.html)</button>
            </div>
          </>
        ) : (
          <>
            <p className="help">Export the codebook as a Word table (for a thesis appendix), or as CSV or JSON to share with co-coders and import into another project.</p>
            <label className="check">
              <input type="checkbox" checked={counts} onChange={(e) => setCounts(e.target.checked)} /> Include segment and source counts in the Word table
            </label>
            <div className="row">
              <button className="btn btn-primary" disabled={!project.codes.length || busy} onClick={() => run(async () => { const { codebookDocx } = await import('../../../lib/coding/docxExports'); const bytes = await codebookDocx(project, { includeCounts: counts }); await saveAndReport('codebook.docx', bytes, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); })}>Word table (.docx)</button>
              <button className="btn" disabled={!project.codes.length || busy} onClick={() => run(() => saveAndReport('codebook.csv', codebookToCsv(project.codes), 'text/csv;charset=utf-8'))}>CSV</button>
              <button className="btn" disabled={!project.codes.length || busy} onClick={() => run(() => saveAndReport('codebook.json', codebookToJson(project.codes), 'application/json'))}>JSON</button>
            </div>
            <hr className="divider" />
            <div className="stack" style={{ gap: 6 }}>
              <b>Import a codebook</b>
              <p className="help">A Socius JSON codebook, or a CSV with a “name” column and optional parent, description, inclusion, exclusion, example, color and rules columns. Codes with a name you already use are kept; empty details are filled in.</p>
              <div>
                <button className="btn" onClick={() => fileRef.current?.click()}>Choose JSON or CSV file</button>
                <input ref={fileRef} type="file" accept=".json,.csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importCodebook(f); e.target.value = ''; }} />
              </div>
              {importMsg ? <div className={`callout ${importMsg.tone === 'good' ? 'callout-good' : 'callout-bad'}`}>{importMsg.text}</div> : null}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export function ExportToDatasetDialog(props: { onClose: () => void }) {
  const ds = useStore((s) => s.dataset);
  const project = useStore((s) => s.coding);
  const mutateDataset = useStore((s) => s.mutateDataset);
  const nodes = useOrderedCodes();
  const linked = useMemo(() => project.docs.filter((d) => d.kind === 'response' && d.varId && ds?.columns[d.varId]), [project.docs, ds]);
  const questions = useMemo(() => [...new Set(linked.map((d) => d.varId!))], [linked]);
  const [question, setQuestion] = useState(questions[0] ?? '');
  const linkedIds = useMemo(() => new Set(linked.filter((d) => d.varId === question).map((d) => d.id)), [linked, question]);
  // Themes (codes with sub-codes) get a variable that is 1 when the theme or any sub-code applies.
  const members = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const n of nodes) {
      const d = descendantIds(project.codes, n.code.id);
      if (d.length) m[n.code.id] = [n.code.id, ...d];
    }
    return m;
  }, [nodes, project.codes]);
  const usedCodes = useMemo(() => {
    const used = new Set(project.segments.filter((s) => linkedIds.has(s.docId)).map((s) => s.codeId));
    return nodes.filter((n) => (members[n.code.id] ?? [n.code.id]).some((id) => used.has(id))).map((n) => n.code);
  }, [project.segments, linkedIds, nodes, members]);
  const depthOf = useMemo(() => new Map(nodes.map((n) => [n.code.id, n.depth])), [nodes]);
  const [chosen, setChosen] = useState<Set<string>>(() => new Set(usedCodes.map((c) => c.id)));
  const [coder, setCoder] = useState('');
  const [countVar, setCountVar] = useState(true);
  const [mode, setMode] = useState<ExportMode>('update');
  const coders = useMemo(() => [...new Set(project.segments.filter((s) => linkedIds.has(s.docId)).map((s) => s.coder))], [project.segments, linkedIds]);

  const build = useMemo(() => {
    if (!ds || !question) return null;
    const ids = usedCodes.filter((c) => chosen.has(c.id)).map((c) => c.id);
    return buildCodeVariables(ds, project.codes, project.docs, project.segments, ids, { sourceVarId: question, coder: coder || null, countVariable: countVar, members, mode });
  }, [ds, question, usedCodes, chosen, project, coder, countVar, members, mode]);
  const previous = build?.previous ?? [];
  const nUpdate = build?.plans.filter((p) => p.replaces).length ?? 0;
  const nAdd = (build?.plans.length ?? 0) - nUpdate;

  if (!ds || !linked.length) {
    return (
      <Modal title="Export codes to dataset" size="narrow" onClose={props.onClose} footer={<button className="btn btn-primary" onClick={props.onClose}>Close</button>}>
        <p style={{ fontSize: 'var(--fs-sm)' }}>
          {!ds ? 'Open the dataset the responses came from first.' : 'None of the coded responses come from this dataset. Import open-ended answers from a string variable of this dataset (Import > Open-ended answers), code them, then export the codes here.'}
        </p>
      </Modal>
    );
  }

  const apply = () => {
    if (!build || !build.plans.length) return;
    const plans = build.plans;
    // One dataset update, so a single Undo reverts both the updated values and the new variables.
    mutateDataset((d: Dataset) => applyCodeVariables(d, plans, question));
    const listNames = (names: string[]) => `${names.slice(0, 3).join(', ')}${names.length > 3 ? '…' : ''}`;
    const updated = plans.filter((p) => p.replaces).map((p) => p.variable.name);
    const added = plans.filter((p) => !p.replaces).map((p) => p.variable.name);
    const parts: string[] = [];
    if (updated.length) parts.push(`Updated ${plural(updated.length, 'existing variable')} (${listNames(updated)})`);
    if (added.length) parts.push(`${updated.length ? 'added' : 'Added'} ${plural(added.length, 'variable')} (${listNames(added)}) after ${ds.variables.find((v) => v.id === question)?.name}`);
    toast(
      `${parts.join(' and ')}. 1 = mentioned, 0 = not mentioned, blank = no answer. Compare groups with Crosstabs (chi-square). Undo in the Edit menu reverts this.`,
      'success',
    );
    props.onClose();
  };
  const applyLabel = nUpdate && nAdd ? `Update ${nUpdate}, add ${nAdd}` : nUpdate ? `Update ${plural(nUpdate, 'variable')}` : `Add ${plural(nAdd, 'variable')}`;

  return (
    <Modal
      title="Export codes to dataset"
      subtitle="One 0/1 variable per code, so you can run crosstabs or regressions on what people wrote"
      onClose={props.onClose}
      footer={
        <>
          <button className="btn" onClick={props.onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!build?.plans.length} onClick={apply}>{applyLabel}</button>
        </>
      }
    >
      <div className="stack">
        <div className="cw-form-grid">
          {questions.length > 1 ? (
            <div className="field">
              <label htmlFor="cw-q">Question</label>
              <select id="cw-q" className="select" value={question} onChange={(e) => setQuestion(e.target.value)}>
                {questions.map((q) => <option key={q} value={q}>{ds.variables.find((v) => v.id === q)?.name}</option>)}
              </select>
            </div>
          ) : null}
          {coders.length > 1 ? (
            <div className="field">
              <label htmlFor="cw-dcoder">Use coding by</label>
              <select id="cw-dcoder" className="select" value={coder} onChange={(e) => setCoder(e.target.value)}>
                <option value="">Any coder</option>
                {coders.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          ) : null}
        </div>
        {!usedCodes.length ? <div className="callout callout-info">None of these responses are coded yet.</div> : null}
        {previous.length ? (
          <div className="callout callout-info stack" style={{ gap: 6 }} role="radiogroup" aria-label="Variables exported before">
            <span>
              {previous.length === 1 ? 'A variable for these codes was' : `${previous.length} variables for these codes were`} already exported from this question (
              <span className="mono">{previous.slice(0, 4).map((v) => v.name).join(', ')}{previous.length > 4 ? '…' : ''}</span>).
            </span>
            <label className="check">
              <input type="radio" name="cw-export-mode" checked={mode === 'update'} onChange={() => setMode('update')} /> Update the existing variables (replace their values; names, labels and position stay)
            </label>
            <label className="check">
              <input type="radio" name="cw-export-mode" checked={mode === 'new'} onChange={() => setMode('new')} /> Create new copies (the earlier variables are kept as they are)
            </label>
          </div>
        ) : null}
        <div className="row">
          <b>Codes</b>
          <span className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => setChosen(chosen.size ? new Set() : new Set(usedCodes.map((c) => c.id)))}>{chosen.size ? 'Select none' : 'Select all'}</button>
        </div>
        <table className="table">
          <thead>
            <tr><th style={{ width: 32 }} /><th>Code</th><th>{nUpdate ? 'Variable' : 'New variable'}</th><th className="num">Mentioned</th></tr>
          </thead>
          <tbody>
            {usedCodes.map((c) => {
              const plan = build?.plans.find((p) => p.codeId === c.id);
              return (
                <tr key={c.id}>
                  <td><input type="checkbox" checked={chosen.has(c.id)} onChange={() => setChosen((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} aria-label={`Export ${c.name}`} /></td>
                  <td style={{ paddingLeft: 8 + (depthOf.get(c.id) ?? 0) * 16 }}><span className="row" style={{ gap: 6 }}><Swatch color={c.color} />{c.name}{members[c.id] ? <span className="faint">theme: 1 if any of its sub-codes applies</span> : null}</span></td>
                  <td className="mono">{plan?.variable.name ?? ''}{plan?.replaces ? <span className="faint"> (update)</span> : null}</td>
                  <td className="num">{plan ? `${plan.nMentioned} of ${build!.nLinked}` : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <label className="check">
          <input type="checkbox" checked={countVar} onChange={(e) => setCountVar(e.target.checked)} /> Also add a count variable (number of these codes mentioned)
        </label>
        <p className="help">
          Values: 1 = Mentioned, 0 = Not mentioned (value labels included), system-missing for cases with no answer. Measurement level nominal.
          {build?.nMismatched ? ` ${plural(build.nMismatched, 'response')} no longer match their case (cases were deleted, sorted or edited) and are left out.` : ''}
        </p>
      </div>
    </Modal>
  );
}
