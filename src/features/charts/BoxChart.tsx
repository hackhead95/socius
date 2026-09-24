import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { band, formatTick, formatValue, linear, niceTicks } from './scale';
import { ChartHeader, ChartSvg, FS_AXIS, FS_TICK, TipRow, YAxis, fit, useHeaderLayout, maxLabelWidth, type SetTip } from './common';

type BoxSpec = Extract<ChartSpec, { type: 'box' }>;

export function boxDesc(spec: BoxSpec): string {
  return `Box plot of ${spec.groups.length} group${spec.groups.length === 1 ? '' : 's'}. ` +
    spec.groups
      .map((g) => `${g.name}: median ${formatValue(g.median)}, middle half ${formatValue(g.q1)} to ${formatValue(g.q3)}, n = ${formatValue(g.n)}${g.outliers.length ? `, ${g.outliers.length} outlier${g.outliers.length === 1 ? '' : 's'}` : ''}`)
      .join('; ') + '.';
}

function star(cx: number, cy: number, r: number): string {
  let d = '';
  for (let k = 0; k < 3; k++) {
    const a = (Math.PI / 3) * k + Math.PI / 2;
    const dx = Math.cos(a) * r;
    const dy = Math.sin(a) * r;
    d += `M${(cx - dx).toFixed(2)} ${(cy - dy).toFixed(2)}L${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}`;
  }
  return d;
}

