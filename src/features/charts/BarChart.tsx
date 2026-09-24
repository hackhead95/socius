import { Fragment, useState, type ReactElement } from 'react';
import type { ChartSpec } from '../../core/output';
import { band, barPath, formatTick, formatValue, linear, niceTicks } from './scale';
import {
  ChartHeader, ChartSvg, FS_AXIS, FS_TICK, TipRow, XAxisNumeric, YAxis, fit, useHeaderLayout, listText, maxLabelWidth, measureText, seriesColor,
  type LegendItem, type SetTip,
} from './common';

type BarSpec = Extract<ChartSpec, { type: 'bar' }>;

const MAX_BAR = 24;
const GAP = 2;

export function barDesc(spec: BarSpec): string {
  const s = spec.series;
  const unit = spec.percent ? '%' : '';
  if (s.length === 1) {
    const vals = s[0].values;
    let hi = 0;
    for (let i = 1; i < vals.length; i++) if (vals[i] > vals[hi]) hi = i;
    return `Bar chart of ${spec.categories.length} categories. Highest: ${spec.categories[hi] ?? ''} (${formatValue(vals[hi] ?? NaN)}${unit}). ` +
      spec.categories.map((c, i) => `${c}: ${formatValue(vals[i] ?? NaN)}${unit}`).join('; ') + '.';
  }
  return `${spec.stacked ? 'Stacked' : 'Clustered'} bar chart of ${spec.categories.length} categories by ${listText(s.map((x) => x.name))}.`;
}

