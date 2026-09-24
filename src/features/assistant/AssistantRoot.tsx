// Mounted once by the app shell: the floating Assistant button, the panel, the Ctrl+J / Cmd+J
// shortcut, and requests from other features (openAssistant({ prompt, send, outputId })).
import { useEffect, useRef } from 'react';
import { AssistantPanel } from './AssistantPanel';
import { useAssistantChat } from './chat-store';
import { sendMessage } from './controller';
import { AsIcon } from './icons';
import { assistantShortcutLabel, toggleAssistant, useAssistantUi } from './open';
import './assistant.css';

export function isAssistantShortcut(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'shiftKey'>): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'j';
}

export function AssistantRoot() {
  const open = useAssistantUi((s) => s.open);
  const request = useAssistantUi((s) => s.request);
  const fabRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isAssistantShortcut(e)) return;
      e.preventDefault();
      // A dialog is open: its backdrop would cover the panel.
      if (document.querySelector('.modal')) return;
      toggleAssistant();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Requests from other features: attach an output item, fill in or send a prompt.
  useEffect(() => {
    if (!request) return;
    const r = useAssistantUi.getState().consumeRequest();
    if (!r) return;
    const chat = useAssistantChat.getState();
    if (r.outputId) chat.setFocusOutput(r.outputId);
    if (r.prompt) {
      if (r.send && !chat.running) void sendMessage(r.prompt);
      else chat.setDraft(r.prompt);
    }
  }, [request]);

  // Toasts move out of the way of the button and the panel (see assistant.css).
  useEffect(() => {
    const cl = document.body.classList;
    cl.toggle('as-panel-open', open);
    cl.toggle('as-fab-visible', !open);
    return () => {
      cl.remove('as-panel-open');
      cl.remove('as-fab-visible');
    };
  }, [open]);

  // Give focus back to the button when the panel closes.
  useEffect(() => {
    if (wasOpen.current && !open) fabRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      {open ? (
        <AssistantPanel onClose={() => useAssistantUi.getState().setOpen(false)} />
      ) : (
        <button ref={fabRef} type="button" className="as-fab" aria-label={`Assistant (${assistantShortcutLabel()})`} title={`Assistant (${assistantShortcutLabel()})`} onClick={() => useAssistantUi.getState().setOpen(true)} data-testid="assistant-fab">
          <AsIcon name="assistant" size={22} />
          <span className="as-fab-label" aria-hidden="true">Assistant</span>
        </button>
      )}
    </>
  );
}
