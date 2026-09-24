// Error boundaries: a render error shows a friendly screen instead of a white page, and is written to
// the error log (Help > Error log).
// - AppErrorBoundary (main.tsx): the whole app; "Something went wrong" with Reload and Copy error report.
// - PanelBoundary (App.tsx): one main view; the other tabs keep working.
// - GuardedDialogs (App.tsx): a failing dialog closes with a message instead of taking the app down.
// - QuietBoundary: hides a failing extra (the assistant panel) and says so.
import { Component, useState, type ErrorInfo, type ReactNode } from 'react';
import { useStore } from '../core/store';
import { copyToClipboard } from '../platform/host';
import { componentStackText, formatReport, logError } from '../platform/errorlog';
import { copyErrorReport, openErrorLog, prefilledFeedbackUrl } from '../features/errorlog/actions';
import { FEEDBACK_URL } from './links';
import '../features/errorlog/errorlog.css';

/** React's component stack, component names only (no file URLs or data). */
function componentStack(info: ErrorInfo | undefined): string | undefined {
  return componentStackText(info?.componentStack);
}

interface BoundaryProps {
  children: ReactNode;
  /** What this boundary guards, logged as the operation ("app", "tab:output", "dialog"...). */
  op: string;
  fallback: (error: unknown, reset: () => void) => ReactNode;
  onError?: (error: unknown) => void;
  /** When this value changes, a failed boundary tries its children again. */
  resetKey?: unknown;
}

interface BoundaryState {
  error: unknown;
  failed: boolean;
}

export class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, failed: false };
  /** This boundary logs what it catches (with its `op`), so the root's onCaughtError leaves it alone. */
  readonly logsOwnErrors = true;

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error, failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    logError('ui', error, { op: this.props.op }, componentStack(info));
    try {
      this.props.onError?.(error);
    } catch {
      /* the fallback still shows */
    }
  }

  componentDidUpdate(prev: BoundaryProps): void {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.reset();
  }

  reset = (): void => {
    this.setState({ error: null, failed: false });
  };

  render(): ReactNode {
    if (this.state.failed) return this.props.fallback(this.state.error, this.reset);
    return this.props.children;
  }
}

// ---------- the whole app ----------

export function CrashScreen() {
  const [copied, setCopied] = useState<boolean | null>(null);
  let reportUrl = FEEDBACK_URL;
  try {
    reportUrl = prefilledFeedbackUrl(FEEDBACK_URL, true);
  } catch {
    /* plain feedback address */
  }
  return (
    <div className="crash" role="alert">
      <div className="crash-card">
        <h1>Something went wrong</h1>
        <p>Socius ran into a problem it could not recover from, so this page stopped. The problem was written to the error log.</p>
        <p><b>Your work is autosaved in this browser.</b> Reload the page to continue where you left off (changes from the last few seconds may be missing).</p>
        <div className="row">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
          <button className="btn" onClick={async () => setCopied(await copyToClipboard(formatReport()))}>Copy error report</button>
          <a className="btn btn-ghost" href={reportUrl} target="_blank" rel="noopener noreferrer">Report the problem</a>
        </div>
        {copied === true ? <p role="status">Error report copied. Paste it into your message; it contains no data values, variable names or keys.</p> : null}
        {copied === false ? <p role="status">Copy failed: your browser did not allow clipboard access. After reloading, use Help &gt; Error log &gt; Download report.</p> : null}
      </div>
    </div>
  );
}

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary op="app" fallback={() => <CrashScreen />}>{children}</ErrorBoundary>;
}

// ---------- one main view ----------

const VIEW_NAMES: Record<string, string> = { data: 'Data View', variables: 'Variable View', output: 'Output', coding: 'Text coding' };

export function PanelBoundary({ name, children }: { name: string; children: ReactNode }) {
  return (
    <ErrorBoundary
      op={`tab:${name}`}
      resetKey={name}
      fallback={(_e, reset) => (
        <div className="crash-panel" role="alert">
          <h2>{VIEW_NAMES[name] ?? 'This view'} stopped working</h2>
          <p>Socius hit a problem showing this view. The other tabs and your data are not affected, and your work is autosaved. The details are in Help &gt; Error log.</p>
          <div className="row">
            <button className="btn btn-primary" onClick={reset}>Try again</button>
            <button className="btn" onClick={() => void copyErrorReport()}>Copy error report</button>
            <button className="btn btn-ghost" onClick={openErrorLog}>Open the error log</button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// ---------- dialogs and extras ----------

function tell(text: string) {
  try {
    useStore.getState().toast(text, 'error');
  } catch {
    /* no store */
  }
}

/** A dialog that fails to render is closed with a message; the next dialog opens normally. */
export function GuardedDialogs({ children }: { children: ReactNode }) {
  const dialog = useStore((s) => s.dialog);
  return (
    <ErrorBoundary
      op={`dialog:${dialog ? `${dialog.kind}/${dialog.id}` : 'none'}`}
      resetKey={dialog}
      fallback={() => null}
      onError={() => {
        useStore.getState().closeDialog();
        tell('That dialog stopped working because of an error, so it was closed. Your data is not affected. Details are in Help > Error log.');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/** Hide a failing extra part of the page (until reload) and say so. */
export function QuietBoundary({ op, message, children }: { op: string; message: string; children: ReactNode }) {
  return (
    <ErrorBoundary op={op} fallback={() => null} onError={() => tell(message)}>
      {children}
    </ErrorBoundary>
  );
}
