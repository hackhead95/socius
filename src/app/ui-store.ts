// App-shell UI state that is not part of the saved project: theme, sidebar, cross-view
// navigation requests, the global confirm dialog, and "modified since saved" tracking.
import { create } from 'zustand';
import type { Dataset } from '../core/types';
import { readPref, writePref } from '../features/project/persistence';

export type ThemePref = 'system' | 'light' | 'dark';

export interface ConfirmRequest {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (ok: boolean) => void;
}

export interface GridTarget {
  varId?: string;
  row?: number;
  /** Variable View: start editing the variable's name (double-click on a Data View column heading). */
  editName?: boolean;
  seq: number;
}

interface UiState {
  theme: ThemePref;
  setTheme: (t: ThemePref) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (b: boolean) => void;
  /** "You are exploring sample data" banner. */
  sampleBanner: boolean;
  setSampleBanner: (b: boolean) => void;
  /** Dataset object as last opened/saved; anything else counts as modified. */
  cleanDataset: Dataset | null;
  markClean: (ds: Dataset | null) => void;
  /** Ask the Data View to select a variable (column) and/or case. */
  gridTarget: GridTarget | null;
  focusGrid: (t: Omit<GridTarget, 'seq'>) => void;
  /** Ask Variable View to select a variable. */
  varViewTarget: GridTarget | null;
  focusVariableView: (varId: string, opts?: { editName?: boolean }) => void;
  /** Variable currently selected in Data View (sidebar highlight). */
  currentVarId: string | null;
  setCurrentVarId: (id: string | null) => void;
  confirmReq: ConfirmRequest | null;
  confirm: (opts: Omit<ConfirmRequest, 'resolve'>) => Promise<boolean>;
  settleConfirm: (ok: boolean) => void;
  /** Busy overlay text (opening a big file). */
  busy: string | null;
  setBusy: (s: string | null) => void;
  /** Ask the Data View to open its find / go-to bar. */
  findSeq: number;
  gotoSeq: number;
  requestFind: () => void;
  requestGoto: () => void;
  /** Show the "Restored your last session" notice (with a Start fresh action). */
  restoredAt: number | null;
  setRestoredAt: (t: number | null) => void;
  /** Search palette (Ctrl+K). */
  paletteOpen: boolean;
  setPaletteOpen: (b: boolean) => void;
  /** Ask the Output view to scroll to an item (and optionally one of its blocks). */
  outputTarget: { itemId: string; blockIndex?: number; seq: number } | null;
  focusOutput: (itemId: string, blockIndex?: number) => void;
  /** The start screen (welcome, recent projects) is showing over open work: the Socius logo shows it. */
  home: boolean;
  setHome: (b: boolean) => void;
}

let seq = 0;

const initialTheme = ((): ThemePref => {
  const t = readPref('theme');
  return t === 'light' || t === 'dark' ? t : 'system';
})();

export const useUi = create<UiState>((set, get) => ({
  theme: initialTheme,
  setTheme: (t) => {
    writePref('theme', t === 'system' ? null : t);
    set({ theme: t });
  },
  sidebarOpen: readPref('sidebar') !== 'closed',
  setSidebarOpen: (b) => {
    writePref('sidebar', b ? null : 'closed');
    set({ sidebarOpen: b });
  },
  sampleBanner: false,
  setSampleBanner: (b) => set({ sampleBanner: b }),
  cleanDataset: null,
  markClean: (ds) => set({ cleanDataset: ds }),
  gridTarget: null,
  focusGrid: (t) => set({ gridTarget: { ...t, seq: ++seq } }),
  varViewTarget: null,
  focusVariableView: (varId, opts) => set({ varViewTarget: { varId, editName: opts?.editName, seq: ++seq } }),
  currentVarId: null,
  setCurrentVarId: (id) => (get().currentVarId === id ? undefined : set({ currentVarId: id })),
  confirmReq: null,
  confirm: (opts) =>
    new Promise<boolean>((resolve) => {
      const prev = get().confirmReq;
      if (prev) prev.resolve(false);
      set({ confirmReq: { ...opts, resolve } });
    }),
  settleConfirm: (ok) => {
    const r = get().confirmReq;
    set({ confirmReq: null });
    r?.resolve(ok);
  },
  busy: null,
  setBusy: (s) => set({ busy: s }),
  findSeq: 0,
  gotoSeq: 0,
  requestFind: () => set({ findSeq: get().findSeq + 1 }),
  requestGoto: () => set({ gotoSeq: get().gotoSeq + 1 }),
  restoredAt: null,
  setRestoredAt: (t) => set({ restoredAt: t }),
  paletteOpen: false,
  setPaletteOpen: (b) => set({ paletteOpen: b }),
  outputTarget: null,
  focusOutput: (itemId, blockIndex) => set({ outputTarget: { itemId, blockIndex, seq: ++seq } }),
  home: false,
  setHome: (b) => (get().home === b ? undefined : set({ home: b })),
}));

export function applyTheme(t: ThemePref) {
  try {
    const root = document.documentElement;
    if (t === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', t);
  } catch {
    /* no DOM */
  }
}
