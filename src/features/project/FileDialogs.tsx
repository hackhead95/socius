// File dialogs: text/Excel import options with a live preview, and recent projects.
import { useEffect, useMemo, useState } from 'react';
import type { Dataset } from '../../core/types';
import { formatCell } from '../../core/data';
import { importFile, type ImportColumnInfo, type ImportOptions } from '../../lib/io';
import { Modal } from '../../ui/Modal';
import { Icon } from '../../ui/Icon';
import { VarMeasureIcon } from '../../ui/MeasureIcon';
import { confirmReplace, importBytes, openRecentProject } from './fileActions';
import { listRecent, removeRecent, type RecentEntry } from './persistence';
import { formatDateTime } from '../../core/format-date';

const PREVIEW_BYTES = 96 * 1024;

/** Encodings offered for SPSS files that do not name theirs (older SPSS versions, other programs). */
const SAV_ENCODINGS: Array<[string, string]> = [
  ['utf-8', 'UTF-8 (Unicode)'],
  ['windows-1252', 'Western European (Windows-1252)'],
  ['windows-1250', 'Central European (Windows-1250)'],
  ['windows-1251', 'Cyrillic (Windows-1251)'],
  ['windows-1253', 'Greek (Windows-1253)'],
  ['windows-1254', 'Turkish (Windows-1254)'],
  ['windows-1256', 'Arabic (Windows-1256)'],
  ['iso-8859-2', 'Central European (ISO-8859-2)'],
  ['koi8-r', 'Cyrillic (KOI8-R)'],
  ['gbk', 'Chinese Simplified (GBK)'],
  ['big5', 'Chinese Traditional (Big5)'],
  ['shift_jis', 'Japanese (Shift-JIS)'],
  ['euc-kr', 'Korean (EUC-KR)'],
];

// eslint-disable-next-line no-control-regex
const NON_ASCII = /[^\x00-\x7f]/;

/** Variables whose names, labels, value labels or first string values show the encoding at work. */
function textSamples(ds: Dataset): Array<{ name: string; text: string }> {
  const out: Array<{ name: string; text: string }> = [];
  const plain: Array<{ name: string; text: string }> = [];
  for (const v of ds.variables) {
    const col = ds.columns[v.id];
    const firstText = Array.isArray(col) ? col.find((x) => x.trim() !== '') ?? '' : '';
    const parts = [v.label, ...v.valueLabels.slice(0, 3).map((l) => l.label), firstText].filter(Boolean);
    const text = parts.join(' · ');
    (NON_ASCII.test(v.name + text) ? out : plain).push({ name: v.name, text });
  }
  return [...out, ...plain].slice(0, 8);
}

