# Calling Ollama and LM Studio from an HTTPS website (September 2026)

## What to do (for implementers)

1. **Three gates must all pass.** (a) the program is running and listening; (b) it allows our origin via CORS: Ollama `OLLAMA_ORIGINS=https://hackhead95.github.io` (exact origin, no path, no trailing slash, **no spaces after commas**); LM Studio **Enable CORS**; (c) the browser allows a public site to reach loopback. Chrome/Edge 142+ and Firefox 151+ show a permission prompt ("Apps on device" / "Device apps and services"). Safari still blocks `http://localhost` from https as mixed content.
2. **Detect each gate separately.** Use `navigator.permissions.query({name:'loopback-network'})`, falling back to `'local-network-access'`. Wrap it in try/catch because Firefox and Safari throw for unknown names. Next, a `mode:'no-cors'` GET to the server root: an opaque success means the program is running, and a TypeError means it is not running or the browser blocked it. Last, a normal CORS GET to the model list: a TypeError here, after the no-cors probe succeeded, means CORS or origin.
3. **Pass `targetAddressSpace: 'loopback'` in the fetch init for localhost URLs.** Chrome 142+ supports it (it enables the prompt path and the mixed-content relaxation). Other browsers ignore unknown init keys. Do not rely on the old PNA header `Access-Control-Allow-Private-Network`: Chrome replaced PNA with the LNA permission.
4. **Models:** Ollama `GET /api/tags` (native: `models[].name`, `details.parameter_size`, `details.quantization_level`, `size`) or `GET /v1/models` (`data[].id`). LM Studio `GET /v1/models` (OpenAI shape), or `GET /api/v1/models` / `GET /api/v0/models` (native, with `state: loaded|not-loaded`). Ollama `GET /api/version` is a cheap "is it Ollama" probe.
5. **User instructions per OS** (Ollama): **Windows**: quit Ollama from the tray, set a *user* environment variable `OLLAMA_ORIGINS`, start Ollama again. **macOS app**: `launchctl setenv OLLAMA_ORIGINS "https://hackhead95.github.io"`, then quit and reopen (this does not survive a reboot). **Linux systemd**: `sudo systemctl edit ollama.service`, add `[Service]` `Environment="OLLAMA_ORIGINS=https://hackhead95.github.io"`, then `sudo systemctl daemon-reload && sudo systemctl restart ollama`.

Labels: **[verified]** = official docs or source code; **[reported]** = blog, forum or third-party docs; **[inferred]** = our reasoning.

---

## 1. Ollama

### OLLAMA_ORIGINS: exact semantics [verified: `envconfig/config.go` and `server/routes.go` on ollama/ollama `main`]

- `AllowedOrigins()` reads `OLLAMA_ORIGINS`. It trims surrounding whitespace and quotes of the **whole** value (`strings.Trim(strings.TrimSpace(v), "\"'")`), then does `strings.Split(s, ",")`. **Items are not trimmed individually**, so `https://a, https://b` makes the second entry `" https://b"`, which never matches **[inferred from code]**. Tell users: no spaces.
- The defaults are **always appended**, whatever you set:
  - `http(s)://localhost`, `http(s)://127.0.0.1`, `http(s)://0.0.0.0`, and each of these with `:*`
  - `app://*`, `file://*`, `tauri://*`, `vscode-webview://*`, `vscode-file://*`
  - So setting it is additive.
- CORS middleware: `gin-contrib/cors` with `AllowWildcard = true` and `AllowBrowserExtensions = true`. Wildcards such as `https://*.github.io` work. `*` alone allows any site (unsafe: any page the user visits could use their models). Allowed request headers: `Authorization, Content-Type, User-Agent, Accept, X-Requested-With, OpenAI-Beta, x-stainless-*`. Do not send other custom headers, or the preflight fails **[verified list; failure inferred]**.
- For a disallowed origin, gin-contrib/cors aborts with **403 and no `Access-Control-Allow-Origin`**. The browser reports a generic TypeError ("Failed to fetch"). A `no-cors` request still resolves (opaque), which is how we tell "running but CORS-blocked" apart from "not running" **[inferred from gin-contrib/cors behaviour; matches the existing `ai-local.ts` probe]**.
- `allowedHostsMiddleware`: when Ollama is bound to loopback it checks the request **Host** header. It accepts `localhost`, IP literals that are loopback, private or unspecified, the machine hostname, and `*.localhost`, `*.local`, `*.internal`. So `http://localhost:11434` and `http://127.0.0.1:11434` both work **[verified]**.
- The value to give Socius users: `OLLAMA_ORIGINS=https://hackhead95.github.io`. The origin is scheme plus host only; the `/socius/` path is not part of an origin. **[verified: CORS spec; inferred for our site]**

