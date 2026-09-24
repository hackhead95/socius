import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { arcPath, formatValue, pieAngles } from './scale';
import { ChartHeader, ChartSvg, FS_LEGEND, FS_TICK, TipRow, fit, useHeaderLayout, measureText, seriesColor, type SetTip } from './common';

type PieSpec = Extract<ChartSpec, { type: 'pie' }>;

export function pieDesc(spec: PieSpec): string {
  const total = spec.slices.reduce((a, s) => a + (s.value > 0 ? s.value : 0), 0);
  return `Donut chart of ${spec.slices.length} parts, total ${formatValue(total)}. ` +
    spec.slices.map((s) => `${s.name}: ${formatValue(s.value)} (${total ? formatValue((s.value / total) * 100, true, 1) : '0%'})`).join('; ') + '.';
}

export function PieChart({ spec, width, setTip }: { spec: PieSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState(-1);
  const head = useHeaderLayout(spec.title, [], width);
  const angles = pieAngles(spec.slices.map((s) => s.value));
  const total = spec.slices.reduce((a, s) => a + (s.value > 0 ? s.value : 0), 0);
  const side = width >= 460;
  const d = Math.min(side ? 240 : 220, side ? width * 0.45 : width - 24);
  const R = d / 2;
  const rIn = R * 0.58;
  const top = head.top + 4;
  const rowH = 22;
  const legendX = side ? 24 + d + 32 : 12;
  const legendY = side ? top + Math.max(8, R - (spec.slices.length * rowH) / 2) : top + d + 20;
  const legendW = Math.min(width - legendX - 8, 340);
  const height = side ? Math.max(top + d + 16, legendY + spec.slices.length * rowH + 8) : legendY + spec.slices.length * rowH + 8;
  const cx = side ? 24 + R : width / 2;
  const cy = top + R;
  const pctW = measureText('100.0%', FS_LEGEND) + 4;
  const valW = Math.max(...spec.slices.map((s) => measureText(formatValue(s.value), FS_LEGEND))) + 12;

  const tipFor = (i: number) => (
    <>
      <div className="chart-tip-title">{spec.slices[i].name}</div>
      <TipRow color={seriesColor(i)} value={total ? formatValue((spec.slices[i].value / total) * 100, true, 1) : '0%'} label={`${formatValue(spec.slices[i].value)} of ${formatValue(total)}`} />
    </>
  );

  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={pieDesc(spec)} onPointerLeave={() => { setHover(-1); setTip(null); }}>
      <ChartHeader layout={head} legend={[]} />
      {angles.map((a, i) => {
        if (a.share <= 0) return null;
        const grow = hover === i ? 4 : 0;
        return (
          <path
            key={i}
            d={arcPath(cx, cy, R + grow, rIn, a.start, a.end)}
            fill={seriesColor(i)}
            stroke="var(--surface)"
            strokeWidth={2}
            strokeLinejoin="round"
            tabIndex={0}
            className="chart-hit"
            aria-label={`${spec.slices[i].name}: ${formatValue(spec.slices[i].value)}, ${formatValue(a.share * 100, true, 1)}`}
            onPointerMove={(e) => {
              setHover(i);
              const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: tipFor(i) });
            }}
            onFocus={(e) => {
              setHover(i);
              const scale = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().width / width;
              const mid = (a.start + a.end) / 2;
              setTip({ x: (cx + Math.cos(mid) * R) * scale, y: (cy + Math.sin(mid) * R) * scale, content: tipFor(i) });
            }}
            onBlur={() => { setHover(-1); setTip(null); }}
          />
        );
      })}
      <text x={cx} y={cy - 2} fontSize={18} fontWeight={600} textAnchor="middle" fill="var(--text)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatValue(total)}
      </text>
      <text x={cx} y={cy + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--muted)">
        total
      </text>
      {spec.slices.map((s, i) => {
        const y = legendY + i * rowH;
        const nameW = legendW - pctW - valW - 22;
        return (
          <g key={`lg${i}`} transform={`translate(${legendX},${y})`} opacity={hover >= 0 && hover !== i ? 0.6 : 1}>
            <rect x={0} y={-5} width={12} height={10} rx={2} fill={seriesColor(i)} />
            <text x={20} y={4} fontSize={FS_LEGEND} fill="var(--text)">
              {fit(s.name, Math.max(40, nameW), FS_LEGEND)}
            </text>
            <text x={legendW - pctW} y={4} fontSize={FS_LEGEND} textAnchor="end" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(s.value)}
            </text>
            <text x={legendW} y={4} fontSize={FS_LEGEND} textAnchor="end" fill="var(--text)" fontWeight={500} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {total ? formatValue((s.value / total) * 100, true, 1) : '0%'}
            </text>
          </g>
        );
      })}
    </ChartSvg>
  );
}
