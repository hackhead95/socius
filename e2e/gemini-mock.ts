// Helpers for mocking Google's Gemini Interactions API (POST /v1beta/interactions) in e2e tests.
// Specs describe model replies as generateContent-style parts ({text}, {functionCall, thoughtSignature})
// because they are short to write; these helpers turn them into Interactions steps (JSON or the SSE
// event stream), and turn an Interactions request back into a generateContent-like body (contents,
// systemInstruction, generationConfig) so assertions stay readable.
import type { Route } from '@playwright/test';

export const GEMINI = 'https://generativelanguage.googleapis.com/**';
export const cors = { 'Access-Control-Allow-Origin': '*' };

export type Part = Record<string, any>;

export const isInteractions = (url: string) => /\/v1beta\/interactions(\?|$)/.test(url);

/** Model list reply for GET /v1beta/models. */
export function modelsReply(names: string[]) {
  return { status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ models: names.map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) }) };
}

/** The last user text of an Interactions request (a prompt string, or the last user_input step). */
export function promptOf(body: any): string {
  if (typeof body?.input === 'string') return body.input;
  const steps: any[] = Array.isArray(body?.input) ? body.input : [];
  for (let i = steps.length - 1; i >= 0; i--) if (steps[i]?.type === 'user_input') return (steps[i].content ?? []).map((c: any) => c.text ?? '').join('');
  return '';
}

/** An Interactions request in generateContent terms: contents (user/model turns), systemInstruction, generationConfig. */
export function legacyBody(body: any): any {
  const contents: Array<{ role: 'user' | 'model'; parts: Part[] }> = [];
  const push = (role: 'user' | 'model', part: Part) => {
    const last = contents[contents.length - 1];
    if (last?.role === role) last.parts.push(part);
    else contents.push({ role, parts: [part] });
  };
  let signature: string | undefined;
  const steps: any[] = typeof body?.input === 'string' ? [{ type: 'user_input', content: [{ type: 'text', text: body.input }] }] : Array.isArray(body?.input) ? body.input : [];
  for (const s of steps) {
    if (s.type === 'user_input') push('user', { text: (s.content ?? []).map((c: any) => c.text ?? '').join('') });
    else if (s.type === 'thought') signature = s.signature;
    else if (s.type === 'model_output') for (const c of s.content ?? []) push('model', { text: c.text });
    else if (s.type === 'function_call') {
      push('model', { functionCall: { name: s.name, args: s.arguments ?? {} }, ...(signature ? { thoughtSignature: signature } : {}) });
      signature = undefined;
    } else if (s.type === 'function_result') push('user', { functionResponse: { name: s.name, response: { result: s.result } } });
  }
  return {
    contents,
    systemInstruction: body?.system_instruction ? { parts: [{ text: body.system_instruction }] } : undefined,
    generationConfig: { ...(body?.response_format?.mime_type ? { responseMimeType: body.response_format.mime_type } : {}), ...(body?.generation_config ?? {}) },
    tools: body?.tools,
    stream: !!body?.stream,
    store: body?.store,
    model: body?.model,
  };
}

let seq = 0;
/** generateContent-style parts -> Interactions output steps (a thoughtSignature becomes a thought step). */
export function partsToSteps(parts: Part[]): any[] {
  const steps: any[] = [];
  for (const p of parts) {
    if (p.thoughtSignature) steps.push({ type: 'thought', signature: p.thoughtSignature });
    if (typeof p.text === 'string') {
      const last = steps[steps.length - 1];
      if (last?.type === 'model_output') last.content.push({ type: 'text', text: p.text });
      else steps.push({ type: 'model_output', content: [{ type: 'text', text: p.text }] });
    } else if (p.functionCall) steps.push({ type: 'function_call', id: `fc_${++seq}`, name: p.functionCall.name, arguments: p.functionCall.args ?? {} });
  }
  return steps;
}

/** Reply to an Interactions request with these parts: JSON, or SSE events when the request streams. */
export function interactionReply(parts: Part[], stream: boolean, textChunks?: string[]) {
  const steps = partsToSteps(parts);
  const status = steps.some((s) => s.type === 'function_call') ? 'requires_action' : 'completed';
  if (!stream) return { status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ id: `int_${++seq}`, status, steps }) };
  const ev = (o: unknown) => `data: ${JSON.stringify(o)}\n\n`;
  let out = ev({ event_type: 'interaction.created', interaction: { id: `int_${++seq}`, status: 'in_progress' } });
  steps.forEach((s, index) => {
    if (s.type === 'model_output') {
      out += ev({ event_type: 'step.start', index, step: { type: 'model_output', content: [] } });
      const texts = textChunks && steps.filter((x) => x.type === 'model_output').length === 1 ? textChunks : s.content.map((c: any) => c.text);
      for (const t of texts) out += ev({ event_type: 'step.delta', index, delta: { type: 'text', text: t } });
    } else if (s.type === 'function_call') {
      out += ev({ event_type: 'step.start', index, step: { type: 'function_call', id: s.id, name: s.name, arguments: {} } });
      out += ev({ event_type: 'step.delta', index, delta: { type: 'arguments_delta', arguments: JSON.stringify(s.arguments) } });
    } else {
      out += ev({ event_type: 'step.start', index, step: { type: s.type } });
      if (s.signature) out += ev({ event_type: 'step.delta', index, delta: { type: 'thought_signature', signature: s.signature } });
    }
    out += ev({ event_type: 'step.stop', index });
  });
  out += ev({ event_type: 'interaction.completed', interaction: { id: `int_${seq}`, status } });
  out += 'data: [DONE]\n\n';
  return { status: 200, headers: { ...cors, 'Content-Type': 'text/event-stream' }, body: out };
}

/** Fulfil a route with a Google error body (the Interactions endpoint wraps errors in an array). */
export function googleErrorReply(code: number, status: string, message: string, details: unknown[] = []) {
  return { status: code, headers: cors, contentType: 'application/json', body: JSON.stringify([{ error: { code, message, status, ...(details.length ? { details } : {}) } }]) };
}

export async function fulfil(route: Route, reply: { status: number; headers: Record<string, string>; contentType?: string; body: string }) {
  await route.fulfill(reply).catch(() => undefined);
}
