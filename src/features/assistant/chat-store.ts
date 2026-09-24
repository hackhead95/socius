// Conversation state for the assistant panel. Kept in memory for the browser session (it survives
// closing the panel and switching tabs, not a page reload). "What the assistant can see" settings for
// statistics and texts are remembered in this browser; reading individual cases always starts off.
import { create } from 'zustand';
import type { ChatMessage } from '../../platform/ai-tools';
import { DEFAULT_PERMISSIONS, type Artifact, type AssistantPermissions, type TraceStep } from '../../lib/assistant/types';

export interface ArtifactEntry {
  id: string;
  artifact: Artifact;
  state: 'idle' | 'done' | 'dismissed' | 'failed';
  note?: string;
}

export interface ChatEntry {
  id: string;
  role: 'user' | 'assistant' | 'divider';
  text: string;
  status: 'pending' | 'streaming' | 'done' | 'error' | 'stopped';
  error?: string;
  steps: TraceStep[];
  artifacts: ArtifactEntry[];
  /** For user messages: what it was about, e.g. an output item's title. */
  about?: string;
  /** For assistant messages: which AI service answered. */
  provider?: string;
  truncated?: boolean;
  /** For assistant messages: the user message it answers (for Retry). */
  replyTo?: string;
}

export const SEE_KEY = 'socius.assistant.see';
export const WIDTH_KEY = 'socius.assistant.width';

function loadPermissions(): AssistantPermissions {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SEE_KEY) : null;
    const o = raw ? JSON.parse(raw) : null;
    return {
      stats: typeof o?.stats === 'boolean' ? o.stats : DEFAULT_PERMISSIONS.stats,
      texts: typeof o?.texts === 'boolean' ? o.texts : DEFAULT_PERMISSIONS.texts,
      cases: false, // never remembered: raw rows are opted into per session
    };
  } catch {
    return { ...DEFAULT_PERMISSIONS };
  }
}

function loadWidth(): number {
  try {
    const n = Number(typeof localStorage !== 'undefined' ? localStorage.getItem(WIDTH_KEY) : NaN);
    return Number.isFinite(n) && n >= 320 ? n : 440;
  } catch {
    return 440;
  }
}

interface ChatState {
  entries: ChatEntry[];
  /** The model-side conversation (with tool calls), for follow-up questions. */
  history: ChatMessage[];
  running: boolean;
  controller: AbortController | null;
  permissions: AssistantPermissions;
  /** Dataset the history refers to; opening another file starts a fresh model history. */
  datasetId: string | null;
  /** Output item the next message is about (from "Explain with AI" etc.). */
  focusOutputId: string | null;
  draft: string;
  width: number;
  setPermission: (k: keyof AssistantPermissions, v: boolean) => void;
  setDraft: (s: string) => void;
  setWidth: (w: number) => void;
  setFocusOutput: (id: string | null) => void;
  patchEntry: (id: string, fn: (e: ChatEntry) => ChatEntry) => void;
  clear: () => void;
}

export const useAssistantChat = create<ChatState>((set, get) => ({
  entries: [],
  history: [],
  running: false,
  controller: null,
  permissions: loadPermissions(),
  datasetId: null,
  focusOutputId: null,
  draft: '',
  width: loadWidth(),
  setPermission: (k, v) => {
    const permissions = { ...get().permissions, [k]: v };
    set({ permissions });
    try {
      localStorage.setItem(SEE_KEY, JSON.stringify({ stats: permissions.stats, texts: permissions.texts }));
    } catch {
      /* storage unavailable */
    }
  },
  setDraft: (draft) => set({ draft }),
  setWidth: (w) => {
    set({ width: w });
    try {
      localStorage.setItem(WIDTH_KEY, String(Math.round(w)));
    } catch {
      /* storage unavailable */
    }
  },
  setFocusOutput: (id) => set({ focusOutputId: id }),
  patchEntry: (id, fn) => set({ entries: get().entries.map((e) => (e.id === id ? fn(e) : e)) }),
  clear: () => {
    get().controller?.abort();
    set({ entries: [], history: [], running: false, controller: null, focusOutputId: null, datasetId: null });
  },
}));
