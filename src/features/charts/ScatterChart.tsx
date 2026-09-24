import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { PointIndex, extent, formatTick, formatValue, linear, niceTicks } from './scale';
import { ChartHeader, ChartSvg, FS_TICK, TipRow, XAxisNumeric, YAxis, headerLayout, maxLabelWidth, measureText, seriesColor, type LegendItem, type SetTip } from './common';

type ScatterSpec = Extract<ChartSpec, { type: 'scatter' }>;

/** Above this many points the dots are painted on a canvas layer instead of SVG circles. */
export const CANVAS_THRESHOLD = 3000;

export function scatterDesc(spec: ScatterSpec): string {
  const ex = extent(spec.points.map((p) => p.x));
  const ey = extent(spec.points.map((p) => p.y));
  let s = `Scatter plot of ${formatValue(spec.points.length)} cases: ${spec.yLabel} against ${spec.xLabel}.`;
  if (ex && ey) s += ` ${spec.xLabel} ranges from ${formatValue(ex[0])} to ${formatValue(ex[1])}; ${spec.yLabel} from ${formatValue(ey[0])} to ${formatValue(ey[1])}.`;
  if (spec.fit) s += ` Fitted line: ${spec.yLabel} = ${formatValue(spec.fit.a)} + ${formatValue(spec.fit.b)} x ${spec.xLabel}${spec.fit.r2 !== undefined ? `, R squared ${formatValue(spec.fit.r2, false, 3)}` : ''}.`;
  return s;
}

/** Bumps when the colour theme changes, so canvas layers repaint with the new token values. */
function useThemeVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bump = () => setV((x) => x + 1);
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', bump);
    const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(bump) : null;
    mo?.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => {
      mq?.removeEventListener?.('change', bump);
      mo?.disconnect();
    };
  }, []);
  return v;
}

