// A guided check for an AI program on this computer (Ollama, LM Studio, or another OpenAI-compatible
// server on localhost), used by AI assistant settings > Other service when the address is local.
//
// Why a local program often "does not connect" from a website such as https://hackhead95.github.io:
// - It is not running, or listens on another address or port.
// - It rejects requests from other websites (CORS). Ollama only accepts pages on localhost unless
//   OLLAMA_ORIGINS includes the site's address; LM Studio needs "Enable CORS" turned on.
// - The browser blocks a public website from reaching programs on this computer until the user allows
//   it (Chrome and Edge 142+: "Local network access", split in 145+ into "Apps on device"
//   (loopback-network) and "Local network"; Firefox 151+: "Device apps and services").
// - Safari blocks a secure (https) website from reaching http://localhost or http://127.0.0.1 at all.
//   Chrome, Edge and Firefox allow both addresses (they count as trustworthy, not mixed content).
// - The model named in settings is not installed (`ollama pull llama3.2`).
// - The address is wrong: missing /v1, https instead of http, 0.0.0.0 (browsers block it), or plain
//   http to another computer (mixed content from an https page).
//
// Research notes: docs/research/local-ai-from-a-website.md.
//
// The check runs these steps in order and says exactly which one failed and how to fix it. Nothing
// here sends data anywhere except the address the user typed.

import { AiUnavailableError } from './claude';
import { askOpenAiCompatible, normaliseBaseUrl } from './ai-http';
import { aiErrorText, stripThinking } from './ai';

export type LocalKind = 'ollama' | 'lmstudio' | 'generic';
export type LocalOs = 'windows' | 'mac' | 'linux' | 'other';

// ---------- addresses ----------

const LOOPBACK_HOST = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|0\.0\.0\.0)$/i;
const PRIVATE_HOST = /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|[a-z0-9-]+\.local|\[f[cd][0-9a-f:]*\])$/i;

function parse(url: string): URL | null {
  try {
    return new URL(normaliseBaseUrl(url));
  } catch {
    return null;
  }
}

/** Is this address a program on this computer (loopback)? */
export function isLoopbackUrl(url: string): boolean {
  const u = parse(url);
  return !!u && LOOPBACK_HOST.test(u.hostname);
}

/** Is this address on this computer or the local network (not the internet)? */
export function isLocalServiceUrl(url: string): boolean {
  const u = parse(url);
  return !!u && (LOOPBACK_HOST.test(u.hostname) || PRIVATE_HOST.test(u.hostname));
}

/** Which kind of local program: from the chosen preset, else from the port. */
export function localKind(preset: string, baseUrl: string): LocalKind {
  if (preset === 'ollama') return 'ollama';
  if (preset === 'lmstudio') return 'lmstudio';
  const port = parse(baseUrl)?.port;
  if (port === '11434') return 'ollama';
  if (port === '1234') return 'lmstudio';
  return 'generic';
}

/** Server root (scheme, host, port) of a base URL, e.g. http://localhost:11434. */
export function serverRoot(baseUrl: string): string {
  const u = parse(baseUrl);
  return u ? `${u.protocol}//${u.host}` : '';
}

export interface AddressAdvice {
  /** A better address to use, when the typed one will probably fail. */
  suggested: string;
  why: string;
}

/**
 * Common address mistakes: no /v1 at the end, 0.0.0.0 (a listening address, which browsers refuse to
 * connect to) instead of localhost, https for a local program, or plain http to another computer from
 * an https page. (localhost and 127.0.0.1 both work in Chrome, Edge and Firefox.)
 */
