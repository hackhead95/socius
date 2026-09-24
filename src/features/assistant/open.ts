// Entry point for the Socius assistant panel (owned by the assistant module).
// Other features call openAssistant() to show the panel, optionally with a prompt to send.
import { create } from 'zustand';

export interface AssistantRequest {
  /** Text to place in the input (sent immediately when `send` is true). */
  prompt?: string;
  send?: boolean;
  /** Optional context the caller wants attached, e.g. an output item id. */
  outputId?: string;
}

interface AssistantUi {
  open: boolean;
  request: AssistantRequest | null;
  setOpen: (open: boolean) => void;
  consumeRequest: () => AssistantRequest | null;
}

export const useAssistantUi = create<AssistantUi>((set, get) => ({
  open: false,
  request: null,
  setOpen: (open) => set({ open }),
  consumeRequest: () => {
    const r = get().request;
    if (r) set({ request: null });
    return r;
  },
}));

export function openAssistant(req?: AssistantRequest): void {
  useAssistantUi.setState({ open: true, request: req ?? null });
}
