// State of the "Explain with AI" panels on Output items. Kept outside the viewer so a streaming answer
// survives switching tabs. Nothing is sent until run() is called from the panel's Explain button.
import { create } from 'zustand';
import { useStore } from '../../core/store';
import type { OutputItem } from '../../core/output';
import { aiErrorMessage, aiErrorText, aiPromptBudget, askAI, getAiStatus } from '../../platform/ai';
import { buildExplainPrompt, plainText } from './explainPrompt';

export type ExplainPhase = 'confirm' | 'running' | 'done' | 'error';

export interface ExplainPanelState {
  phase: ExplainPhase;
  text: string;
  error?: string;
  /** Provider that answered ("Google Gemini (gemini-3.6-flash)"). */
  provider?: string;
}

interface ExplainStore {
  panels: Record<string, ExplainPanelState>;
  /** Item the user wanted explained before AI was set up (continued after set-up). */
  pendingItemId: string | null;
  setPending: (id: string | null) => void;
  open: (itemId: string) => void;
  close: (itemId: string) => void;
  run: (item: OutputItem) => Promise<void>;
  stop: (itemId: string) => void;
  /** Append the explanation to the item as an AI-generated note; returns false when nothing to add. */
  addToOutput: (itemId: string) => boolean;
}

const controllers = new Map<string, AbortController>();

export const useExplain = create<ExplainStore>((set, get) => {
  const patch = (id: string, p: Partial<ExplainPanelState>) =>
    set((s) => (s.panels[id] ? { panels: { ...s.panels, [id]: { ...s.panels[id], ...p } } } : s));
  return {
    panels: {},
    pendingItemId: null,
    setPending: (id) => set({ pendingItemId: id }),
    open: (itemId) =>
      set((s) => (s.panels[itemId] && s.panels[itemId].phase !== 'error' ? s : { panels: { ...s.panels, [itemId]: { phase: 'confirm', text: '' } } })),
    close: (itemId) => {
      controllers.get(itemId)?.abort();
      controllers.delete(itemId);
      set((s) => {
        const panels = { ...s.panels };
        delete panels[itemId];
        return { panels };
      });
    },
    run: async (item) => {
      controllers.get(item.id)?.abort();
      const ctrl = new AbortController();
      controllers.set(item.id, ctrl);
      const { prompt } = buildExplainPrompt(item, { budgetBytes: aiPromptBudget() });
      const provider = getAiStatus().label;
      set((s) => ({ panels: { ...s.panels, [item.id]: { phase: 'running', text: '', provider } } }));
      try {
        const text = await askAI(prompt, { signal: ctrl.signal, modelTier: 'default', onText: (t) => patch(item.id, { text: t }) });
        if (controllers.get(item.id) !== ctrl) return;
        patch(item.id, { phase: 'done', text: text.trim() });
      } catch (e) {
        if (controllers.get(item.id) !== ctrl) return;
        const stopped = ctrl.signal.aborted;
        const cur = get().panels[item.id];
        // Stopped with some text: keep what arrived.
        if (stopped && cur?.text) patch(item.id, { phase: 'done', error: aiErrorMessage('cancelled') });
        else patch(item.id, { phase: 'error', error: stopped ? aiErrorMessage('cancelled') : aiErrorText(e) });
      } finally {
        if (controllers.get(item.id) === ctrl) controllers.delete(item.id);
      }
    },
    stop: (itemId) => controllers.get(itemId)?.abort(),
    addToOutput: (itemId) => {
      const p = get().panels[itemId];
      const text = p?.text ? plainText(p.text) : '';
      if (!text) return false;
      const st = useStore.getState();
      const outputs = st.outputs.map((o) =>
        o.id === itemId
          ? {
              ...o,
              blocks: [
                ...o.blocks,
                { kind: 'text' as const, style: 'note' as const, ai: true, text: `AI-generated explanation (${p.provider ?? 'AI'}). Check it against the tables before you use it.\n\n${text}` },
              ],
            }
          : o,
      );
      useStore.setState({ outputs });
      get().close(itemId);
      return true;
    },
  };
});
