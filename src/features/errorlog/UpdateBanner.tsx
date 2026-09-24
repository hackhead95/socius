// The calm "Socius was updated" banner (see update.ts): shown when a code file of the old version
// could not be loaded, with a Reload button, instead of a broken feature.
import { Icon } from '../../ui/Icon';
import { dismissUpdateNotice, reloadForUpdate, useUpdateNotice } from './update';
import './errorlog.css';

export function UpdateBanner() {
  const notice = useUpdateNotice();
  if (!notice) return null;
  return (
    <div className="update-banner" role="status" aria-live="polite">
      <Icon name="info" size={15} />
      {notice === 'updated' ? (
        <span>Socius was updated. Reload to get the new version. Your work is autosaved in this browser.</span>
      ) : (
        <span>Part of Socius could not be loaded, even after reloading. Check your internet connection, then reload.</span>
      )}
      <button type="button" className="btn btn-sm btn-primary" onClick={() => void reloadForUpdate()}>Reload</button>
      <button type="button" className="btn btn-sm btn-ghost btn-icon" onClick={dismissUpdateNotice} aria-label="Dismiss"><Icon name="x" size={13} /></button>
    </div>
  );
}