### Setting it per OS [verified: `docs/faq.mdx` on ollama/ollama `main`, sections "How do I configure Ollama server?" and "How can I allow additional web origins to access Ollama?"]

| OS | Steps |
|---|---|
| **Windows (app/tray)** | "Ollama inherits your user and system environment variables." 1) Quit Ollama from the taskbar tray icon. 2) Settings (Win 11) or Control Panel (Win 10) → search "environment variables" → **Edit environment variables for your account**. 3) New variable `OLLAMA_ORIGINS` = `https://hackhead95.github.io`. 4) OK. 5) Start Ollama from the Start menu. (PowerShell equivalent: `setx OLLAMA_ORIGINS "https://hackhead95.github.io"`, then quit and restart Ollama **[inferred]**.) |
| **macOS app** | `launchctl setenv OLLAMA_ORIGINS "https://hackhead95.github.io"`, then restart the Ollama app (menu bar icon → Quit, reopen). `launchctl setenv` is lost at reboot **[reported, widely]**. For a permanent setting, users re-run it or use a LaunchAgent plist **[inferred]**. |
| **Linux (systemd)** | `sudo systemctl edit ollama.service` → under `[Service]` add `Environment="OLLAMA_ORIGINS=https://hackhead95.github.io"` → `sudo systemctl daemon-reload && sudo systemctl restart ollama`. |
| **Manual `ollama serve`** | `OLLAMA_ORIGINS=https://hackhead95.github.io ollama serve` (bash), or `$env:OLLAMA_ORIGINS="https://hackhead95.github.io"; ollama serve` (PowerShell). |
| **Docker** | `docker run -e OLLAMA_ORIGINS=https://hackhead95.github.io -p 11434:11434 ollama/ollama` **[inferred]**. |

- The desktop app's Settings has "Expose Ollama to the network" (Windows and macOS). That changes the bind address (like `OLLAMA_HOST=0.0.0.0`), **not** CORS. We found no origins field in the app UI. **[reported: [digitalcitizen](https://www.digitalcitizen.life/how-to-expose-ollama-to-the-network-on-windows/), [ollama #11153](https://github.com/ollama/ollama/issues/11153)]** Users do not need to expose to the network for Socius.
- Check the value: `ollama serve` logs the config at startup, including `OLLAMA_ORIGINS:[…]` **[verified: envconfig `AsMap` includes OLLAMA_ORIGINS; log format inferred]**.

### Endpoints [verified: `server/routes.go`]

- `GET/HEAD /api/version` → `{"version": "x.y.z"}`: a cheap identity probe.
- `GET/HEAD /api/tags`: installed models (native). `GET /api/ps`: loaded models.
- `GET /v1/models`: OpenAI-shaped list. `POST /v1/chat/completions`: OpenAI-compatible chat, which supports `tools` and `stream`. Native `POST /api/chat` also exists.
- Model missing: 404 `{"error":"model \"x\" not found, try pulling it first"}` **[reported, widely seen]**.

## 2. LM Studio

