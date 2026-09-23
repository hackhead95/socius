// Import sources: files (.txt .md .docx .csv .xlsx), pasted text, sample interviews, and
// open-ended answers from a string variable of the active dataset.

import { useMemo, useRef, useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { useStore } from '../../../core/store';
import type { TextDoc } from '../../../core/coding-types';
import { newId } from '../../../core/types';
import { varDisplayName } from '../../../core/data';
import { decodeText, extractDocxText, normaliseText, parseCsv } from '../../../lib/coding/importers';
import { buildResponseDocs } from '../../../lib/coding/survey';
import { sampleTranscripts } from '../../../samples';
import { addDocs } from '../actions';
import { plural, toast } from '../hooks';
import { useCodingUi } from '../uiStore';
import { Segmented } from '../ui';

type Tab = 'files' | 'paste' | 'samples' | 'survey';

interface Table {
  fileName: string;
  header: string[];
  rows: string[][];
}

export function ImportDialog(props: { onClose: () => void; initialTab?: Tab }) {
  const dataset = useStore((s) => s.dataset);
  const [tab, setTab] = useState<Tab>(props.initialTab ?? 'files');
  return (
    <Modal
      title="Import sources"
      subtitle="Interview transcripts, field notes and open-ended survey answers"
      onClose={props.onClose}
      size="wide"
    >
      <div className="stack">
        <Segmented
          label="Import from"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'files', label: 'Files' },
            { value: 'paste', label: 'Paste text' },
            { value: 'samples', label: 'Sample interviews' },
            { value: 'survey', label: dataset ? 'Open-ended answers in the dataset' : 'Open-ended answers' },
          ]}
        />
        {tab === 'files' ? <FilesTab onDone={props.onClose} /> : tab === 'paste' ? <PasteTab onDone={props.onClose} /> : tab === 'samples' ? <SamplesTab onDone={props.onClose} /> : <SurveyTab onDone={props.onClose} />}
      </div>
    </Modal>
  );
}

function finish(docs: TextDoc[], onDone: () => void) {
  if (!docs.length) return;
  addDocs(docs);
  const nDocs = docs.filter((d) => d.kind === 'document').length;
  const nResp = docs.length - nDocs;
  const ui = useCodingUi.getState();
  if (nDocs) ui.set({ view: 'documents', activeDocId: docs.find((d) => d.kind === 'document')!.id });
  else ui.set({ view: 'responses' });
  toast(`Imported ${[nDocs ? plural(nDocs, 'document') : '', nResp ? plural(nResp, 'response') : ''].filter(Boolean).join(' and ')}.`, 'success');
  onDone();
}

