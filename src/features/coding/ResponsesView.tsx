// Response mode: one open-ended answer per row, virtualised for thousands of rows.
// Keyboard: j/k or arrows move, x or Space selects, 1-9 toggle the first nine codes, / finds a code,
// o opens the response in the reading view for passage-level coding.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '../../core/store';
import type { TextDoc } from '../../core/coding-types';
import { attributeKeys, attributeValues } from '../../lib/coding/analysis';
import { createCode, setWholeResponseCode } from './actions';
import { useCodeMap, useQuickKeyCodes, useSegmentIndex, plural } from './hooks';
import { useCodingUi, openLocalDialog, jumpTo } from './uiStore';
import { QuickCode } from './QuickCode';
import { CodeChip, Floating } from './ui';

export function ResponsesView() {
  const allDocs = useStore((s) => s.coding.docs);
  const dataset = useStore((s) => s.dataset);
  const codes = useStore((s) => s.coding.codes);
  const activeCoder = useStore((s) => s.coding.activeCoder);
  const segIndex = useSegmentIndex();
  const codeMap = useCodeMap();
  const quick = useQuickKeyCodes();
  const ai = useCodingUi((s) => s.ai);
  const selectedCodeId = useCodingUi((s) => s.selectedCodeId);
  const exampleMemo = useCodingUi((s) => s.exampleNote);
  const exampleNote = useStore((s) => !!exampleMemo && s.coding.memos.some((m) => m.id === exampleMemo));
  const allSegments = useStore((s) => s.coding.segments);

  const responses = useMemo(() => allDocs.filter((d) => d.kind === 'response'), [allDocs]);
  const questions = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of responses) m.set(d.varId ?? '', (m.get(d.varId ?? '') ?? 0) + 1);
    return [...m.entries()];
  }, [responses]);

  const [question, setQuestion] = useState<string>('');
  const [search, setSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState<string>(''); // '' all, '__uncoded', '__coded', or code id
  const [attrKey, setAttrKey] = useState('');
  const [attrVal, setAttrVal] = useState('');
  const [focus, setFocus] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [picker, setPicker] = useState<{ ids: string[]; anchor: { left: number; top: number; bottom: number }; mode: 'toggle' | 'on' | 'off' } | null>(null);

  const scoped = useMemo(() => (question && questions.length > 1 ? responses.filter((d) => (d.varId ?? '') === question) : responses), [responses, question, questions.length]);
  const attrKeysList = useMemo(() => attributeKeys(scoped), [scoped]);
  const attrVals = useMemo(() => (attrKey ? attributeValues(scoped, attrKey) : []), [scoped, attrKey]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((d) => {
      const segs = segIndex.get(d.id);
      if (codeFilter === '__uncoded' && segs?.length) return false;
      if (codeFilter === '__coded' && !segs?.length) return false;
      if (codeFilter && !codeFilter.startsWith('__') && !segs?.some((s) => s.codeId === codeFilter)) return false;
      if (attrKey && attrVal && (d.attributes?.[attrKey] ?? '') !== attrVal) return false;
      if (q && !d.text.toLowerCase().includes(q) && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scoped, search, codeFilter, attrKey, attrVal, segIndex]);

  const nCoded = useMemo(() => scoped.filter((d) => segIndex.get(d.id)?.length).length, [scoped, segIndex]);
  const nAutoCoded = useMemo(() => (exampleNote ? new Set(allSegments.filter((s) => s.origin === 'auto-rule').map((s) => s.docId)).size : 0), [exampleNote, allSegments]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const virt = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 76,
    overscan: 8,
    getItemKey: (i) => rows[i]?.id ?? i,
  });

  useEffect(() => {
    if (focus >= rows.length) setFocus(Math.max(0, rows.length - 1));
  }, [rows.length, focus]);

  // A new search or filter starts at the top of the list (coding inside a filter does not).
  const filterKey = `${question}\u0000${search}\u0000${codeFilter}\u0000${attrKey}\u0000${attrVal}`;
  const lastFilter = useRef(filterKey);
  useEffect(() => {
    if (lastFilter.current === filterKey) return;
    lastFilter.current = filterKey;
    setFocus(0);
    virt.scrollToOffset(0);
  }, [filterKey, virt]);

  const move = (to: number) => {
    const i = Math.max(0, Math.min(rows.length - 1, to));
    setFocus(i);
    virt.scrollToIndex(i, { align: 'auto' });
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const openPicker = (ids: string[], mode: 'toggle' | 'on' | 'off' = 'toggle', el?: HTMLElement | null) => {
    if (!ids.length) return;
    const r = (el ?? listRef.current)?.getBoundingClientRect();
    const anchor = r ? { left: r.left + Math.min(40, r.width / 4), top: r.top, bottom: Math.min(r.bottom, r.top + 40) } : { left: 100, top: 100, bottom: 120 };
    setPicker({ ids, anchor, mode });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea, select, .cw-floating')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const doc = rows[focus];
    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        move(focus + 1);
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        move(focus - 1);
        break;
      case 'Home':
        e.preventDefault();
        move(0);
        break;
      case 'End':
        e.preventDefault();
        move(rows.length - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        move(focus + 10);
        break;
      case 'PageUp':
        e.preventDefault();
        move(focus - 10);
        break;
      case 'x':
      case ' ':
        if (doc) {
          e.preventDefault();
          toggleSelect(doc.id);
        }
        break;
      case '/':
        if (doc) {
          e.preventDefault();
          openPicker([doc.id], 'toggle', listRef.current?.querySelector<HTMLElement>(`[data-row="${focus}"]`));
        }
        break;
      case 'o':
      case 'Enter':
        if (doc) {
          e.preventDefault();
          jumpTo(doc.id, 0, 0);
        }
        break;
      default:
        if (/^[1-9]$/.test(e.key) && doc) {
          const c = quick[Number(e.key) - 1];
          if (c) {
            e.preventDefault();
            setWholeResponseCode([doc.id], c.id);
          }
        }
    }
  };

  if (!responses.length) {
    return (
      <div className="cw-center-empty empty">
        <h3>No open-ended responses yet</h3>
        <p>Bring in the answers to an open question from your survey data, or import a CSV or Excel file with one response per row.</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => openLocalDialog('import', { tab: 'survey' })} disabled={!dataset}>
            Import open-ended answers from the dataset
          </button>
          <button className="btn" onClick={() => openLocalDialog('import', { tab: 'files' })}>
            Import CSV or Excel
          </button>
        </div>
        {!dataset ? <p className="help">Open a dataset first to import its open-ended answers.</p> : null}
      </div>
    );
  }

  const selIds = [...selected].filter((id) => rows.some((r) => r.id === id));

  return (
    <div className="cw-responses" onKeyDown={onKeyDown}>
      <div className="cw-resp-tools">
        {questions.length > 1 ? (
          <select className="select input-sm" value={question} onChange={(e) => setQuestion(e.target.value)} aria-label="Question">
            <option value="">All questions</option>
            {questions.map(([varId, n]) => {
              const v = dataset?.variables.find((x) => x.id === varId);
              return (
                <option key={varId} value={varId}>
                  {v ? v.name : varId ? 'Earlier import' : 'Imported file'} ({n})
                </option>
              );
            })}
          </select>
        ) : null}
        <input
          className="input input-sm cw-resp-search"
          placeholder="Search responses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            // Enter or Down goes from the search box to the list, ready for number keys.
            if ((e.key === 'Enter' || e.key === 'ArrowDown') && rows.length) {
              e.preventDefault();
              scrollRef.current?.focus();
            }
          }}
          aria-label="Search responses (Enter to go to the list)"
          title="Enter or Down arrow moves to the list"
        />
        <select className="select input-sm" value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} aria-label="Filter by code">
          <option value="">All responses</option>
          <option value="__uncoded">Not coded yet</option>
          <option value="__coded">Coded</option>
          {codes.map((c) => (
            <option key={c.id} value={c.id}>
              With code: {c.name}
            </option>
          ))}
        </select>
        {attrKeysList.length ? (
          <select
            className="select input-sm"
            value={attrKey}
            onChange={(e) => {
              setAttrKey(e.target.value);
              setAttrVal('');
            }}
            aria-label="Filter by attribute"
          >
            <option value="">Any attribute</option>
            {attrKeysList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        ) : null}
        {attrKey ? (
          <select className="select input-sm" value={attrVal} onChange={(e) => setAttrVal(e.target.value)} aria-label={`Value of ${attrKey}`}>
            <option value="">Any value</option>
            {attrVals.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : null}
        <span className="spacer" />
        <span className="help num">
          {rows.length.toLocaleString()} shown · {nCoded.toLocaleString()} of {scoped.length.toLocaleString()} coded
        </span>
      </div>

      {exampleNote ? (
        <div className="cw-example-note" role="note" aria-label="About the worked example">
          <div className="cw-example-text">
            <b>Worked example.</b> These are the sample survey’s answers about the biggest challenge facing the neighbourhood. Keyword rules from the starter codebook coded{' '}
            {nAutoCoded.toLocaleString()} of {responses.length.toLocaleString()} answers automatically. Rules miss answers worded differently and sometimes pick up a word used in passing, so check the codes before you rely on them.
          </div>
          <div className="cw-example-actions">
            <button className="btn btn-sm" onClick={() => { setCodeFilter('__coded'); scrollRef.current?.focus(); }}>Review coded answers</button>
            <button className="btn btn-sm" onClick={() => { setCodeFilter('__uncoded'); scrollRef.current?.focus(); }}>Show answers not coded</button>
            <button className="btn btn-sm" onClick={() => useCodingUi.getState().set({ view: 'analyse', analyseTab: 'attribute' })}>Codes by attribute</button>
            <button className="btn btn-sm" onClick={() => openLocalDialog('export-dataset')} disabled={!dataset}>Export codes to dataset…</button>
            <span className="spacer" />
            <button className="btn btn-sm btn-ghost" onClick={() => useCodingUi.getState().set({ exampleNote: null })}>Hide note</button>
          </div>
        </div>
      ) : null}

      <div className="cw-resp-keys">
        <span className="help">Keys:</span>
        {quick.length ? (
          quick.map((c, i) => (
            <span key={c.id} className="cw-keychip">
              <span className="kbd">{i + 1}</span>
              <CodeChip code={c} small />
            </span>
          ))
        ) : (
          <span className="help">add codes to the codebook to code with number keys 1 to 9</span>
        )}
        <span className="help cw-keyhelp">
          <span className="kbd">j</span>/<span className="kbd">k</span> move · <span className="kbd">x</span> select · <span className="kbd">/</span> find code · <span className="kbd">o</span> open
        </span>
      </div>

      {selIds.length ? (
        <div className="cw-bulkbar" role="region" aria-label="Bulk actions">
          <b>{plural(selIds.length, 'response')} selected</b>
          <button className="btn btn-sm btn-primary" onClick={(e) => openPicker(selIds, 'on', e.currentTarget)}>
            Apply a code…
          </button>
          <button className="btn btn-sm" onClick={(e) => openPicker(selIds, 'off', e.currentTarget)}>
            Remove a code…
          </button>
          {selectedCodeId && codeMap.get(selectedCodeId) ? (
            <button className="btn btn-sm" onClick={() => setWholeResponseCode(selIds, selectedCodeId, 'on')}>
              Apply “{codeMap.get(selectedCodeId)!.name}”
            </button>
          ) : null}
          {ai === 'yes' ? (
            <button className="btn btn-sm" onClick={() => openLocalDialog('ai-suggest', { docIds: selIds })}>
              Suggest codes with AI…
            </button>
          ) : null}
          <span className="spacer" />
          <button className="btn btn-sm btn-ghost" onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      ) : null}

      <div className="cw-resp-head" role="presentation">
        <label className="check cw-resp-selall" title="Select all shown">
          <input
            type="checkbox"
            checked={rows.length > 0 && selIds.length === rows.length}
            ref={(el) => {
              if (el) el.indeterminate = selIds.length > 0 && selIds.length < rows.length;
            }}
            onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
            aria-label="Select all shown responses"
          />
        </label>
        <span>Response</span>
        <span className="cw-resp-codes-h">Codes</span>
      </div>
      <div className="cw-resp-scroll" ref={scrollRef} tabIndex={0} aria-label="Responses. Use j and k to move, number keys to code." role="grid" aria-rowcount={rows.length} aria-activedescendant={rows[focus] ? `resp-${rows[focus].id}` : undefined}>
        <div ref={listRef} style={{ height: virt.getTotalSize(), position: 'relative' }}>
          {virt.getVirtualItems().map((vi) => {
            const d = rows[vi.index];
            if (!d) return null;
            return (
              <ResponseRow
                key={vi.key}
                doc={d}
                index={vi.index}
                start={vi.start}
                measure={virt.measureElement}
                focused={vi.index === focus}
                selected={selected.has(d.id)}
                codeIds={codeIdsFor(segIndex.get(d.id), activeCoder)}
                codeMap={codeMap}
                onFocus={() => setFocus(vi.index)}
                onToggleSelect={() => toggleSelect(d.id)}
                onRemove={(codeId) => setWholeResponseCode([d.id], codeId, 'off')}
                onAdd={(el) => openPicker([d.id], 'toggle', el)}
              />
            );
          })}
        </div>
        {!rows.length ? <div className="cw-empty-small help">No responses match these filters.</div> : null}
      </div>

      {picker ? (
        <Floating anchor={picker.anchor} onClose={() => setPicker(null)} label="Choose a code" width={320}>
          <QuickCode
            title={picker.ids.length > 1 ? `${picker.mode === 'off' ? 'Remove from' : 'Apply to'} ${picker.ids.length} responses` : 'Toggle a code on this response'}
            applied={picker.ids.length === 1 ? new Set(codeIdsFor(segIndex.get(picker.ids[0]), activeCoder).map((x) => x.id)) : undefined}
            onPick={(codeId) => {
              setWholeResponseCode(picker.ids, codeId, picker.mode);
              setPicker(null);
              scrollRef.current?.focus();
            }}
            onCreate={(name) => createCode(name)}
            onClose={() => {
              setPicker(null);
              scrollRef.current?.focus();
            }}
          />
        </Floating>
      ) : null}
    </div>
  );
}

function codeIdsFor(segs: import('../../core/coding-types').CodedSegment[] | undefined, activeCoder: string): Array<{ id: string; mine: boolean; partial: boolean; coder: string }> {
  if (!segs?.length) return [];
  const m = new Map<string, { id: string; mine: boolean; partial: boolean; coder: string }>();
  for (const s of segs) {
    const e = m.get(s.codeId);
    const mine = s.coder === activeCoder;
    if (!e) m.set(s.codeId, { id: s.codeId, mine, partial: s.start > 0, coder: s.coder });
    else if (mine) e.mine = true;
  }
  return [...m.values()];
}

function ResponseRow(props: {
  doc: TextDoc;
  index: number;
  start: number;
  measure: (el: Element | null) => void;
  focused: boolean;
  selected: boolean;
  codeIds: Array<{ id: string; mine: boolean; partial: boolean; coder: string }>;
  codeMap: Map<string, import('../../core/coding-types').CodeDef>;
  onFocus: () => void;
  onToggleSelect: () => void;
  onRemove: (codeId: string) => void;
  onAdd: (el: HTMLElement) => void;
}) {
  const { doc } = props;
  const attrs = Object.entries(doc.attributes ?? {});
  return (
    <div
      ref={props.measure}
      data-index={props.index}
      data-row={props.index}
      id={`resp-${doc.id}`}
      role="row"
      aria-selected={props.selected}
      className={`cw-resp-row ${props.focused ? 'is-focused' : ''} ${props.selected ? 'is-selected' : ''}`}
      style={{ transform: `translateY(${props.start}px)` }}
      onMouseDown={props.onFocus}
    >
      <label className="check cw-resp-check">
        <input type="checkbox" checked={props.selected} onChange={props.onToggleSelect} aria-label={`Select ${doc.name}`} tabIndex={-1} />
      </label>
      <div className="cw-resp-main">
        <div className="cw-resp-meta">
          <b>{doc.name}</b>
          {attrs.slice(0, 4).map(([k, v]) => (
            <span key={k} className="cw-attr">
              {k}: {v}
            </span>
          ))}
        </div>
        <div className={`cw-resp-text ${props.focused ? '' : 'is-clamped'}`}>{doc.text}</div>
      </div>
      <div className="cw-resp-codes">
        {props.codeIds.map((c) => {
          const code = props.codeMap.get(c.id);
          if (!code) return null;
          return (
            <CodeChip
              key={c.id}
              code={code}
              small
              muted={!c.mine}
              title={`${code.name}${c.partial ? ' (part of the response)' : ''}${!c.mine ? `, coded by ${c.coder}` : ''}`}
              onRemove={c.mine ? () => props.onRemove(c.id) : undefined}
            />
          );
        })}
        <button className="btn btn-ghost btn-sm cw-resp-add" onClick={(e) => props.onAdd(e.currentTarget)} aria-label={`Add a code to ${doc.name}`} tabIndex={-1}>
          + code
        </button>
      </div>
    </div>
  );
}

