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
  /** The AI feature the user tried to use before AI was set up (explained at the top of the dialog). */
  intent: string | null;
  set: (open: boolean) => void;
}

/** The AI assistant settings dialog, rendered once by the app shell above every other dialog. */
export const useAiSettingsDialog = create<AiDialogState>((set) => ({ open: false, intent: null, set: (open) => set(open ? { open } : { open, intent: null }) }));

/**
 * Open AI assistant settings. `intent` names the AI feature the user was trying to use (see
 * features.ts), so the dialog can say what it will do once set up. Safe as an onClick handler (a
 * click event is ignored).
 */
export function openAiSettings(intent?: unknown): void {
  useAiSettingsDialog.setState({ open: true, intent: typeof intent === 'string' ? intent : null });
}
