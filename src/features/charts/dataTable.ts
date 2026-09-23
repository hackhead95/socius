// A plain table view of any chart's data (the accessible twin of the chart, also used by exports).
import type { ChartSpec } from '../../core/output';

export interface ChartData {
  columns: string[];
  rows: Array<Array<string | number | null>>;
}

export function chartDataTable(spec: ChartSpec): ChartData {
  switch (spec.type) {
    case 'bar': {
      const cols = [spec.xLabel || 'Category', ...spec.series.map((s) => (spec.series.length === 1 ? s.name || spec.yLabel || 'Value' : s.name))];
      const hasErr = !!spec.errors;
      if (hasErr) spec.series.forEach((s) => cols.push(`${spec.series.length === 1 ? '' : s.name + ' '}95% CI lower`, `${spec.series.length === 1 ? '' : s.name + ' '}95% CI upper`));
      return {
        columns: cols,
        rows: spec.categories.map((c, i) => {
          const r: Array<string | number | null> = [c, ...spec.series.map((s) => s.values[i] ?? null)];
          if (hasErr) spec.series.forEach((_, si) => { const e = spec.errors?.[si]?.[i]; r.push(e ? e[0] : null, e ? e[1] : null); });
          return r;
        }),
      };
    }
    case 'histogram':
      return {
        columns: ['From', 'To', spec.yLabel || 'Frequency'],
        rows: spec.counts.map((c, i) => [spec.edges[i], spec.edges[i + 1], c]),
      };
    case 'box':
      return {
        columns: ['Group', 'n', 'Lower whisker', 'Q1', 'Median', 'Q3', 'Upper whisker', 'Outliers'],
        rows: spec.groups.map((g) => [g.name, g.n, g.min, g.q1, g.median, g.q3, g.max, g.outliers.length]),
      };
    case 'scatter': {
      const grouped = spec.points.some((p) => p.group !== undefined);
      const pts = spec.points.slice(0, 500);
      return {
        columns: grouped ? [spec.xLabel, spec.yLabel, 'Group'] : [spec.xLabel, spec.yLabel],
        rows: pts.map((p) => (grouped ? [p.x, p.y, p.group ?? ''] : [p.x, p.y])),
      };
    }
    case 'line':
      return {
        columns: [spec.xLabel || 'Category', ...spec.series.map((s) => s.name)],
        rows: spec.categories.map((c, i) => [c, ...spec.series.map((s) => s.values[i] ?? null)]),
      };
    case 'pie': {
      const total = spec.slices.reduce((a, s) => a + (s.value > 0 ? s.value : 0), 0);
      return {
        columns: ['Part', 'Value', 'Percent'],
        rows: spec.slices.map((s) => [s.name, s.value, total ? (s.value / total) * 100 : null]),
      };
    }
    case 'heatmap':
      return { columns: ['', ...spec.colLabels], rows: spec.rowLabels.map((r, i) => [r, ...spec.values[i]]) };
    case 'pyramid':
      return {
        columns: [spec.yLabel || 'Group', spec.left.name, spec.right.name],
        rows: spec.groups.map((g, i) => [g, spec.left.values[i] ?? null, spec.right.values[i] ?? null]).reverse(),
      };
  }
}
