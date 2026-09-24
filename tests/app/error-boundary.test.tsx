// @vitest-environment jsdom
// Error boundaries and the error log UI: a render error shows a friendly screen (not a white page) and
// is logged; one broken view does not take down the others; a broken dialog closes; the Error log
// dialog lists entries; the feedback form address carries a short summary.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { AppErrorBoundary, GuardedDialogs, PanelBoundary } from '../../src/app/ErrorBoundary';
import { __resetErrorLogForTests, getLog, logError, unseenErrorCount } from '../../src/platform/errorlog';
import { useStore } from '../../src/core/store';
import { ErrorLogDialog } from '../../src/features/errorlog/ErrorLogDialog';
import { feedbackFormUrl, MAX_FEEDBACK_URL, reportFileName } from '../../src/features/errorlog/actions';
import { FALLBACK_FEEDBACK_URL } from '../../src/app/links';

function Boom({ what = 'kaboom' }: { what?: string }): never {
  throw new TypeError(`Cannot read properties of undefined (reading '${what}')`);
}

let consoleSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  localStorage.clear();
  __resetErrorLogForTests();
  // React reports caught render errors on the console; keep the test output readable.
  consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  consoleSpy.mockRestore();
  useStore.setState({ dialog: null, toasts: [] });
});

describe('error boundaries', () => {
  it('the app boundary shows "Something went wrong" with Reload and Copy error report, and logs the error', () => {
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy error report' })).toBeTruthy();
    expect(screen.getByText(/Your work is autosaved/)).toBeTruthy();
    const e = getLog()[0];
    expect(e).toMatchObject({ level: 'error', area: 'ui', context: { op: 'app' } });
    expect(e.message).toBe("Cannot read properties of undefined (reading '…')");
    expect(e.detail).toContain('Type: TypeError');
    expect(e.detail).toContain('Component stack:');
    expect(e.detail).toContain('Boom');
    expect(unseenErrorCount()).toBe(1);
  });

  it('a broken view shows its own message; the rest of the app keeps working and Try again re-renders', () => {
    function Harness() {
      const [broken, setBroken] = useState(true);
      return (
        <div>
          <button onClick={() => setBroken(false)}>fix</button>
          <PanelBoundary name="output">{broken ? <Boom /> : <p>Output is back</p>}</PanelBoundary>
          <p>Top bar still here</p>
        </div>
      );
    }
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Output stopped working' })).toBeTruthy();
    expect(screen.getByText('Top bar still here')).toBeTruthy();
    fireEvent.click(screen.getByText('fix'));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('Output is back')).toBeTruthy();
    expect(getLog()[0].context?.op).toBe('tab:output');
  });

  it('a dialog that fails to render is closed with a message, and the next dialog opens', () => {
    function Host() {
      const d = useStore((s) => s.dialog);
      if (!d) return null;
      return d.id === 'bad' ? <Boom /> : <p>Good dialog</p>;
    }
    act(() => useStore.getState().openDialog({ kind: 'custom', id: 'bad' }));
    render(
      <GuardedDialogs>
        <Host />
      </GuardedDialogs>,
    );
    expect(useStore.getState().dialog).toBeNull();
    expect(useStore.getState().toasts.at(-1)?.text).toMatch(/dialog stopped working/);
    expect(getLog()[0].context?.op).toBe('dialog:custom/bad');
    act(() => useStore.getState().openDialog({ kind: 'custom', id: 'good' }));
    expect(screen.getByText('Good dialog')).toBeTruthy();
  });
});

describe('Error log dialog', () => {
  it('lists entries newest first with filters and details, and opening it clears the new-errors count', () => {
    logError('import', new Error('Could not open the file.'));
    logError('ai', Object.assign(new Error('The AI service answered 500.'), { code: 'unavailable' }));
    expect(unseenErrorCount()).toBe(2);
    render(<ErrorLogDialog onClose={() => undefined} />);
    const items = document.querySelectorAll('.errlog-item');
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('The AI service answered 500.');
    expect(items[0].querySelector('.errlog-detail')?.textContent).toContain('Code: unavailable');
    expect(unseenErrorCount()).toBe(0);
    fireEvent.change(screen.getByLabelText('Filter by area'), { target: { value: 'import' } });
    expect(document.querySelectorAll('.errlog-item')).toHaveLength(1);
    // Clear asks in the page first.
    fireEvent.click(screen.getByRole('button', { name: 'Clear log...' }));
    expect(screen.getByText(/Clear all 2 entries/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear log' }));
    expect(getLog()).toHaveLength(0);
    expect(screen.getByText('No problems logged')).toBeTruthy();
  });
});

describe('feedback form address', () => {
  it('uses the bug report form with the browser and the summary filled in', () => {
    const url = feedbackFormUrl(FALLBACK_FEEDBACK_URL, 'Version: 0.1.0\nRecent problems: x', 'Mozilla/5.0 (Windows NT 10.0) Chrome/140.0 Safari/537.36');
    expect(url.startsWith('https://github.com/hackhead95/socius/issues/new?template=bug_report.yml')).toBe(true);
    const q = new URL(url).searchParams;
    expect(q.get('browser')).toBe('Chrome 140 on Windows');
    expect(q.get('error-report')).toBe('Version: 0.1.0\nRecent problems: x');
  });

  it('stays under the length limit', () => {
    const long = Array.from({ length: 200 }, (_, i) => `- problem ${i} ${'é'.repeat(40)}`).join('\n');
    const url = feedbackFormUrl(FALLBACK_FEEDBACK_URL, long);
    expect(url.length).toBeLessThanOrEqual(MAX_FEEDBACK_URL);
    expect(new URL(url).searchParams.get('error-report')).toContain('shortened');
  });

  it('leaves other addresses alone and names report files by date', () => {
    expect(feedbackFormUrl('https://example.org/feedback', 'x')).toBe('https://example.org/feedback');
    expect(reportFileName(new Date(2026, 8, 24, 9, 5))).toBe('socius-error-report-20260924-0905.txt');
  });
});