- CORS is **off by default**. Turn it on in **Developer → Server Settings → Enable CORS**, or with `lms server start --cors`. **[verified: `lmstudio-ai/docs` `3_cli/1_serve/server-start.mdx`: "Enable CORS support for web application development. When not set, CORS is disabled"; GUI toggle reported via [docs page](https://lmstudio.ai/docs/developer/core/server/settings) snippets]** LM Studio's CORS is an on/off switch, not an origin allowlist **[reported]**.
- Default port **1234**, bound to `127.0.0.1` (`--bind 0.0.0.0` or the "Serve on Local Network" toggle exposes it; Socius does not need that). **[verified: same doc]**
- Optional **Require Authentication** (0.4+): the user creates an API token and requests send `Authorization: Bearer <token>`. It is off by default. **[reported: [LM Studio auth docs](https://lmstudio.ai/docs/developer/core/authentication) snippets]** Socius should let the user paste a token in the "API key" field (the OpenAI-compatible path already sends Bearer).
- Models: `GET /v1/models` (OpenAI shape, `data[].id`). Native REST: `GET /api/v1/models` (0.4+) or legacy `GET /api/v0/models`, both with `state: "loaded" | "not-loaded"`, type (`llm`/`vlm`/`embeddings`), quantization, max context. **[reported: LM Studio docs snippets]** JIT loading means requesting a not-loaded model may load it, which is slow the first time **[reported]**.
- Old advice ("enable CORS **and** Serve on Local Network to fix `Access-Control-Allow-Private-Network`", [lmstudio-bug-tracker #392](https://github.com/lmstudio-ai/lmstudio-bug-tracker/issues/392)) comes from Chrome's retired PNA preflight. In 2026 the fix for Chrome is the permission prompt, not a server header **[inferred]**.

## 3. Browser gates

### Chrome / Edge: Local Network Access (LNA) [verified: MDN source (mdn/content `web/security/defenses/local_network_access`) and mdn/browser-compat-data; reported: Chrome blog snippets]

- **Chrome 142 (Oct 2025)** started gating requests from public sites to local or loopback addresses behind a permission prompt. The permission is `local-network-access`. **Chrome 145** split it into `local-network` (LAN devices) and `loopback-network` (this computer: `127.0.0.0/8`, `::1`, `localhost`). The old name is kept as an alias. BCD: `Request.targetAddressSpace` from Chrome 142; `permission_loopback-network` and `permission_local-network` from 145; Edge mirrors Chrome. **[verified: BCD]**
- The UI label changed: Chrome ≤144 prompt text was "Look for and connect to any device on your local network", with the site setting "Local network access". Newer Chrome shows **"Apps on device"** for loopback. **[reported: [Okta help](https://help.okta.com/eu/en-us/content/topics/end-user/ov-device-lna-prompt.htm), search snippets]**
- It replaces PNA (CORS preflight plus the `Access-Control-Allow-Private-Network` header). With LNA, servers need **no** extra header. The user decides. **[reported: [openreplay](https://blog.openreplay.com/chrome-local-network-access-lna-permission/), Chrome blog snippets]**
- Behaviour:
  - The permission requires a secure context: our https site is fine.
  - The prompt appears on the **first** request.
  - While the prompt is pending, the request waits. If the user denies (or dismisses) it, `fetch` rejects with a TypeError.
  - Once denied, later requests fail **silently** (no new prompt) until the user resets it: click the site-controls icon left of the address → **Site settings** → "Apps on device" / "Local network access" → Allow. Or open `chrome://settings/content/siteDetails?site=https%3A%2F%2Fhackhead95.github.io`.
  - **[verified: MDN "user will be shown a permission dialog… allow or deny"; reset path reported]**
- **Mixed content:** `http://localhost` and `http://127.0.0.1` are "potentially trustworthy", so https→`http://localhost` is not blocked as mixed content in Chrome or Firefox. Once the permission is granted, LNA also relaxes mixed content for private IP literals and `.local`. `targetAddressSpace` is needed only when a *public-looking hostname* resolves to a local address. **[verified: MDN]**
- `targetAddressSpace: 'loopback'` in the `fetch` init is harmless and future-proof. Chrome validates that the resolved address really is loopback **[verified: WICG explainer]**. Safari 26.4 release notes mention fixing "fetch() would throw a TypeError when using `targetAddressSpace: 'loopback'`", which suggests WebKit is implementing it **[reported: search snippets of webkit.org blog; BCD still says Safari: no]**.
- Enterprise: admins can pre-allow via policies (for example `LocalNetworkAccessAllowedForUrls`) **[reported: Okta and Duo KB articles]**.
- Iframes need `allow="loopback-network"` (or `local-network-access`). Socius is top-level on GitHub Pages, so this does not apply. **Inside the claude.ai Artifact viewer the app is in a sandboxed iframe we do not control, so local AI will not work there [inferred]**.

### Firefox [reported]

- LNA prompts: Firefox 149 for ETP Strict users, then **gradual rollout to everyone from Firefox 151 (19 May 2026)**, and WebSockets gated from Firefox 154. The permission for this computer is called **"Device apps and services"**. Manage it under Settings → Privacy & Security → Permissions → Device apps and services → Settings…, or through the site-info padlock. There is an enterprise policy `LocalNetworkAccess`. Sources: [Firefox 151 notes](https://www.firefox.com/en-US/firefox/151.0/releasenotes/), [admin policy](https://firefox-admin-docs.mozilla.org/reference/policies/localnetworkaccess/), [cyberinsider on 154](https://cyberinsider.com/firefox-154-blocks-silent-websocket-access-to-local-network-devices/), [bugzilla 2059274](https://bugzilla.mozilla.org/show_bug.cgi?id=2059274).
- BCD lists **no** Firefox support for the `loopback-network` Permissions API name or `targetAddressSpace`. `permissions.query` with those names **throws a TypeError** in Firefox, so wrap it **[verified: BCD; throw behaviour is standard for unknown enum values]**.
- Firefox 84+ treats `localhost` and `127.0.0.1` as potentially trustworthy (no mixed-content block) **[reported]**.

### Safari [reported]

- Safari is "the only browser that blocks mixed-content `http://localhost` requests" from https pages ([WebKit bug 171934](https://bugs.webkit.org/show_bug.cgi?id=171934) is the long-open request to stop that). In practice an https site cannot call `http://localhost:11434` from Safari. Workarounds: run the local server with HTTPS and a trusted local certificate (hard for users), or use Chrome, Edge or Firefox. **What Socius should do [inferred]:** detect Safari and say "Safari blocks this; use Chrome, Edge or Firefox for a local model, or use the on-device model or Gemini."
- Safari has no WebGPU-free fallback for local AI; see `webllm-in-2026.md`.

### localhost vs 127.0.0.1 [inferred unless noted]

- Both are loopback for LNA and for Ollama's host check **[verified]**.
- `localhost` may resolve to `::1` first. Ollama listens on `127.0.0.1:11434` (IPv4) by default. Browsers fall back to IPv4 (happy eyeballs), so this rarely matters, but a proxy or VPN tool can break `localhost`. Recommended default: `http://localhost:11434`; on a network error, retry `http://127.0.0.1:11434` once and remember which worked.
- The existing `ai-local.ts` comment says 127.0.0.1 is treated as mixed content "by some browsers; localhost is allowed". Per spec and in Chrome and Firefox **both** are allowed; Safari blocks **both**. Update the wording.

## 4. Detecting each failure from JS

```ts
async function loopbackPermission(): Promise<'granted'|'denied'|'prompt'|'unknown'> {
  for (const name of ['loopback-network', 'local-network-access']) {
    try { return (await navigator.permissions.query({ name } as any)).state as any; } catch { /* unsupported name */ }
  }
  return 'unknown';               // Firefox/Safari: cannot know in advance
}
const init = { targetAddressSpace: 'loopback' } as RequestInit; // ignored where unsupported
// 1) running?  no-cors never needs CORS approval; resolves (opaque) whenever something answered
try { await fetch(`${root}/api/version`, { ...init, mode: 'no-cors', cache: 'no-store' }); running = true } catch { running = false }
// 2) CORS / origin allowed?
try { const r = await fetch(`${root}/api/tags`, init); corsOk = r.ok } catch { corsOk = false }
```

| Observation | Meaning | Tell the user |
|---|---|---|
| `isSecureContext` true, Safari UA, both fetches fail | Safari mixed-content block | use Chrome, Edge or Firefox |
| permission `denied` | user blocked "Apps on device" | reset in site settings (path above) |
| permission `prompt` and fetch pending more than ~2 s | a prompt is probably showing | "Click **Allow** in the browser's prompt" (show before the first request) |
| no-cors fails, permission granted or unknown | program not running, wrong port, or firewall | start Ollama / LM Studio; check the port |
| no-cors OK, CORS fetch TypeError | origin not allowed | set `OLLAMA_ORIGINS` / enable CORS in LM Studio, then restart the program |
| CORS OK, 404 on chat with "not found, try pulling" | model not installed | `ollama pull <model>` |
| 401 on LM Studio | "Require Authentication" is on | paste the LM Studio API token |

Error text differs by browser: Chrome "Failed to fetch", Firefox "NetworkError when attempting to fetch resource.", Safari "Load failed". Never parse these strings; use the probe sequence **[reported, common knowledge]**.

Note: the no-cors probe also triggers the LNA prompt in Chrome (LNA covers all subresource and fetch requests **[verified: MDN list]**). Run the probe only after the user presses "Test connection", so the prompt is expected.