export function BoxChart({ spec, width, setTip }: { spec: BoxSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState(-1);
  const head = useHeaderLayout(spec.title, [], width);
  const G = spec.groups.length;
  let lo = Infinity;
  let hi = -Infinity;
  for (const g of spec.groups) {
    lo = Math.min(lo, g.min, g.q1);
    hi = Math.max(hi, g.max, g.q3);
    for (const o of g.outliers) {
      lo = Math.min(lo, o.value);
      hi = Math.max(hi, o.value);
    }
  }
  if (!Number.isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  const yt = niceTicks(lo, hi, 5);
  const left = Math.ceil(maxLabelWidth(yt.values.map((t) => formatTick(t, yt.step)))) + 10 + (spec.yLabel ? 20 : 0);
  const right = 10;
  const top = head.top + 4;
  const plotH = 250;
  const xb = band(G, left, width - right);
  const labels = spec.groups.map((g) => fit(g.name, Math.max(40, xb.bandwidth - 6), FS_TICK));
  const height = top + plotH + 40 + (spec.xLabel ? 18 : 0);
  const ys = linear(yt.min, yt.max, top + plotH, top);
  const boxW = Math.min(44, xb.bandwidth * 0.5);

  const tipFor = (gi: number) => {
    const g = spec.groups[gi];
    return (
      <>
        <div className="chart-tip-title">{g.name}</div>
        <TipRow value={formatValue(g.median)} label="Median" />
        <TipRow value={`${formatValue(g.q1)} to ${formatValue(g.q3)}`} label="Middle 50%" />
        <TipRow value={`${formatValue(g.min)} to ${formatValue(g.max)}`} label="Whiskers" />
        {g.mean !== undefined ? <TipRow value={formatValue(g.mean)} label="Mean" /> : null}
        <TipRow value={formatValue(g.n)} label="n" />
        {g.outliers.length ? <TipRow value={g.outliers.length} label="Outliers (point at them for case numbers)" /> : null}
      </>
    );
  };

  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={boxDesc(spec)} onPointerLeave={() => { setHover(-1); setTip(null); }}>
      <ChartHeader layout={head} legend={[]} />
      <YAxis ticks={yt.values} scale={ys} x0={left} x1={width - right} format={(t) => formatTick(t, yt.step)} title={spec.yLabel} titleX={12} plotTop={top} plotBottom={top + plotH} />
      <line x1={left} x2={width - right} y1={top + plotH} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {spec.groups.map((g, gi) => {
        const cx = xb.center(gi);
        const x0 = cx - boxW / 2;
        const cap = boxW * 0.45;
        return (
          <g key={gi}>
            {hover === gi ? <rect x={xb.start(gi)} y={top} width={xb.bandwidth} height={plotH} fill="var(--surface-3)" opacity={0.55} /> : null}
            <g stroke="var(--text-2)" strokeWidth={1}>
              <line x1={cx} x2={cx} y1={ys(g.max)} y2={ys(g.q3)} />
              <line x1={cx} x2={cx} y1={ys(g.q1)} y2={ys(g.min)} />
              <line x1={cx - cap / 2} x2={cx + cap / 2} y1={ys(g.max)} y2={ys(g.max)} />
              <line x1={cx - cap / 2} x2={cx + cap / 2} y1={ys(g.min)} y2={ys(g.min)} />
            </g>
            <rect x={x0} y={ys(g.q3)} width={boxW} height={Math.max(1, ys(g.q1) - ys(g.q3))} rx={3} fill="var(--viz-1)" fillOpacity={0.16} stroke="var(--viz-1)" strokeWidth={1.5} />
            <line x1={x0} x2={x0 + boxW} y1={ys(g.median)} y2={ys(g.median)} stroke="var(--text)" strokeWidth={2} />
            {g.mean !== undefined && Number.isFinite(g.mean) ? (
              <path d={`M${cx - 4} ${ys(g.mean)}h8M${cx} ${ys(g.mean) - 4}v8`} stroke="var(--text)" strokeWidth={1.5} />
            ) : null}
            <rect
              x={x0 - 4}
              y={ys(g.max) - 4}
              width={boxW + 8}
              height={Math.max(8, ys(g.min) - ys(g.max) + 8)}
              fill="transparent"
              className="chart-hit"
              tabIndex={0}
              aria-label={`${g.name}: median ${formatValue(g.median)}, quartiles ${formatValue(g.q1)} and ${formatValue(g.q3)}, n ${formatValue(g.n)}`}
              onPointerMove={(e) => {
                setHover(gi);
                const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: tipFor(gi) });
              }}
              onFocus={(e) => {
                setHover(gi);
                const scale = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().width / width;
                setTip({ x: (cx + boxW) * scale, y: ys(g.q3) * scale, content: tipFor(gi) });
              }}
              onBlur={() => { setHover(-1); setTip(null); }}
            />
            {g.outliers.map((o, oi) => {
              const oy = ys(o.value);
              const label = `${o.caseIndex !== undefined ? `Case ${o.caseIndex}` : 'Case'}: ${formatValue(o.value)}`;
              const show = (sx: number, sy: number) =>
                setTip({
                  x: sx,
                  y: sy,
                  content: (
                    <>
                      <div className="chart-tip-title">{g.name}</div>
                      <TipRow value={formatValue(o.value)} label={`${o.caseIndex !== undefined ? `case ${o.caseIndex}, ` : ''}${o.extreme ? 'extreme (over 3 box-lengths out)' : 'outlier (over 1.5 box-lengths out)'}`} />
                    </>
                  ),
                });
              return (
                <g key={oi}>
                  {o.extreme ? (
                    <path d={star(cx, oy, 4.5)} stroke="var(--text)" strokeWidth={1.4} strokeLinecap="round" />
                  ) : (
                    <circle cx={cx} cy={oy} r={3.5} fill="var(--surface)" stroke="var(--text-2)" strokeWidth={1.25} />
                  )}
                  <circle
                    cx={cx}
                    cy={oy}
                    r={7}
                    fill="transparent"
                    className="chart-hit"
                    aria-label={label}
                    onPointerMove={(e) => {
                      e.stopPropagation();
                      const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      show(e.clientX - r.left, e.clientY - r.top);
                    }}
                  />
                </g>
              );
            })}
            <text x={cx} y={top + plotH + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--text-2)">
              {labels[gi]}
            </text>
            <text x={cx} y={top + plotH + 29} fontSize={FS_TICK - 1} textAnchor="middle" fill="var(--muted)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              n = {formatValue(g.n)}
            </text>
          </g>
        );
      })}
      {spec.xLabel ? (
        <text x={(left + width - right) / 2} y={height - 6} fontSize={FS_AXIS} textAnchor="middle" fill="var(--text-2)">
          {fit(spec.xLabel, Math.max(40, width - 16), FS_AXIS)}
        </text>
      ) : null}
    </ChartSvg>
  );
}
