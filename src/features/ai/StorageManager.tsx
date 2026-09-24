// Browser storage: what Socius keeps in this browser (downloaded on-device AI models, projects and
// autosave, the error log and settings), how much room is left, deleting downloaded models, and asking
// the browser to keep the data. Shown in AI settings (On this computer), in Help > About and in the
// "Browser storage" dialog that the "storage is full" banner opens.
//
// All GitHub Pages sites on hackhead95.github.io share one browser storage allowance, so "Other data
// at this address" can belong to other sites there.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { Modal } from '../../ui/Modal';
import {
  deleteAllStoredModels, deleteStoredModel, estimateStorage, formatBytes, freeBytes, listWebLlmStorage, localStorageBytes, requestPersist, storagePersisted, type StorageEstimate, type WebLlmStorage,
} from '../../platform/ai-storage';
import { deleteWebLlmModelId } from '../../platform/ai-webllm';
import { refreshAiStatus } from '../../platform/ai';
import { getAutosaveState, retryAutosaveNow, subscribeAutosave } from '../project/persistence';
import './ai.css';
import { formatTime } from '../../core/format-date';

interface Snapshot {
  est: StorageEstimate;
  models: WebLlmStorage;
  persisted: boolean | null;
  local: { total: number; errorLog: number };
}

async function snapshot(): Promise<Snapshot> {
  const [est, models, persisted] = await Promise.all([estimateStorage(), listWebLlmStorage(), storagePersisted()]);
  return { est, models, persisted, local: localStorageBytes() };
}

/** Autosave state (paused because storage is full?), for React. */
export function useAutosaveState() {
  return useSyncExternalStore(subscribeAutosave, getAutosaveState, getAutosaveState);
}

export function StorageManager({ compact = false, onChanged }: { compact?: boolean; onChanged?: () => void }) {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const autosave = useAutosaveState();

  const reload = useCallback(async () => {
    setSnap(await snapshot());
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);

  const afterDelete = async (what: string) => {
    const saved = await retryAutosaveNow();
    await reload();
    void refreshAiStatus();
    onChanged?.();
    setNote(`${what}${autosave.paused ? (saved ? ' Autosave works again.' : ' Autosave is still paused: the browser still reports too little space.') : ''}`);
  };

  const removeOne = async (id: string, label: string) => {
    setBusy(id);
    try {
      await deleteWebLlmModelId(id).catch(() => deleteStoredModel(id));
    } finally {
      setBusy(null);
    }
    await afterDelete(`Deleted ${label}.`);
  };

  const removeAll = async () => {
    setBusy('all');
    try {
      await deleteAllStoredModels();
    } finally {
      setBusy(null);
    }
    await afterDelete('Deleted all downloaded AI models.');
  };

  const keep = async () => {
    const ok = await requestPersist();
    await reload();
    setNote(ok ? 'The browser will keep Socius\'s data when disk space runs low.' : 'The browser did not agree to keep the data permanently (browsers decide this themselves, often after you use a site for a while or bookmark it).');
  };

  if (!snap) return <p className="help" data-testid="storage-manager">Checking this browser's storage…</p>;
  const { est, models, persisted, local } = snap;
  const free = freeBytes(est);
  const idb = est.details?.indexedDB;
  const known = models.totalBytes + (idb ?? 0) + local.total;
  const other = est.usage !== null ? Math.max(0, est.usage - known) : null;
  const low = free !== null && free < 300e6;

  return (
    <section className="stack storage-manager" data-testid="storage-manager" aria-label="Browser storage" style={{ gap: 8 }}>
      <p className="help" data-testid="storage-total">
        {est.usage !== null && est.quota !== null ? (
          <>
            This site uses <b>{formatBytes(est.usage)}</b> of the <b>{formatBytes(est.quota)}</b> the browser allows here; <b className={low ? 'text-bad' : undefined}>{formatBytes(free)} free</b>.
          </>
        ) : (
          'This browser does not say how much storage this site may use.'
        )}{' '}
        {compact ? null : 'All sites at hackhead95.github.io share this allowance.'}
      </p>
      {autosave.paused ? (
        <div className="callout callout-warn" role="note">Autosave is paused because browser storage is full. Delete downloaded AI models below, or save your project to a file.</div>
      ) : null}
      <table className="storage-table">
        <tbody>
          {models.models.map((m) => (
            <tr key={m.id} data-testid="storage-model">
              <th scope="row">
                AI model: {m.label ?? m.id}
                {m.label ? <span className="help mono"> {m.id}</span> : null}
                {m.complete === false ? <span className="badge">partly downloaded</span> : null}
              </th>
              <td className="num">{formatBytes(m.bytes)}</td>
              <td>
                <button type="button" className="btn btn-sm" disabled={!!busy} onClick={() => void removeOne(m.id, m.label ?? m.id)}>
                  {busy === m.id ? 'Deleting…' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
          {!models.models.length ? (
            <tr>
              <th scope="row">Downloaded AI models</th>
              <td className="num">{models.totalBytes ? formatBytes(models.totalBytes) : 'none'}</td>
              <td />
            </tr>
          ) : null}
          {models.otherBytes > 0 ? (
            <tr>
              <th scope="row">On-device AI program files</th>
              <td className="num">{formatBytes(models.otherBytes)}</td>
              <td />
            </tr>
          ) : null}
          <tr>
            <th scope="row">Projects and autosave</th>
            <td className="num">{idb !== undefined ? formatBytes(idb) : 'included in the total'}</td>
            <td />
          </tr>
          <tr>
            <th scope="row">Error log and settings</th>
            <td className="num">{formatBytes(local.total)}</td>
            <td />
          </tr>
          {other !== null && other > 1e6 && !compact ? (
            <tr>
              <th scope="row">Other data at this address (other sites at hackhead95.github.io, browser overhead)</th>
              <td className="num">{formatBytes(other)}</td>
              <td />
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {models.models.length || models.totalBytes ? (
          <button type="button" className="btn btn-sm" disabled={!!busy} onClick={() => void removeAll()} data-testid="storage-delete-all">
            {busy === 'all' ? 'Deleting…' : 'Delete downloaded AI models'}
          </button>
        ) : null}
        <button type="button" className="btn btn-sm btn-ghost" disabled={!!busy} onClick={() => void reload().then(() => setNote(`Checked again at ${formatTime(Date.now())}.`))}>Check again</button>
        <span className="help">
          Kept when disk space runs low: {persisted === true ? 'yes' : persisted === false ? 'no, the browser may clear it' : 'unknown'}.{' '}
          {persisted === false ? (
            <button type="button" className="linkish" onClick={() => void keep()}>Ask the browser to keep it</button>
          ) : null}
        </span>
      </div>
      {note ? <p className="help" role="status">{note}</p> : null}
    </section>
  );
}

// ---------- the "Browser storage" dialog ----------

export const useStorageDialog = create<{ open: boolean; set: (open: boolean) => void }>((set) => ({ open: false, set: (open) => set({ open }) }));

export function openStorageManager(): void {
  useStorageDialog.setState({ open: true });
}

export function StorageDialogHost() {
  const open = useStorageDialog((s) => s.open);
  const set = useStorageDialog((s) => s.set);
  if (!open) return null;
  return (
    <Modal
      title="Browser storage"
      subtitle="What Socius keeps in this browser, and how to free space."
      onClose={() => set(false)}
      footer={
        <>
          <span className="spacer" />
          <button className="btn btn-primary" onClick={() => set(false)}>Close</button>
        </>
      }
    >
      <StorageManager />
    </Modal>
  );
}
