// STUB — owned by the Analysis/Output agent.
import type { ChartSpec } from '../../core/output';
export function Chart(props: { spec: ChartSpec }) {
  return <div className="muted">{props.spec.title}</div>;
}