export function BarChart({ spec, width, setTip }: { spec: BarSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState<number>(-1);
  const S = spec.series.length;
  const C = spec.categories.length;
  const legend: LegendItem[] = spec.series.map((s, i) => ({ label: s.name, color: seriesColor(i) }));
  const head = useHeaderLayout(spec.title, legend, width);
  const pct = !!spec.percent;
  const horizontal = !!spec.horizontal;

  // Value domain.
  let lo = 0;
  let hi = 0;
  for (let c = 0; c < C; c++) {
    if (spec.stacked) {
      let pos = 0;
      let neg = 0;
      for (const s of spec.series) {
        const v = s.values[c];
        if (Number.isFinite(v)) (v >= 0 ? (pos += v) : (neg += v));
      }
      hi = Math.max(hi, pos);
      lo = Math.min(lo, neg);
    } else {
      spec.series.forEach((s, si) => {
        const v = s.values[c];
        if (Number.isFinite(v)) {
          hi = Math.max(hi, v);
          lo = Math.min(lo, v);
        }
        const e = spec.errors?.[si]?.[c];
        if (e) {
          if (Number.isFinite(e[1])) hi = Math.max(hi, e[1]);
          if (Number.isFinite(e[0])) lo = Math.min(lo, e[0]);
        }
      });
    }
  }
  if (pct && spec.stacked && hi > 99 && hi <= 100.5) hi = 100;
  const showValueLabels = S === 1 && !spec.stacked && C <= 16 && !spec.errors;

  const tipFor = (c: number) => (
    <>
      <div className="chart-tip-title">{spec.categories[c]}</div>
      {spec.series.map((s, si) => {
        const v = s.values[c];
        const e = spec.errors?.[si]?.[c];
        return (
          <TipRow
            key={si}
            color={S > 1 ? seriesColor(si) : undefined}
            value={formatValue(v, pct)}
            label={
              <>
                {S > 1 ? s.name : spec.yLabel ?? ''}
                {e ? ` (95% CI ${formatValue(e[0])} to ${formatValue(e[1])})` : ''}
              </>
            }
          />
        );
      })}
    </>
  );

  if (!horizontal) {
    const plotH = 240;
    const ticks = niceTicks(lo, hi, 5);
    const tickLabels = ticks.values.map((t) => formatTick(t, ticks.step, pct));
    const left = Math.ceil(maxLabelWidth(tickLabels)) + 10 + (spec.yLabel ? 20 : 0);
    const right = 8;
    const bw0 = (width - left - right) / Math.max(1, C);
    const labelW = maxLabelWidth(spec.categories);
    const rotate = labelW > bw0 - 6;
    const maxRot = 120;
    const catLabels = spec.categories.map((c) => (rotate ? fit(c, maxRot, FS_TICK) : c));
    const rotH = rotate ? Math.min(maxRot, labelW) * Math.sin(Math.PI / 4) + 12 : 0;
    const bottomPad = (rotate ? rotH + 10 : 22) + (spec.xLabel ? 20 : 0);
    const top = head.top + (showValueLabels ? 12 : 0);
    const height = top + plotH + bottomPad + 4;
    const y = linear(ticks.min, ticks.max, top + plotH, top);
    const x = band(C, left, width - right);
    const groupW = Math.min(x.bandwidth * 0.72, S * MAX_BAR + (S - 1) * GAP);
    const barW = spec.stacked ? Math.min(MAX_BAR, x.bandwidth * 0.72) : Math.max(1, (groupW - (S - 1) * GAP) / S);
    const y0 = y(0);

    const bars: ReactElement[] = [];
    for (let c = 0; c < C; c++) {
      const cx = x.center(c);
      if (spec.stacked) {
        let pos = 0;
        let neg = 0;
        const segs: Array<{ si: number; a: number; b: number }> = [];
        spec.series.forEach((s, si) => {
          const v = s.values[c];
          if (!Number.isFinite(v) || v === 0) return;
          if (v > 0) {
            segs.push({ si, a: pos, b: pos + v });
            pos += v;
          } else {
            segs.push({ si, a: neg, b: neg + v });
            neg += v;
          }
        });
        const lastPos = [...segs].reverse().find((s) => s.b > 0);
        const lastNeg = [...segs].reverse().find((s) => s.b < 0);
        for (const sg of segs) {
          const ya = y(sg.a);
          const yb = y(sg.b);
          const isEnd = sg === lastPos || sg === lastNeg;
          const top_ = Math.min(ya, yb);
          let h = Math.abs(ya - yb);
          // 2px surface gap between segments (taken from the segment's far end).
          const gapped = !isEnd ? Math.max(0, h - GAP) : h;
          const yy = sg.b >= 0 ? top_ + (h - gapped) : top_;
          h = gapped;
          bars.push(
            <path key={`${c}-${sg.si}`} d={isEnd ? barPath(cx - barW / 2, yy, barW, h, 4, sg.b >= 0 ? 'top' : 'bottom') : `M${cx - barW / 2} ${yy}h${barW}v${h}h${-barW}Z`} fill={seriesColor(sg.si)} />,
          );
        }
      } else {
        const gx = cx - groupW / 2;
        spec.series.forEach((s, si) => {
          const v = s.values[c];
          if (!Number.isFinite(v)) return;
          const bx = gx + si * (barW + GAP);
          const yv = y(v);
          const h = Math.abs(yv - y0);
          bars.push(<path key={`${c}-${si}`} d={barPath(bx, Math.min(yv, y0), barW, h, 4, v >= 0 ? 'top' : 'bottom')} fill={seriesColor(si)} />);
          const e = spec.errors?.[si]?.[c];
          if (e && Number.isFinite(e[0]) && Number.isFinite(e[1])) {
            const ex = bx + barW / 2;
            const cap = Math.min(8, barW);
            bars.push(
              <g key={`e${c}-${si}`} stroke="var(--text)" strokeWidth={1.25}>
                <line x1={ex} x2={ex} y1={y(e[0])} y2={y(e[1])} />
                <line x1={ex - cap / 2} x2={ex + cap / 2} y1={y(e[0])} y2={y(e[0])} />
                <line x1={ex - cap / 2} x2={ex + cap / 2} y1={y(e[1])} y2={y(e[1])} />
              </g>,
            );
          }
          if (showValueLabels) {
            const label = formatValue(v, pct);
            if (measureText(label, FS_TICK) <= x.bandwidth - 2)
              bars.push(
                <text key={`l${c}`} x={bx + barW / 2} y={v >= 0 ? yv - 5 : yv + 13} fontSize={FS_TICK} textAnchor="middle" fill="var(--text-2)" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {label}
                </text>,
              );
          }
        });
      }
    }

    return (
      <ChartSvg width={width} height={height} title={spec.title} desc={barDesc(spec)} onPointerLeave={() => { setHover(-1); setTip(null); }}>
        <ChartHeader layout={head} legend={legend} />
        <YAxis ticks={ticks.values} scale={y} x0={left} x1={width - right} format={(t) => formatTick(t, ticks.step, pct)} title={spec.yLabel} titleX={12} plotTop={top} plotBottom={top + plotH} />
        {hover >= 0 ? <rect x={x.start(hover)} y={top} width={x.bandwidth} height={plotH} fill="var(--surface-3)" opacity={0.55} /> : null}
        {bars}
        <line x1={left} x2={width - right} y1={y0} y2={y0} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
        {catLabels.map((l, c) =>
          rotate ? (
            <text key={c} transform={`translate(${x.center(c) + 3},${top + plotH + 10}) rotate(-45)`} fontSize={FS_TICK} textAnchor="end" fill="var(--text-2)">
              {l}
            </text>
          ) : (
            <text key={c} x={x.center(c)} y={top + plotH + 15} fontSize={FS_TICK} textAnchor="middle" fill="var(--text-2)">
              {l}
            </text>
          ),
        )}
        {spec.xLabel ? (
          <text x={(left + width - right) / 2} y={height - 8} fontSize={FS_AXIS} textAnchor="middle" fill="var(--text-2)">
            {fit(spec.xLabel, Math.max(40, width - 16), FS_AXIS)}
          </text>
        ) : null}
        {spec.categories.map((cat, c) => (
          <rect
            key={`hit${c}`}
            x={x.start(c)}
            y={top}
            width={x.bandwidth}
            height={plotH}
            fill="transparent"
            tabIndex={0}
            className="chart-hit"
            aria-label={`${cat}: ${spec.series.map((s) => `${S > 1 ? s.name + ' ' : ''}${formatValue(s.values[c], pct)}`).join(', ')}`}
            onPointerMove={(e) => {
              setHover(c);
              const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: tipFor(c) });
            }}
            onFocus={(e) => {
              setHover(c);
              const svg = e.currentTarget.ownerSVGElement as SVGSVGElement;
              const scale = svg.getBoundingClientRect().width / width;
              setTip({ x: x.center(c) * scale, y: (top + 20) * scale, content: tipFor(c) });
            }}
            onBlur={() => { setHover(-1); setTip(null); }}
          />
        ))}
      </ChartSvg>
    );
  }

  // Horizontal bars: categories top to bottom.
  const rowH = spec.stacked ? 30 : Math.max(26, S * (Math.min(MAX_BAR, 16) + GAP) + 10);
  const labelMax = Math.min(width * 0.38, 220);
  const catLabels = spec.categories.map((c) => fit(c, labelMax, FS_TICK));
  const left = Math.ceil(maxLabelWidth(catLabels)) + 12 + (spec.yLabel ? 20 : 0);
  const ticks = niceTicks(lo, hi, Math.max(3, Math.min(6, Math.floor((width - left) / 90))));
  const tickLabels = ticks.values.map((t) => formatTick(t, ticks.step, pct));
  const right = Math.max(10, measureText(tickLabels[tickLabels.length - 1] ?? '', FS_TICK) / 2 + 4) + (showValueLabels ? 36 : 0);
  const top = head.top;
  const plotH = rowH * C;
  const height = top + plotH + 24 + (spec.xLabel ? 20 : 0) + 4;
  const xs = linear(ticks.min, ticks.max, left, width - right);
  const yb = band(C, top, top + plotH);
  const barT = spec.stacked ? Math.min(MAX_BAR, yb.bandwidth * 0.66) : Math.min(MAX_BAR, (yb.bandwidth * 0.72 - (S - 1) * GAP) / S);
  const groupT = spec.stacked ? barT : S * barT + (S - 1) * GAP;
  const x0 = xs(0);
  const bars: ReactElement[] = [];
  for (let c = 0; c < C; c++) {
    const cy = yb.center(c);
    if (spec.stacked) {
      let pos = 0;
      const segs: Array<{ si: number; a: number; b: number }> = [];
      spec.series.forEach((s, si) => {
        const v = s.values[c];
        if (!Number.isFinite(v) || v <= 0) return;
        segs.push({ si, a: pos, b: pos + v });
        pos += v;
      });
      segs.forEach((sg, k) => {
        const xa = xs(sg.a);
        const w0 = xs(sg.b) - xa;
        const isEnd = k === segs.length - 1;
        const w = isEnd ? w0 : Math.max(0, w0 - GAP);
        bars.push(
          <path key={`${c}-${sg.si}`} d={isEnd ? barPath(xa, cy - barT / 2, w, barT, 4, 'right') : `M${xa} ${cy - barT / 2}h${w}v${barT}h${-w}Z`} fill={seriesColor(sg.si)} />,
        );
      });
    } else {
      const gy = cy - groupT / 2;
      spec.series.forEach((s, si) => {
        const v = s.values[c];
        if (!Number.isFinite(v)) return;
        const by = gy + si * (barT + GAP);
        const xv = xs(v);
        bars.push(<path key={`${c}-${si}`} d={barPath(Math.min(xv, x0), by, Math.abs(xv - x0), barT, 4, v >= 0 ? 'right' : 'left')} fill={seriesColor(si)} />);
        const e = spec.errors?.[si]?.[c];
        if (e && Number.isFinite(e[0]) && Number.isFinite(e[1])) {
          const ey = by + barT / 2;
          const cap = Math.min(8, barT);
          bars.push(
            <g key={`e${c}-${si}`} stroke="var(--text)" strokeWidth={1.25}>
              <line x1={xs(e[0])} x2={xs(e[1])} y1={ey} y2={ey} />
              <line x1={xs(e[0])} x2={xs(e[0])} y1={ey - cap / 2} y2={ey + cap / 2} />
              <line x1={xs(e[1])} x2={xs(e[1])} y1={ey - cap / 2} y2={ey + cap / 2} />
            </g>,
          );
        }
        if (showValueLabels)
          bars.push(
            <text key={`l${c}`} x={v >= 0 ? xv + 5 : xv - 5} y={by + barT / 2 + 3.5} fontSize={FS_TICK} textAnchor={v >= 0 ? 'start' : 'end'} fill="var(--text-2)" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatValue(v, pct)}
            </text>,
          );
      });
    }
  }
  return (
    <ChartSvg width={width} height={height} title={spec.title} desc={barDesc(spec)} onPointerLeave={() => { setHover(-1); setTip(null); }}>
      <ChartHeader layout={head} legend={legend} />
      <XAxisNumeric ticks={ticks.values} scale={xs} y0={top} y1={top + plotH} format={(t) => formatTick(t, ticks.step, pct)} title={spec.yLabel} titleY={height - 8} plotLeft={left} plotRight={width - right} />
      {hover >= 0 ? <rect x={left} y={yb.start(hover)} width={width - right - left} height={yb.bandwidth} fill="var(--surface-3)" opacity={0.55} /> : null}
      {bars}
      <line x1={x0} x2={x0} y1={top} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
      {catLabels.map((l, c) => (
        <text key={c} x={left - 8} y={yb.center(c) + 3.5} fontSize={FS_TICK} textAnchor="end" fill="var(--text-2)">
          {l}
        </text>
      ))}
      {spec.xLabel ? (
        <text transform={`translate(12,${top + plotH / 2}) rotate(-90)`} fontSize={FS_AXIS} textAnchor="middle" fill="var(--text-2)">
          {fit(spec.xLabel, Math.max(40, plotH), FS_AXIS)}
        </text>
      ) : null}
      {spec.categories.map((cat, c) => (
        <Fragment key={`hit${c}`}>
          <rect
            x={0}
            y={yb.start(c)}
            width={width}
            height={yb.bandwidth}
            fill="transparent"
            tabIndex={0}
            className="chart-hit"
            aria-label={`${cat}: ${spec.series.map((s) => `${S > 1 ? s.name + ' ' : ''}${formatValue(s.values[c], pct)}`).join(', ')}`}
            onPointerMove={(e) => {
              setHover(c);
              const r = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
              setTip({ x: e.clientX - r.left, y: e.clientY - r.top, content: tipFor(c) });
            }}
            onFocus={(e) => {
              setHover(c);
              const svg = e.currentTarget.ownerSVGElement as SVGSVGElement;
              const scale = svg.getBoundingClientRect().width / width;
              setTip({ x: (left + 20) * scale, y: yb.center(c) * scale, content: tipFor(c) });
            }}
            onBlur={() => { setHover(-1); setTip(null); }}
          />
        </Fragment>
      ))}
    </ChartSvg>
  );
}