export function ScatterChart({ spec, width, setTip }: { spec: ScatterSpec; width: number; setTip: SetTip }) {
  const [hover, setHover] = useState(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeV = useThemeVersion();
  const groups = useMemo(() => {
    const seen: string[] = [];
    const idx = new Map<string, number>();
    for (const g of spec.groups ?? []) {
      if (!idx.has(g)) {
        idx.set(g, seen.length);
        seen.push(g);
      }
    }
    for (const p of spec.points) {
      if (p.group !== undefined && !idx.has(p.group)) {
        idx.set(p.group, seen.length);
        seen.push(p.group);
      }
    }
    return { names: seen, idx };
  }, [spec.points, spec.groups]);
  const legend: LegendItem[] = groups.names.map((g, i) => ({ label: g, color: seriesColor(i), kind: 'dot' }));
  if (spec.fit && groups.names.length >= 2) legend.push({ label: 'Fit line (all cases)', color: 'var(--text)', kind: 'line' });
  const head = headerLayout(spec.title, legend, width);
  const n = spec.points.length;
  const useCanvas = n > CANVAS_THRESHOLD;

  const ex = extent(spec.points.map((p) => p.x)) ?? [0, 1];
  const ey = extent(spec.points.map((p) => p.y)) ?? [0, 1];
  const yt = niceTicks(ey[0], ey[1], 5);
  const left = Math.ceil(maxLabelWidth(yt.values.map((t) => formatTick(t, yt.step)))) + 10 + 20;
  const top = head.top + 4;
  const xt = niceTicks(ex[0], ex[1], Math.max(3, Math.min(8, Math.floor((width - left) / 80))));
  const right = Math.max(14, measureText(formatTick(xt.max, xt.step), FS_TICK) / 2 + 4);
  const plotH = Math.max(220, Math.min(340, Math.round((width - left - right) * 0.62)));
  const height = top + plotH + 46;
  const xs = linear(xt.min, xt.max, left, width - right);
  const ys = linear(yt.min, yt.max, top + plotH, top);
  const r = n > 1000 ? 2.5 : n > 300 ? 3.25 : 4;
  const alpha = n > 1000 ? 0.55 : n > 300 ? 0.75 : 0.9;

  const px = useMemo(() => {
    const X = new Float64Array(n);
    const Y = new Float64Array(n);
    spec.points.forEach((p, i) => {
      X[i] = xs(p.x);
      Y[i] = ys(p.y);
    });
    return { X, Y, index: new PointIndex(X, Y, 24) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec.points, width, xt.min, xt.max, yt.min, yt.max, top, plotH]);

  useLayoutEffect(() => {
    if (!useCanvas) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
    const w = width - left - right;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(plotH * dpr);
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const cs = getComputedStyle(cv);
    const colors = Array.from({ length: 8 }, (_, i) => cs.getPropertyValue(`--viz-${i + 1}`).trim() || '#2a78d6');
    const faint = cs.getPropertyValue('--faint').trim() || '#888';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, plotH);
    ctx.globalAlpha = alpha;
    const byColor = new Map<string, number[]>();
    spec.points.forEach((p, i) => {
      const gi = p.group !== undefined ? groups.idx.get(p.group) ?? 0 : 0;
      const c = gi < 8 ? colors[gi] : faint;
      const arr = byColor.get(c);
      if (arr) arr.push(i);
      else byColor.set(c, [i]);
    });
    for (const [c, idxs] of byColor) {
      ctx.fillStyle = c;
      ctx.beginPath();
      for (const i of idxs) {
        const x = px.X[i] - left;
        const y = px.Y[i] - top;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }, [useCanvas, px, width, left, right, plotH, top, r, alpha, themeV, groups, spec.points]);

  let fitLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (spec.fit && Number.isFinite(spec.fit.a) && Number.isFinite(spec.fit.b)) {
    // Clip the line to the plot rectangle.
    const f = (x: number) => spec.fit!.a + spec.fit!.b * x;
    let xa = ex[0];
    let xb = ex[1];
    const clipX = (yv: number) => (spec.fit!.b !== 0 ? (yv - spec.fit!.a) / spec.fit!.b : NaN);
    for (const bound of [yt.min, yt.max]) {
      const xc = clipX(bound);
      if (Number.isFinite(xc)) {
        if (f(xa) < yt.min || f(xa) > yt.max) if (xc > xa && xc < xb) xa = xc;
        if (f(xb) < yt.min || f(xb) > yt.max) if (xc < xb && xc > xa) xb = xc;
      }
    }
    fitLine = { x1: xs(xa), y1: ys(f(xa)), x2: xs(xb), y2: ys(f(xb)) };
  }

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / width;
    const sx = (e.clientX - rect.left) / scale;
    const sy = (e.clientY - rect.top) / scale;
    const i = px.index.nearest(sx, sy, 16);
    setHover(i);
    if (i < 0) {
      setTip(null);
      return;
    }
    const p = spec.points[i];
    const gi = p.group !== undefined ? groups.idx.get(p.group) ?? 0 : 0;
    setTip({
      x: px.X[i] * scale,
      y: px.Y[i] * scale,
      content: (
        <>
          {p.group !== undefined ? <div className="chart-tip-title">{p.group}</div> : null}
          <TipRow color={p.group !== undefined ? seriesColor(gi) : undefined} value={formatValue(p.y)} label={spec.yLabel} />
          <TipRow value={formatValue(p.x)} label={spec.xLabel} />
        </>
      ),
    });
  };

  const hp = hover >= 0 ? spec.points[hover] : null;
  const fitLabel = spec.fit?.r2 !== undefined ? `R² = ${formatValue(spec.fit.r2, false, 3).replace(/^0\./, '.')}` : null;

  const canvasEl = useCanvas ? (
    <canvas
      ref={canvasRef}
      data-chart-layer={`${left},${top},${width - left - right},${plotH}`}
      style={{ position: 'absolute', left: `${(left / width) * 100}%`, top: `${(top / height) * 100}%`, width: `${((width - left - right) / width) * 100}%`, height: `${(plotH / height) * 100}%`, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  ) : null;

  return (
    <div className="chart-scatter-wrap" style={{ position: 'relative', background: 'var(--surface)' }}>
      {canvasEl}
      <ChartSvg transparent={useCanvas} width={width} height={height} title={spec.title} desc={scatterDesc(spec)} onPointerMove={onMove} onPointerLeave={() => { setHover(-1); setTip(null); }}>
        <ChartHeader layout={head} legend={legend} />
        <YAxis ticks={yt.values} scale={ys} x0={left} x1={width - right} format={(t) => formatTick(t, yt.step)} title={spec.yLabel} titleX={12} plotTop={top} plotBottom={top + plotH} />
        <XAxisNumeric ticks={xt.values} scale={xs} y0={top} y1={top + plotH} format={(t) => formatTick(t, xt.step)} title={spec.xLabel} titleY={height - 8} plotLeft={left} plotRight={width - right} />
        <line x1={left} x2={width - right} y1={top + plotH} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} shapeRendering="crispEdges" />
        {useCanvas ? (
          <g data-canvas-slot={`${left},${top},${width - left - right},${plotH}`} />
        ) : (
          <g>
            {spec.points.map((p, i) => {
              const gi = p.group !== undefined ? groups.idx.get(p.group) ?? 0 : 0;
              return <circle key={i} cx={px.X[i]} cy={px.Y[i]} r={r} fill={seriesColor(gi)} fillOpacity={alpha} stroke="var(--surface)" strokeWidth={n > 300 ? 0.5 : 1} />;
            })}
          </g>
        )}
        {fitLine ? (
          <g>
            <line {...fitLine} stroke="var(--surface)" strokeWidth={4} strokeLinecap="round" />
            <line {...fitLine} stroke="var(--text)" strokeWidth={1.75} strokeLinecap="round" />
            {fitLabel ? (
              // Put R² in the plot corner the line does not reach (bottom right for a rising line, top
              // right for a falling one) so the label never sits on the line itself.
              <text x={width - right - 4} y={fitLine.y2 < fitLine.y1 ? top + plotH - 6 : top + 12} fontSize={FS_TICK} textAnchor="end" fill="var(--text)" paintOrder="stroke" stroke="var(--surface)" strokeWidth={3}>
                {fitLabel}
              </text>
            ) : null}
          </g>
        ) : null}
        {hp ? <circle cx={px.X[hover]} cy={px.Y[hover]} r={r + 3} fill="none" stroke="var(--text)" strokeWidth={1.5} /> : null}
      </ChartSvg>
    </div>
  );
}
