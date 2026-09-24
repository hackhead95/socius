// App shell: top bar + menubar, main tabs, variable sidebar, dialogs, toasts, drag-and-drop,
// session restore (else the welcome screen) and autosave.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore, type MainTab } from '../core/store';
import { OutputViewer } from '../features/output/OutputViewer';
import { CodingWorkspace } from '../features/coding/CodingWorkspace';
import { DataView } from '../features/data/DataView';
import { VariableView } from '../features/data/VariableView';
import { applyProject, currentProjectState, isModified } from '../features/project/fileActions';
import { loadSession, saveSession } from '../features/project/persistence';
import { TopBar } from './TopBar';
import { Sidebar } from './Sidebar';
import { DialogHost } from './DialogHost';
import { AiSettingsHost } from '../features/ai/AiSettingsDialog';
import { CommandPaletteHost } from './CommandPalette';
import { AssistantRoot } from '../features/assistant/AssistantRoot';
import { BusyOverlay, ConfirmHost, DropOverlay, Toasts } from './Overlays';
import { SampleBanner, Welcome } from './Welcome';
import { applyTheme, useUi } from './ui-store';
import { handleGlobalKey } from './shortcuts';
import { GuardedDialogs, PanelBoundary, QuietBoundary } from './ErrorBoundary';
import { UpdateBanner } from '../features/errorlog/UpdateBanner';
import { setBeforeReload } from '../features/errorlog/update';
import './app.css';
import '../features/data/data.css';
import '../features/transform/transform.css';

const AUTOSAVE_MS = 1500;
const BIG_CELLS = 15_000_000;

function useStartup(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rec = await loadSession();
        const s = rec?.state;
        if (alive && s && (s.dataset || s.outputs.length || s.coding.docs.length || s.coding.codes.length)) {
          applyProject(s);
          // Unsaved edits stay "unsaved" after a reload, so opening another file still asks first.
          if (rec!.modified) useUi.getState().markClean(null);
          useUi.getState().setRestoredAt(rec!.savedAt);
          return;
        }
        // First visit (nothing saved): the welcome screen offers Open data file, Open project,
        // Load sample survey and New empty dataset. The sample is loaded only when chosen.
      } catch {
        /* storage unavailable: the welcome screen covers it */
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

function useAutosave(enabled: boolean) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const save = () => {
      timer.current = null;
      return saveSession(currentProjectState(), isModified()).catch(() => false);
    };
    // "Socius was updated" > Reload saves first, so nothing changed a moment ago is lost.
    setBeforeReload(() => {
      if (timer.current) clearTimeout(timer.current);
      return save();
    });
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      const ds = useStore.getState().dataset;
      if (ds && ds.nCases * ds.variables.length > BIG_CELLS) return; // very large data: save when the page is hidden
      timer.current = setTimeout(save, AUTOSAVE_MS);
    };
    const unsubStore = useStore.subscribe((s, prev) => {
      if (s.dataset === prev.dataset && s.outputs === prev.outputs && s.coding === prev.coding && s.showValueLabels === prev.showValueLabels && s.tab === prev.tab) return;
      schedule();
    });
    // Saving a project marks the data clean; remember that too.
    const unsubUi = useUi.subscribe((s, prev) => {
      if (s.cleanDataset !== prev.cleanDataset) schedule();
    });
    const unsub = () => {
      unsubStore();
      unsubUi();
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (timer.current) clearTimeout(timer.current);
        save();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onVis);
    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onVis);
      setBeforeReload(null);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled]);
}

/**
 * Publish where the app's fixed chrome (top bar and view tabs) ends, as CSS variables: the assistant
 * panel opens below it, so Undo, Redo, the menus and Search stay usable, and on narrow screens the
 * assistant button docks into the tab bar instead of floating over the content.
 */
