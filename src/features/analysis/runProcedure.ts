// Running a procedure from its dialog without freezing the page.
//
// Small analyses run directly (they finish in milliseconds and need no copy of the data). Larger ones
// run in a Web Worker (procedure.worker.ts): the dataset is copied to the worker, the procedure runs
// there, and the finished OutputItem (plain JSON) comes back. The dialog shows elapsed time and can
// stop a background run. When a worker is not available (older browsers, the single-file build, a
// procedure registered at run time, a worker that fails to load) the procedure runs directly, as before.

import type { Dataset } from '../../core/types';
import type { OutputItem } from '../../core/output';
import type { OptionValues, ProcedureDef, SlotValues } from '../../core/procedure';
import { getProcedure, procedures } from '../../procedures';

export interface RunRequest {
  id: string;
  dataset: Dataset;
  slots: SlotValues;
  options: OptionValues;
}

export type RunResponse = { ok: true; item: OutputItem } | { ok: false; message: string; name: string };

/** The worker's side: run the procedure and report the result or the error message. */
export function handleRunRequest(req: RunRequest): RunResponse {
  const def = getProcedure(req.id);
  if (!def) return { ok: false, name: 'Error', message: `Unknown analysis "${req.id}".` };
  try {
    return { ok: true, item: def.run(req.dataset, req.slots, req.options) };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { ok: false, name: err.name, message: err.message };
  }
}

/** Data cells (cases x variables used) from which a run goes to the worker. */
export const BACKGROUND_MIN_CELLS = 50_000;

/** Whether this run is worth doing in the background. */
export function runsInBackground(def: ProcedureDef, ds: Dataset, slots: SlotValues): boolean {
  if (typeof Worker === 'undefined') return false;
  // Only procedures the worker can look up itself (not ones registered at run time, e.g. in tests).
  if (!procedures.includes(def)) return false;
  const nVars = Math.max(1, Object.values(slots).reduce((s, ids) => s + (ids?.length ?? 0), 0));
  return ds.nCases * nVars >= BACKGROUND_MIN_CELLS;
}

export interface ProcedureRun {
  /** Resolves with the output, rejects with an Error carrying the procedure's own message. */
  result: Promise<OutputItem>;
  /** True while the run happens in a worker (the page stays responsive and the run can be stopped). */
  background: boolean;
  /** Stop a background run (the promise rejects with a StoppedError). */
  stop: () => void;
}

export class StoppedError extends Error {
  constructor() {
    super('The analysis was stopped.');
    this.name = 'StoppedError';
  }
}

function runDirect(def: ProcedureDef, ds: Dataset, slots: SlotValues, options: OptionValues): Promise<OutputItem> {
  try {
    return Promise.resolve(def.run(ds, slots, options));
  } catch (e) {
    return Promise.reject(e);
  }
}

function makeWorker(): Worker {
  // Keep this exact form: Vite recognises `new Worker(new URL(..., import.meta.url))` and bundles the worker.
  return new Worker(new URL('./procedure.worker.ts', import.meta.url), { type: 'module' });
}

/** Start a run: in a worker when that is worthwhile and possible, otherwise directly. */
export function startProcedureRun(def: ProcedureDef, ds: Dataset, slots: SlotValues, options: OptionValues): ProcedureRun {
  if (!runsInBackground(def, ds, slots)) return { result: runDirect(def, ds, slots, options), background: false, stop: () => undefined };
  let worker: Worker;
  try {
    worker = makeWorker();
  } catch {
    return { result: runDirect(def, ds, slots, options), background: false, stop: () => undefined };
  }
  let settle: { resolve: (i: OutputItem) => void; reject: (e: unknown) => void } | null = null;
  let answered = false;
  const result = new Promise<OutputItem>((resolve, reject) => (settle = { resolve, reject }));
  const finish = () => {
    worker.terminate();
  };
  worker.onmessage = (e: MessageEvent<RunResponse>) => {
    answered = true;
    finish();
    const r = e.data;
    if (r.ok) settle!.resolve(r.item);
    else {
      const err = new Error(r.message);
      err.name = r.name;
      settle!.reject(err);
    }
  };
  // A worker that cannot load (or crashes) never answers: run directly instead, as before.
  const fallback = () => {
    if (answered) return;
    answered = true;
    finish();
    runDirect(def, ds, slots, options).then(settle!.resolve, settle!.reject);
  };
  worker.onerror = (e) => {
    e.preventDefault?.();
    fallback();
  };
  worker.onmessageerror = fallback;
  try {
    worker.postMessage({ id: def.id, dataset: ds, slots, options } satisfies RunRequest);
  } catch {
    fallback(); // the dataset could not be copied to the worker
  }
  return {
    result,
    background: true,
    stop: () => {
      if (answered) return;
      answered = true;
      finish();
      settle!.reject(new StoppedError());
    },
  };
}
