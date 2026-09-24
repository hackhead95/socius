// Runs a built-in procedure off the main thread so the page stays responsive during long analyses.
// The dialog posts { id, dataset, slots, options }; the worker answers { ok: true, item } or
// { ok: false, message, name }. See runProcedure.ts for when the worker is used and the fallback.

import { handleRunRequest, type RunRequest } from './runProcedure';

self.onmessage = (e: MessageEvent<RunRequest>) => {
  (self as unknown as { postMessage: (m: unknown) => void }).postMessage(handleRunRequest(e.data));
};