function useShellMetrics() {
  useLayoutEffect(() => {
    const tabbar = document.querySelector<HTMLElement>('.tabbar');
    const topbar = document.querySelector<HTMLElement>('.topbar');
    if (!tabbar) return;
    const root = document.documentElement.style;
    const apply = () => {
      const r = tabbar.getBoundingClientRect();
      root.setProperty('--shell-top', `${Math.round(r.bottom)}px`);
      root.setProperty('--tabbar-top', `${Math.round(r.top)}px`);
      root.setProperty('--tabbar-h', `${Math.round(r.height)}px`);
    };
    apply();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(apply) : null;
    ro?.observe(tabbar);
    if (topbar) ro?.observe(topbar);
    window.addEventListener('resize', apply);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', apply);
    };
  }, []);
}

export function App() {
  const ready = useStartup();
  useAutosave(ready);
  const theme = useUi((s) => s.theme);
  const tab = useStore((s) => s.tab);
  const setTab = useStore((s) => s.setTab);
  const hasData = useStore((s) => !!s.dataset);
  const nOut = useStore((s) => s.outputs.length);
  // Home (the Socius logo) shows the start screen over open work until you pick a tab or open something.
  const home = useUi((s) => s.home);
  useShellMetrics();

  useEffect(() => applyTheme(theme), [theme]);
  useEffect(
    () =>
      useStore.subscribe((s, p) => {
        if (s.tab !== p.tab || s.dataset !== p.dataset || s.coding !== p.coding || s.outputs !== p.outputs) useUi.getState().setHome(false);
      }),
    [],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  const tabs: Array<{ id: MainTab; label: string; needsData: boolean }> = [
    { id: 'data', label: 'Data View', needsData: false },
    { id: 'variables', label: 'Variable View', needsData: true },
    { id: 'output', label: 'Output', needsData: false },
    { id: 'coding', label: 'Text coding', needsData: false },
  ];

  const dataTab = tab === 'data' || tab === 'variables';
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const list = tabs.filter((t) => hasData || !t.needsData);
    const cur = list.findIndex((t) => t.id === tabs[i].id);
    const next = list[(cur + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
    setTab(next.id);
    requestAnimationFrame(() => document.getElementById(`tab-${next.id}`)?.focus());
  };

  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <TopBar />
      <nav className="tabbar" aria-label="Views">
        <div className="tabs main-tabs" role="tablist">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              className="tab"
              // On the start screen (Home) no view is current, so no tab is marked.
              aria-selected={!home && tab === t.id}
              aria-controls="main"
              tabIndex={tab === t.id ? 0 : -1}
              disabled={t.needsData && !hasData}
              title={t.needsData && !hasData ? 'Open or create a dataset first' : undefined}
              onClick={() => {
                useUi.getState().setHome(false);
                setTab(t.id);
              }}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {t.label}
              {t.id === 'output' && nOut ? <span className="badge badge-accent tab-badge num">{nOut}</span> : null}
            </button>
          ))}
        </div>
      </nav>
      <div className={`workspace ${dataTab && hasData && !home ? 'with-sidebar' : ''}`}>
        {dataTab && hasData && !home ? <Sidebar /> : null}
        <main id="main" className="main" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          <PanelBoundary name={tab}>
          {!ready ? (
            <div className="empty"><span className="spinner" aria-hidden="true" /> Loading...</div>
          ) : home ? (
            <Welcome />
          ) : tab === 'output' ? (
            <div className="pane"><OutputViewer /></div>
          ) : tab === 'coding' ? (
            <div className="pane"><CodingWorkspace /></div>
          ) : !hasData ? (
            <Welcome />
          ) : (
            <div className="pane pane-data">
              <SampleBanner />
              {tab === 'variables' ? <VariableView /> : <DataView />}
            </div>
          )}
          </PanelBoundary>
        </main>
      </div>
      <GuardedDialogs><DialogHost /></GuardedDialogs>
      <CommandPaletteHost />
      <QuietBoundary op="assistant" message="The Socius assistant stopped working because of an error. Reload the page to use it again. Details are in Help > Error log."><AssistantRoot /></QuietBoundary>
      <AiSettingsHost />
      <ConfirmHost />
      <Toasts />
      <UpdateBanner />
      <BusyOverlay />
      <DropOverlay />
    </div>
  );
}