export function addressAdvice(baseUrl: string, kind: LocalKind, pageProtocol = currentProtocol()): AddressAdvice | null {
  const u = parse(baseUrl);
  if (!u) return null;
  let host = u.hostname;
  let protocol = u.protocol;
  let path = u.pathname.replace(/\/+$/, '');
  const reasons: string[] = [];
  if (host === '0.0.0.0') {
    reasons.push('use "localhost" instead of 0.0.0.0: 0.0.0.0 is where the program listens, and browsers refuse to connect to it');
    host = 'localhost';
  }
  if (protocol === 'https:' && LOOPBACK_HOST.test(u.hostname) && (kind === 'ollama' || kind === 'lmstudio')) {
    reasons.push(`${kind === 'ollama' ? 'Ollama' : 'LM Studio'} uses http, not https, on this computer`);
    protocol = 'http:';
  }
  if ((kind === 'ollama' || kind === 'lmstudio') && !/\/v1$/.test(path)) {
    reasons.push('the address must end in /v1');
    path = '/v1';
  }
  if (!reasons.length) {
    if (pageProtocol === 'https:' && protocol === 'http:' && !LOOPBACK_HOST.test(u.hostname)) {
      return {
        suggested: '',
        why: 'This page is secure (https), and browsers block plain http requests to other computers from it. Run the AI program on this computer and use http://localhost, or give the other computer an https address.',
      };
    }
    return null;
  }
  const suggested = `${protocol}//${host}${u.port ? `:${u.port}` : ''}${path}`;
  const why = reasons.join('; ');
  return { suggested, why: why.charAt(0).toUpperCase() + why.slice(1) + '.' };
}

// ---------- this browser and computer ----------

function nav(): any {
  return (globalThis as any).navigator;
}

function currentProtocol(): string {
  try {
    return (globalThis as any).location?.protocol ?? '';
  } catch {
    return '';
  }
}

/** The address of this website, which the local program must allow (e.g. https://hackhead95.github.io). */
export function siteOrigin(): string {
  try {
    const o = (globalThis as any).location?.origin;
    return typeof o === 'string' && o !== 'null' ? o : 'https://hackhead95.github.io';
  } catch {
    return 'https://hackhead95.github.io';
  }
}

export function detectOs(n: any = nav()): LocalOs {
  const p = `${n?.userAgentData?.platform ?? ''} ${n?.platform ?? ''} ${n?.userAgent ?? ''}`.toLowerCase();
  if (/android|iphone|ipad|cros/.test(p)) return 'other';
  if (/win/.test(p)) return 'windows';
  if (/mac/.test(p)) return 'mac';
  if (/linux|x11/.test(p)) return 'linux';
  return 'other';
}

export type BrowserFamily = 'chromium' | 'firefox' | 'safari' | 'other';

