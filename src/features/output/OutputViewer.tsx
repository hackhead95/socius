// The Output viewer: a document of analysis results (like the SPSS Output Viewer) with an outline
// navigator, APA/SPSS table styles, per-item and per-block actions, and report exports.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../core/store';
import type { OutputBlock, OutputItem } from '../../core/output';
import { ConfirmDialog } from '../../ui/Modal';
import { getProcedure } from '../../procedures';
import { Chart } from '../charts/Chart';
import { chartDataTable } from '../charts/dataTable';
import { formatNumber } from './format';
import { OutputTableView } from './OutputTableView';
import { useOutputPrefs } from './viewPrefs';
import { formatItemTime } from './reportHtml';
import { copyItem, copyTable, copyText, exportReport, saveChartPng, saveChartSvg, saveTableXlsx, type ReportFormat } from './actions';
import { IconChart, IconChevron, IconCopy, IconDown, IconDownload, IconOutline, IconTable, IconText, IconTrash, IconUp, IconWarn, IconX } from './icons';
import { useUi } from '../../app/ui-store';
import { ExplainPanel } from '../ai/ExplainPanel';
import { isExplainable } from '../ai/explainPrompt';
import { useExplain } from '../ai/explainStore';
import { getAiStatus } from '../../platform/ai';
import { openAiSettings } from '../ai/hooks';
import '../ai/ai.css';
import './output.css';

/** Quick-start procedures for the empty state (first three that are registered). */
const QUICK_START: Array<{ label: string; ids: string[] }> = [
  { label: 'Frequencies', ids: ['frequencies'] },
  { label: 'Crosstabs', ids: ['crosstabs'] },
  { label: 'Compare means', ids: ['ttest-independent', 'means'] },
  { label: 'Bar chart', ids: ['graph-bar'] },
  { label: 'Histogram', ids: ['graph-histogram'] },
];

const blockAnchor = (itemId: string, i: number) => `out-${itemId}-b${i}`;
const itemAnchor = (itemId: string) => `out-${itemId}`;

/** Table and figure numbers across the whole document (APA numbering). */
function useNumbering(outputs: OutputItem[]) {
  return useMemo(() => {
    const tables = new Map<string, number>();
    let t = 0;
    for (const it of outputs) it.blocks.forEach((b, i) => { if (b.kind === 'table') tables.set(`${it.id}:${i}`, ++t); });
    return tables;
  }, [outputs]);
}

function blockLabel(b: OutputBlock): string | null {
  if (b.kind === 'table') return b.table.title;
  if (b.kind === 'chart') return b.chart.title;
  if (b.kind === 'heading') return b.text;
  return null;
}