function FilesTab({ onDone }: { onDone: () => void }) {
  const [pending, setPending] = useState<Array<{ name: string; text: string; include: boolean }>>([]);
  const [table, setTable] = useState<Table | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFiles = async (files: FileList | File[]) => {
    setBusy(true);
    const errs: string[] = [];
    const docs: Array<{ name: string; text: string; include: boolean }> = [];
    for (const f of Array.from(files)) {
      const ext = (f.name.split('.').pop() ?? '').toLowerCase();
      const base = f.name.replace(/\.[^.]+$/, '');
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        if (ext === 'docx') docs.push({ name: base, text: normaliseText(extractDocxText(bytes)), include: true });
        else if (ext === 'txt' || ext === 'md' || ext === 'text') docs.push({ name: base, text: normaliseText(decodeText(bytes)), include: true });
        else if (ext === 'csv' || ext === 'tsv') {
          const rows = parseCsv(decodeText(bytes), ext === 'tsv' ? '\t' : undefined);
          if (rows.length < 2) throw new Error('needs a header row and at least one response');
          setTable({ fileName: f.name, header: rows[0].map((h, i) => h.trim() || `Column ${i + 1}`), rows: rows.slice(1) });
        } else if (ext === 'xlsx') {
          const { default: readXlsxFile } = await import('read-excel-file/browser');
          const sheets = await readXlsxFile(f);
          const data = sheets[0]?.data ?? [];
          const rows = data.map((r) => r.map((c) => (c === null || c === undefined ? '' : c instanceof Date ? c.toISOString().slice(0, 10) : String(c))));
          if (rows.length < 2) throw new Error('the first sheet needs a header row and at least one response');
          setTable({ fileName: f.name, header: rows[0].map((h, i) => h.trim() || `Column ${i + 1}`), rows: rows.slice(1) });
        } else if (ext === 'doc') {
          errs.push(`${f.name}: old Word .doc files cannot be read. Save it as .docx in Word and import that.`);
        } else if (ext === 'pdf') {
          errs.push(`${f.name}: PDF text cannot be read here. Copy the text into Paste text, or save it as .docx or .txt.`);
        } else errs.push(`${f.name}: this file type is not supported. Use .docx, .txt, .md, .csv or .xlsx.`);
      } catch (e: any) {
        errs.push(`${f.name}: ${e?.message ?? 'could not be read'}`);
      }
    }
    for (const d of docs) if (!d.text.trim()) errs.push(`${d.name}: no text found.`);
    setPending((p) => [...p, ...docs.filter((d) => d.text.trim())]);
    setErrors(errs);
    setBusy(false);
  };

  if (table) return <TableImport table={table} onBack={() => setTable(null)} onDone={onDone} />;

  return (
    <div className="stack">
      <div
        className={`cw-drop ${drag ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) void readFiles(e.dataTransfer.files);
        }}
      >
        <p>
          <b>Drop files here</b> or{' '}
          <button className="btn btn-sm" onClick={() => inputRef.current?.click()}>
            choose files
          </button>
        </p>
        <p className="help">Word (.docx), plain text (.txt, .md): one document per file. CSV or Excel (.xlsx): one response per row, you choose the text column next.</p>
        <input ref={inputRef} type="file" multiple accept=".txt,.md,.docx,.csv,.tsv,.xlsx" hidden onChange={(e) => e.target.files && void readFiles(e.target.files)} />
      </div>
      {busy ? <p className="help">Reading files…</p> : null}
      {errors.map((e, i) => (
        <div key={i} className="callout callout-warn">
          {e}
        </div>
      ))}
      {pending.length ? (
        <>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>Name</th>
                <th className="num">Words</th>
                <th>Beginning</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((d, i) => (
                <tr key={i}>
                  <td>
                    <input type="checkbox" checked={d.include} onChange={(e) => setPending((p) => p.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)))} aria-label={`Include ${d.name}`} />
                  </td>
                  <td>
                    <input className="input input-sm" value={d.name} onChange={(e) => setPending((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} aria-label="Document name" />
                  </td>
                  <td className="num">{d.text.split(/\s+/).filter(Boolean).length.toLocaleString()}</td>
                  <td className="help cw-cell-clip">{d.text.slice(0, 120)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn btn-primary"
              disabled={!pending.some((d) => d.include)}
              onClick={() =>
                finish(
                  pending.filter((d) => d.include).map((d) => ({ id: newId('doc'), name: d.name.trim() || 'Untitled', kind: 'document', text: d.text, attributes: {}, createdAt: Date.now() })),
                  onDone,
                )
              }
            >
              Import {plural(pending.filter((d) => d.include).length, 'document')}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function TableImport({ table, onBack, onDone }: { table: Table; onBack: () => void; onDone: () => void }) {
  const guess = useMemo(() => {
    // The text column: the one with the longest average cell.
    let best = 0, bestLen = -1;
    table.header.forEach((_, i) => {
      const avg = table.rows.slice(0, 200).reduce((s, r) => s + (r[i]?.length ?? 0), 0);
      if (avg > bestLen) {
        best = i;
        bestLen = avg;
      }
    });
    return best;
  }, [table]);
  // An ID column: all values distinct and a name like id, resp_id, respondent, name.
  const idGuess = useMemo(
    () =>
      table.header.findIndex(
        (h, i) => i !== guess && /^(id|.*[_ ]id|respondent.*|name|case.*|serial)$/i.test(h.trim()) && new Set(table.rows.map((r) => r[i]?.trim() ?? '')).size === table.rows.length,
      ),
    [table, guess],
  );
  const [textCol, setTextCol] = useState(guess);
  const [nameCol, setNameCol] = useState(idGuess);
  const [attrs, setAttrs] = useState<Set<number>>(() => {
    const s = new Set<number>();
    table.header.forEach((_, i) => {
      if (i === guess || i === idGuess) return;
      const distinct = new Set(table.rows.map((r) => r[i]?.trim() ?? '')).size;
      if (distinct > 1 && distinct <= 30 && (table.rows.length < 5 || distinct < table.rows.length)) s.add(i);
    });
    return s;
  });
  const [kind, setKind] = useState<'response' | 'document'>('response');
  const nonEmpty = table.rows.filter((r) => (r[textCol] ?? '').trim()).length;

  const run = () => {
    const now = Date.now();
    const docs: TextDoc[] = [];
    table.rows.forEach((r, i) => {
      const text = (r[textCol] ?? '').trim();
      if (!text) return;
      const attributes: Record<string, string> = {};
      for (const a of attrs) {
        const v = (r[a] ?? '').trim();
        if (v) attributes[table.header[a]] = v;
      }
      const idVal = nameCol >= 0 ? (r[nameCol] ?? '').trim() : '';
      const name = idVal ? (/^\d+$/.test(idVal) ? `${table.header[nameCol]} ${idVal}` : idVal) : `Row ${i + 1}`;
      docs.push({ id: newId('doc'), name, kind, text: kind === 'document' ? normaliseText(text) : text, attributes, createdAt: now + i });
    });
    finish(docs, onDone);
  };

  return (
    <div className="stack">
      <div className="row">
        <b>{table.fileName}</b>
        <span className="help">{plural(table.rows.length, 'row')}</span>
        <span className="spacer" />
        <button className="btn btn-sm btn-ghost" onClick={onBack}>
          Choose another file
        </button>
      </div>
      <div className="cw-form-grid">
        <div className="field">
          <label htmlFor="cw-textcol">Column with the text</label>
          <select id="cw-textcol" className="select" value={textCol} onChange={(e) => setTextCol(Number(e.target.value))}>
            {table.header.map((h, i) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cw-namecol">Column with an ID or name (optional)</label>
          <select id="cw-namecol" className="select" value={nameCol} onChange={(e) => setNameCol(Number(e.target.value))}>
            <option value={-1}>None (Row 1, Row 2…)</option>
            {table.header.map((h, i) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cw-kind2">Each row is</label>
          <select id="cw-kind2" className="select" value={kind} onChange={(e) => setKind(e.target.value as any)}>
            <option value="response">an open-ended response</option>
            <option value="document">a document</option>
          </select>
        </div>
      </div>
      <fieldset className="cw-fieldset">
        <legend className="label">Attributes to keep (for filtering and codes-by-attribute tables)</legend>
        <div className="cw-checkgrid">
          {table.header.map((h, i) =>
            i === textCol ? null : (
              <label key={i} className="check">
                <input
                  type="checkbox"
                  checked={attrs.has(i)}
                  onChange={(e) =>
                    setAttrs((s) => {
                      const n = new Set(s);
                      if (e.target.checked) n.add(i);
                      else n.delete(i);
                      return n;
                    })
                  }
                />
                {h}
              </label>
            ),
          )}
        </div>
      </fieldset>
      <div className="cw-preview">
        {table.rows.slice(0, 4).map((r, i) => (
          <div key={i} className="cw-preview-row">
            <span className="help">{nameCol >= 0 ? r[nameCol] : `Row ${i + 1}`}</span> {(r[textCol] ?? '').slice(0, 200) || <i className="faint">empty</i>}
          </div>
        ))}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" disabled={!nonEmpty} onClick={run}>
          Import {plural(nonEmpty, kind === 'response' ? 'response' : 'document')}
        </button>
      </div>
    </div>
  );
}

function PasteTab({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [split, setSplit] = useState(false);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="cw-pname">Name</label>
        <input id="cw-pname" className="input" value={name} placeholder={split ? 'Name prefix, e.g. Q12' : 'e.g. Interview 4, field notes 12 March'} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="cw-ptext">Text</label>
        <textarea id="cw-ptext" className="textarea cw-paste" rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a transcript or notes here" />
      </div>
      <label className="check">
        <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
        Each line is a separate open-ended response
      </label>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          disabled={!text.trim()}
          onClick={() => {
            const now = Date.now();
            const base = name.trim();
            const docs: TextDoc[] = split
              ? lines.map((l, i) => ({ id: newId('doc'), name: `${base || 'Response'} ${i + 1}`, kind: 'response', text: l, attributes: {}, createdAt: now + i }))
              : [{ id: newId('doc'), name: base || 'Pasted text', kind: 'document', text: normaliseText(text), attributes: {}, createdAt: now }];
            finish(docs, onDone);
          }}
        >
          {split ? `Import ${plural(lines.length, 'response')}` : 'Import document'}
        </button>
      </div>
    </div>
  );
}

function SamplesTab({ onDone }: { onDone: () => void }) {
  const existing = useStore((s) => s.coding.docs);
  const [chosen, setChosen] = useState<Set<number>>(() => new Set(sampleTranscripts.map((_, i) => i)));
  if (!sampleTranscripts.length) {
    return <div className="cw-empty-small help">No sample interviews are bundled in this build. Import your own transcripts from Files or Paste text.</div>;
  }
  const already = new Set(existing.filter((d) => d.kind === 'document').map((d) => d.name));
  return (
    <div className="stack">
      <p className="help">Practice transcripts bundled with Socius. They are fictional and safe to experiment with.</p>
      <div className="cw-sample-list">
        {sampleTranscripts.map((t, i) => (
          <label key={i} className="cw-sample">
            <input
              type="checkbox"
              checked={chosen.has(i)}
              onChange={(e) =>
                setChosen((s) => {
                  const n = new Set(s);
                  if (e.target.checked) n.add(i);
                  else n.delete(i);
                  return n;
                })
              }
            />
            <span className="stack" style={{ gap: 2 }}>
              <b>
                {t.name}
                {already.has(t.name) ? <span className="badge" style={{ marginLeft: 6 }}>already imported</span> : null}
              </b>
              <span className="help">
                {t.text.split(/\s+/).length.toLocaleString()} words
                {Object.entries(t.attributes).length ? ` · ${Object.entries(t.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}` : ''}
              </span>
            </span>
          </label>
        ))}
      </div>
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          disabled={!chosen.size}
          onClick={() => {
            const now = Date.now();
            finish(
              [...chosen].sort((a, b) => a - b).map((i, k) => ({ id: newId('doc'), name: sampleTranscripts[i].name, kind: 'document' as const, text: normaliseText(sampleTranscripts[i].text), attributes: { ...sampleTranscripts[i].attributes }, createdAt: now + k })),
              onDone,
            );
          }}
        >
          Load {plural(chosen.size, 'interview')}
        </button>
      </div>
    </div>
  );
}

function SurveyTab({ onDone }: { onDone: () => void }) {
  const ds = useStore((s) => s.dataset);
  const existing = useStore((s) => s.coding.docs);
  const stringVars = useMemo(() => {
    if (!ds) return [];
    return ds.variables
      .filter((v) => v.type === 'string')
      .map((v) => {
        const col = ds.columns[v.id] as string[];
        let n = 0, len = 0;
        for (const x of col) {
          const t = x.trim();
          if (t) {
            n++;
            len += t.length;
          }
        }
        return { v, n, avg: n ? len / n : 0 };
      })
      .filter((x) => x.n > 0)
      .sort((a, b) => b.avg - a.avg);
  }, [ds]);
  const [varId, setVarId] = useState(stringVars[0]?.v.id ?? '');
  const attrCandidates = useMemo(() => (ds ? ds.variables.filter((v) => v.id !== varId && (v.valueLabels.length > 0 || v.measure !== 'scale') && !(v.type === 'string' && stringVars.find((s) => s.v.id === v.id && s.avg > 30))) : []), [ds, varId, stringVars]);
  const [attrs, setAttrs] = useState<Set<string>>(() => new Set(attrCandidates.filter((v) => v.valueLabels.length > 0 && v.valueLabels.length <= 12).slice(0, 6).map((v) => v.id)));
  const [idVar, setIdVar] = useState<string>(() => ds?.variables.find((v) => /^(id|resp_?id|respondent|case_?id|caseno|serial)$/i.test(v.name))?.id ?? '');
  const [error, setError] = useState('');

  if (!ds) {
    return <div className="cw-empty-small help">Open a dataset first (File menu). Then pick the string variable that holds the open-ended answers.</div>;
  }
  if (!stringVars.length) {
    return <div className="cw-empty-small help">This dataset has no string variables with text in them. Open-ended answers are stored as string variables in SPSS.</div>;
  }
  const chosen = stringVars.find((s) => s.v.id === varId);
  const col = ds.columns[varId] as string[] | undefined;
  const samples = col ? col.map((x, i) => [i, x.trim()] as const).filter(([, x]) => x).slice(0, 4) : [];
  const nAlready = existing.filter((d) => d.kind === 'response' && d.varId === varId).length;

  return (
    <div className="stack">
      <div className="cw-form-grid">
        <div className="field">
          <label htmlFor="cw-svar">Open-ended question (string variable)</label>
          <select id="cw-svar" className="select" value={varId} onChange={(e) => setVarId(e.target.value)}>
            {stringVars.map((s) => (
              <option key={s.v.id} value={s.v.id}>
                {varDisplayName(s.v, 'both')} ({s.n.toLocaleString()} answers)
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cw-sid">Name responses by (optional)</label>
          <select id="cw-sid" className="select" value={idVar} onChange={(e) => setIdVar(e.target.value)}>
            <option value="">Case number</option>
            {ds.variables.filter((v) => v.id !== varId).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
      </div>
      <fieldset className="cw-fieldset">
        <legend className="label">Attributes (respondent characteristics to compare codes by)</legend>
        <div className="cw-checkgrid">
          {attrCandidates.map((v) => (
            <label key={v.id} className="check" title={v.label}>
              <input
                type="checkbox"
                checked={attrs.has(v.id)}
                onChange={(e) =>
                  setAttrs((s) => {
                    const n = new Set(s);
                    if (e.target.checked) n.add(v.id);
                    else n.delete(v.id);
                    return n;
                  })
                }
              />
              {v.name}
              {v.label ? <span className="faint cw-cell-clip"> {v.label}</span> : null}
            </label>
          ))}
          {!attrCandidates.length ? <span className="help">No categorical variables found.</span> : null}
        </div>
      </fieldset>
      <div className="cw-preview">
        {samples.map(([i, x]) => (
          <div key={i} className="cw-preview-row">
            <span className="help">Case {i + 1}</span> {x.slice(0, 220)}
          </div>
        ))}
      </div>
      {nAlready ? <div className="callout callout-info">{plural(nAlready, 'answer')} to this question were imported before; they will be skipped.</div> : null}
      {error ? <div className="callout callout-bad">{error}</div> : null}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <button
          className="btn btn-primary"
          disabled={!chosen}
          onClick={() => {
            try {
              const r = buildResponseDocs(ds, varId, [...attrs].filter((id) => attrCandidates.some((v) => v.id === id)), idVar || null, existing);
              if (!r.docs.length) {
                setError(r.nDuplicate ? 'All answers to this question are already imported.' : 'No non-empty answers found.');
                return;
              }
              finish(r.docs, onDone);
            } catch (e: any) {
              setError(e?.message ?? 'Could not import the answers.');
            }
          }}
        >
          Import {plural(Math.max(0, (chosen?.n ?? 0) - nAlready), 'answer')}
        </button>
      </div>
    </div>
  );
}
