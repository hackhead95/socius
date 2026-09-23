import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { formatValue } from './scale';
import { ChartHeader, ChartSvg, FS_TICK, TipRow, fit, headerLayout, maxLabelWidth, useUid, type SetTip } from './common';

type HeatSpec = Extract<ChartSpec, { type: 'heatmap' }>;

/** Normalised intensity: sequential 0..1; diverging -1..1 (sign = side). */
export function heatIntensity(v: number, scale: 'diverging' | 'sequential', min: number, max: number): number {
  if (!Number.isFinite(v)) return 0;
  if (scale === 'diverging') {
    const m = Math.max(Math.abs(min), Math.abs(max)) || 1;
    return Math.max(-1, Math.min(1, v / m));
  }
  const span = max - min || 1;
  return Math.max(0, Math.min(1, (v - min) / span));
}

/** Fill for an intensity: one hue light->dark for sequential; blue/red arms with a neutral middle for diverging. */
export function heatFill(t: number, scale: 'diverging' | 'sequential'): string {
  if (scale === 'sequential') return `color-mix(in oklab, var(--viz-1) ${Math.round(t * 100)}%, var(--surface))`;
  const pole = t >= 0 ? 'var(--viz-1)' : 'var(--viz-8)';
  return `color-mix(in oklab, ${pole} ${Math.round(Math.abs(t) * 100)}%, var(--surface-3))`;
}

export function heatText(t: number): string {
  return Math.abs(t) > 0.55 ? 'var(--accent-text)' : 'var(--text)';
}

function fmtCell(v: number, scale: 'diverging' | 'sequential'): string {
  if (scale === 'diverging' && Math.abs(v) <= 1) {
    const s = v.toFixed(2);
    return s.replace(/^(-?)0\./, '$1.');
  }
  return formatValue(v);
}

export function heatmapDesc(spec: HeatSpec): string {
  let best: { r: number; c: number; v: number } | null = null;
  spec.values.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v === null || !Number.isFinite(v)) return;
      if (spec.scale === 'diverging' && spec.rowLabels[r] === spec.colLabels[c]) return;
      if (!best || Math.abs(v) > Math.abs(best.v)) best = { r, c, v };
    }),
  );
  const b = best as { r: number; c: number; v: number } | null;
  return `Heatmap with ${spec.rowLabels.length} rows and ${spec.colLabels.length} columns (${spec.scale} colour scale).` +
    (b ? ` Strongest value: ${spec.rowLabels[b.r]} with ${spec.colLabels[b.c]} (${fmtCell(b.v, spec.scale)}).` : '');
}