export function OutputViewer() {
  const outputs = useStore((s) => s.outputs);
  const focusOutputId = useStore((s) => s.focusOutputId);
  const removeOutput = useStore((s) => s.removeOutput);
  const moveOutput = useStore((s) => s.moveOutput);
  const clearOutputs = useStore((s) => s.clearOutputs);
  const prefs = useOutputPrefs();
  const numbering = useNumbering(outputs);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ item: OutputItem; index: number } | null>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  const opts = { style: prefs.tableStyle, includeInterpretations: prefs.showInterpretations, includeSyntax: prefs.showSyntax };

  const scrollTo = useCallback((anchor: string, itemId: string) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(itemId);
    setOutlineOpen(false);
    const focusable = el.closest('article')?.querySelector<HTMLElement>('.oi-title');
    focusable?.focus({ preventScroll: true });
  }, []);

  // New output: scroll it into view and flash it.
  useEffect(() => {
    if (!focusOutputId) return;
    setCollapsed((prev) => {
      if (!prev.has(focusOutputId)) return prev;
      const n = new Set(prev);
      n.delete(focusOutputId);
      return n;
    });
    const id = focusOutputId;
    const raf = requestAnimationFrame(() => {
      const el = document.getElementById(itemAnchor(id));
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActive(id);
      setFlash(id);
    });
    const t = window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 1800);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [focusOutputId, outputs.length]);

  // A jump requested from elsewhere (search palette, Explain a result): expand, scroll, flash.
  const outputTarget = useUi((s) => s.outputTarget);
  useEffect(() => {
    if (!outputTarget) return;
    const { itemId, blockIndex } = outputTarget;
    setCollapsed((prev) => {
      if (!prev.has(itemId)) return prev;
      const n = new Set(prev);
      n.delete(itemId);
      return n;
    });
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(blockIndex !== undefined ? blockAnchor(itemId, blockIndex) : itemAnchor(itemId));
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.getElementById(`${itemAnchor(itemId)}-t`)?.focus({ preventScroll: true });
        setActive(itemId);
        setFlash(itemId);
      }),
    );
    const t = window.setTimeout(() => setFlash((f) => (f === itemId ? null : f)), 1800);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [outputTarget?.seq]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll spy: the outline follows the item at the top of the document.
  useEffect(() => {
    const root = docRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return;
    const scroller = root.scrollHeight > root.clientHeight ? root : null;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive((vis[0].target as HTMLElement).dataset.itemId ?? null);
      },
      { root: scroller, rootMargin: '0px 0px -65% 0px', threshold: 0 },
    );
    root.querySelectorAll('article[data-item-id]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [outputs]);

  const doDelete = (item: OutputItem) => {
    const index = outputs.findIndex((o) => o.id === item.id);
    removeOutput(item.id);
    setUndo({ item, index });
    window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndo(null), 7000);
  };
  const doUndo = () => {
    if (!undo) return;
    const st = useStore.getState();
    const outs = st.outputs.slice();
    outs.splice(Math.min(undo.index, outs.length), 0, undo.item);
    useStore.setState({ outputs: outs });
    setUndo(null);
    window.clearTimeout(undoTimer.current);
  };
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const toggleCollapsed = (id: string) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="ov">
      <div className="ov-toolbar" role="toolbar" aria-label="Output">
        <button className="btn btn-sm ov-outline-toggle" onClick={() => setOutlineOpen((o) => !o)} aria-expanded={outlineOpen} aria-controls="ov-outline">
          <IconOutline /> Outline
        </button>
        <div className="ov-seg" role="radiogroup" aria-label="Table style">
          {(['apa', 'spss'] as const).map((s) => (
            <button key={s} role="radio" aria-checked={prefs.tableStyle === s} className={`ov-seg-btn ${prefs.tableStyle === s ? 'on' : ''}`} onClick={() => prefs.set({ tableStyle: s })} title={s === 'apa' ? 'APA 7 tables: horizontal rules only, numbered, italic titles' : 'SPSS-like tables with a light grid'}>
              {s === 'apa' ? 'APA tables' : 'SPSS tables'}
            </button>
          ))}
        </div>
        <label className="check ov-check">
          <input type="checkbox" checked={prefs.showInterpretations} onChange={(e) => prefs.set({ showInterpretations: e.target.checked })} />
          Interpretations
        </label>
        <label className="check ov-check">
          <input type="checkbox" checked={prefs.showSyntax} onChange={(e) => prefs.set({ showSyntax: e.target.checked })} />
          Syntax
        </label>
        <span className="spacer" />
        <ExportMenu disabled={!outputs.length} onExport={(f) => exportReport(outputs, f, opts)} />
        <button className="btn btn-sm btn-ghost" disabled={!outputs.length} onClick={() => setConfirmClear(true)}>
          Clear output
        </button>
      </div>

      {!outputs.length ? (
        <EmptyState />
      ) : (
        <div className="ov-body">
          <nav id="ov-outline" className={`ov-outline ${outlineOpen ? 'open' : ''}`} aria-label="Output outline">
            <div className="ov-outline-head">
              <span className="eyebrow">Outline</span>
              <span className="faint num">{outputs.length}</span>
              <button className="btn btn-ghost btn-sm btn-icon ov-outline-close" onClick={() => setOutlineOpen(false)} aria-label="Close outline">
                <IconX />
              </button>
            </div>
            <ol className="ov-outline-list">
              {outputs.map((it) => (
                <li key={it.id} className={it.id === active ? 'active' : undefined}>
                  <button className="ov-outline-item" onClick={() => scrollTo(itemAnchor(it.id), it.id)} aria-current={it.id === active ? 'true' : undefined}>
                    <span className="ov-outline-title">{it.title}</span>
                    <span className="ov-outline-time num">{new Date(it.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                  <ol>
                    {it.blocks.map((b, i) => {
                      const label = blockLabel(b);
                      if (!label) return null;
                      return (
                        <li key={i}>
                          <button className="ov-outline-block" onClick={() => { setCollapsed((p) => { const n = new Set(p); n.delete(it.id); return n; }); requestAnimationFrame(() => scrollTo(blockAnchor(it.id, i), it.id)); }}>
                            {b.kind === 'table' ? <IconTable /> : b.kind === 'chart' ? <IconChart /> : <IconText />}
                            <span>{label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              ))}
            </ol>
          </nav>
          {outlineOpen ? <div className="ov-scrim" onClick={() => setOutlineOpen(false)} /> : null}
          <div className="ov-doc" ref={docRef}>
            <div className="ov-paper">
              {outputs.map((it, idx) => (
                <OutputItemView
                  key={it.id}
                  item={it}
                  index={idx}
                  count={outputs.length}
                  collapsed={collapsed.has(it.id)}
                  flash={flash === it.id}
                  numbering={numbering}
                  onToggle={() => toggleCollapsed(it.id)}
                  onMove={(d) => moveOutput(it.id, idx + d)}
                  onDelete={() => doDelete(it)}
                  onCopy={() => copyItem(it, opts)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {undo ? (
        <div className="ov-undo" role="status">
          <span>Deleted “{undo.item.title}”.</span>
          <button className="btn btn-sm" onClick={doUndo}>Undo</button>
        </div>
      ) : null}

      {confirmClear ? (
        <ConfirmDialog
          title="Clear all output?"
          message={<>This removes all {outputs.length} results from the Output view. Export a report first if you want to keep them.</>}
          confirmLabel="Clear output"
          danger
          onCancel={() => setConfirmClear(false)}
          onConfirm={() => {
            clearOutputs();
            setConfirmClear(false);
          }}
        />
      ) : null}
    </div>
  );
}

function ExportMenu({ disabled, onExport }: { disabled: boolean; onExport: (f: ReportFormat) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ReportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLButtonElement>('button')?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const items: Array<{ f: ReportFormat; label: string; help: string }> = [
    { f: 'docx', label: 'Word (.docx)', help: 'APA tables and figures, ready to edit' },
    { f: 'html', label: 'Web page (.html)', help: 'Standalone and printable' },
    { f: 'xlsx', label: 'Excel (.xlsx)', help: 'One sheet per table' },
    { f: 'txt', label: 'Plain text (.txt)', help: 'Tables as aligned text' },
  ];
  const run = async (f: ReportFormat) => {
    setOpen(false);
    setBusy(f);
    try {
      await onExport(f);
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="ov-menu" ref={ref}>
      <button className="btn btn-sm btn-primary" disabled={disabled || !!busy} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <IconDownload /> {busy ? 'Preparing…' : 'Export report'}
      </button>
      {open ? (
        <div className="ov-menu-list" role="menu" onKeyDown={(e) => {
          const btns = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? []);
          const i = btns.indexOf(document.activeElement as HTMLButtonElement);
          if (e.key === 'ArrowDown') { e.preventDefault(); btns[(i + 1) % btns.length]?.focus(); }
          if (e.key === 'ArrowUp') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length]?.focus(); }
        }}>
          {items.map((it) => (
            <button key={it.f} role="menuitem" className="ov-menu-item" onClick={() => run(it.f)}>
              <span>{it.label}</span>
              <span className="help">{it.help}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState() {
  const openDialog = useStore((s) => s.openDialog);
  const hasData = useStore((s) => !!s.dataset);
  const quick = QUICK_START.map((q) => ({ label: q.label, id: q.ids.find((id) => getProcedure(id)) })).filter((q): q is { label: string; id: string } => !!q.id).slice(0, 3);
  return (
    <div className="ov-empty">
      <div className="ov-empty-card">
        <p className="eyebrow">Output</p>
        <h3>Your results will appear here</h3>
        <p>
          Choose an analysis from the <b>Analyze</b> menu or a chart from the <b>Graphs</b> menu. Each result arrives here as a numbered table or figure with a plain-language
          reading, an APA-style sentence you can paste into your paper, and the equivalent SPSS syntax.
        </p>
        <p className="muted">Export everything to Word, a web page, Excel or plain text with “Export report”.</p>
        {quick.length ? (
          <div className="ov-empty-actions">
            {quick.map((q) => (
              <button key={q.id} className="btn" disabled={!hasData} onClick={() => openDialog({ kind: 'procedure', id: q.id })}>
                {q.label}
              </button>
            ))}
          </div>
        ) : null}
        {!hasData ? <p className="help">Open a data file or a sample survey first (File menu).</p> : null}
      </div>
    </div>
  );
}

interface ItemProps {
  item: OutputItem;
  index: number;
  count: number;
  collapsed: boolean;
  flash: boolean;
  numbering: Map<string, number>;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
  onCopy: () => Promise<void>;
}

const OutputItemView = memo(function OutputItemView({ item, index, count, collapsed, flash, numbering, onToggle, onMove, onDelete, onCopy }: ItemProps) {
  const prefs = useOutputPrefs();
  const [copying, setCopying] = useState(false);
  const bodyId = `${itemAnchor(item.id)}-body`;
  return (
    <article id={itemAnchor(item.id)} data-item-id={item.id} className={`oi ${flash ? 'flash' : ''}`} aria-labelledby={`${itemAnchor(item.id)}-t`}>
      <header className="oi-head">
        <button className="btn btn-ghost btn-sm btn-icon oi-collapse" onClick={onToggle} aria-expanded={!collapsed} aria-controls={bodyId} aria-label={collapsed ? 'Expand' : 'Collapse'}>
          <IconChevron open={!collapsed} />
        </button>
        <div className="oi-titles">
          <h2 id={`${itemAnchor(item.id)}-t`} className="oi-title" tabIndex={-1}>
            {item.title}
          </h2>
          <p className="oi-meta">
            {[item.datasetName, formatItemTime(item.createdAt)].filter(Boolean).join(' · ')}
            {item.caseNote ? <span className="oi-case"> · {item.caseNote}</span> : null}
          </p>
        </div>
        <div className="oi-actions">
          <button className="btn btn-ghost btn-sm" disabled={copying} onClick={async () => { setCopying(true); try { await onCopy(); } finally { setCopying(false); } }} title="Copy with formatting for Word or Google Docs">
            <IconCopy /> <span className="oi-action-label">{copying ? 'Copying…' : 'Copy'}</span>
          </button>
          {isExplainable(item) ? <ExplainButton itemId={item.id} /> : null}
          <button className="btn btn-ghost btn-sm btn-icon" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up" title="Move up">
            <IconUp />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move down" title="Move down">
            <IconDown />
          </button>
          <button className="btn btn-ghost btn-sm btn-icon oi-delete" onClick={onDelete} aria-label="Delete" title="Delete">
            <IconTrash />
          </button>
        </div>
      </header>
      {collapsed ? null : (
        <div className="oi-body" id={bodyId}>
          {item.blocks.map((b, i) => (
            <div key={i} id={blockAnchor(item.id, i)} className={`ob ob-${b.kind}`}>
              <BlockView block={b} number={numbering.get(`${item.id}:${i}`)} />
            </div>
          ))}
          {prefs.showSyntax && item.syntax ? <SyntaxView syntax={item.syntax} /> : null}
        </div>
      )}
      <ExplainPanel item={item} />
    </article>
  );
});

function BlockView({ block, number }: { block: OutputBlock; number?: number }) {
  const prefs = useOutputPrefs();
  switch (block.kind) {
    case 'heading':
      return <h3 className="ob-heading">{block.text}</h3>;
    case 'table':
      return (
        <>
          <OutputTableView table={block.table} style={prefs.tableStyle} number={number} />
          <div className="ob-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => copyTable(block.table, prefs.tableStyle, prefs.tableStyle === 'apa' ? number : undefined)}>
              <IconCopy /> Copy table
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => saveTableXlsx(block.table, prefs.tableStyle)}>
              <IconDownload /> Excel
            </button>
          </div>
        </>
      );
    case 'chart':
      return <ChartBlock block={block} />;
    case 'text':
      if (block.style === 'interpretation') {
        if (!prefs.showInterpretations) return null;
        return (
          <aside className="ob-interp">
            <p className="ob-label">What this means</p>
            <p>{block.text}</p>
          </aside>
        );
      }
      if (block.style === 'apa')
        return (
          <div className="ob-apa">
            <div className="ob-apa-head">
              <p className="ob-label">APA-style report</p>
              <button className="btn btn-ghost btn-sm" onClick={() => copyText(block.text, 'APA sentence')}>
                <IconCopy /> Copy
              </button>
            </div>
            <p className="ob-apa-text">{block.text}</p>
          </div>
        );
      if (block.style === 'warning')
        return (
          <div className="ob-warning" role="note">
            <IconWarn />
            <p>
              <b>Check this: </b>
              {block.text}
            </p>
          </div>
        );
      if (block.ai) {
        const [head, ...rest] = block.text.split('\n\n');
        return (
          <aside className="ob-ai-note">
            <p className="ob-label">AI-generated</p>
            <p className="help">{head}</p>
            <p className="ob-ai-note-text">{rest.join('\n\n')}</p>
          </aside>
        );
      }
      return <p className="ob-note">{block.text}</p>;
  }
}

function ChartBlock({ block }: { block: Extract<OutputBlock, { kind: 'chart' }> }) {
  const [showData, setShowData] = useState(false);
  const [busy, setBusy] = useState(false);
  const data = showData ? chartDataTable(block.chart) : null;
  const wrap = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="ob-chart">
        <Chart spec={block.chart} />
      </div>
      <div className="ob-actions">
        <button className="btn btn-ghost btn-sm" aria-pressed={showData} onClick={() => setShowData((s) => !s)}>
          <IconTable /> {showData ? 'Hide data' : 'Show data'}
        </button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => wrap(() => saveChartPng(block.chart))}>
          <IconDownload /> PNG
        </button>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => wrap(() => saveChartSvg(block.chart))}>
          <IconDownload /> SVG
        </button>
      </div>
      {data ? (
        <div className="ob-data scroll-x" tabIndex={0} role="region" aria-label={`Data for ${block.chart.title}`}>
          <table className="table">
            <thead>
              <tr>{data.columns.map((c, i) => <th key={i} className={i ? 'num' : undefined}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {data.rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((v, ci) => (
                    <td key={ci} className={typeof v === 'number' ? 'num' : undefined}>
                      {v === null ? '' : typeof v === 'number' ? formatNumber(v, Number.isInteger(v) ? 'int' : 'dec2') : v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.chart.type === 'scatter' && block.chart.points.length > 500 ? <p className="help">First 500 of {block.chart.points.length.toLocaleString('en-US')} points.</p> : null}
        </div>
      ) : null}
    </>
  );
}

function SyntaxView({ syntax }: { syntax: string }) {
  return (
    <details className="ob-syntax">
      <summary>
        <span>Syntax</span>
        <span className="help">SPSS commands that reproduce this result</span>
      </summary>
      <div className="ob-syntax-body">
        <pre>{syntax}</pre>
        <button className="btn btn-sm" onClick={() => copyText(syntax, 'Syntax')}>
          <IconCopy /> Copy syntax
        </button>
      </div>
    </details>
  );
}

/** "Explain with AI": opens the panel under the item (or AI set-up first, then continues). */
function ExplainButton({ itemId }: { itemId: string }) {
  const open = useExplain((s) => !!s.panels[itemId]);
  return (
    <button
      className="btn btn-ghost btn-sm oi-explain"
      aria-expanded={open}
      title="Explain this result in plain language with AI. You see what will be sent first."
      onClick={() => {
        const ex = useExplain.getState();
        if (open) {
          ex.close(itemId);
          return;
        }
        if (getAiStatus().ready === 'no') {
          ex.setPending(itemId);
          openAiSettings('explain');
          return;
        }
        ex.open(itemId);
      }}
    >
      <span className="ai-badge" aria-hidden="true">AI</span> <span className="oi-action-label">Explain with AI</span>
    </button>
  );
}
