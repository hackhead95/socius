// Turns a TransformResult into an output-log entry (procedure 'transform').

import type { OutputItem } from '../../core/output';
import { newId } from '../../core/types';
import type { TransformResult } from './dsops';

export function transformLogItem(r: TransformResult, datasetName?: string): OutputItem {
  return {
    id: newId('out'),
    procedure: 'transform',
    title: r.title,
    createdAt: Date.now(),
    datasetName,
    syntax: r.syntax,
    blocks: [
      { kind: 'text', style: 'note', text: r.summary },
      ...r.warnings.map((w) => ({ kind: 'text' as const, style: 'warning' as const, text: w })),
    ],
  };
}
