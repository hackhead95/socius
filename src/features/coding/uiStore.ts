// UI state for the Text coding workspace (not saved with the project).

import { create } from 'zustand';
import type { CodingProject } from '../../core/coding-types';

export type CodingView = 'documents' | 'responses' | 'retrieve' | 'analyse' | 'reliability' | 'memos';
export type AnalyseTab = 'frequencies' | 'cooccurrence' | 'attribute' | 'words' | 'kwic';

export interface HistoryEntry {
  label: string;
  before: CodingProject;
  after: CodingProject;
  key?: string;
}

export interface PendingSelection {
  docId: string;
  start: number;
  end: number;
}

export interface LocalDialog {
  id: string;
  params?: Record<string, unknown>;
}

interface CodingUiState {
  view: CodingView;
  analyseTab: AnalyseTab;
  activeDocId: string | null;
  selectedCodeId: string | null;
  recentCodeIds: string[];
  showAllCoders: boolean;
  collapsed: Record<string, boolean>;
  /** Scroll the reader to this range and flash it. */
  jump: { docId: string; start: number; end: number; nonce: number } | null;
  /** Text selected in the reader, waiting for a code. */
  pending: PendingSelection | null;
  history: HistoryEntry[];
  dialog: LocalDialog | null;
  ai: 'unknown' | 'yes' | 'no';
  /** Source list filters. */
  docSearch: string;
  docFilter: 'all' | 'coded' | 'uncoded';
  docAttr: { key: string; value: string } | null;
  /** Keyword-in-context search term. */
  kwicQuery: string;
  /** Sources analysed in the Analyse view: 'all', 'document', 'response' or 'q:<varId>' (one question). */
  analyseSources: string;
  set: (patch: Partial<CodingUiState>) => void;
}

export const useCodingUi = create<CodingUiState>((set) => ({
  view: 'documents',
  analyseTab: 'frequencies',
  activeDocId: null,
  selectedCodeId: null,
  recentCodeIds: [],
  showAllCoders: true,
  collapsed: {},
  jump: null,
  pending: null,
  history: [],
  dialog: null,
  ai: 'unknown',
  docSearch: '',
  docFilter: 'all',
  docAttr: null,
  kwicQuery: '',
  analyseSources: 'all',
  set: (patch) => set(patch),
}));

export function openLocalDialog(id: string, params?: Record<string, unknown>) {
  useCodingUi.getState().set({ dialog: { id, params } });
}

/** Open a document (or a single response) in the reading view, scrolled to a range. */
export function jumpTo(docId: string, start: number, end: number) {
  const s = useCodingUi.getState();
  s.set({
    view: 'documents',
    activeDocId: docId,
    jump: { docId, start, end, nonce: Date.now() },
  });
}
