// What the panel's buttons do: send a message through the agent, stop, retry, apply what the
// assistant proposed. Reads the live app store at the moment each tool runs.
import { useStore } from '../../core/store';
import { newId } from '../../core/types';
import { aiErrorIsAppFault, aiErrorText, getAiStatus, effectiveProvider, providerLabel, recordAiConnection, refreshAiStatus } from '../../platform/ai';
import { copyToClipboard } from '../../platform/host';
import { aiErrorReport } from '../../platform/ai-diagnose';
import { logError, logWarn } from '../../platform/errorlog';
import { runAgent, type Driver } from '../../lib/assistant/agent';
import { addToOutput, applyProposal } from '../../lib/assistant/actions';
import { createDriver } from '../../lib/assistant/drivers';
import { compactSystemPrompt, systemPrompt } from '../../lib/assistant/prompt';
import { allTools, compactTools } from '../../lib/assistant/tools';
import type { AppSnapshot, TraceStep } from '../../lib/assistant/types';
import { useAssistantChat, type ChatEntry } from './chat-store';

export function appSnapshot(): AppSnapshot {
  const s = useStore.getState();
  return { dataset: s.dataset, outputs: s.outputs, coding: s.coding, tab: s.tab };
}

function upsertStep(steps: TraceStep[], s: TraceStep): TraceStep[] {
  const i = steps.findIndex((x) => x.id === s.id);
  if (i < 0) return [...steps, s];
  const next = steps.slice();
  next[i] = s;
  return next;
}

export interface SendOptions {
  /** Use this driver instead of the configured provider (tests, previews). */
  driver?: Driver | null;
}

/** Send a message. Resolves when the answer is complete, stopped or failed (never rejects). */
export async function sendMessage(text: string, opts: SendOptions = {}): Promise<void> {
  const chat = useAssistantChat.getState();
  const msg = text.trim();
  if (chat.running || !msg) return;
  const app = useStore.getState();
  const dsId = app.dataset?.id ?? null;
  let history = chat.history;
  const entries = chat.entries.slice();
  if (history.length && chat.datasetId !== dsId) {
    entries.push({ id: newId('div'), role: 'divider', text: app.dataset ? `Now working with "${app.dataset.name}"` : 'The dataset was closed', status: 'done', steps: [], artifacts: [] });
    history = [];
  }
  const focusItem = chat.focusOutputId ? app.outputs.find((o) => o.id === chat.focusOutputId) ?? null : null;
  const user: ChatEntry = { id: newId('msg'), role: 'user', text: msg, status: 'done', steps: [], artifacts: [], about: focusItem ? focusItem.title : undefined };
  const reply: ChatEntry = { id: newId('msg'), role: 'assistant', text: '', status: 'pending', steps: [], artifacts: [], replyTo: user.id };
  const controller = new AbortController();
  useAssistantChat.setState({ entries: [...entries, user, reply], running: true, controller, datasetId: dsId, draft: '', focusOutputId: null, history });
  const patch = (fn: (e: ChatEntry) => ChatEntry) => useAssistantChat.getState().patchEntry(reply.id, fn);

  let driver: Driver | null;
  try {
    driver = opts.driver !== undefined ? opts.driver : await createDriver();
  } catch {
    driver = null;
  }
  if (!driver) {
    patch((e) => ({ ...e, status: 'error', error: aiErrorText({ code: 'not_configured' }) }));
    useAssistantChat.setState({ running: false, controller: null });
    return;
  }
  const label = opts.driver ? opts.driver.name : providerLabel(effectiveProvider());
  patch((e) => ({ ...e, provider: label }));
  const permissions = { ...useAssistantChat.getState().permissions };
  const snap = appSnapshot();
  const pctx = { snapshot: snap, permissions, focusOutput: focusItem, providerLabel: label };
  const system = driver.compact ? compactSystemPrompt(pctx) : systemPrompt(pctx);
  const tools = driver.compact ? compactTools(snap.tab) : allTools();
  try {
    const res = await runAgent({
      driver,
      system,
      history,
      user: focusItem ? `${msg}\n\n(The user is asking about the output item "${focusItem.title}", id ${focusItem.id}, shown in the context.)` : msg,
      tools,
      ctx: { state: appSnapshot, permissions, maxResultBytes: driver.budget.maxToolResultBytes },
      signal: controller.signal,
      events: {
        onText: (t) => patch((e) => ({ ...e, text: t, status: t ? 'streaming' : 'pending' })),
        onStep: (s) => patch((e) => ({ ...e, steps: upsertStep(e.steps, s) })),
        onArtifact: (a) => patch((e) => ({ ...e, artifacts: [...e.artifacts, { id: newId('art'), artifact: a, state: 'idle' }] })),
      },
    });
    patch((e) => ({ ...e, text: res.text, status: 'done', truncated: res.truncated }));
    useAssistantChat.setState({ history: res.history });
    if (!opts.driver) recordAiConnection(true);
    // The provider label may now name the model picked automatically (no request is made).
    if (!opts.driver) void refreshAiStatus().catch(() => undefined);
  } catch (e: any) {
    if (e?.code === 'cancelled' || controller.signal.aborted) patch((x) => ({ ...x, status: 'stopped' }));
    else {
      // A wrong key, no connection or a limit is the user's to fix (a warning); only app faults are errors.
      if (aiErrorIsAppFault(e)) logError('assistant', e, { op: 'assistant-turn' });
      else logWarn('assistant', e, { op: 'assistant-turn' });
      if (!opts.driver) recordAiConnection(false, e);
      const partial = typeof e?.partial === 'string' ? e.partial : '';
      patch((x) => ({ ...x, status: 'error', error: aiErrorText(e), errorReport: aiErrorReport(e, 'Socius assistant'), text: x.text || partial }));
    }
  } finally {
    if (useAssistantChat.getState().controller === controller) useAssistantChat.setState({ running: false, controller: null });
  }
}

