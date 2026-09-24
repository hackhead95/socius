// Hand-built responsive SVG charts for every ChartSpec type. Colours come from the --viz-* tokens,
// so both themes work; each chart has an accessible name/description and a hover/focus tooltip.
import { useState } from 'react';
import type { ChartSpec } from '../../core/output';
import { ChartTitleShown, Tooltip, useChartWidth, type Tip } from './common';
import { BarChart } from './BarChart';
import { HistogramChart } from './HistogramChart';
import { BoxChart } from './BoxChart';
import { ScatterChart } from './ScatterChart';
import { LineChart } from './LineChart';
import { PieChart } from './PieChart';
import { HeatmapChart } from './HeatmapChart';
import { PyramidChart } from './PyramidChart';
import './charts.css';

export interface ChartProps {
  spec: ChartSpec;
  /** Fixed pixel width (exports). Omit to fill the container. */
  width?: number;
  /**
   * Draw the title inside the chart (default). False when a caption above the chart already shows
   * it (APA "Figure N" + italic title), so the title is not printed twice.
   */
  showTitle?: boolean;
}

export function Chart({ spec, width: fixedWidth, showTitle = true }: ChartProps) {
  const [ref, width] = useChartWidth(fixedWidth);
  const [tip, setTip] = useState<Tip | null>(null);
  const w = Math.max(260, width);
  return (
    <div ref={ref} className="chart" data-chart-type={spec.type} style={fixedWidth ? { width: fixedWidth } : undefined}>
      <ChartTitleShown.Provider value={showTitle}>
        <ChartBody spec={spec} width={w} setTip={setTip} />
      </ChartTitleShown.Provider>
      <Tooltip tip={tip} width={w} />
    </div>
  );
}

function ChartBody({ spec, width, setTip }: { spec: ChartSpec; width: number; setTip: (t: Tip | null) => void }) {
  switch (spec.type) {
    case 'bar':
      return <BarChart spec={spec} width={width} setTip={setTip} />;
    case 'histogram':
      return <HistogramChart spec={spec} width={width} setTip={setTip} />;
    case 'box':
      return <BoxChart spec={spec} width={width} setTip={setTip} />;
    case 'scatter':
      return <ScatterChart spec={spec} width={width} setTip={setTip} />;
    case 'line':
      return <LineChart spec={spec} width={width} setTip={setTip} />;
    case 'pie':
      return <PieChart spec={spec} width={width} setTip={setTip} />;
    case 'heatmap':
      return <HeatmapChart spec={spec} width={width} setTip={setTip} />;
    case 'pyramid':
      return <PyramidChart spec={spec} width={width} setTip={setTip} />;
    default:
      return <div className="muted">This chart type is not supported.</div>;
  }
}