export function detectBrowser(n: any = nav()): { family: BrowserFamily; name: string; version: number } {
  const ua: string = n?.userAgent ?? '';
  let m: RegExpMatchArray | null;
  if ((m = ua.match(/Edg\/(\d+)/))) return { family: 'chromium', name: 'Edge', version: +m[1] };
  if ((m = ua.match(/Firefox\/(\d+)/))) return { family: 'firefox', name: 'Firefox', version: +m[1] };
  if ((m = ua.match(/(?:Chrome|Chromium)\/(\d+)/))) return { family: 'chromium', name: /OPR\//.test(ua) ? 'Opera' : 'Chrome', version: +m[1] };
  if ((m = ua.match(/Version\/(\d+).*Safari/))) return { family: 'safari', name: 'Safari', version: +m[1] };
  return { family: 'other', name: 'this browser', version: 0 };
}

export type PermissionStateX = 'granted' | 'denied' | 'prompt';

export interface LocalNetworkPermission {
  /** The permission name the browser knows (loopback-network in Chrome 145+, local-network-access in 142 to 144). */
  name: string;
  state: PermissionStateX;
}

/**
 * The browser's permission for this website to reach programs on this computer, or null when the
 * browser has no such permission (then it does not ask; older Chrome, Firefox, Safari).
 */
export async function queryLocalNetworkPermission(n: any = nav()): Promise<LocalNetworkPermission | null> {
  const perms = n?.permissions;
  if (!perms || typeof perms.query !== 'function') return null;
  for (const name of ['loopback-network', 'local-network-access', 'local-network']) {
    try {
      const r = await perms.query({ name });
      if (r && typeof r.state === 'string') return { name, state: r.state as PermissionStateX };
    } catch {
      /* not known to this browser: try the next name */
    }
  }
  return null;
}

/** Where to change the permission, in this browser's words. */
export function permissionHelp(perm: LocalNetworkPermission | null, browser = detectBrowser()): string {
  if (browser.family === 'firefox')
    return 'Click the padlock at the left of the address bar and allow "Device apps and services" for this site, then reload this page. Or: Firefox Settings > Privacy & Security > Permissions > Device apps and services > Settings.';
  const setting = perm?.name === 'local-network-access' ? 'Local network access' : 'Apps on device (or Local network access)';
  const where = browser.name === 'Edge' ? 'Edge' : 'Chrome';
  return `Click the icon at the left of the address bar (the tune or padlock icon), choose Site settings, and set "${setting}" to Allow. Then reload this page. Once blocked, ${where} does not ask again until you change this. You can also do it in ${where} settings > Privacy and security > Site settings.`;
}

/** Safari blocks https pages from reaching http://localhost (mixed content), whatever the program allows. */
export const SAFARI_LOCAL_BLOCKED =
  'Safari blocks secure websites such as this one from reaching programs on this computer. Use Chrome, Edge or Firefox for Ollama or LM Studio, or choose the on-device model or Google Gemini instead.';

// ---------- how to allow this website ----------

export interface FixStep {
  /** One instruction in plain English. */
  text: string;
  /** A command or value to copy, when there is one. */
  copy?: string;
}

export interface OsFix {
  os: LocalOs;
  label: string;
  steps: FixStep[];
}

/** How to let Ollama accept requests from this website, for each operating system. */
export function ollamaOriginsFix(origin = siteOrigin()): OsFix[] {
  return [
    {
      os: 'windows',
      label: 'Windows',
      steps: [
        { text: 'Quit Ollama: right-click the Ollama icon near the clock (in the taskbar corner; click ^ if you cannot see it) and choose Quit Ollama.' },
        { text: 'Open Command Prompt or PowerShell (press the Windows key, type cmd, press Enter) and run this command:', copy: `setx OLLAMA_ORIGINS "${origin}"` },
        { text: 'Start Ollama again from the Start menu.' },
        { text: 'Or, without a command: Start > search "environment variables" > "Edit environment variables for your account" > New. Name: OLLAMA_ORIGINS, value (exactly, no spaces):', copy: origin },
        { text: 'If you start Ollama yourself in PowerShell instead, start it like this:', copy: `$env:OLLAMA_ORIGINS="${origin}"; ollama serve` },
      ],
    },
    {
      os: 'mac',
      label: 'macOS',
      steps: [
        { text: 'Open Terminal (Applications > Utilities) and run this command:', copy: `launchctl setenv OLLAMA_ORIGINS "${origin}"` },
        { text: 'Quit Ollama from the llama icon in the menu bar (Quit Ollama), then open Ollama again from Applications.' },
        { text: 'This setting is lost when the Mac restarts. After a restart, run the command again, then quit and reopen Ollama.' },
        { text: 'If you start Ollama yourself in Terminal instead, start it like this:', copy: `OLLAMA_ORIGINS="${origin}" ollama serve` },
      ],
    },
    {
      os: 'linux',
      label: 'Linux',
      steps: [
        { text: 'If Ollama runs as a service (the usual install), open its settings:', copy: 'sudo systemctl edit ollama.service' },
        { text: 'Add these two lines, then save and close the editor:', copy: `[Service]\nEnvironment="OLLAMA_ORIGINS=${origin}"` },
        { text: 'Restart Ollama:', copy: 'sudo systemctl daemon-reload && sudo systemctl restart ollama' },
        { text: 'If you start Ollama yourself in a terminal instead, stop it and start it like this:', copy: `OLLAMA_ORIGINS="${origin}" ollama serve` },
      ],
    },
  ];
}

export function lmStudioCorsFix(): FixStep[] {
  return [
    { text: 'In LM Studio, open the Developer tab (the green terminal icon on the left).' },
    { text: 'Turn the server on: set Status to Running.' },
    { text: 'Click Settings (next to the status) and turn on Enable CORS.' },
    { text: 'Or, in a terminal:', copy: 'lms server start --cors' },
    { text: 'If "Require Authentication" is on in the same settings, create an API token there and paste it in API key above.' },
  ];
}

export function pullCommand(model: string): string {
  return `ollama pull ${model.trim() || 'llama3.2'}`;
}

// ---------- probing ----------

export type StepId = 'running' | 'allowed' | 'permission' | 'model' | 'answer';
export type StepStatus = 'pending' | 'running' | 'ok' | 'fail' | 'warn' | 'skip';

export interface LocalStep {
  id: StepId;
  title: string;
  status: StepStatus;
  /** What happened, in plain English. */
  detail?: string;
  /** What to do about it. */
  fix?: FixStep[];
  /** Show the OS-specific "allow this website" instructions. */
  showOriginsFix?: boolean;
}

export interface LocalModel {
  id: string;
  /** Size on disk in bytes, when the program says. */
  size?: number;
}

export interface LocalCheckConfig {
  preset: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface LocalCheckResult {
  steps: LocalStep[];
  kind: LocalKind;
  models: LocalModel[] | null;
  /** The installed model that matches the setting (e.g. "llama3.2:latest" for "llama3.2"). */
  matchedModel: string | null;
  reply: string;
  permission: LocalNetworkPermission | null;
  version: string;
  /** Technical notes for "Copy details" (no keys). */
  log: string[];
  ok: boolean;
  /** A Base URL that worked when the typed one did not (localhost unreachable, 127.0.0.1 fine). */
  suggestedBaseUrl?: string;
}

export interface LocalCheckOptions {
  signal?: AbortSignal;
  /** Called after every change, with a fresh copy of the result so far. */
  onUpdate?: (r: LocalCheckResult) => void;
  /** Called with the reply as it streams in. */
  onText?: (text: string) => void;
  fetchImpl?: typeof fetch;
  navigatorImpl?: any;
  /** Milliseconds to wait for the program before giving up (default 6 s; 60 s while the browser asks for permission). */
  timeoutMs?: number;
}

export const STEP_TITLES: Record<StepId, string> = {
  running: 'Is the program running?',
  allowed: 'Does it allow this website?',
  permission: 'Browser permission for this computer',
  model: 'Is the model installed?',
  answer: 'Did it answer?',
};

const ORDER: StepId[] = ['running', 'allowed', 'permission', 'model', 'answer'];

function programName(kind: LocalKind): string {
  return kind === 'ollama' ? 'Ollama' : kind === 'lmstudio' ? 'LM Studio' : 'The AI program';
}

class Timeout extends Error {
  constructor() {
    super('timeout');
    this.name = 'TimeoutError';
  }
}

/** fetch with a time limit that also follows the caller's signal. */
async function timedFetch(f: typeof fetch, url: string, init: RequestInit, ms: number, signal?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    ctrl.abort();
  }, ms);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort);
  try {
    return await f(url, { ...init, signal: ctrl.signal, cache: 'no-store' });
  } catch (e) {
    if (signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
    if (timedOut) throw new Timeout();
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}

/** Does "llama3.2" match an installed "llama3.2:latest"? Returns the installed name, or null. */
export function matchModel(wanted: string, models: LocalModel[]): string | null {
  const w = wanted.trim().toLowerCase();
  if (!w) return null;
  const ids = models.map((m) => m.id);
  const exact = ids.find((id) => id.toLowerCase() === w);
  if (exact) return exact;
  if (!w.includes(':')) {
    const latest = ids.find((id) => id.toLowerCase() === `${w}:latest`);
    if (latest) return latest;
  }
  // LM Studio ids sometimes carry a publisher prefix ("lmstudio-community/...").
  const tail = ids.find((id) => id.toLowerCase().split('/').pop() === w);
  return tail ?? null;
}

/** Parse Ollama's /api/tags or an OpenAI-style /models list. */
export function parseModelList(data: any): LocalModel[] {
  if (Array.isArray(data?.models)) return data.models.map((m: any) => ({ id: String(m?.name ?? m?.model ?? ''), size: typeof m?.size === 'number' ? m.size : undefined })).filter((m: LocalModel) => m.id);
  if (Array.isArray(data?.data)) return data.data.map((m: any) => ({ id: String(m?.id ?? '') })).filter((m: LocalModel) => m.id);
  return [];
}

/** Run the checklist. Never throws (except when stopped): every problem ends up in a step. */
export async function runLocalCheck(cfg: LocalCheckConfig, opts: LocalCheckOptions = {}): Promise<LocalCheckResult> {
  const f = opts.fetchImpl ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const n = opts.navigatorImpl ?? nav();
  const kind = localKind(cfg.preset, cfg.baseUrl);
  const name = programName(kind);
  let base = normaliseBaseUrl(cfg.baseUrl);
  let root = serverRoot(base);
  const r: LocalCheckResult = {
    steps: ORDER.map((id) => ({ id, title: STEP_TITLES[id], status: 'pending' })),
    kind,
    models: null,
    matchedModel: null,
    reply: '',
    permission: null,
    version: '',
    log: [],
    ok: false,
  };
  const emit = () => opts.onUpdate?.({ ...r, steps: r.steps.map((s) => ({ ...s })), log: [...r.log], models: r.models ? [...r.models] : null });
  const step = (id: StepId, patch: Partial<LocalStep>) => {
    const s = r.steps.find((x) => x.id === id)!;
    Object.assign(s, patch);
    emit();
  };
  const skipRest = (from: StepId, why: string) => {
    for (const id of ORDER.slice(ORDER.indexOf(from) + 1)) {
      const s = r.steps.find((x) => x.id === id)!;
      if (s.status === 'pending') Object.assign(s, { status: 'skip', detail: why });
    }
    emit();
  };
  const log = (line: string) => r.log.push(line);
  const aborted = () => {
    if (opts.signal?.aborted) throw new AiUnavailableError('cancelled', 'Stopped.');
  };

  log(`address: ${base || '(empty)'}`);
  log(`kind: ${kind}`);
  if (!root) {
    step('running', { status: 'fail', detail: 'The Base URL is not a valid address. For Ollama it is http://localhost:11434/v1.', fix: [{ text: 'Choose "Ollama on this computer" or "LM Studio on this computer" under Service to fill it in.' }] });
    skipRest('running', 'Fix the address first.');
    return r;
  }

  // The browser's permission first: in Chrome and Edge 142+ it decides whether any request can go out.
  r.permission = await queryLocalNetworkPermission(n);
  log(`permission: ${r.permission ? `${r.permission.name}=${r.permission.state}` : 'not used by this browser'}`);
  const browser = detectBrowser(n);
  const loopback = isLoopbackUrl(base);
  // Chrome 142+ uses this to show its permission question for this computer; other browsers ignore it.
  const space = (loopback ? { targetAddressSpace: 'loopback' } : {}) as RequestInit;
  const safariBlocked = browser.family === 'safari' && currentProtocol() === 'https:' && isLocalServiceUrl(base) && /^http:/i.test(base);
  const waitMs = opts.timeoutMs ?? (r.permission?.state === 'prompt' ? 60_000 : 6_000);
  const permStep = (): void => {
    const p = r.permission;
    if (!loopback && !isLocalServiceUrl(base)) {
      step('permission', { status: 'skip', detail: 'Not needed: this address is not on this computer.' });
    } else if (safariBlocked) {
      step('permission', { status: 'fail', detail: SAFARI_LOCAL_BLOCKED });
    } else if (!p) {
      step('permission', {
        status: 'ok',
        detail:
          browser.family === 'firefox'
            ? 'Firefox may ask whether this site may use "Device apps and services": click Allow.'
            : `${browser.name} does not ask for a separate permission here.`,
      });
    } else if (p.state === 'granted') {
      step('permission', { status: 'ok', detail: 'Allowed: this website may connect to programs on this computer.' });
    } else if (p.state === 'denied') {
      step('permission', { status: 'fail', detail: 'Blocked: the browser does not let this website connect to programs on this computer.', fix: [{ text: permissionHelp(p, browser) }] });
    } else {
      step('permission', { status: 'warn', detail: 'Not decided yet. When the browser asks whether this site may "look for and connect to" apps or devices on your computer or local network, click Allow.', fix: [{ text: permissionHelp(p, browser) }] });
    }
  };

  // 1) Is something listening? An opaque (no-cors) request succeeds whenever a server answers, even
  //    one that rejects this website, so this separates "not running" from "not allowed".
  step('running', { status: 'running', detail: r.permission?.state === 'prompt' ? 'If the browser asks to allow this site to connect to apps on this device, click Allow.' : `Looking for ${name} at ${root}` });
  let running = false;
  try {
    await timedFetch(f, `${root}/`, { ...space, mode: 'no-cors', method: 'GET', credentials: 'omit' }, waitMs, opts.signal);
    running = true;
    log('probe no-cors: answered');
  } catch (e: any) {
    aborted();
    log(`probe no-cors: ${e?.name ?? 'Error'} ${e?.message ?? ''}`.trim());
    const timedOut = e instanceof Timeout;
    const denied = r.permission?.state === 'denied';
    // "localhost" can fail where 127.0.0.1 works (it may resolve to IPv6 first; some VPN or proxy tools).
    if (!timedOut && !denied && !safariBlocked && parse(base)?.hostname === 'localhost') {
      const alt = base.replace(/\/\/localhost(?=[:/]|$)/i, '//127.0.0.1');
      try {
        await timedFetch(f, `${serverRoot(alt)}/`, { ...space, mode: 'no-cors', method: 'GET', credentials: 'omit' }, 3_000, opts.signal);
        running = true;
        log('probe 127.0.0.1: answered');
        r.suggestedBaseUrl = alt;
        base = alt;
        root = serverRoot(alt);
      } catch {
        aborted();
        log('probe 127.0.0.1: no answer');
      }
    }
  }
  if (!running) {
    const denied = r.permission?.state === 'denied';
    const timedOut = r.log.some((l) => l.startsWith('probe no-cors: TimeoutError'));
    const advice = addressAdvice(base, kind);
    const fix: FixStep[] = [];
    if (denied) fix.push({ text: permissionHelp(r.permission, browser) });
    else if (r.permission && r.permission.state !== 'granted')
      fix.push({ text: `If the browser asked whether this site may connect to apps or devices on this computer and the question was closed or blocked, allow it: ${permissionHelp(r.permission, browser)}` });
    if (advice?.suggested) fix.push({ text: `${advice.why} Use:`, copy: advice.suggested });
    else if (advice) fix.push({ text: advice.why });
    if (kind === 'ollama') {
      fix.push({ text: 'Start Ollama: open the Ollama app (on Windows from the Start menu, on a Mac from Applications). Or run this in a terminal:', copy: 'ollama serve' });
      fix.push({ text: 'Not installed yet? Download it free from ollama.com, install it, then come back and click Test connection.' });
    } else if (kind === 'lmstudio') {
      fix.push(...lmStudioCorsFix().slice(0, 2));
    } else {
      fix.push({ text: 'Start the program and check the address and port it shows.' });
    }
    step('running', {
      status: 'fail',
      detail: safariBlocked
        ? SAFARI_LOCAL_BLOCKED
        : denied
        ? `The browser blocked this website from connecting to programs on this computer, so it cannot tell whether ${name} is running.`
        : timedOut
          ? `No answer from ${root} within ${Math.round(waitMs / 1000)} seconds. The program may be busy, or a firewall or browser extension may be blocking it.`
          : `Nothing answered at ${root}. ${name} is not running, uses another address or port, or the browser blocked the connection.`,
      fix,
    });
    permStep();
    skipRest('running', `Needs ${name} to be running first.`);
    return r;
  }
  if (r.suggestedBaseUrl)
    step('running', {
      status: 'warn',
      detail: `${name} answered at ${root}, but not at localhost (a VPN, proxy or security program can cause this). The rest of this check uses ${root}.`,
      fix: [{ text: 'Use this Base URL:', copy: r.suggestedBaseUrl }],
    });
  else step('running', { status: 'ok', detail: `${name} is running at ${root}.` });

  // 2) Does it allow this website (CORS)? A normal request fails without the program's permission header.
  step('allowed', { status: 'running', detail: '' });
  const headers: Record<string, string> = {};
  if (cfg.apiKey.trim()) headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;
  const listUrl = kind === 'ollama' ? `${root}/api/tags` : `${base}/models`;
  let listRes: Response | null = null;
  try {
    if (kind === 'ollama') {
      const v = await timedFetch(f, `${root}/api/version`, { ...space, method: 'GET', credentials: 'omit' }, waitMs, opts.signal);
      try {
        r.version = String((await v.json())?.version ?? '');
      } catch {
        r.version = '';
      }
      log(`version: ${v.status} ${r.version}`);
    }
    listRes = await timedFetch(f, listUrl, { ...space, method: 'GET', headers, credentials: 'omit' }, waitMs, opts.signal);
    log(`models: ${listRes.status}`);
  } catch (e: any) {
    aborted();
    log(`cors request: ${e?.name ?? 'Error'} ${e?.message ?? ''}`.trim());
    const origin = siteOrigin();
    step('allowed', {
      status: 'fail',
      detail:
        kind === 'ollama'
          ? `Ollama is running but refused this website (${origin}). Ollama only accepts requests from pages on this computer unless you add this website's address to the OLLAMA_ORIGINS setting and restart Ollama.`
          : kind === 'lmstudio'
            ? `LM Studio is running but did not allow this website (${origin}). Turn on "Enable CORS" in LM Studio's server settings.`
            : `The program is running but did not allow this website (${origin}). Turn on CORS in the program, allowing ${origin}.`,
      fix: kind === 'lmstudio' ? lmStudioCorsFix() : kind === 'generic' ? [{ text: `Allow this website in the program's CORS settings:`, copy: origin }] : undefined,
      showOriginsFix: kind === 'ollama',
    });
    permStep();
    skipRest('allowed', 'Needs the program to allow this website first.');
    return r;
  }
  if (listRes.status === 401 || listRes.status === 403) {
    step('allowed', {
      status: 'fail',
      detail:
        kind === 'lmstudio'
          ? `LM Studio asked for a key (it answered ${listRes.status}): "Require Authentication" is on in its server settings. Create an API token there and paste it in API key above, or turn authentication off.`
          : `${name} asked for a key (it answered ${listRes.status}). Paste the key from the program's server settings in API key above, or turn authentication off there.`,
    });
    permStep();
    skipRest('allowed', 'Needs a key first.');
    return r;
  }
  step('allowed', { status: 'ok', detail: `${name} accepts requests from this website${r.version ? ` (Ollama ${r.version})` : ''}.` });

  // 3) Permission: requests got through, so nothing needs changing.
  if (r.permission?.state === 'granted') step('permission', { status: 'ok', detail: 'Allowed: this website may connect to programs on this computer.' });
  else step('permission', { status: 'ok', detail: r.permission ? 'Requests got through, so nothing needs changing.' : `${browser.name} does not ask for a separate permission here.` });

  // 4) Which models are installed?
  step('model', { status: 'running', detail: '' });
  if (listRes.ok) {
    try {
      r.models = parseModelList(await listRes.json());
    } catch {
      r.models = null;
    }
  }
  log(`installed: ${r.models ? r.models.map((m) => m.id).join(', ') || '(none)' : 'unknown'}`);
  const wanted = cfg.model.trim();
  if (r.models) {
    r.matchedModel = matchModel(wanted, r.models);
    if (!r.models.length) {
      step('model', {
        status: 'fail',
        detail: kind === 'ollama' ? 'Ollama has no models yet.' : `${name} has no model loaded.`,
        fix: kind === 'ollama' ? [{ text: 'Download a model (about 2 GB for llama3.2) in a terminal, then click Test connection again:', copy: pullCommand(wanted) }] : [{ text: 'In LM Studio, load a model (the model picker at the top of the window), then click Test connection again.' }],
      });
      skipRest('model', 'Needs a model first.');
      return r;
    }
    if (!wanted) {
      step('model', { status: 'fail', detail: `Choose one of the ${r.models.length} installed model${r.models.length === 1 ? '' : 's'} below.` });
      skipRest('model', 'Choose a model first.');
      return r;
    }
    if (!r.matchedModel) {
      step('model', {
        status: 'fail',
        detail: `"${wanted}" is not installed. Installed: ${r.models.slice(0, 6).map((m) => m.id).join(', ')}${r.models.length > 6 ? ', ...' : ''}. Choose one below, or install it.`,
        fix: kind === 'ollama' ? [{ text: 'To install it, run this in a terminal (it downloads a few GB), then click Test connection again:', copy: pullCommand(wanted) }] : [{ text: `Load "${wanted}" in ${name}, or choose an installed model below.` }],
      });
      skipRest('model', 'Needs an installed model first.');
      return r;
    }
    step('model', { status: 'ok', detail: `"${r.matchedModel}" is installed.` });
  } else {
    step('model', { status: wanted ? 'warn' : 'fail', detail: wanted ? `Could not list the installed models (the program answered ${listRes.status}). Trying "${wanted}" anyway.` : 'Type the model name above.' });
    if (!wanted) {
      skipRest('model', 'Needs a model name first.');
      return r;
    }
  }

  // 5) Ask for a one-word reply, streamed like the real features.
  step('answer', { status: 'running', detail: 'Asking for a one-word reply. The first answer can take a minute while the model loads into memory.' });
  try {
    const text = await askOpenAiCompatible({ baseUrl: base, apiKey: cfg.apiKey, model: r.matchedModel ?? wanted }, 'Reply with the single word OK.', {
      signal: opts.signal,
      onText: (t) => opts.onText?.(stripThinking(t)),
    });
    r.reply = stripThinking(text).trim();
    log(`answer: ${r.reply.slice(0, 40)}`);
    if (!r.reply) {
      step('answer', { status: 'warn', detail: 'It answered, but with an empty reply. Try another model.' });
    } else {
      step('answer', { status: 'ok', detail: `It answered: "${r.reply.slice(0, 60)}"${r.suggestedBaseUrl ? `. Save the address ${r.suggestedBaseUrl} to use it.` : ''}` });
      r.ok = !r.suggestedBaseUrl;
    }
  } catch (e: any) {
    if (opts.signal?.aborted || e?.code === 'cancelled') throw new AiUnavailableError('cancelled', 'Stopped.');
    log(`answer error: ${e?.code ?? ''} ${e?.detail ?? e?.message ?? ''}`.trim());
    const missing = e?.code === 'bad_model' || /not found|pull/i.test(String(e?.detail ?? ''));
    step('answer', {
      status: 'fail',
      detail: aiErrorText(e),
      fix: missing && kind === 'ollama' ? [{ text: 'Install the model, then try again:', copy: pullCommand(wanted) }] : undefined,
    });
  }
  emit();
  return r;
}

// ---------- "Copy details" ----------

/** A plain-text report for asking for help. Contains no API key. */
export function localDiagnostics(cfg: LocalCheckConfig, r: LocalCheckResult | null, n: any = nav()): string {
  const lines = [
    'Socius local AI check',
    `Time: ${new Date().toISOString()}`,
    `Website: ${siteOrigin()}`,
    `Browser: ${n?.userAgent ?? 'unknown'}`,
    `Computer: ${detectOs(n)}`,
    `Service: ${cfg.preset}`,
    `Base URL: ${normaliseBaseUrl(cfg.baseUrl)}`,
    `Model: ${cfg.model || '(empty)'}`,
    `API key: ${cfg.apiKey.trim() ? 'set (not shown)' : 'none'}`,
  ];
  if (r) {
    lines.push('', 'Steps:');
    for (const s of r.steps) lines.push(`- ${s.title} ${s.status.toUpperCase()}${s.detail ? `: ${s.detail}` : ''}`);
    lines.push('', 'Log:', ...r.log.map((l) => `  ${l}`));
  } else {
    lines.push('', 'Test connection has not been run yet.');
  }
  // Belt and braces: never include the key, even if a message echoed it.
  const key = cfg.apiKey.trim();
  const text = lines.join('\n');
  return key ? text.split(key).join('[key removed]') : text;
}