export function stopAssistant(): void {
  useAssistantChat.getState().controller?.abort();
}

/** Ask the last question again (after an error or Stop). */
export function retryLast(opts: SendOptions = {}): Promise<void> {
  const chat = useAssistantChat.getState();
  if (chat.running) return Promise.resolve();
  const last = [...chat.entries].reverse().find((e) => e.role === 'assistant');
  const user = last?.replyTo ? chat.entries.find((e) => e.id === last.replyTo) : undefined;
  if (!last || !user) return Promise.resolve();
  useAssistantChat.setState({ entries: chat.entries.filter((e) => e.id !== last.id && e.id !== user.id) });
  return sendMessage(user.text, opts);
}

/** Run an artifact's button: add an analysis to Output, apply a data change, open a dialog. */
export function runArtifact(entryId: string, artifactId: string): void {
  const chat = useAssistantChat.getState();
  const entry = chat.entries.find((e) => e.id === entryId);
  const a = entry?.artifacts.find((x) => x.id === artifactId);
  if (!entry || !a || a.state === 'done') return;
  const set = (state: 'done' | 'failed', note: string) =>
    chat.patchEntry(entryId, (e) => ({ ...e, artifacts: e.artifacts.map((x) => (x.id === artifactId ? { ...x, state, note } : x)) }));
  if (a.artifact.kind === 'output') {
    addToOutput(a.artifact.item, () => useStore.getState(), false);
    useStore.getState().toast(`Added "${a.artifact.item.title}" to the Output tab.`, 'success');
    set('done', 'Added to Output');
    return;
  }
  const r = applyProposal(a.artifact.proposal, () => useStore.getState());
  set(r.ok ? 'done' : 'failed', r.ok ? (a.artifact.proposal.kind === 'dialog' ? 'Dialog opened' : 'Applied. Undo with Edit > Undo.') : r.message);
}

export function dismissArtifact(entryId: string, artifactId: string): void {
  useAssistantChat.getState().patchEntry(entryId, (e) => ({ ...e, artifacts: e.artifacts.map((x) => (x.id === artifactId ? { ...x, state: 'dismissed' } : x)) }));
}

export async function copyAnswer(text: string): Promise<boolean> {
  return copyToClipboard(text);
}

/** Is an AI provider set up (no request is made)? */
export function aiReady(): boolean {
  const s = getAiStatus();
  return !!s.provider && s.ready !== 'no';
}
