import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { barPath, formatTick, formatValue, linear, niceTicks, normalCurvePoints } from './scale';
import { ChartHeader, ChartSvg, FS_TICK, TipRow, XAxisNumeric, YAxis, useHeaderLayout, maxLabelWidth, measureText, type SetTip } from './common';

type HistSpec = Extract<ChartSpec, { type: 'histogram' }>;

export function histogramDesc(spec: HistSpec): string {
  const n = spec.counts.reduce((a, b) => a + b, 0);
  let peak = 0;
  for (let i = 1; i < spec.counts.length; i++) if (spec.counts[i] > spec.counts[peak]) peak = i;
  const lo = spec.edges[0];
  const hi = spec.edges[spec.edges.length - 1];
  return `Histogram of ${formatValue(n)} values from ${formatValue(lo)} to ${formatValue(hi)} in ${spec.counts.length} bins. ` +
    `Most frequent bin: ${formatValue(spec.edges[peak])} to ${formatValue(spec.edges[peak + 1])} (${formatValue(spec.counts[peak])}).` +
    (spec.normal ? ` Normal curve with mean ${formatValue(spec.normal.mean)} and SD ${formatValue(spec.normal.sd)}.` : '');
}

export function HistogramChart({ spec, width, setTip }: { spec: HistSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState(-1);
  const head = useHeaderLayout(spec.title, [], width);
  const curve = spec.normal && spec.normal.sd > 0 ? normalCurvePoints(spec.edges, spec.normal) : [];
  let hi = 0;
  for (const c of spec.counts) hi = Math.max(hi, c);
  for (const [, y] of curve) hi = Math.max(hi, y);
  const yt = niceTicks(0, hi, 5);
  const left = Math.ceil(maxLabelWidth(yt.values.map((t) => formatTick(t, yt.step)))) + 10 + 20;
  const x0d = spec.edges[0];
  const x1d = spec.edges[spec.edges.length - 1];
  const xt = niceTicks(x0d, x1d, Math.max(3, Math.min(8, Math.floor((width - left) / 70))));
  const xTicks = xt.values.filter((v) => v >= x0d - 1e-9 && v <= x1d + 1e-9);
  const right = Math.max(14, measureText(formatTick(xTicks[xTicks.length - 1] ?? 0, xt.step), FS_TICK) / 2 + 4);
  const top = head.top + (spec.normal ? 20 : 6);
  const plotH = 240;
  const height = top + plotH + 26 + (spec.xLabel ? 20 : 0) + 4;
  const xs = linear(x0d, x1d, left, width - right);
  const ys = linear(yt.min, yt.max, top + plotH, top);
  const gap = spec.counts.length > 60 ? 1 : 2;
  const curvePath = curve.map(([x, y], i) => `${i ? 'L' : 'M'}${xs(x).toFixed(2)} ${ys(y).toFixed(2)}`).join('');

  const tipFor = (i: number) => (
    <>
      <div className="chart-tip-title">
        {formatValue(spec.edges[i])} to {formatValue(spec.edges[i + 1])}
      </div>
      <TipRow value={formatValue(spec.counts[i])} label={spec.yLabel ?? 'Frequency'} />
    </>
  );

  // Key for the curve, right-aligned above the plot.
  const curveText = spec.normal && curve.length ? `Normal curve (M = ${formatValue(spec.normal.mean)}, SD = ${formatValue(spec.normal.sd)})` : null;
  const curveTextW = curveText ? measureText(curveText, FS_TICK) : 0;

  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={histogramDesc(spec)} onPointerLeave={() => { setHover(-1); setTip(null); }}>
      <ChartHeader layout={head} legend={[]} />
      <YAxis ticks={yt.values} scale={ys} x0={left} x1={width - right} format={(t) => formatTick(t, yt.step)} title={spec.yLabel ?? 'Frequency'} titleX={12} plotTop={top} plotBottom={top + plotH} />
      {spec.counts.map((c, i) => {
        const xa = xs(spec.edges[i]);
        const xb = xs(spec.edges[i + 1]);
        const w = Math.max(0.5, xb - xa - gap);
        const yv = ys(c);
        return <path key={i} d={barPath(xa + gap / 2, yv, w, top + plotH - yv, Math.min(4, w / 3), 'top')} fill="var(--viz-1)" opacity={hover >= 0 && hover !== i ? 0.75 : 1} />;
      })}
      {curvePath ? <path d={curvePath} fill="none" stroke="var(--text)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" /> : null}
      {curveText ? (
        <g transform={`translate(${Math.max(left, width - right - curveTextW - 22)},${top - 12})`}>
          <line x1={0} x2={16} y1={-4} y2={-4} stroke="var(--text)" strokeWidth={1.75} strokeLinecap="round" />
          <text x={22} y={0} fontSize={FS_TICK} fill="var(--text-2)">
            {curveText}
          </text>
        </g>
      ) : null}
      <line x1={left} x2={width - right} y1={top + plotH} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      <XAxisNumeric ticks={xTicks} scale={xs} y0={top} y1={top + plotH} grid={false} format={(t) => formatTick(t, xt.step)} title={spec.xLabel} titleY={height - 8} plotLeft={left} plotRight={width - right} />
      {spec.counts.map((c, i) => {
        const xa = xs(spec.edges[i]);
        const xb = xs(spec.edges[i + 1]);
        return (
          <rect
            key={`h${i}`}
            x={xa}
            y={top}
            width={Math.max(1, xb - xa)}
            height={plotH}
            fill="transparent"
            className="chart-hit"
            tabIndex={spec.counts.length <= 40 ? 0 : -1}
            aria-label={`${formatValue(spec.edges[i])} to ${formatValue(spec.edges[i + 1])}: ${formatValue(c)}`}
            onPointerMove={(e) => {
              setHover(i);
              const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: tipFor(i) });
            }}
            onFocus={(e) => {
              setHover(i);
              const scale = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().width / width;
              setTip({ x: ((xa + xb) / 2) * scale, y: (top + 20) * scale, content: tipFor(i) });
            }}
            onBlur={() => { setHover(-1); setTip(null); }}
          />
        );
      })}
    </ChartSvg>
  );
}
