#!/usr/bin/env node
// A tiny stand-in for Ollama (or LM Studio) for testing Socius's local AI check. Development only:
// it is not part of the app build.
//
// It serves what Socius uses: GET /, /api/version, /api/tags, /v1/models and POST /v1/chat/completions
// (streaming SSE and plain JSON), with the CORS behaviour of the real programs:
//   --cors ollama   (default) like Ollama: pages on localhost / 127.0.0.1 / 0.0.0.0 are allowed, plus any
//                   origin listed in --origins (like OLLAMA_ORIGINS); other origins get 403 with no CORS
//                   headers, so the browser reports a network error.
//   --cors none     like LM Studio with "Enable CORS" off: answers normally but without CORS headers.
//   --cors all      Access-Control-Allow-Origin: * for everyone.
//
// Usage:
//   node scripts/diagnostics/fake-ollama.mjs --port 11434 --models llama3.2:latest,qwen2.5:1.5b \
//        --origins https://hackhead95.github.io --reply "OK"
// "Not running" is simply: do not start it (or stop it), so the port is closed.
//
// From tests: import { startFakeOllama } from '.../fake-ollama.mjs'; const s = await startFakeOllama({...});
// s.set({ cors: 'none' }); s.requests; await s.close();

import http from 'node:http';
import { pathToFileURL } from 'node:url';

const DEFAULT_ALLOWED = /^(https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?|app:\/\/.*|file:\/\/.*|tauri:\/\/.*|vscode-webview:\/\/.*)$/i;
const ALLOW_HEADERS = 'Authorization, Content-Type, User-Agent, Accept, X-Requested-With, OpenAI-Beta';

/**
 * @typedef {{ port?: number, host?: string, cors?: 'ollama' | 'none' | 'all', origins?: string[],
 *   models?: string[], reply?: string, version?: string, chunkDelayMs?: number, flavour?: 'ollama' | 'lmstudio' }} FakeOptions
 */

function originAllowed(origin, opts) {
  if (!origin) return true;
  if (opts.cors === 'all') return true;
  if (opts.cors === 'none') return false;
  if (DEFAULT_ALLOWED.test(origin)) return true;
  return (opts.origins ?? []).some((o) => o === '*' || o === origin || (o.endsWith('*') && origin.startsWith(o.slice(0, -1))));
}

function modelMatches(wanted, installed) {
  const w = String(wanted ?? '').toLowerCase();
  return installed.find((m) => m.toLowerCase() === w || m.toLowerCase() === `${w}:latest`);
}

/** @param {FakeOptions} initial */
export async function startFakeOllama(initial = {}) {
  /** @type {Required<FakeOptions>} */
  const opts = { port: 11434, host: '127.0.0.1', cors: 'ollama', origins: [], models: ['llama3.2:latest'], reply: 'OK', version: '0.12.3', chunkDelayMs: 5, flavour: 'ollama', ...initial };
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;
    const url = new URL(req.url ?? '/', 'http://x');
    let body = '';
    for await (const c of req) body += c;
    requests.push({ method: req.method, path: url.pathname, origin: origin ?? null, auth: req.headers.authorization ?? null, body });

    const allowed = originAllowed(origin, opts);
    const cors = {};
    if (origin && allowed && opts.cors !== 'none') {
      cors['Access-Control-Allow-Origin'] = opts.cors === 'all' ? '*' : origin;
      cors['Vary'] = 'Origin';
    }
    // Ollama (gin-contrib/cors) rejects a disallowed Origin with 403 and no CORS headers.
    if (origin && !allowed && opts.cors === 'ollama') {
      res.writeHead(403);
      return res.end();
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { ...cors, ...(Object.keys(cors).length ? { 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS', 'Access-Control-Allow-Headers': ALLOW_HEADERS, 'Access-Control-Max-Age': '43200' } : {}) });
      return res.end();
    }
    const json = (status, data) => {
      res.writeHead(status, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '')) {
      res.writeHead(200, { ...cors, 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(opts.flavour === 'ollama' ? 'Ollama is running' : '{"error":"Unexpected endpoint or method. (GET /)"}');
    }
    if (req.method === 'GET' && url.pathname === '/api/version' && opts.flavour === 'ollama') return json(200, { version: opts.version });
    if (req.method === 'GET' && url.pathname === '/api/tags' && opts.flavour === 'ollama') {
      return json(200, {
        models: opts.models.map((name) => ({ name, model: name, modified_at: '2026-09-01T10:00:00Z', size: 2019393189, digest: 'a80c4f17acd5', details: { format: 'gguf', family: 'llama', parameter_size: '3.2B', quantization_level: 'Q4_K_M' } })),
      });
    }
    if (req.method === 'GET' && url.pathname === '/v1/models') {
      return json(200, { object: 'list', data: opts.models.map((id) => ({ id, object: 'model', created: 1756720800, owned_by: opts.flavour === 'ollama' ? 'library' : 'organization_owner' })) });
    }
    if (req.method === 'POST' && url.pathname === '/v1/chat/completions') {
      let payload;
      try {
        payload = JSON.parse(body);
      } catch {
        return json(400, { error: { message: 'invalid JSON body', type: 'invalid_request_error' } });
      }
      const model = modelMatches(payload.model, opts.models);
      if (!model) return json(404, { error: { message: `model "${payload.model}" not found, try pulling it first`, type: 'api_error', param: null, code: null } });
      const created = Math.floor(Date.now() / 1000);
      if (payload.stream) {
        res.writeHead(200, { ...cors, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        const pieces = opts.reply.match(/.{1,3}/gs) ?? [''];
        for (const [i, p] of pieces.entries()) {
          const chunk = { id: 'chatcmpl-1', object: 'chat.completion.chunk', created, model: payload.model, system_fingerprint: 'fp_ollama', choices: [{ index: 0, delta: { role: 'assistant', content: p }, finish_reason: i === pieces.length - 1 ? 'stop' : null }] };
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          await new Promise((r) => setTimeout(r, opts.chunkDelayMs));
        }
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      return json(200, { id: 'chatcmpl-1', object: 'chat.completion', created, model: payload.model, system_fingerprint: 'fp_ollama', choices: [{ index: 0, message: { role: 'assistant', content: opts.reply }, finish_reason: 'stop' }], usage: { prompt_tokens: 10, completion_tokens: 1, total_tokens: 11 } });
    }
    res.writeHead(404, { ...cors, 'Content-Type': 'text/plain' });
    res.end('404 page not found');
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port, opts.host, resolve);
  });
  const port = /** @type {import('node:net').AddressInfo} */ (server.address()).port;
  return {
    port,
    url: `http://localhost:${port}`,
    requests,
    /** @param {Partial<FakeOptions>} patch */
    set(patch) {
      Object.assign(opts, patch);
    },
    close() {
      return new Promise((resolve) => {
        server.closeAllConnections?.();
        server.close(() => resolve(undefined));
      });
    },
  };
}

// ---------- command line ----------

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const get = (name, d) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d;
  };
  const list = (v) => (v ? String(v).split(',').map((x) => x.trim()).filter(Boolean) : []);
  const s = await startFakeOllama({
    port: Number(get('port', 11434)),
    host: get('host', '127.0.0.1'),
    cors: get('cors', 'ollama'),
    origins: list(get('origins', process.env.OLLAMA_ORIGINS ?? '')),
    models: list(get('models', 'llama3.2:latest')),
    reply: get('reply', 'OK'),
    flavour: get('flavour', 'ollama'),
  });
  console.log(`fake ${get('flavour', 'ollama')} listening on ${s.url} (cors: ${get('cors', 'ollama')})`);
}
