// Help > Error log...: what went wrong in this browser, newest first, with filters, details, copy,
// download and clear. Opening it clears the "new errors" dot on the Help menu.
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../ui/Modal';
import { clearLog, formatEntry, LOG_AREAS, logIsMemoryOnly, markLogSeen, SESSION_ID, type LogArea, type LogEntry, type LogLevel } from '../../platform/errorlog';
import { copyErrorReport, downloadErrorReport, openFeedback, useErrorLog } from './actions';
import './errorlog.css';
import { formatDateTime, formatTime } from '../../core/format-date';

const LEVEL_LABEL: Record<LogLevel, string> = { error: 'Error', warn: 'Warning', info: 'Info' };
const AREA_LABEL: Record<LogArea, string> = {
  ai: 'AI', import: 'Opening files', export: 'Saving files', analysis: 'Analyses', transform: 'Transform', coding: 'Text coding',
  assistant: 'Assistant', ui: 'App', storage: 'Browser storage', network: 'Network',
};

function when(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date().toDateString() === d.toDateString();
    return today ? formatTime(d) : formatDateTime(d);
  } catch {
    return iso;
  }
}

function EntryRow({ e }: { e: LogEntry }) {
  return (
    <li className={`errlog-item errlog-${e.level}`}>
      <details>
        <summary>
          <span className={`badge ${e.level === 'error' ? 'badge-bad' : e.level === 'warn' ? 'badge-warn' : 'badge-accent'} errlog-level`}>{LEVEL_LABEL[e.level]}</span>
          <span className="errlog-area">{AREA_LABEL[e.area] ?? e.area}</span>
          <span className="errlog-msg">{e.message}</span>
          <span className="errlog-time num" title={e.time}>
            {e.count && e.count > 1 ? <span className="errlog-count">x{e.count} </span> : null}
            {when(e.time)}
          </span>
        </summary>
        <pre className="errlog-detail">{formatEntry(e)}</pre>
      </details>
    </li>
  );
}

export function ErrorLogDialog({ onClose }: { onClose: () => void }) {
  const log = useErrorLog();
  const [level, setLevel] = useState<'all' | LogLevel>('all');
  const [area, setArea] = useState<'all' | LogArea>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    markLogSeen();
  }, [log]);

  const areas = useMemo(() => LOG_AREAS.filter((a) => log.some((e) => e.area === a)), [log]);
  const shown = log.filter((e) => (level === 'all' || e.level === level) && (area === 'all' || e.area === area));
  const nSession = log.filter((e) => e.session === SESSION_ID && e.level === 'error').length;

  const footer = confirmClear ? (
    <div className="errlog-confirm" role="alert">
      <span>Clear all {log.length} entries from this browser? This cannot be undone.</span>
      <button className="btn" onClick={() => setConfirmClear(false)}>Cancel</button>
      <button
        className="btn btn-danger"
        onClick={() => {
          clearLog();
          setConfirmClear(false);
        }}
      >
        Clear log
      </button>
    </div>
  ) : (
    <>
      <button className="btn btn-ghost errlog-clear" disabled={!log.length} onClick={() => setConfirmClear(true)}>Clear log...</button>
      <button className="btn" onClick={openFeedback}>Report a problem...</button>
      <button className="btn" onClick={() => void downloadErrorReport()}>Download report (.txt)</button>
      <button className="btn btn-primary" onClick={() => void copyErrorReport()}>Copy report</button>
    </>
  );

  return (
    <Modal
      title="Error log"
      subtitle="Problems Socius noticed in this browser, newest first. The log stays on this computer; nothing is sent anywhere."
      onClose={onClose}
      size="wide"
      footer={footer}
    >
      <div className="stack errlog">
        <p className="help">
          To report a problem, click <b>Copy report</b> and paste it into your message, or use <b>Report a problem</b>. The log never contains your data values, variable names or labels, file names, text excerpts or API keys.
          {logIsMemoryOnly() ? ' This browser does not allow storage, so the log is kept only until the page is closed.' : ''}
        </p>
        {log.length ? (
          <>
            <div className="row errlog-filters">
              <label className="row">
                <span className="help">Level</span>
                <select className="select input-sm" value={level} onChange={(ev) => setLevel(ev.target.value as 'all' | LogLevel)} aria-label="Filter by level">
                  <option value="all">All levels</option>
                  <option value="error">Errors</option>
                  <option value="warn">Warnings</option>
                  <option value="info">Info</option>
                </select>
              </label>
              <label className="row">
                <span className="help">Area</span>
                <select className="select input-sm" value={area} onChange={(ev) => setArea(ev.target.value as 'all' | LogArea)} aria-label="Filter by area">
                  <option value="all">All areas</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>{AREA_LABEL[a]}</option>
                  ))}
                </select>
              </label>
              <span className="help errlog-count-line">
                {shown.length === log.length ? `${log.length} ${log.length === 1 ? 'entry' : 'entries'}` : `${shown.length} of ${log.length} entries`}
                {nSession ? `, ${nSession} ${nSession === 1 ? 'error' : 'errors'} this session` : ''}
              </span>
            </div>
            {shown.length ? (
              <ul className="errlog-list" aria-label="Log entries">
                {shown.map((e) => <EntryRow key={e.id} e={e} />)}
              </ul>
            ) : (
              <p className="help">No entries match these filters.</p>
            )}
          </>
        ) : (
          <div className="empty errlog-empty">
            <h3>No problems logged</h3>
            <p>If something goes wrong, the details appear here so you can send them with your feedback.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