export function HeatmapChart({ spec, width, setTip }: { spec: HeatSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const gid = useUid('hmg');
  const head = headerLayout(spec.title, [], width);
  const R = spec.rowLabels.length;
  const C = spec.colLabels.length;
  let mn = Infinity;
  let mx = -Infinity;
  for (const row of spec.values) for (const v of row) if (v !== null && Number.isFinite(v)) { mn = Math.min(mn, v); mx = Math.max(mx, v); }
  if (!Number.isFinite(mn)) { mn = 0; mx = 1; }
  const min = spec.min ?? (spec.scale === 'diverging' ? -Math.max(Math.abs(mn), Math.abs(mx)) : Math.min(0, mn));
  const max = spec.max ?? (spec.scale === 'diverging' ? Math.max(Math.abs(mn), Math.abs(mx)) : mx);

  const rowLabels = spec.rowLabels.map((l) => fit(l, Math.min(200, width * 0.34), FS_TICK));
  const left = Math.ceil(maxLabelWidth(rowLabels)) + 12;
  const colLabelW = maxLabelWidth(spec.colLabels);
  const cellW0 = Math.max(16, Math.min(72, (width - left - 8) / Math.max(1, C)));
  const rotate = colLabelW > cellW0 - 6;
  // Rotated labels lean right: keep room for the last one.
  const rightPad = rotate ? Math.max(8, Math.min(110, colLabelW) * Math.SQRT1_2 - cellW0 / 2 + 4) : 8;
  const cellW = Math.max(16, Math.min(72, (width - left - rightPad) / Math.max(1, C)));
  const cellH = Math.max(20, Math.min(38, cellW * 0.75));
  const colLabels = spec.colLabels.map((l) => (rotate ? fit(l, 110, FS_TICK) : l));
  const colH = rotate ? Math.min(110, colLabelW) * Math.SQRT1_2 + 14 : 20;
  const top = head.top + colH;
  const height = top + cellH * R + 44;
  const showVals = cellW >= 34 && cellH >= 18;
  const legendW = Math.min(220, width - left - 16);

  const tipFor = (r: number, c: number) => {
    const v = spec.values[r][c];
    return (
      <>
        <div className="chart-tip-title">
          {spec.rowLabels[r]} × {spec.colLabels[c]}
        </div>
        <TipRow value={v === null ? 'blank' : fmtCell(v, spec.scale)} />
      </>
    );
  };

  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={heatmapDesc(spec)} onPointerLeave={() => { setHover(null); setTip(null); }}>
      <ChartHeader layout={head} legend={[]} />
      <defs>
        <linearGradient id={gid} x1="0" x2="1" y1="0" y2="0">
          {Array.from({ length: 11 }, (_, k) => {
            const t = spec.scale === 'diverging' ? -1 + (2 * k) / 10 : k / 10;
            return <stop key={k} offset={`${k * 10}%`} style={{ stopColor: heatFill(t, spec.scale) }} />;
          })}
        </linearGradient>
      </defs>
      {colLabels.map((l, c) =>
        rotate ? (
          <text key={c} transform={`translate(${left + (c + 0.5) * cellW - 2},${top - 6}) rotate(-45)`} fontSize={FS_TICK} fill="var(--text-2)">
            {l}
          </text>
        ) : (
          <text key={c} x={left + (c + 0.5) * cellW} y={top - 7} fontSize={FS_TICK} textAnchor="middle" fill="var(--text-2)">
            {l}
          </text>
        ),
      )}
      {rowLabels.map((l, r) => (
        <text key={r} x={left - 8} y={top + (r + 0.5) * cellH + 3.5} fontSize={FS_TICK} textAnchor="end" fill="var(--text-2)" fontWeight={hover?.[0] === r ? 600 : 400}>
          {l}
        </text>
      ))}
      {spec.values.map((row, r) =>
        row.map((v, c) => {
          const x = left + c * cellW;
          const y = top + r * cellH;
          const t = v === null ? 0 : heatIntensity(v, spec.scale, min, max);
          return (
            <g key={`${r}-${c}`}>
              <rect x={x + 1} y={y + 1} width={cellW - 2} height={cellH - 2} rx={2} fill={v === null ? 'var(--surface-2)' : heatFill(t, spec.scale)} stroke={hover && hover[0] === r && hover[1] === c ? 'var(--text)' : 'none'} strokeWidth={1.5} />
              {showVals && v !== null ? (
                <text x={x + cellW / 2} y={y + cellH / 2 + 3.5} fontSize={cellW < 44 ? 10 : FS_TICK} textAnchor="middle" fill={heatText(t)} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {fmtCell(v, spec.scale)}
                </text>
              ) : null}
              <rect
                x={x}
                y={y}
                width={cellW}
                height={cellH}
                fill="transparent"
                className="chart-hit chart-hit-quiet"
                aria-label={`${spec.rowLabels[r]} and ${spec.colLabels[c]}: ${v === null ? 'blank' : fmtCell(v, spec.scale)}`}
                tabIndex={R * C <= 100 ? 0 : -1}
                onPointerMove={(e) => {
                  setHover([r, c]);
                  const rc = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                  setTip({ x: e.clientX - rc.left, y: e.clientY - rc.top, content: tipFor(r, c) });
                }}
                onFocus={(e) => {
                  setHover([r, c]);
                  const scale = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().width / width;
                  setTip({ x: (x + cellW) * scale, y: y * scale, content: tipFor(r, c) });
                }}
                onBlur={() => { setHover(null); setTip(null); }}
              />
            </g>
          );
        }),
      )}
      <g transform={`translate(${Math.min(left, width - legendW - 8)},${top + cellH * R + 16})`}>
        <rect x={0} y={0} width={legendW} height={8} rx={2} fill={`url(#${gid})`} />
        <text x={0} y={22} fontSize={FS_TICK - 1} fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmtCell(min, spec.scale)}
        </text>
        {spec.scale === 'diverging' ? (
          <text x={legendW / 2} y={22} fontSize={FS_TICK - 1} textAnchor="middle" fill="var(--muted)">
            0
          </text>
        ) : null}
        <text x={legendW} y={22} fontSize={FS_TICK - 1} textAnchor="end" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {fmtCell(max, spec.scale)}
        </text>
      </g>
    </ChartSvg>
  );
}
