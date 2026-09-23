// Shared pieces for the SVG chart renderers: sizing, text measurement, colours, the frame (title,
// legend, accessible title/desc) and the hover tooltip.

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { approxTextWidth, legendLayout, truncateLabel } from './scale';

export const FONT_UI = 'var(--font-ui)';
export const FS_TICK = 11;
export const FS_AXIS = 11.5;
export const FS_TITLE = 13.5;
export const FS_LEGEND = 11.5;

/** Categorical colour for series i (fixed order, never cycled). Past slot 8 everything is neutral. */
export function seriesColor(i: number): string {
  return i >= 0 && i < 8 ? `var(--viz-${i + 1})` : 'var(--faint)';
}

let measureCtx: CanvasRenderingContext2D | null | undefined;
/** Text width in px (canvas when available, else an approximation). */
export function measureText(text: string, fontSize: number, weight = 400): number {
  if (measureCtx === undefined) {
    try {
      measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null;
    } catch {
      measureCtx = null;
    }
  }
  if (!measureCtx) return approxTextWidth(text, fontSize) * (weight >= 600 ? 1.05 : 1);
  measureCtx.font = `${weight} ${fontSize}px 'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif`;
  return measureCtx.measureText(text).width;
}

export const fit = (text: string, maxWidth: number, fs: number) => truncateLabel(text, maxWidth, fs, (t, f) => measureText(t, f));

/** Width of the container, tracked with ResizeObserver. `fixed` overrides (used for exports). */
export function useChartWidth(fixed?: number): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(fixed ?? 640);
  useLayoutEffect(() => {
    if (fixed) return;
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const cw = Math.floor(el.clientWidth);
      if (cw > 0) setW((prev) => (Math.abs(prev - cw) >= 1 ? cw : prev));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fixed]);
  return [ref, fixed ?? w];
}

export interface LegendItem {
  label: string;
  color: string;
  kind?: 'rect' | 'line' | 'dot';
}

export interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

export type SetTip = (t: Tip | null) => void;

/** Top-of-chart header layout: title + wrapped legend. Returns the y where the plot may start. */
export function headerLayout(title: string, legend: LegendItem[], width: number) {
  const pad = 4;
  const titleText = fit(title, width - pad * 2, FS_TITLE);
  let y = pad + FS_TITLE + 2;
  const titleY = y;
  const lay = legend.length >= 2 ? legendLayout(legend.map((l) => l.label), width - pad * 2, FS_LEGEND, 12, 16, (t, f) => measureText(t, f)) : { items: [], rows: 0 };
  const legendY = y + 12;
  if (lay.rows) y = legendY + lay.rows * 18 - 4;
  return { titleText, titleY, legendY, legend: lay, top: y + 14 };
}

