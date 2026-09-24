// The AI features offered app-wide (AI menu, the AI chip in the top bar, the "AI is ready. Try it"
// panel, the search palette): what each does, what it needs first, and how to start it.
//
// Starting a feature never sends anything by itself: it opens the dialog or panel where the user sees
// what will be sent and clicks to send.
import { useStore } from '../../core/store';
import type { OutputItem } from '../../core/output';
import { aiAvailable, getAiStatus } from '../../platform/ai';
import { openAssistant } from '../assistant/open';
import { useCodingUi } from '../coding/uiStore';
import { useUi } from '../../app/ui-store';
import { isExplainable } from './explainPrompt';
import { openAiSettings } from './hooks';
import { useExplain } from './explainStore';

export type AiFeatureId = 'assistant' | 'explain' | 'codebook' | 'suggest' | 'summarise';

export interface AiFeatureInfo {
  id: AiFeatureId;
  /** Button label ("Explain a result"). */
  label: string;
  /** Menu label (with "..." when it opens a dialog). */
  menuLabel: string;
  /** What it does, completing "Once AI is set up, <label> ...". */
  does: string;
}

export const AI_FEATURES: AiFeatureInfo[] = [
  {
    id: 'assistant',
    label: 'Ask the assistant',
    menuLabel: 'Ask the Socius assistant...',
    does: 'answers your questions about methods and your data, for example which test to use, and points you to the menu that runs it.',
  },
  {
    id: 'explain',
    label: 'Explain a result',
    menuLabel: 'Explain a result...',
    does: 'explains one result from the Output tab in plain language: what was tested, what the numbers mean, whether the warnings matter and how to report it.',
  },
  {
    id: 'codebook',
    label: 'Suggest a codebook',
    menuLabel: 'Suggest a codebook...',
    does: 'reads a sample of your interviews or open-ended answers and proposes codes with definitions and example quotes, for you to review.',
  },
  {
    id: 'suggest',
    label: 'Suggest codes for open-ended answers',
    menuLabel: 'Suggest codes for open-ended answers...',
    does: 'applies your codebook to open-ended survey answers and suggests codes for each answer, which you accept or reject.',
  },
  {
    id: 'summarise',
    label: 'Summarise a code',
    menuLabel: 'Summarise a code...',
    does: 'drafts a short summary of the passages coded with one code, for you to check against the quotes.',
  },
];

export function aiFeature(id: AiFeatureId): AiFeatureInfo {
  return AI_FEATURES.find((f) => f.id === id)!;
}

export function isAiFeatureId(x: unknown): x is AiFeatureId {
  return typeof x === 'string' && AI_FEATURES.some((f) => f.id === x);
}

// ---------- what each feature needs first ----------

export interface AiContext {
  hasDataset: boolean;
  /** The dataset has text (string) variables, so open-ended answers can be imported. */
  hasTextVars: boolean;
  /** Output items that can be explained. */
  explainable: number;
  nDocs: number;
  nResponses: number;
  nCodes: number;
  nSegments: number;
}

export type AiPrereqAction = 'open-crosstabs' | 'load-sample' | 'import-survey' | 'import-docs' | 'load-interviews' | 'open-coding' | 'suggest-codebook' | 'open-responses';

export interface AiBlocker {
  title: string;
  message: string;
  actions: AiPrereqAction[];
}