export function ImportDialog({ params, onClose }: { params?: Record<string, unknown>; onClose: () => void }) {
  const name = String(params?.name ?? 'file');
  const bytes = params?.bytes instanceof Uint8Array ? params.bytes : new Uint8Array();
  const kind = params?.kind === 'xlsx' ? 'xlsx' : params?.kind === 'sav' ? 'sav' : 'text';
  const note = typeof params?.note === 'string' ? params.note.replace(/\s*If letters look wrong.*$/, '') : '';
  const sheets = Array.isArray(params?.sheets) ? (params!.sheets as string[]) : [];
  const [delimiter, setDelimiter] = useState('auto');
  const [header, setHeader] = useState(true);
  const [encoding, setEncoding] = useState(kind === 'sav' ? (/Windows-1252/.test(note) ? 'windows-1252' : 'utf-8') : 'auto');
  const [sheet, setSheet] = useState(0);
  const [preview, setPreview] = useState<{ ds?: Dataset; warnings?: string[]; columns?: ImportColumnInfo[]; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  /** Columns (0-based) to keep as text exactly as written ("Keep as text"). */
  const [textCols, setTextCols] = useState<number[]>([]);
  // Another separator, sheet or header row gives other columns: start the choice again.
  useEffect(() => setTextCols([]), [delimiter, header, sheet, encoding]);
  const toggleText = (j: number, on: boolean) => setTextCols((cur) => (on ? [...cur.filter((x) => x !== j), j].sort((a, b) => a - b) : cur.filter((x) => x !== j)));

  const opts: ImportOptions = useMemo(
    () =>
      kind === 'xlsx'
        ? { header, sheet, ...(textCols.length ? { textColumns: textCols } : {}) }
        : kind === 'sav'
          ? { encoding }
          : { header, ...(delimiter !== 'auto' ? { delimiter } : {}), ...(encoding !== 'auto' ? { encoding } : {}), ...(textCols.length ? { textColumns: textCols } : {}) },
    [kind, header, sheet, delimiter, encoding, textCols],
  );

  const rawLines = useMemo(() => {
    if (kind !== 'text') return [];
    try {
      const slice = bytes.subarray(0, 4096);
      const text = new TextDecoder(encoding === 'auto' ? 'utf-8' : encoding).decode(slice);
      return text.split(/\r?\n/).slice(0, 6);
    } catch {
      return [];
    }
  }, [bytes, encoding, kind]);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      let sample = bytes;
      if (kind === 'text' && bytes.length > PREVIEW_BYTES) {
        let end = PREVIEW_BYTES;
        while (end > 0 && bytes[end - 1] !== 0x0a) end--;
        sample = bytes.subarray(0, end || PREVIEW_BYTES);
      }
      try {
        const res = await importFile(name, sample, opts);
        if (alive) setPreview({ ds: res.dataset, warnings: res.warnings, columns: res.columns });
      } catch (e) {
        if (alive) setPreview({ error: e instanceof Error ? e.message : 'This file could not be read with these settings.' });
      }
    };
    void run();
    return () => {
      alive = false;
    };
  }, [bytes, name, kind, opts]);

  const doImport = async () => {
    // For an SPSS file the data was just opened from this same file, so re-reading replaces nothing new.
    if (kind !== 'sav' && !(await confirmReplace(`Opening ${name}`))) return;
    setBusy(true);
    const ok = await importBytes(name, bytes, opts);
    setBusy(false);
    if (ok) onClose();
  };

  const ds = preview?.ds;
  const cols = ds ? ds.variables.slice(0, 12) : [];
  if (kind === 'sav') {
    const samples = ds ? textSamples(ds) : [];
    return (
      <Modal
        title={`Text encoding of ${name}`}
        subtitle="This SPSS file does not say which character set its labels and text use."
        onClose={onClose}
        footer={
          <>
            <button className="btn" onClick={onClose}>Keep as opened</button>
            <button className="btn btn-primary" onClick={doImport} disabled={busy || !!preview?.error}>{busy ? 'Reading...' : 'Re-read with this encoding'}</button>
          </>
        }
      >
        <div className="stack">
          <div className="callout callout-info">{note} If letters in the labels below look wrong (for example Ã© instead of é), choose the encoding the file was made with.</div>
          <div className="field" style={{ maxWidth: 320 }}>
            <label htmlFor="imp-sav-enc">Character encoding</label>
            <select id="imp-sav-enc" className="select" value={encoding} onChange={(e) => setEncoding(e.target.value)}>
              {SAV_ENCODINGS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </div>
          {preview?.error ? <div className="callout callout-bad">{preview.error}</div> : null}
          {!preview ? <div className="help">Reading...</div> : null}
          {samples.length ? (
            <div className="scroll-x import-preview">
              <table className="table">
                <thead><tr><th>Variable</th><th>Label, value labels and text with this encoding</th></tr></thead>
                <tbody>
                  {samples.map((x) => (
                    <tr key={x.name}><td className="mono">{x.name}</td><td>{x.text || <span className="muted">(no text)</span>}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </Modal>
    );
  }
  const nRows = ds ? Math.min(ds.nCases, 8) : 0;
  const infoOf = (j: number) => preview?.columns?.find((c) => c.index === j);
  /** A column the user can keep as text: read as numbers or dates, or already kept. */
  const canKeep = (c?: ImportColumnInfo) => !!c && (c.readAs !== 'text' || c.keptAsText);
  const keepBox = (c: ImportColumnInfo, withName: boolean) => (
    <label className="check keep-text" title={`Keep ${c.name} exactly as written in the file (as text), instead of reading it as ${c.readAs === 'number' ? 'numbers' : c.readAs === 'time' ? 'times' : 'dates'}.`} style={{ fontWeight: 'normal', fontSize: 12, gap: 4, whiteSpace: 'nowrap' }}>
      <input type="checkbox" checked={textCols.includes(c.index)} onChange={(e) => toggleText(c.index, e.target.checked)} aria-label={`Keep ${c.name} as text`} />
      {withName ? <span><span className="mono">{c.name}</span>: keep as text</span> : 'Keep as text'}
    </label>
  );
  // Columns whose text changed when read as numbers but are not in the preview table.
  const hiddenChanged = (preview?.columns ?? []).filter((c) => c.index >= cols.length && (c.keptAsText || (c.readAs === 'number' && (c.missingWords.length || c.leadingZeros))));

  return (
    <Modal
      title={`Open ${name}`}
      subtitle={kind === 'xlsx' ? 'Choose the sheet and whether the first row holds variable names.' : 'Check how the text file is split into variables.'}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={doImport} disabled={busy || !!preview?.error}>{busy ? 'Opening...' : 'Open'}</button>
        </>
      }
    >
      <div className="stack">
        <div className="row" style={{ alignItems: 'flex-end' }}>
          {kind === 'xlsx' ? (
            <div className="field" style={{ minWidth: 200 }}>
              <label htmlFor="imp-sheet">Sheet</label>
              <select id="imp-sheet" className="select" value={sheet} onChange={(e) => setSheet(Number(e.target.value))}>
                {sheets.map((s, i) => <option key={i} value={i}>{s}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="field" style={{ width: 190 }}>
                <label htmlFor="imp-delim">Separator</label>
                <select id="imp-delim" className="select" value={delimiter} onChange={(e) => setDelimiter(e.target.value)}>
                  <option value="auto">Detect automatically</option>
                  <option value=",">Comma ,</option>
                  <option value=";">Semicolon ;</option>
                  <option value={'\t'}>Tab</option>
                  <option value="|">Pipe |</option>
                </select>
              </div>
              <div className="field" style={{ width: 230 }}>
                <label htmlFor="imp-enc">Character encoding</label>
                <select id="imp-enc" className="select" value={encoding} onChange={(e) => setEncoding(e.target.value)}>
                  <option value="auto">Detect (UTF-8 if possible)</option>
                  <option value="utf-8">UTF-8</option>
                  <option value="windows-1252">Windows Western (1252)</option>
                  <option value="iso-8859-1">Latin-1 (ISO-8859-1)</option>
                  <option value="utf-16le">UTF-16</option>
                </select>
              </div>
            </>
          )}
          <label className="check" style={{ paddingBottom: 6 }}><input type="checkbox" checked={header} onChange={(e) => setHeader(e.target.checked)} /> First row has variable names</label>
        </div>
        {kind === 'text' && rawLines.length ? (
          <div>
            <div className="label" style={{ marginBottom: 4 }}>Start of the file</div>
            <pre className="raw-preview">{rawLines.join('\n')}</pre>
          </div>
        ) : null}
        <div>
          <div className="label" style={{ marginBottom: 4 }}>
            Preview {ds ? <span className="muted num">({ds.variables.length} variables{bytes.length > PREVIEW_BYTES && kind === 'text' ? ', first rows' : `, ${ds.nCases.toLocaleString('en-US')} cases`})</span> : null}
          </div>
          {preview?.error ? <div className="callout callout-bad">{preview.error}</div> : null}
          {!preview ? <div className="help">Reading...</div> : null}
          {ds ? (
            <div className="scroll-x import-preview">
              <table className="table">
                <thead>
                  <tr>
                    {cols.map((v, j) => (
                      <th key={v.id} title={v.label} style={{ verticalAlign: 'top' }}>
                        <span className="row" style={{ gap: 4, flexWrap: 'nowrap' }}><VarMeasureIcon v={v} /> <span className="mono">{v.name}</span></span>
                        {canKeep(infoOf(j)) ? keepBox(infoOf(j)!, false) : null}
                      </th>
                    ))}
                    {ds.variables.length > cols.length ? <th className="muted">+{ds.variables.length - cols.length} more</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: nRows }, (_, i) => (
                    <tr key={i}>
                      {cols.map((v) => (
                        <td key={v.id} className={v.type === 'numeric' ? 'num mono' : ''}>{formatCell(v, ds.columns[v.id][i], false)}</td>
                      ))}
                      {ds.variables.length > cols.length ? <td /> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        {hiddenChanged.length ? <div className="row" style={{ gap: 12 }}>{hiddenChanged.map((c) => <span key={c.index}>{keepBox(c, true)}</span>)}</div> : null}
        {preview?.warnings?.length ? (
          <div className="callout callout-warn">
            {preview.warnings.slice(0, 4).map((w) => <div key={w}>{w}</div>)}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export function RecentProjectsDialog({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<RecentEntry[] | null>(null);
  useEffect(() => {
    void listRecent().then(setItems);
  }, []);
  return (
    <Modal title="Recent projects" subtitle="Projects you saved or opened in this browser. They are stored only on this computer." onClose={onClose} footer={<button className="btn" onClick={onClose}>Close</button>}>
      {items === null ? <div className="help">Loading...</div> : null}
      {items && !items.length ? <div className="empty"><h3>No recent projects</h3><p>Save a project with File &gt; Save project and it will appear here. If this browser blocks storage, recent projects are not kept.</p></div> : null}
      {items && items.length ? (
        <ul className="recent-list">
          {items.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                className="recent-item"
                onClick={async () => {
                  onClose();
                  await openRecentProject(it.id, it.name);
                }}
              >
                <Icon name="file" size={16} />
                <span className="recent-name">{it.name}</span>
                <span className="help num">{it.nCases.toLocaleString('en-US')} cases · {it.nVars} variables · {formatDateTime(it.savedAt)}</span>
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost btn-icon"
                aria-label={`Forget ${it.name}`}
                title="Remove from this list"
                onClick={async () => {
                  await removeRecent(it.id);
                  setItems(await listRecent());
                }}
              >
                <Icon name="x" size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}
