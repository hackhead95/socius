import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { band, formatTick, formatValue, linear, niceTicks, labelStride } from './scale';
import { ChartHeader, ChartSvg, FS_AXIS, FS_TICK, TipRow, YAxis, fit, headerLayout, listText, maxLabelWidth, measureText, seriesColor, type LegendItem, type SetTip } from './common';

type LineSpec = Extract<ChartSpec, { type: 'line' }>;

export function lineDesc(spec: LineSpec): string {
  const parts = spec.series.map((s) => {
    const vals = s.values.map((v, i) => (v === null || !Number.isFinite(v) ? null : `${spec.categories[i]} ${formatValue(v)}`)).filter(Boolean);
    return `${spec.series.length > 1 ? s.name + ': ' : ''}${vals.join(', ')}`;
  });
  return `Line chart across ${spec.categories.length} categories${spec.series.length > 1 ? ` for ${listText(spec.series.map((s) => s.name))}` : ''}. ${parts.join('. ')}.`;
}

export function LineChart({ spec, width, setTip }: { spec: LineSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState(-1);
  const S = spec.series.length;
  const C = spec.categories.length;
  const legend: LegendItem[] = spec.series.map((s, i) => ({ label: s.name, color: seriesColor(i), kind: 'line' }));
  const head = headerLayout(spec.title, legend, width);
  let lo = Infinity;
  let hi = -Infinity;
  for (const s of spec.series)
    for (const v of s.values)
      if (v !== null && Number.isFinite(v)) {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
  if (!Number.isFinite(lo)) {
    lo = 0;
    hi = 1;
  }
  // Start at zero when the data are all positive and not far from it (keeps differences honest).
  if (lo > 0 && lo < hi * 0.5) lo = 0;
  const yt = niceTicks(lo, hi, 5);
  const left = Math.ceil(maxLabelWidth(yt.values.map((t) => formatTick(t, yt.step)))) + 10 + (spec.yLabel ? 20 : 0);

  // Direct end labels for up to 4 series when they do not collide.
  const endInfo = spec.series.map((s) => {
    for (let i = s.values.length - 1; i >= 0; i--) {
      const v = s.values[i];
      if (v !== null && Number.isFinite(v)) return { i, v };
    }
    return null;
  });
  let endLabels = S >= 2 && S <= 4 && width >= 480;
  const top = head.top + 6;
  const plotH = 240;
  const ys = linear(yt.min, yt.max, top + plotH, top);
  if (endLabels) {
    const ys_ = endInfo.map((e) => (e ? ys(e.v) : NaN)).filter(Number.isFinite).sort((a, b) => a - b);
    for (let k = 1; k < ys_.length; k++) if (ys_[k] - ys_[k - 1] < 13) endLabels = false;
  }
  const endLabelText = spec.series.map((s) => fit(s.name, 110, FS_TICK));
  const endW = endLabels ? Math.max(...endLabelText.map((t) => measureText(t, FS_TICK))) + 14 : 0;
  const right = endLabels ? endW + 8 : 14;
  const xb = band(C, left, width - right);
  const labelW = maxLabelWidth(spec.categories);
  const stride = labelStride(C, xb.bandwidth, Math.min(labelW, 110));
  const catLabels = spec.categories.map((c) => fit(c, Math.max(30, xb.bandwidth * stride - 6), FS_TICK));
  const height = top + plotH + 26 + (spec.xLabel ? 20 : 0) + 4;

  const paths = spec.series.map((s) => {
    let d = '';
    let pen = false;
    s.values.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${xb.center(i).toFixed(2)} ${ys(v).toFixed(2)}`;
      pen = true;
    });
    return d;
  });

  const tipFor = (c: number) => (
    <>
      <div className="chart-tip-title">{spec.categories[c]}</div>
      {spec.series.map((s, si) => (
        <TipRow key={si} color={S > 1 ? seriesColor(si) : undefined} value={s.values[c] === null ? 'no data' : formatValue(s.values[c] as number)} label={S > 1 ? s.name : spec.yLabel ?? ''} />
      ))}
    </>
  );

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width / width;
    const sx = (e.clientX - rect.left) / scale;
    const sy = (e.clientY - rect.top) / scale;
    if (sy < top - 10 || sy > top + plotH + 10) {
      setHover(-1);
      setTip(null);
      return;
    }
    const c = Math.max(0, Math.min(C - 1, Math.floor((sx - left) / xb.bandwidth)));
    setHover(c);
    setTip({ x: xb.center(c) * scale, y: e.clientY - rect.top, content: tipFor(c) });
  };

  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={lineDesc(spec)} onPointerMove={onMove} onPointerLeave={() => { setHover(-1); setTip(null); }}>
      <ChartHeader layout={head} legend={legend} />
      <YAxis ticks={yt.values} scale={ys} x0={left} x1={width - right} format={(t) => formatTick(t, yt.step)} title={spec.yLabel} titleX={12} plotTop={top} plotBottom={top + plotH} />
      <line x1={left} x2={width - right} y1={top + plotH} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {hover >= 0 ? <line x1={xb.center(hover)} x2={xb.center(hover)} y1={top} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} /> : null}
      {paths.map((d, si) => (
        <path key={si} d={d} fill="none" stroke={seriesColor(si)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {spec.series.map((s, si) =>
        s.values.map((v, i) =>
          v === null || !Number.isFinite(v) ? null : (
            <circle key={`${si}-${i}`} cx={xb.center(i)} cy={ys(v)} r={hover === i ? 5 : 4} fill={seriesColor(si)} stroke="var(--surface)" strokeWidth={2} />
          ),
        ),
      )}
      {endLabels
        ? endInfo.map((e, si) =>
            e ? (
              <text key={`end${si}`} x={xb.center(e.i) + 9} y={ys(e.v) + 3.5} fontSize={FS_TICK} fill="var(--text-2)">
                {endLabelText[si]}
              </text>
            ) : null,
          )
        : null}
      {catLabels.map((l, c) =>
        c % stride === 0 ? (
          <text key={c} x={xb.center(c)} y={top + plotH + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--text-2)">
            {l}
          </text>
        ) : null,
      )}
      {spec.xLabel ? (
        <text x={(left + width - right) / 2} y={height - 8} fontSize={FS_AXIS} textAnchor="middle" fill="var(--text-2)">
          {fit(spec.xLabel, Math.max(40, width - 16), FS_AXIS)}
        </text>
      ) : null}
      {spec.categories.map((cat, c) => (
        <rect
          key={`f${c}`}
          x={xb.start(c)}
          y={top}
          width={xb.bandwidth}
          height={plotH}
          fill="transparent"
          tabIndex={0}
          className="chart-hit chart-hit-quiet"
          aria-label={`${cat}: ${spec.series.map((s) => `${S > 1 ? s.name + ' ' : ''}${s.values[c] === null ? 'no data' : formatValue(s.values[c] as number)}`).join(', ')}`}
          onFocus={(e) => {
            setHover(c);
            const scale = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect().width / width;
            setTip({ x: xb.center(c) * scale, y: (top + 30) * scale, content: tipFor(c) });
          }}
          onBlur={() => { setHover(-1); setTip(null); }}
        />
      ))}
    </ChartSvg>
  );
}
