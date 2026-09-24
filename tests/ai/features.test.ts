// App-wide AI features: what each needs first, and where starting one leads (set-up, "do this first",
// the feature itself). No request is sent to any AI service here.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __reloadAiSettings, refreshAiStatus, saveAiSettings } from '../../src/platform/ai';
import { __resetCapabilityCache } from '../../src/platform/claude';
import { __setWebLlmLoader } from '../../src/platform/ai-webllm';
import { useStore } from '../../src/core/store';
import { makeDataset, makeVariable } from '../../src/core/types';
import { emptyCodingProject } from '../../src/core/coding-types';
import { useUi } from '../../src/app/ui-store';
import { useAssistantUi } from '../../src/features/assistant/open';
import { useAiSettingsDialog } from '../../src/features/ai/hooks';
import { useExplain } from '../../src/features/ai/explainStore';
import { AI_FEATURES, aiFeatureBlocker, runAiFeature, type AiContext } from '../../src/features/ai/features';
import { memoryStorage } from '../platform/helpers';

const none: AiContext = { hasDataset: false, hasTextVars: false, explainable: 0, nDocs: 0, nResponses: 0, nCodes: 0, nSegments: 0 };

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  __resetCapabilityCache();
  __setWebLlmLoader(null, { ok: false, reason: 'no_api', f16: false });
  __reloadAiSettings();
  useStore.setState({ dataset: null, outputs: [], coding: emptyCodingProject(), dialog: null, tab: 'data' });
  useAiSettingsDialog.setState({ open: false, intent: null });
  useAssistantUi.setState({ open: false, request: null });
  useExplain.setState({ panels: {}, pendingItemId: null });
});
afterEach(() => vi.unstubAllGlobals());

describe('what each AI feature needs first', () => {
  it('Explain a result needs a result; the fix depends on whether data is open', () => {
    expect(aiFeatureBlocker('explain', none)).toMatchObject({ title: 'Run an analysis first', actions: ['load-sample'] });
    const b = aiFeatureBlocker('explain', { ...none, hasDataset: true })!;
    expect(b.message).toContain('for example Crosstabs');
    expect(b.actions).toEqual(['open-crosstabs']);
    expect(aiFeatureBlocker('explain', { ...none, explainable: 1 })).toBeNull();
  });

  it('coding features ask for text, answers, a codebook or coded passages', () => {
    expect(aiFeatureBlocker('codebook', { ...none, hasDataset: true, hasTextVars: true })!.actions[0]).toBe('import-survey');
    expect(aiFeatureBlocker('codebook', { ...none, nDocs: 2 })).toBeNull();
    expect(aiFeatureBlocker('suggest', { ...none, hasDataset: true, hasTextVars: true })).toMatchObject({ title: 'Import open-ended answers first', actions: ['import-survey'] });
    expect(aiFeatureBlocker('suggest', { ...none, nDocs: 5, nResponses: 5 })).toMatchObject({ title: 'Build a codebook first', actions: ['suggest-codebook', 'open-responses'] });
    expect(aiFeatureBlocker('suggest', { ...none, nDocs: 5, nResponses: 5, nCodes: 1 })).toBeNull();
    expect(aiFeatureBlocker('summarise', { ...none, nDocs: 3 })).toMatchObject({ title: 'Code some text first', actions: ['open-coding'] });
    expect(aiFeatureBlocker('summarise', { ...none, nSegments: 1 })).toBeNull();
    expect(aiFeatureBlocker('assistant', none)).toBeNull();
  });

  it('describes every feature in plain words, without em-dashes', () => {
    expect(AI_FEATURES.map((f) => f.menuLabel)).toEqual(['Ask the Socius assistant...', 'Explain a result...', 'Suggest a codebook...', 'Suggest codes for open-ended answers...', 'Summarise a code...']);
    for (const f of AI_FEATURES) expect(f.does).not.toMatch(/—/);
  });
});

describe('starting a feature', () => {
  it('opens the assistant for Ask the Socius assistant', async () => {
    await runAiFeature('assistant');
    expect(useAssistantUi.getState().open).toBe(true);
  });

  it('opens AI settings with the feature named when AI is not set up', async () => {
    await runAiFeature('explain');
    expect(useAiSettingsDialog.getState()).toMatchObject({ open: true, intent: 'explain' });
    expect(useStore.getState().dialog).toBeNull();
  });

  it('with AI ready: "do this first" when data is missing, else the feature', async () => {
    saveAiSettings({ provider: 'gemini', gemini: { apiKey: 'AIza-test', model: '' } });
    await refreshAiStatus();
    await runAiFeature('explain');
    expect(useStore.getState().dialog).toEqual({ kind: 'custom', id: 'ai-prereq', params: { feature: 'explain' } });
    expect(useAiSettingsDialog.getState().open).toBe(false);

    const item = { id: 'o1', procedure: 'crosstabs', title: 'Crosstabs', createdAt: 0, blocks: [{ kind: 'text' as const, style: 'interpretation' as const, text: 'x' }] };
    useStore.setState({ outputs: [item], dialog: null });
    await runAiFeature('explain');
    expect(useStore.getState().tab).toBe('output');
    expect(useExplain.getState().panels.o1).toMatchObject({ phase: 'confirm' });
    expect(useUi.getState().outputTarget).toMatchObject({ itemId: 'o1' });

    // Two results: the picker.
    useStore.setState({ outputs: [item, { ...item, id: 'o2' }], dialog: null });
    await runAiFeature('explain');
    expect(useStore.getState().dialog).toEqual({ kind: 'custom', id: 'ai-explain-pick' });

    // The result chosen before set-up is continued.
    useExplain.setState({ panels: {}, pendingItemId: 'o2' });
    useStore.setState({ dialog: null });
    await runAiFeature('explain');
    expect(useExplain.getState().panels.o2).toBeTruthy();
    expect(useExplain.getState().pendingItemId).toBeNull();

    const text = makeVariable({ name: 'q_open', type: 'string' });
    useStore.setState({ dataset: makeDataset({ name: 'S', variables: [text], columns: { [text.id]: ['a'] }, nCases: 1 }), dialog: null });
    await runAiFeature('suggest');
    expect(useStore.getState().dialog).toEqual({ kind: 'custom', id: 'ai-prereq', params: { feature: 'suggest' } });
  });
});
