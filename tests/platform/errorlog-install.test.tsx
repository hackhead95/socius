// @vitest-environment jsdom
// The running app's error capture (src/features/errorlog/install.ts): resources that fail to load,
// code files missing after an update (with the "Socius was updated" banner), and React's root error
// options (errors caught by other boundaries, uncaught and recovered errors).
import { Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { __resetErrorLogForTests, getLog } from '../../src/platform/errorlog';
import { describeResourceError, installErrorLog, reactRootErrorOptions } from '../../src/features/errorlog/install';
import { __resetUpdateNoticeForTests, getUpdateNotice, isChunkLoadError } from '../../src/features/errorlog/update';
import { UpdateBanner } from '../../src/features/errorlog/UpdateBanner';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

beforeAll(() => installErrorLog());
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  __resetErrorLogForTests();
  __resetUpdateNoticeForTests();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string>): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  document.body.appendChild(e);
  return e;
}

describe('resources that fail to load', () => {
  it('describes scripts and stylesheets as warnings and images as info, with the path only', () => {
    const s = describeResourceError(el('script', { src: '/socius/assets/index-Ab12.js?v=3' }));
    expect(s).toEqual({ level: 'warn', message: 'Could not load a script: /socius/assets/index-Ab12.js' });
    expect(describeResourceError(el('link', { rel: 'stylesheet', href: '/socius/assets/app.css' }))).toEqual({ level: 'warn', message: 'Could not load a stylesheet: /socius/assets/app.css' });
    expect(describeResourceError(el('link', { rel: 'modulepreload', href: '/socius/assets/chunk.js' }))?.level).toBe('warn');
    expect(describeResourceError(el('img', { src: '/socius/guide/shot.png' }))).toEqual({ level: 'info', message: 'Could not load an image: /socius/guide/shot.png' });
    expect(describeResourceError(el('img', { src: 'data:image/png;base64,AAAA' }))?.message).toBe('Could not load an image: (data address)');
    expect(describeResourceError(el('img', { src: 'https://example.org/p.png?token=abc123secret' }))?.message).toBe('Could not load an image: https://example.org/p.png');
    expect(describeResourceError(el('div', {}))).toBeNull();
    expect(describeResourceError(window)).toBeNull();
  });

  it('logs a failed script from the capture-phase error event', () => {
    const s = el('script', { src: '/socius/assets/lazy-Xy9.js' });
    s.dispatchEvent(new Event('error'));
    const e = getLog()[0];
    expect(e).toMatchObject({ level: 'warn', area: 'network', message: 'Could not load a script: /socius/assets/lazy-Xy9.js', context: { op: 'resource load' } });
    el('img', { src: '/x.png' }).dispatchEvent(new Event('error'));
    expect(getLog()[0]).toMatchObject({ level: 'info', area: 'network' });
  });
});

describe('code files missing after an update', () => {
  it('recognises the browsers\' chunk-load messages', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true);
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/a.css'))).toBe(true);
    expect(isChunkLoadError(new TypeError('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it('vite:preloadError logs a warning and shows the banner; the event is not cancelled', () => {
    const ev = new Event('vite:preloadError', { cancelable: true }) as Event & { payload?: unknown };
    ev.payload = new TypeError('Failed to fetch dynamically imported module: http://localhost/assets/exportDocx-1a2b.js');
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
    expect(getLog()[0]).toMatchObject({ level: 'warn', area: 'network', context: { op: 'vite:preloadError' } });
    expect(getUpdateNotice()).toBe('updated');
  });

  it('an unhandled chunk-load rejection is a warning with the banner, not an error', () => {
    const reason = new TypeError('Failed to fetch dynamically imported module');
    const ev = new Event('unhandledrejection') as Event & { reason?: unknown; promise?: unknown };
    ev.reason = reason;
    window.dispatchEvent(ev);
    expect(getLog()[0]).toMatchObject({ level: 'warn', area: 'network' });
    expect(getUpdateNotice()).toBe('updated');
  });

  it('the banner says Socius was updated and reloads; right after a reload it suggests checking the connection', () => {
    const reload = vi.fn();
    const loc = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...loc, reload } });
    try {
      window.dispatchEvent(Object.assign(new Event('vite:preloadError'), { payload: new Error('Unable to preload CSS for /a.css') }));
      render(<UpdateBanner />);
      expect(screen.getByRole('status').textContent).toContain('Socius was updated. Reload to get the new version.');
      fireEvent.click(screen.getByRole('button', { name: 'Reload' }));
      expect(reload).toHaveBeenCalledTimes(1);
      expect(Number(sessionStorage.getItem('socius.reloadedForUpdate'))).toBeGreaterThan(0);
      // The reloaded page fails again: no reload loop, a different message.
      act(() => {
        __resetUpdateNoticeForTests();
        window.dispatchEvent(Object.assign(new Event('vite:preloadError'), { payload: new Error('Unable to preload CSS for /b.css') }));
      });
      expect(getUpdateNotice()).toBe('still-failing');
      expect(screen.getByRole('status').textContent).toContain('Check your internet connection');
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
      expect(screen.queryByRole('status')).toBeNull();
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: loc });
    }
  });
});

describe('React root error options', () => {
  function Boom(): never {
    throw new TypeError('render failed');
  }
  /** A boundary that is not one of Socius's own (it does not log). */
  class OtherBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
    state = { failed: false };
    static getDerivedStateFromError() {
      return { failed: true };
    }
    render() {
      return this.state.failed ? <p>fallback</p> : this.props.children;
    }
  }

  function mount(node: ReactNode) {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div, reactRootErrorOptions);
    act(() => root.render(node));
    return { div, root };
  }

  it('logs errors that another boundary caught, with component names only', () => {
    const { div, root } = mount(<OtherBoundary><Boom /></OtherBoundary>);
    expect(div.textContent).toBe('fallback');
    const e = getLog()[0];
    expect(e).toMatchObject({ level: 'error', area: 'ui', message: 'render failed', context: { op: 'react caught error' } });
    const components = e.detail!.slice(e.detail!.indexOf('Component stack:'));
    expect(components).toMatch(/^Component stack:\n  at Boom\n/);
    expect(components).not.toMatch(/https?:|\.tsx|:\d/);
    act(() => root.unmount());
  });

  it('leaves errors caught by Socius\'s own boundaries to them (logged once, with the boundary name)', () => {
    const { root } = mount(<ErrorBoundary op="tab:output" fallback={() => <p>oops</p>}><Boom /></ErrorBoundary>);
    const entries = getLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].context?.op).toBe('tab:output');
    act(() => root.unmount());
  });

  it('logs recovered errors as warnings and uncaught ones as errors', () => {
    reactRootErrorOptions.onRecoverableError(new Error('hydration mismatch'), { componentStack: '\n    at App (x.js:1:1)' });
    expect(getLog()[0]).toMatchObject({ level: 'warn', area: 'ui', context: { op: 'react recovered' } });
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const err = new RangeError('uncaught at the root');
    reactRootErrorOptions.onUncaughtError(err, { componentStack: '\n    at App (x.js:1:1)' });
    expect(getLog()[0]).toMatchObject({ level: 'error', area: 'ui', context: { op: 'react uncaught error' } });
    expect(reportError).toHaveBeenCalledWith(err);
    vi.unstubAllGlobals();
  });
});