/** Why a feature cannot start yet (with what to do first), or null when it can. */
export function aiFeatureBlocker(id: AiFeatureId, c: AiContext): AiBlocker | null {
  switch (id) {
    case 'explain':
      if (c.explainable) return null;
      return {
        title: 'Run an analysis first',
        message: c.hasDataset
          ? 'Explain a result explains one result from the Output tab, and there are no results yet. Run an analysis first, for example Crosstabs (Analyze > Descriptive Statistics > Crosstabs).'
          : 'Explain a result explains one result from the Output tab, and there are no results yet. Open a data file or the sample survey, then run an analysis, for example Crosstabs.',
        actions: c.hasDataset ? ['open-crosstabs'] : ['load-sample'],
      };
    case 'codebook':
      if (c.nDocs) return null;
      return {
        title: 'Import some text first',
        message: 'Suggest a codebook reads your interview transcripts or open-ended survey answers, and there is nothing to read yet. Import answers from a survey question or documents first.',
        actions: c.hasTextVars ? ['import-survey', 'import-docs', 'load-interviews'] : ['import-docs', 'load-interviews'],
      };
    case 'suggest':
      if (!c.nResponses)
        return {
          title: 'Import open-ended answers first',
          message: c.hasTextVars
            ? 'Suggest codes works on open-ended survey answers, one answer per respondent. Import the answers to an open question from your dataset first.'
            : 'Suggest codes works on open-ended survey answers, one answer per respondent. Open a dataset with an open-ended (text) question first, for example the sample survey, then import its answers.',
          actions: c.hasTextVars ? ['import-survey'] : ['load-sample'],
        };
      if (!c.nCodes)
        return {
          title: 'Build a codebook first',
          message: 'Suggest codes applies your codebook to the answers, so it needs at least one code. Create codes by hand in the codebook, or let the AI suggest a codebook first.',
          actions: ['suggest-codebook', 'open-responses'],
        };
      return null;
    case 'summarise':
      if (c.nSegments) return null;
      return {
        title: 'Code some text first',
        message: c.nDocs
          ? 'Summarise a code reads the passages coded with one code, and nothing is coded yet. Code some passages or answers in Text coding first.'
          : 'Summarise a code reads the passages coded with one code, and there is no text to code yet. Import answers or documents in Text coding first.',
        actions: c.nDocs ? ['open-coding'] : c.hasTextVars ? ['import-survey', 'load-interviews'] : ['load-interviews', 'import-docs'],
      };
    default:
      return null;
  }
}

export function explainableOutputs(outputs: OutputItem[]): OutputItem[] {
  return outputs.filter(isExplainable);
}

export function currentAiContext(): AiContext {
  const st = useStore.getState();
  const docs = st.coding.docs;
  return {
    hasDataset: !!st.dataset,
    hasTextVars: !!st.dataset?.variables.some((v) => v.type === 'string'),
    explainable: explainableOutputs(st.outputs).length,
    nDocs: docs.length,
    nResponses: docs.filter((d) => d.kind === 'response').length,
    nCodes: st.coding.codes.length,
    nSegments: st.coding.segments.length,
  };
}

// ---------- starting a feature ----------

async function aiReady(): Promise<boolean> {
  if (getAiStatus().ready === 'yes') return true;
  try {
    return await aiAvailable();
  } catch {
    return false;
  }
}

/** Open the Output tab at an item and show its "Explain with AI" panel (nothing is sent yet). */
export function startExplain(itemId: string): void {
  const st = useStore.getState();
  st.setTab('output');
  useExplain.getState().open(itemId);
  useUi.getState().focusOutput(itemId);
}

/**
 * Start an AI feature: set-up help when AI is not ready (saying what the feature will do), a "do this
 * first" dialog when its data is missing, otherwise the feature's own dialog or panel.
 */
export async function runAiFeature(id: AiFeatureId): Promise<void> {
  const st = useStore.getState();
  if (id === 'assistant') {
    // The assistant panel explains its own set-up when AI is not ready.
    openAssistant();
    return;
  }
  if (!(await aiReady())) {
    openAiSettings(id);
    return;
  }
  if (aiFeatureBlocker(id, currentAiContext())) {
    st.openDialog({ kind: 'custom', id: 'ai-prereq', params: { feature: id } });
    return;
  }
  switch (id) {
    case 'explain': {
      const items = explainableOutputs(st.outputs);
      const pending = useExplain.getState().pendingItemId;
      const target = items.find((i) => i.id === pending) ?? (items.length === 1 ? items[0] : null);
      useExplain.getState().setPending(null);
      if (target) startExplain(target.id);
      else st.openDialog({ kind: 'custom', id: 'ai-explain-pick' });
      return;
    }
    case 'codebook':
      st.setTab('coding');
      st.openDialog({ kind: 'coding', id: 'ai-codebook' });
      return;
    case 'suggest':
      st.setTab('coding');
      st.openDialog({ kind: 'coding', id: 'ai-suggest' });
      return;
    case 'summarise': {
      const ui = useCodingUi.getState();
      const counts = new Map<string, number>();
      for (const s of st.coding.segments) counts.set(s.codeId, (counts.get(s.codeId) ?? 0) + 1);
      const keep = ui.selectedCodeId && counts.get(ui.selectedCodeId) ? ui.selectedCodeId : [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      ui.set({ view: 'retrieve', selectedCodeId: keep });
      st.setTab('coding');
      st.toast('Choose a code, then click "Summarise this code".', 'info');
      return;
    }
  }
}
