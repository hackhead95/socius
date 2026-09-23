// Registry: store dialog { kind: 'transform', id } -> dialog component.
import type { ComponentType } from 'react';
import { useStore } from '../../core/store';
import type { Dataset } from '../../core/types';
import { ComputeDialog } from './ComputeDialog';
import { RecodeDialog } from './RecodeDialog';
import { AutoRecodeDialog, CountDialog, RankDialog, ReverseDialog, ScaleDialog, StandardizeDialog } from './DeriveDialogs';
import { BinningDialog, SelectCasesDialog, SortDialog, WeightDialog } from './CasesDialogs';
import { AggregateDialog, MergeCasesDialog, MergeVariablesDialog } from './MergeDialogs';

type DialogProps = { ds: Dataset; onClose: () => void; params?: Record<string, unknown> };

const DIALOGS: Record<string, ComponentType<DialogProps>> = {
  compute: ComputeDialog,
  'recode-same': (p) => <RecodeDialog {...p} mode="same" />,
  'recode-different': (p) => <RecodeDialog {...p} mode="different" />,
  autorecode: AutoRecodeDialog,
  reverse: ReverseDialog,
  scale: ScaleDialog,
  standardize: StandardizeDialog,
  binning: BinningDialog,
  count: CountDialog,
  rank: RankDialog,
  select: SelectCasesDialog,
  weight: WeightDialog,
  sort: SortDialog,
  'merge-cases': MergeCasesDialog,
  'merge-variables': MergeVariablesDialog,
  aggregate: AggregateDialog,
};

export function hasTransformDialog(id: string): boolean {
  return id in DIALOGS;
}

export function TransformDialog({ id, params, onClose }: { id: string; params?: Record<string, unknown>; onClose: () => void }) {
  const ds = useStore((s) => s.dataset);
  const C = DIALOGS[id];
  if (!C || !ds) return null;
  return <C ds={ds} onClose={onClose} params={params} />;
}
