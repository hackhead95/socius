// Output model. Every analysis produces one OutputItem made of blocks (tables, charts, text).
// Procedures build these; the Output viewer renders them; exporters turn them into Word/HTML/Excel.
// Keep blocks declarative and serialisable (plain JSON: no functions, no typed arrays).

/** How a numeric cell is shown. The renderer owns the exact formatting rules. */
export type CellFormat =
  | 'int' // 1,234
  | 'dec1' | 'dec2' | 'dec3' | 'dec4'
  | 'pct' // value is already a percentage (e.g. 45.2 -> "45.2%"), 1 decimal
  | 'p' // p-value, APA style: ".032", "< .001"; never "0.000"
  | 'coef' // 3 decimals, drop leading zero NOT applied (coefficients can exceed 1)
  | 'r' // correlation-like bounded statistic: 3 decimals, APA leading-zero drop (".45")
  | 'text';

export interface Cell {
  /** null renders as empty; NaN renders as "." (SPSS convention for not computable). */
  v: number | string | null;
  fmt?: CellFormat;
  /** Significance marker appended (e.g. "*", "**", "a"). */
  mark?: string;
  bold?: boolean;
  italic?: boolean;
  colSpan?: number;
  rowSpan?: number;
  /** Visual emphasis for noteworthy cells (e.g. significant p). */
  tone?: 'good' | 'warn' | 'bad' | 'muted';
  /** Indent level for row headers (0 = none). */
  indent?: number;
  align?: 'left' | 'right' | 'center';
}

export interface OutputTable {
  title: string;
  subtitle?: string;
  /**
   * Header rows (top to bottom). Use colSpan/rowSpan for nested headers, like SPSS pivot tables.
   * The first `stubColumns` columns are row-header columns.
   */
  header: Cell[][];
  /** Body rows. Row-header cells come first (may use rowSpan for grouped rows). */
  rows: Cell[][];
  /** Number of leading row-header columns (rendered left-aligned, as th). Default 1. */
  stubColumns?: number;
  /** Indices of body rows to render with a top rule (e.g. before a "Total" row). */
  ruleBefore?: number[];
  footnotes?: string[];
}

export type ChartSpec =
  | {
      type: 'bar';
      title: string;
      xLabel?: string;
      yLabel?: string;
      /** Categories along the axis. */
      categories: string[];
      /** One series = simple bar; several = clustered (or stacked when `stacked`). */
      series: Array<{ name: string; values: number[] }>;
      stacked?: boolean;
      /** Show values as percentages (values are already %). */
      percent?: boolean;
      horizontal?: boolean;
      /** Optional error bars per series per category: [lo, hi]. */
      errors?: Array<Array<[number, number] | null>>;
    }
  | {
      type: 'histogram';
      title: string;
      xLabel?: string;
      yLabel?: string;
      /** Bin edges length = counts.length + 1. */
      edges: number[];
      counts: number[];
      /** Overlay normal curve with this mean/sd/n (scaled to counts). */
      normal?: { mean: number; sd: number; n: number };
    }
  | {
      type: 'box';
      title: string;
      xLabel?: string;
      yLabel?: string;
      groups: Array<{
        name: string;
        min: number; q1: number; median: number; q3: number; max: number; // whisker ends = min/max of non-outliers
        mean?: number;
        outliers: Array<{ value: number; caseIndex?: number; extreme?: boolean }>;
        n: number;
      }>;
    }
  | {
      type: 'scatter';
      title: string;
      xLabel: string;
      yLabel: string;
      /** Points; optional group name for colouring. Keep <= 20k points. */
      points: Array<{ x: number; y: number; group?: string }>;
      /** Fit line y = a + b x drawn across the x-range. */
      fit?: { a: number; b: number; r2?: number };
    }
  | {
      type: 'line';
      title: string;
      xLabel?: string;
      yLabel?: string;
      categories: string[];
      series: Array<{ name: string; values: Array<number | null> }>;
    }
  | {
      type: 'pie';
      title: string;
      slices: Array<{ name: string; value: number }>;
    }
  | {
      type: 'heatmap';
      title: string;
      rowLabels: string[];
      colLabels: string[];
      /** values[r][c]; null = blank. */
      values: Array<Array<number | null>>;
      /** 'diverging' centres on 0 (correlations); 'sequential' from 0 up (counts). */
      scale: 'diverging' | 'sequential';
      min?: number;
      max?: number;
    };

export type OutputBlock =
  | { kind: 'table'; table: OutputTable }
  | { kind: 'chart'; chart: ChartSpec }
  | {
      kind: 'text';
      /**
       * 'interpretation' = plain-language summary of what the result means (shown prominently);
       * 'apa' = an APA 7 results sentence the user can paste into a paper;
       * 'note' = neutral info; 'warning' = assumption violated or result unreliable.
       */
      style: 'interpretation' | 'apa' | 'note' | 'warning';
      text: string;
    }
  | { kind: 'heading'; text: string };

export interface OutputItem {
  id: string;
  /** ProcedureDef.id that produced it (or 'log', 'transform', 'coding'). */
  procedure: string;
  title: string;
  createdAt: number;
  /** Name of the dataset analysed. */
  datasetName?: string;
  /** Equivalent SPSS syntax, for reproducibility and for users who also work in SPSS. */
  syntax?: string;
  /** Short summary of the case base, e.g. "N = 1,204 (weighted by wt_design); 12 excluded (missing)". */
  caseNote?: string;
  blocks: OutputBlock[];
}

/** Small helpers so procedures read well. */
export const cell = (v: Cell['v'], fmt?: CellFormat, extra: Partial<Cell> = {}): Cell => ({ v, fmt, ...extra });
export const hcell = (v: string, extra: Partial<Cell> = {}): Cell => ({ v, fmt: 'text', ...extra });