export function ChartHeader(props: { layout: ReturnType<typeof headerLayout>; legend: LegendItem[] }) {
  const { layout, legend } = props;
  return (
    <g className="chart-header">
      <text x={4} y={layout.titleY} fontSize={FS_TITLE} fontWeight={600} fill="var(--text)" style={{ fontFamily: FONT_UI }}>
        {layout.titleText}
      </text>
      {layout.legend.items.map((it, i) => {
        const y = layout.legendY + it.row * 18;
        const l = legend[i];
        const x = 4 + it.x;
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            {l.kind === 'line' ? (
              <line x1={0} x2={12} y1={0} y2={0} stroke={l.color} strokeWidth={2} strokeLinecap="round" />
            ) : l.kind === 'dot' ? (
              <circle cx={6} cy={0} r={4} fill={l.color} />
            ) : (
              <rect x={0} y={-5} width={12} height={10} rx={2} fill={l.color} />
            )}
            <text x={18} y={4} fontSize={FS_LEGEND} fill="var(--text-2)" style={{ fontFamily: FONT_UI }}>
              {it.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

let uid = 0;
export function useUid(prefix: string): string {
  const ref = useRef<string | null>(null);
  if (ref.current === null) ref.current = `${prefix}${++uid}`;
  return ref.current;
}

/** The outer SVG with accessible name and description, and a surface-coloured background. */
export function ChartSvg(props: { transparent?: boolean; width: number; height: number; title: string; desc: string; children: ReactNode; onPointerLeave?: () => void; onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void }) {
  const id = useUid('chart');
  return (
    <svg
      className="chart-svg"
      width={props.width}
      height={props.height}
      viewBox={`0 0 ${props.width} ${props.height}`}
      role="img"
      aria-labelledby={`${id}-t ${id}-d`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: FONT_UI, display: 'block', maxWidth: '100%', height: 'auto', position: 'relative' }}
      onPointerLeave={props.onPointerLeave}
      onPointerMove={props.onPointerMove}
    >
      <title id={`${id}-t`}>{props.title}</title>
      <desc id={`${id}-d`}>{props.desc}</desc>
      <rect x={0} y={0} width={props.width} height={props.height} fill={props.transparent ? 'none' : 'var(--surface)'} data-bg="1" />
      {props.children}
    </svg>
  );
}

/** Pointer position relative to the chart container (for tooltip placement). */
export function localPoint(e: { clientX: number; clientY: number; currentTarget: Element }): { x: number; y: number; sx: number; sy: number } {
  const svg = (e.currentTarget as Element).closest('svg') as SVGSVGElement | null;
  const rect = svg?.getBoundingClientRect();
  if (!svg || !rect) return { x: 0, y: 0, sx: 0, sy: 0 };
  const vb = svg.viewBox.baseVal;
  const scale = vb && vb.width ? rect.width / vb.width : 1;
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  return { x, y, sx: x / scale, sy: y / scale };
}

/** Tooltip positioned inside the chart container; flips to stay visible. */
export function Tooltip({ tip, width }: { tip: Tip | null; width: number }) {
  if (!tip) return null;
  const left = tip.x > width * 0.6 ? undefined : tip.x + 14;
  const right = tip.x > width * 0.6 ? Math.max(0, width - tip.x + 14) : undefined;
  return (
    <div className="chart-tip" role="status" style={{ left, right, top: Math.max(0, tip.y - 12) }}>
      {tip.content}
    </div>
  );
}

/** Tooltip row: value first (strong), then label; keyed by a short line of the series colour. */
export function TipRow(props: { color?: string; value: ReactNode; label?: ReactNode }) {
  return (
    <div className="chart-tip-row">
      {props.color ? <span className="chart-tip-key" style={{ background: props.color }} /> : null}
      <strong className="num">{props.value}</strong>
      {props.label !== undefined ? <span className="chart-tip-label">{props.label}</span> : null}
    </div>
  );
}

/** Y-axis ticks + gridlines + axis title. */
export function YAxis(props: { ticks: number[]; scale: (v: number) => number; x0: number; x1: number; format: (v: number) => string; title?: string; titleX?: number; plotTop: number; plotBottom: number }) {
  const { ticks, scale, x0, x1, format } = props;
  return (
    <g className="axis-y">
      {ticks.map((t, i) => {
        const y = scale(t);
        return (
          <g key={i}>
            <line x1={x0} x2={x1} y1={y} y2={y} stroke="var(--viz-grid)" strokeWidth={1} shapeRendering="crispEdges" />
            <text x={x0 - 6} y={y + 3.5} fontSize={FS_TICK} textAnchor="end" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {format(t)}
            </text>
          </g>
        );
      })}
      {props.title ? (
        <text
          transform={`translate(${props.titleX ?? 12},${(props.plotTop + props.plotBottom) / 2}) rotate(-90)`}
          fontSize={FS_AXIS}
          textAnchor="middle"
          fill="var(--text-2)"
        >
          {props.title}
        </text>
      ) : null}
    </g>
  );
}

/** X-axis numeric ticks + gridlines + title. */
export function XAxisNumeric(props: { ticks: number[]; scale: (v: number) => number; y0: number; y1: number; format: (v: number) => string; title?: string; titleY?: number; grid?: boolean; plotLeft: number; plotRight: number }) {
  const { ticks, scale, y0, y1, format } = props;
  return (
    <g className="axis-x">
      {ticks.map((t, i) => {
        const x = scale(t);
        return (
          <g key={i}>
            {props.grid !== false ? <line x1={x} x2={x} y1={y0} y2={y1} stroke="var(--viz-grid)" strokeWidth={1} shapeRendering="crispEdges" /> : null}
            <text x={x} y={y1 + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {format(t)}
            </text>
          </g>
        );
      })}
      {props.title ? (
        <text x={(props.plotLeft + props.plotRight) / 2} y={props.titleY ?? y1 + 34} fontSize={FS_AXIS} textAnchor="middle" fill="var(--text-2)">
          {props.title}
        </text>
      ) : null}
    </g>
  );
}

/** Widest of the given tick labels. */
export function maxLabelWidth(labels: string[], fs = FS_TICK): number {
  let m = 0;
  for (const l of labels) m = Math.max(m, measureText(l, fs));
  return m;
}

/** Human list: "a, b and c". */
export function listText(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}
