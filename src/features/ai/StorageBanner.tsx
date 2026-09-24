// One banner when autosave is paused because browser storage is full (see persistence.ts), with the two
// ways out: free space (Browser storage, where downloaded AI models can be deleted) or save the project
// to a file. It goes away by itself when a save succeeds again.
import { useState } from 'react';
import { saveProject } from '../project/fileActions';
import { openStorageManager, useAutosaveState } from './StorageManager';
import './ai.css';

export function StorageFullBanner() {
  const st = useAutosaveState();
  const [hiddenSince, setHiddenSince] = useState<number | null>(null);
  if (!st.paused || (hiddenSince !== null && hiddenSince === st.since)) return null;
  return (
    <div className="storage-banner callout callout-warn" role="alert" data-testid="storage-full-banner">
      <span>
        <b>Browser storage is full, so autosave is paused.</b> Free space in AI settings (downloaded models) or save your project to a file.
      </span>
      <span className="storage-banner-actions">
        <button type="button" className="btn btn-sm btn-primary" onClick={openStorageManager}>Manage storage</button>
        <button type="button" className="btn btn-sm" onClick={() => void saveProject()}>Save project</button>
        <button type="button" className="btn btn-sm btn-ghost" aria-label="Hide this message" onClick={() => setHiddenSince(st.since)}>Hide</button>
      </span>
    </div>
  );
}
