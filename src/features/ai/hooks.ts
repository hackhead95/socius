// React bindings for the AI provider layer (src/platform/ai.ts) and the AI settings dialog.
import { useEffect, useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { getAiStatus, startAiStatus, subscribeAi, type AiStatus } from '../../platform/ai';
import { getWebLlmState, subscribeWebLlm, type WebLlmState } from '../../platform/ai-webllm';

/** Current AI provider and whether it is ready. Re-renders when settings change. */
export function useAiStatus(): AiStatus {
  useEffect(() => startAiStatus(), []);
  return useSyncExternalStore(subscribeAi, getAiStatus, getAiStatus);
}

/** On-device model download / load progress. */
export function useWebLlmState(): WebLlmState {
  return useSyncExternalStore(subscribeWebLlm, getWebLlmState, getWebLlmState);
}

interface AiDialogState {
  open: boolean;
  set: (open: boolean) => void;
}

/** The AI assistant settings dialog, rendered once by the app shell above every other dialog. */
export const useAiSettingsDialog = create<AiDialogState>((set) => ({ open: false, set: (open) => set({ open }) }));

export function openAiSettings(): void {
  useAiSettingsDialog.getState().set(true);
}
