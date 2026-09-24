// Reading view: a transcript with coded passages as highlighter marks, coding stripes in the
// margin, a quick-code popover on selection, and a segment popover on click.
// Paragraphs are memoised on a signature of their own segments, so coding one passage re-renders
// only the paragraphs it touches (fast for 10,000-word transcripts).

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../core/store';
import type { CodedSegment, TextDoc } from '../../core/coding-types';
import { splitLines, assignLanes, trimRange, type Range } from '../../lib/coding/segments';
import { codePath } from '../../lib/coding/tree';
import { tokenize } from '../../lib/coding/text';
import { constantAttributeKeys, orderedAttributes } from '../../lib/coding/analysis';
import { applyCode, createCode, removeSegment, setSegmentMemo, uncodeRange, createMemo } from './actions';
import { fillOf, useCodeMap, useSegmentIndex, plural } from './hooks';
import { useCodingUi, openLocalDialog } from './uiStore';
import { QuickCode } from './QuickCode';
import { Floating, Swatch, CodeChip } from './ui';
import { originLabel } from '../../lib/coding/exports';

const EMPTY: CodedSegment[] = [];
const ZWSP = '\u200b';
const LANE_W = 6;
const MAX_LANES = 10;
const SPEAKER_RE = /^\s*([\p{Lu}][\p{L}\p{M}0-9 .'’-]{0,28}):(?=\s)/u;

interface ParaSeg {
  id: string;
  start: number;
  end: number;
  color: string;
  lane: number;
  label: string;
}

interface ParaProps {
  index: number;
  text: string;
  start: number;
  end: number;
  segs: ParaSeg[];
  pending: Range | null;
  flash: Range | null;
  laneCount: number;
  width: number;
  sig: string;
}

function clip(r: Range | null, a: number, b: number): Range | null {
  if (!r || r.end <= a || r.start >= b) return null;
  return { start: Math.max(a, r.start), end: Math.min(b, r.end) };
}

const Para = memo(
  function Para({ text, start, end, segs, pending, flash, laneCount, sig }: ParaProps) {
    const textRef = useRef<HTMLDivElement>(null);
    const [bars, setBars] = useState<Array<{ id: string; top: number; height: number; left: number; color: string; label: string }>>([]);

    const speakerEnd = useMemo(() => {
      const m = SPEAKER_RE.exec(text.slice(start, end));
      return m ? start + m[0].length : -1;
    }, [text, start, end]);

    const runs = useMemo(() => {
      const cuts = new Set<number>([start, end]);
      const add = (x: number) => x > start && x < end && cuts.add(x);
      for (const s of segs) {
        add(s.start);
        add(s.end);
      }
      if (pending) (add(pending.start), add(pending.end));
      if (flash) (add(flash.start), add(flash.end));
      if (speakerEnd > 0) add(speakerEnd);
      const pts = [...cuts].sort((a, b) => a - b);
      const out: Array<{ a: number; b: number; segs: ParaSeg[]; pending: boolean; flash: boolean; speaker: boolean }> = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const cover = segs.filter((s) => s.start < b && a < s.end).sort((x, y) => y.end - y.start - (x.end - x.start));
        out.push({
          a,
          b,
          segs: cover,
          pending: !!pending && pending.start < b && a < pending.end,
          flash: !!flash && flash.start < b && a < flash.end,
          speaker: speakerEnd > 0 && b <= speakerEnd,
        });
      }
      return out;
    }, [segs, pending, flash, speakerEnd, start, end]);

    useLayoutEffect(() => {
      const el = textRef.current;
      if (!el || !segs.length) {
        setBars((b) => (b.length ? [] : b));
        return;
      }
      const base = el.getBoundingClientRect().top;
      const spans = Array.from(el.children) as HTMLElement[];
      const out: typeof bars = [];
      for (const s of segs) {
        let first: HTMLElement | null = null, last: HTMLElement | null = null;
        for (const sp of spans) {
          const a = Number(sp.dataset.s), b = a + (sp.textContent?.length ?? 0);
          if (a < s.end && s.start < b) {
            if (!first) first = sp;
            last = sp;
          }
        }
        if (!first || !last) continue;
        const r0 = first.getClientRects()[0];
        const rl = last.getClientRects();
        const r1 = rl[rl.length - 1];
        if (!r0 || !r1) continue;
        out.push({ id: s.id, top: r0.top - base, height: Math.max(6, r1.bottom - r0.top), left: Math.min(s.lane, MAX_LANES - 1) * LANE_W, color: s.color, label: s.label });
      }
      setBars(out);
    }, [sig]);

    return (
      <div className={`cw-para ${start === end ? 'cw-para-empty' : ''}`} data-ps={start} data-pe={end}>
        <div className="cw-para-text" ref={textRef}>
          {runs.map((r) => {
            const style: React.CSSProperties = {};
            if (r.segs.length) {
              const inner = r.segs[r.segs.length - 1];
              style.backgroundColor = fillOf(inner.color);
              style.boxShadow = r.segs
                .slice()
                .reverse()
                .slice(0, 4)
                .map((s, k) => `inset 0 -${2 * (k + 1)}px 0 ${s.color}`)
                .join(', ');
            }
            const cls = [r.segs.length ? 'cw-hl' : '', r.pending ? 'cw-pending' : '', r.flash ? 'cw-flash' : '', r.speaker ? 'cw-speaker' : ''].filter(Boolean).join(' ');
            return (
              <span key={r.a} data-s={r.a} className={cls || undefined} style={r.segs.length ? style : undefined}>
                {text.slice(r.a, r.b)}
              </span>
            );
          })}
          {start === end ? <span data-s={start}>{ZWSP}</span> : null}
        </div>
        <div className="cw-gutter" style={{ width: Math.min(laneCount, MAX_LANES) * LANE_W }} aria-hidden={bars.length ? undefined : true}>
          {bars.map((b) => (
            <button key={b.id} className="cw-gbar" data-seg={b.id} style={{ top: b.top, height: b.height, left: b.left, background: b.color }} title={b.label} aria-label={`Coded: ${b.label}`} tabIndex={0} />
          ))}
        </div>
      </div>
    );
  },
  (a, b) => a.sig === b.sig && a.text === b.text,
);

/** Map a DOM selection point inside the reader body to a character offset in the document. */
function pointToOffset(body: HTMLElement, node: Node, offset: number, textLen: number): number {
  if (!body.contains(node)) {
    return node.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING ? 0 : textLen;
  }
  if (node.nodeType === Node.TEXT_NODE) {
    const span = node.parentElement?.closest<HTMLElement>('[data-s]');
    if (span) return span.textContent === ZWSP ? Number(span.dataset.s) : Number(span.dataset.s) + offset;
  }
  const el = node as HTMLElement;
  if (el.dataset?.s !== undefined) return offset === 0 ? Number(el.dataset.s) : Number(el.dataset.s) + (el.textContent?.length ?? 0);
  const child = el.childNodes[offset] as HTMLElement | undefined;
  const firstIn = (n: Node | undefined): HTMLElement | null => {
    if (!n) return null;
    if ((n as HTMLElement).dataset?.s !== undefined) return n as HTMLElement;
    return (n as HTMLElement).querySelector?.('[data-s]') ?? null;
  };
  const f = firstIn(child);
  if (f) return Number(f.dataset.s);
  const para = el.closest<HTMLElement>('[data-ps]');
  if (para) return offset === 0 ? Number(para.dataset.ps) : Number(para.dataset.pe);
  const all = el.querySelectorAll<HTMLElement>('[data-s]');
  const lastEl = all[all.length - 1];
  return lastEl ? Number(lastEl.dataset.s) + (lastEl.textContent?.length ?? 0) : 0;
}

type Pop =
  | { type: 'code'; start: number; end: number; anchor: { left: number; top: number; bottom: number } }
  | { type: 'segments'; offset: number; anchor: { left: number; top: number; bottom: number } };

export const Reader = memo(function Reader({ doc }: { doc: TextDoc }) {
  const segIndex = useSegmentIndex();
  const segs = segIndex.get(doc.id) ?? EMPTY;
  const codeMap = useCodeMap();
  const codes = useStore((s) => s.coding.codes);
  const activeCoder = useStore((s) => s.coding.activeCoder);
  const allSegments = useStore((s) => s.coding.segments);
  const pendingSel = useCodingUi((s) => (s.pending && s.pending.docId === doc.id ? s.pending : null));
  const jump = useCodingUi((s) => s.jump);
  const setUi = useCodingUi((s) => s.set);
  const [pop, setPop] = useState<Pop | null>(null);
  const [flash, setFlash] = useState<Range | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close popovers and pending selection when switching documents.
  useEffect(() => {
    setPop(null);
    setFlash(null);
    const ui = useCodingUi.getState();
    if (ui.pending && ui.pending.docId !== doc.id) ui.set({ pending: null });
  }, [doc.id]);

  const lines = useMemo(() => splitLines(doc.text), [doc.text]);
  const { lanes, count: laneCount } = useMemo(() => assignLanes(segs), [segs]);

  const perLine = useMemo(() => {
    const arr: ParaSeg[][] = lines.map(() => []);
    for (const s of segs) {
      const code = codeMap.get(s.codeId);
      if (!code) continue;
      // First line whose end is after the segment start (binary search).
      let lo = 0, hi = lines.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (lines[mid].end < s.start) lo = mid + 1;
        else hi = mid;
      }
      for (let i = lo; i < lines.length && lines[i].start < s.end; i++) {
        const L = lines[i];
        const a = Math.max(L.start, s.start), b = Math.min(L.end, s.end);
        if (b <= a) continue;
        arr[i].push({ id: s.id, start: a, end: b, color: code.color, lane: lanes.get(s.id) ?? 0, label: `${code.name}${s.coder !== activeCoder ? ` (${s.coder})` : ''}` });
      }
    }
    return arr;
  }, [lines, segs, codeMap, lanes, activeCoder]);

  const pendingRange = pendingSel ? { start: pendingSel.start, end: pendingSel.end } : null;
  const w = Math.round(width);

  const closePop = useCallback(() => {
    setPop(null);
    setUi({ pending: null });
  }, [setUi]);

  // The pending selection was used elsewhere (e.g. a code clicked in the codebook): close the picker.
  useEffect(() => {
    if (!pendingSel) setPop((p) => (p?.type === 'code' ? null : p));
  }, [pendingSel]);

  // Jump to a passage (from retrieval, KWIC, reliability).
  useEffect(() => {
    if (!jump || jump.docId !== doc.id) return;
    const body = bodyRef.current;
    if (!body) return;
    const paras = Array.from(body.querySelectorAll<HTMLElement>('.cw-para'));
    const target = paras.find((p) => Number(p.dataset.ps) <= jump.start && jump.start <= Number(p.dataset.pe)) ?? paras[0];
    target?.scrollIntoView({ block: 'center' });
    setFlash({ start: jump.start, end: jump.end });
    const t = setTimeout(() => setFlash(null), 2400);
    return () => clearTimeout(t);
  }, [jump, doc.id]);

  const readSelection = (anchorFallback?: { x: number; y: number }) => {
    const body = bodyRef.current;
    const sel = window.getSelection();
    if (!body || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!body.contains(range.commonAncestorContainer) && !range.intersectsNode(body)) return false;
    if (sel.isCollapsed) return false;
    const a = pointToOffset(body, range.startContainer, range.startOffset, doc.text.length);
    const b = pointToOffset(body, range.endContainer, range.endOffset, doc.text.length);
    const t = trimRange(doc.text, a, b);
    if (!t) return false;
    const rects = range.getClientRects();
    const last = rects[rects.length - 1] ?? range.getBoundingClientRect();
    const anchor = last ? { left: last.right - 20, top: rects[0]?.top ?? last.top, bottom: last.bottom } : { left: anchorFallback?.x ?? 100, top: anchorFallback?.y ?? 100, bottom: (anchorFallback?.y ?? 100) + 4 };
    setUi({ pending: { docId: doc.id, start: t.start, end: t.end } });
    setPop({ type: 'code', start: t.start, end: t.end, anchor });
    return true;
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.cw-gbar')) return;
    if (readSelection({ x: e.clientX, y: e.clientY })) return;
    // A click: show codes at this point.
    const body = bodyRef.current;
    const sel = window.getSelection();
    if (!body || !sel || !sel.anchorNode) return;
    const off = pointToOffset(body, sel.anchorNode, sel.anchorOffset, doc.text.length);
    const hits = segs.filter((s) => s.start <= off && off < s.end);
    if (hits.length) setPop({ type: 'segments', offset: off, anchor: { left: e.clientX - 20, top: e.clientY - 10, bottom: e.clientY + 10 } });
  };

  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.shiftKey && /^Arrow|Home|End/.test(e.key)) readSelection();
  };

  const onClick = (e: React.MouseEvent) => {
    const bar = (e.target as HTMLElement).closest<HTMLElement>('.cw-gbar');
    if (!bar) return;
    const seg = segs.find((s) => s.id === bar.dataset.seg);
    if (!seg) return;
    const r = bar.getBoundingClientRect();
    setPop({ type: 'segments', offset: seg.start, anchor: { left: r.left - 280, top: r.top, bottom: r.top + 20 } });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const bar = (e.target as HTMLElement).closest<HTMLElement>('.cw-gbar');
    if (bar && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const seg = segs.find((s) => s.id === bar.dataset.seg);
      if (!seg) return;
      const r = bar.getBoundingClientRect();
      setPop({ type: 'segments', offset: seg.start, anchor: { left: r.left - 280, top: r.top, bottom: r.top + 20 } });
    }
  };

  const pick = (codeId: string) => {
    if (pop?.type !== 'code') return;
    applyCode(doc.id, codeId, pop.start, pop.end);
    window.getSelection()?.removeAllRanges();
    closePop();
  };

  const words = useMemo(() => tokenize(doc.text).length, [doc.text]);
  const allDocs = useStore((s) => s.coding.docs);
  const constant = useMemo(() => constantAttributeKeys(allDocs.filter((d) => d.kind === doc.kind)), [allDocs, doc.kind]);
  const attrs = orderedAttributes(doc.attributes, constant);
  const [showAllAttrs, setShowAllAttrs] = useState(false);
  const codesUsed = useMemo(() => new Set(segs.map((s) => s.codeId)).size, [segs]);

  // Codes (active coder) overlapping the pending selection, offered for removal.
  const removable = useMemo(() => {
    if (pop?.type !== 'code') return [];
    const ids = new Set(allSegments.filter((s) => s.docId === doc.id && s.coder === activeCoder && s.start < pop.end && pop.start < s.end).map((s) => s.codeId));
    return [...ids].map((id) => codeMap.get(id)).filter((c): c is NonNullable<typeof c> => !!c);
  }, [pop, allSegments, doc.id, activeCoder, codeMap]);

  const atPoint = pop?.type === 'segments' ? segs.filter((s) => s.start <= pop.offset && pop.offset < s.end) : [];

  return (
    <div className="cw-reader">
      <header className="cw-reader-head">
        <div className="cw-reader-title">
          <div className="eyebrow">{doc.kind === 'response' ? 'Open-ended response' : 'Document'}</div>
          <h2>{doc.name}</h2>
          <div className="cw-reader-meta">
            <span>{plural(words, 'word')}</span>
            <span>{plural(segs.length, 'coded segment')}</span>
            <span>{plural(codesUsed, 'code')}</span>
            {attrs.slice(0, showAllAttrs ? attrs.length : 4).map(([k, v]) => (
              <span key={k} className="cw-attr" title={`${k}: ${v}`}>
                {k}: {v}
              </span>
            ))}
            {attrs.length > 4 ? (
              <button className="cw-linkbtn" onClick={() => setShowAllAttrs((x) => !x)}>
                {showAllAttrs ? 'fewer details' : `+${attrs.length - 4} more`}
              </button>
            ) : null}
          </div>
        </div>
        <div className="row cw-reader-actions">
          {doc.kind === 'response' ? (
            <button className="btn btn-sm" onClick={() => setUi({ view: 'responses' })}>
              Back to responses
            </button>
          ) : null}
          <button className="btn btn-sm" onClick={() => openLocalDialog('doc-edit', { docId: doc.id })}>
            Rename or edit attributes
          </button>
          <button
            className="btn btn-sm"
            onClick={() => {
              createMemo({ title: `Memo on ${doc.name}`, docId: doc.id });
              setUi({ view: 'memos' });
            }}
          >
            Write a memo
          </button>
        </div>
      </header>
      <div className="cw-reader-hint help">
        Select text to code it. Click a highlighted passage or a margin stripe to see its codes, add a memo or remove it.
      </div>
      <div className="cw-reader-scroll">
        <div className="cw-reader-body" ref={bodyRef} onMouseUp={onMouseUp} onKeyUp={onKeyUp} onClick={onClick} onKeyDown={onKeyDown} style={{ ['--cw-lanes' as any]: Math.min(laneCount, MAX_LANES) }}>
          {doc.text.length === 0 ? <p className="muted">This source has no text.</p> : null}
          {lines.map((L, i) => {
            const ps = perLine[i];
            const pend = clip(pendingRange, L.start, L.end);
            const fl = clip(flash, L.start, L.end);
            const sig = `${L.start}:${L.end}:${w}:${Math.min(laneCount, MAX_LANES)}|${ps.map((s) => `${s.id},${s.start},${s.end},${s.color},${s.lane},${s.label}`).join(';')}|${pend ? `${pend.start}-${pend.end}` : ''}|${fl ? `${fl.start}-${fl.end}` : ''}`;
            return <Para key={i} index={i} text={doc.text} start={L.start} end={L.end} segs={ps} pending={pend} flash={fl} laneCount={laneCount} width={w} sig={sig} />;
          })}
        </div>
      </div>

      {pop?.type === 'code' ? (
        <Floating anchor={pop.anchor} onClose={closePop} label="Code the selected text" width={320}>
          <QuickCode
            title={<span className="cw-qc-quote">“{clipText(doc.text.slice(pop.start, pop.end), 90)}”</span>}
            onPick={pick}
            onCreate={(name) => createCode(name)}
            onClose={closePop}
            applied={new Set(removable.map((c) => c.id))}
            footer={
              removable.length ? (
                <div className="cw-qc-remove">
                  <span className="help">Remove from selection:</span>
                  {removable.map((c) => (
                    <CodeChip
                      key={c.id}
                      code={c}
                      small
                      onRemove={() => {
                        uncodeRange(doc.id, c.id, pop.start, pop.end);
                        window.getSelection()?.removeAllRanges();
                        closePop();
                      }}
                    />
                  ))}
                </div>
              ) : doc.kind === 'response' ? (
                <span className="help">Tip: in the Responses view, number keys code whole responses.</span>
              ) : null
            }
          />
        </Floating>
      ) : null}

      {pop?.type === 'segments' && atPoint.length ? (
        <Floating anchor={pop.anchor} onClose={() => setPop(null)} label="Codes on this passage" width={340}>
          <div className="cw-segpop">
            <div className="cw-qc-title">
              {atPoint.length === 1 ? 'Code on this passage' : `${atPoint.length} codes on this passage`}
            </div>
            {atPoint.map((s) => {
              const c = codeMap.get(s.codeId);
              if (!c) return null;
              return (
                <div key={s.id} className="cw-segpop-item">
                  <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <Swatch color={c.color} />
                    <b className="cw-segpop-name">{codePath(codes, c.id)}</b>
                    <span className="spacer" />
                    <button className="btn btn-ghost btn-sm" onClick={() => setUi({ selectedCodeId: c.id })} title="Select in codebook">
                      Select
                    </button>
                    <button
                      className="btn btn-ghost btn-sm cw-danger"
                      onClick={() => {
                        removeSegment(s.id);
                        if (atPoint.length === 1) setPop(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="help">
                    {s.coder} · {originLabel(s.origin)} · “{clipText(doc.text.slice(s.start, s.end), 70)}”
                  </div>
                  <textarea
                    className="textarea cw-segpop-memo"
                    rows={2}
                    placeholder="Memo on this segment"
                    defaultValue={s.memo ?? ''}
                    onChange={(e) => setSegmentMemo(s.id, e.target.value)}
                    aria-label={`Memo for ${c.name}`}
                  />
                </div>
              );
            })}
            <div className="cw-qc-footer row">
              <button
                className="btn btn-sm"
                onClick={() => {
                  const inner = [...atPoint].sort((a, b) => a.end - a.start - (b.end - b.start))[0];
                  const r = pop.anchor;
                  setUi({ pending: { docId: doc.id, start: inner.start, end: inner.end } });
                  setPop({ type: 'code', start: inner.start, end: inner.end, anchor: r });
                }}
              >
                Add another code to this passage
              </button>
            </div>
          </div>
        </Floating>
      ) : null}
    </div>
  );
});

function clipText(s: string, n: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
}
