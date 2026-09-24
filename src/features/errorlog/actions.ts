// Error log and feedback actions shared by the Help menu, the top bar, About and the error screens.
import { useSyncExternalStore } from 'react';
import { useStore } from '../../core/store';
import { copyToClipboard, saveFile } from '../../platform/host';
import { describeBrowser, formatReport, formatSummary, getLog, subscribe, unseenErrorCount, type LogEntry } from '../../platform/errorlog';

export function openErrorLog(): void {
  useStore.getState().openDialog({ kind: 'custom', id: 'error-log' });
}

export function openFeedback(): void {
  useStore.getState().openDialog({ kind: 'custom', id: 'feedback' });
}

let snapshot: LogEntry[] = getLog();
let unseen = unseenErrorCount();
subscribe(() => {
  snapshot = getLog();
  unseen = unseenErrorCount();
});

/** The log, newest first; re-renders when it changes. */
export function useErrorLog(): LogEntry[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
}

/** Errors logged this session that the user has not looked at yet (the Help menu dot). */
export function useUnseenErrors(): number {
  return useSyncExternalStore(subscribe, () => unseen, () => 0);
}

/** Copy the whole report. Resolves true when the clipboard accepted it. */
export async function copyErrorReport(): Promise<boolean> {
  let ok = false;
  try {
    ok = await copyToClipboard(formatReport());
  } catch {
    ok = false;
  }
  try {
    useStore.getState().toast(ok ? 'Error report copied. Paste it into your message.' : 'Copy failed. Your browser did not allow clipboard access. Use Download report instead.', ok ? 'success' : 'error');
  } catch {
    /* store unavailable (error screen) */
  }
  return ok;
}

export function reportFileName(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `socius-error-report-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.txt`;
}

export async function downloadErrorReport(): Promise<void> {
  const name = reportFileName();
  const outcome = await saveFile(name, formatReport(), 'text/plain');
  const st = useStore.getState();
  if (outcome === 'saved') st.toast(`Saved ${name}.`, 'success');
  else if (outcome === 'declined') st.toast('Saving was cancelled.', 'info');
  else st.toast('Could not save the report. Use Copy report instead.', 'error');
}

/** Longest prefilled feedback address (GitHub and browsers cope with more, but some proxies do not). */
export const MAX_FEEDBACK_URL = 6000;

/**
 * The "Something is not working" form on GitHub with the browser and a short diagnostic summary
 * filled in. `feedbackUrl` is FEEDBACK_URL (…/issues/new/choose); anything else is returned as is.
 */
export function feedbackFormUrl(feedbackUrl: string, summary: string, ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''): string {
  const base = feedbackUrl.replace(/\/choose\/?$/, '');
  if (!/\/issues\/new$/.test(base)) return feedbackUrl;
  const make = (text: string) =>
    `${base}?template=bug_report.yml&browser=${encodeURIComponent(describeBrowser(ua))}${text ? `&error-report=${encodeURIComponent(text)}` : ''}`;
  let lines = summary.split('\n');
  let url = make(lines.join('\n'));
  while (url.length > MAX_FEEDBACK_URL && lines.length > 1) {
    lines = lines.slice(0, -1);
    url = make([...lines, '(shortened: use Copy report for the full error report)'].join('\n'));
  }
  return url.length > MAX_FEEDBACK_URL ? make('') : url;
}

/** The feedback form address with the diagnostic summary. */
export function prefilledFeedbackUrl(feedbackUrl: string, includeSummary: boolean): string {
  return feedbackFormUrl(feedbackUrl, includeSummary ? formatSummary(5) : '');
}
