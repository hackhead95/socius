import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { band, barPath, formatTick, formatValue, linear, niceTicks } from './scale';
import { ChartHeader, ChartSvg, FS_AXIS, FS_TICK, TipRow, fit, useHeaderLayout, maxLabelWidth, seriesColor, type LegendItem, type SetTip } from './common';

type PyramidSpec = Extract<ChartSpec, { type: 'pyramid' }>;

export function pyramidDesc(spec: PyramidSpec): string {
  const tl = spec.left.values.reduce((a, b) => a + b, 0);
  const tr = spec.right.values.reduce((a, b) => a + b, 0);
  let peak = 0;
  for (let i = 1; i < spec.groups.length; i++) if (spec.left.values[i] + spec.right.values[i] > spec.left.values[peak] + spec.right.values[peak]) peak = i;
  const u = spec.percent ? '%' : '';
  return `Population pyramid of ${spec.groups.length} groups: ${spec.left.name} (${formatValue(tl)}${u}) on the left, ${spec.right.name} (${formatValue(tr)}${u}) on the right. Largest group: ${spec.groups[peak] ?? ''}.`;
}

export function PyramidChart({ spec, width, setTip }: { spec: PyramidSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState(-1);
  const legend: LegendItem[] = [
    { label: spec.left.name, color: seriesColor(0) },
    { label: spec.right.name, color: seriesColor(1) },
  ];
  const head = useHeaderLayout(spec.title, legend, width);
  const G = spec.groups.length;
  const pct = !!spec.percent;
  let hi = 0;
  for (const v of [...spec.left.values, ...spec.right.values]) if (Number.isFinite(v)) hi = Math.max(hi, v);
  const labels = spec.groups.map((g) => fit(g, 90, FS_TICK));
  const gap = Math.ceil(maxLabelWidth(labels)) + 18;
  const outer = 10;
  const half = (width - gap - outer * 2) / 2;
  const ticks = niceTicks(0, hi, Math.max(2, Math.min(5, Math.floor(half / 70))));
  const top = head.top + 18;
  const rowH = Math.max(14, Math.min(26, 360 / Math.max(1, G)));
  const plotH = rowH * G;
  const height = top + plotH + 26 + (spec.xLabel ? 18 : 0) + 4;
  const cx = width / 2;
  const lx = linear(0, ticks.max, cx - gap / 2, outer);
  const rx = linear(0, ticks.max, cx + gap / 2, width - outer);
  const yb = band(G, top, top + plotH);
  const barT = Math.min(24, yb.bandwidth - 2);
  const rowOf = (gi: number) => G - 1 - gi; // youngest at the bottom

  const tipFor = (gi: number) => (
    <>
      <div className="chart-tip-title">{spec.groups[gi]}</div>
      <TipRow color={seriesColor(0)} value={formatValue(spec.left.values[gi], pct)} label={spec.left.name} />
      <TipRow color={seriesColor(1)} value={formatValue(spec.right.values[gi], pct)} label={spec.right.name} />
    </>
  );

  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={pyramidDesc(spec)} onPointerLeave={() => { setHover(-1); setTip(null); }}>
      <ChartHeader layout={head} legend={legend} />
      <text x={cx - gap / 2 - 4} y={top - 8} fontSize={FS_TICK} textAnchor="end" fill="var(--text-2)" fontWeight={600}>
        {fit(spec.left.name, half - 8, FS_TICK)}
      </text>
      <text x={cx + gap / 2 + 4} y={top - 8} fontSize={FS_TICK} fill="var(--text-2)" fontWeight={600}>
        {fit(spec.right.name, half - 8, FS_TICK)}
      </text>
      {ticks.values.map((t, i) => (
        <g key={i}>
          <line x1={lx(t)} x2={lx(t)} y1={top} y2={top + plotH} stroke="var(--viz-grid)" shapeRendering="crispEdges" />
          <line x1={rx(t)} x2={rx(t)} y1={top} y2={top + plotH} stroke="var(--viz-grid)" shapeRendering="crispEdges" />
          <text x={lx(t)} y={top + plotH + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatTick(t, ticks.step, pct)}
          </text>
          {t !== 0 ? (
            <text x={rx(t)} y={top + plotH + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatTick(t, ticks.step, pct)}
            </text>
          ) : null}
        </g>
      ))}
      {hover >= 0 ? <rect x={outer} y={yb.start(rowOf(hover))} width={width - outer * 2} height={yb.bandwidth} fill="var(--surface-3)" opacity={0.55} /> : null}
      {spec.groups.map((g, gi) => {
        const y = yb.center(rowOf(gi));
        const lv = spec.left.values[gi] ?? 0;
        const rv = spec.right.values[gi] ?? 0;
        return (
          <g key={gi}>
            <path d={barPath(lx(lv), y - barT / 2, lx(0) - lx(lv), barT, 4, 'left')} fill={seriesColor(0)} />
            <path d={barPath(rx(0), y - barT / 2, rx(rv) - rx(0), barT, 4, 'right')} fill={seriesColor(1)} />
            <text x={cx} y={y + 3.5} fontSize={FS_TICK} textAnchor="middle" fill="var(--text-2)">
              {labels[gi]}
            </text>
          </g>
        );
      })}
      <line x1={lx(0)} x2={lx(0)} y1={top} y2={top + plotH} stroke="var(--viz-axis)" shapeRendering="crispEdges" />
      <line x1={rx(0)} x2={rx(0)} y1={top} y2={top + plotH} stroke="var(--viz-axis)" shapeRendering="crispEdges" />
      {spec.xLabel ? (
        <text x={cx} y={height - 8} fontSize={FS_AXIS} textAnchor="middle" fill="var(--text-2)">
          {spec.xLabel}
        </text>
      ) : null}
      {spec.groups.map((g, gi) => (
        <rect
          key={`h${gi}`}
          x={0}
          y={yb.start(rowOf(gi))}
          width={width}
          height={yb.bandwidth}
          fill="transparent"
          tabIndex={0}
          className="chart-hit chart-hit-quiet"
          aria-label={`${g}: ${spec.left.name} ${formatValue(spec.left.values[gi], pct)}, ${spec.right.name} ${formatValue(spec.right.values[gi], pct)}`}
          onPointerMove={(e) => {
            setHover(gi);
            const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
            setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: tipFor(gi) });
          }}
          onFocus={(e) => {
            setHover(gi);
            const scale = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().width / width;
            setTip({ x: (cx + gap) * scale, y: yb.center(rowOf(gi)) * scale, content: tipFor(gi) });
          }}
          onBlur={() => { setHover(-1); setTip(null); }}
        />
      ))}
    </ChartSvg>
  );
}
