# Privacy-preserving client-side error logging without a backend

## What to do (for implementers)

1. **Socius already follows the right pattern.** `src/platform/errorlog.ts` is a localStorage ring buffer (300 entries / 200 KB), with repeat-collapsing, strict redaction (keys including `AQ.`, tokens, URLs without query strings, e-mails, quoted text, file names, project terms), and structured context. `features/errorlog/install.ts` has global `error` and `unhandledrejection` handlers. `AppErrorBoundary` gives a report link. There is a prefilled GitHub issue-form URL capped at 6,000 chars. Keep it. The items below are additions.
2. **Add React 19 root hooks:** `createRoot(el, { onUncaughtError, onCaughtError, onRecoverableError })`. Log `errorInfo.componentStack` trimmed to component names only. Today `main.tsx` passes no options, so errors caught by nested boundaries (and recoverable hydration or concurrent errors) are not logged centrally.
3. **Catch the browser-specific failures that matter here:**
   - Lazy-chunk load failures ("Failed to fetch dynamically imported module" / "error loading dynamically imported module" / `ChunkLoadError`) after a redeploy: offer "Reload to get the new version".
   - `securitypolicyviolation`.
   - WebGPU `device.lost` and `uncapturederror`.
   - `QuotaExceededError` on storage.
   - Resource load errors: capture-phase `error` on `window` for `<script>`/`<link>` targets.
   - Dedupe StrictMode double-invocations.
4. **The GitHub prefill limit is 8,191 bytes for the whole URL** (414 "URI Too Long" above that). Keep the 6,000-character budget, measure the **encoded** URL (already done), and put only a short summary in the URL. The full report goes through Copy or Download. Issue-form fields are prefilled by their `id` (`&error-report=`).
5. **Origin caveat:** every GitHub Pages project of the same user shares the origin `https://hackhead95.github.io`. localStorage and IndexedDB, including **AI keys**, the error log and autosaved datasets, are readable by any other page published under that account. Keep Socius the only site under that account, or move it to its own (sub)domain. Document this in the privacy notes.

Labels: **[verified]** = official docs or source read; **[reported]** = secondary sources; **[inferred]** = ours.

---

## 1. Capture points (what to hook)

| Source | API | Notes |
|---|---|---|
| Uncaught exceptions | `window.addEventListener('error', e)` → `e.error ?? e.message`, `e.filename`, `e.lineno` | Cross-origin scripts give "Script error." with no details unless the script has `crossorigin` and CORS; all Socius code is same-origin [inferred]. Socius has this [verified: `install.ts`] |
| Resource load failures | `window.addEventListener('error', e => { if (e.target !== window) … }, true)` (**capture phase**; these events do not bubble) | Logs the failing `<script src>` / `<link href>` path (strip the query). This is how you see a lazy chunk or font that failed to load [inferred, standard DOM] |
| Promise rejections | `unhandledrejection` → `e.reason` | Socius has this [verified] |
| React render errors | Error boundary `componentDidCatch(error, info)`; React 19 root options `onCaughtError(error, {componentStack})`, `onUncaughtError`, `onRecoverableError` | React 19: uncaught errors go to `window.reportError`, caught ones to `console.error`; the root options let you customise both [reported: [React 19 blog](https://react.dev/blog/2024/12/05/react-19), [createRoot docs](https://react.dev/reference/react-dom/client/createRoot)]. Pass `componentStack` through a filter that keeps only component names (drop file URLs with `?v=` hashes) |
| Dynamic import failures | `import()` rejection. Message differs: Chrome "Failed to fetch dynamically imported module", Firefox "error loading dynamically imported module", Safari "Importing a module script failed." | Typical after a redeploy when an old tab asks for a hashed chunk that no longer exists. Vite also emits `vite:preloadError` on `window` [reported: Vite docs "Load Error Handling"]. Handle it: log, then offer a reload. Remember the reload in `sessionStorage` to avoid loops |
| CSP violations | `document.addEventListener('securitypolicyviolation', e)` → `e.violatedDirective`, `e.blockedURI` (origin only) | Only if a CSP is added later |
| WebGPU | `device.lost.then(info => …)`, `device.addEventListener('uncapturederror', …)` | Out-of-memory in WebLLM. Log the reason and `adapter.info` vendor/architecture (not the device ID) [inferred] |
| Storage | catch `QuotaExceededError` / `DOMException` name on `setItem`, IndexedDB `onerror` | Socius falls back to memory [verified: header comment] |
| Slow operations | `performance.now()` around procedures; optionally `PerformanceObserver({type:'longtask'})` (Chromium only) | Socius has `logSlow` (> 5 s) [verified] |
| Network/AI failures | log a structured code (`invalid_key`, `rate_limited`, HTTP status, API reason) instead of the raw body | Socius does this in `ai-http.ts` (records "without keys") [verified] |

## 2. Ring buffer design

- **Store:** localStorage is synchronous and simple, with a 5 MiB-ish per-origin limit in all major browsers [reported, common knowledge]. Keep the buffer small; Socius uses ≤200 KB and ≤300 entries [verified]. Write inside `try/catch`, and batch writes with `requestIdleCallback`/`setTimeout(0)` to avoid jank during error storms [inferred].
- **Dedupe:** key = level + area + message + first stack frame. Collapse repeats within 60 s into `count` [verified: Socius `REPEAT_MS = 60_000`]. StrictMode double effects and React retries otherwise double entries [inferred].
- **Rate-limit:** at most N entries per second (for example 20), then one "…N more suppressed" entry [inferred].
- **Session id** per page load, with app version and build hash on every report [verified: `BUILD_INFO`].
- **Multi-tab:** two tabs writing the same key can overwrite each other. Re-read before write (read-modify-write in one tick), or use a `BroadcastChannel('socius-log')` to merge. Accept small loss [inferred].
- **Retention:** also drop entries older than 30 days on load [inferred].

## 3. Redaction rules (checklist)

What Socius already does [verified in `errorlog.ts`]:
- Google `AIza…`, `AQ.…` and `ya29.…`, `sk-…`, `gsk_…`, `hf_/ghp_/github_pat_/xox*`, JWTs, `Bearer/Basic/Token` headers, `key=/token=/secret=` parameters, `x-goog-api-key:` / `authorization:` text.
- URLs lose their query string and fragment; key-like path segments are removed.
- `data:` URLs, e-mails, quoted text, file names with data extensions.
- Project-specific names and labels (via `setSensitiveTermsProvider`).
- High-entropy strings (`looksSecret`: runs of 20+ alphanumerics with many case or digit transitions, or 32+ hex characters).
- Unknown objects are never serialised; everything is truncated (message 300, detail 2,000, 8 stack frames).

Additions to consider [inferred]:
- **Numbers that could be data:** error messages such as `Cannot parse "4721.5" in row 18` carry values. The quoted-text rule catches quoted ones. Also mask unquoted numbers in messages from data procedures (`area in {import, transform, analysis}`), but keep HTTP codes and line:column numbers.
- **Phone numbers and Indian IDs:** 10-digit mobile numbers (`/\b[6-9]\d{9}\b/`) and Aadhaar-like 12-digit groups (`/\b\d{4}\s?\d{4}\s?\d{4}\b/`) appear in pasted field data. Replace them with `[number removed]`.
- **Stack frames:** keep the function name and `file:line:col` with the file reduced to its basename (no origin), for example `Crosstabs.tsx:120:14`. Hashed Vite chunk names are fine.
- **componentStack:** keep only `at ComponentName` tokens.
- **Test** the redactor with a corpus of fake secrets (the Socius tests already cover much of this) and a property test: `redact(redact(x)) === redact(x)`, and no output contains any input substring of 20+ characters that `looksSecret` flags.

## 4. Report export and GitHub issue prefill

- **Copy report / Download .txt:** plain text with a header:
  - app version and build;
  - browser and OS from UA-CH `navigator.userAgentData` where available, else a parsed UA summary;
  - screen size bucket;
  - the WebGPU yes/no line;
  - active AI provider id (no key);
  - dataset size only;
  - then the entries newest first.

  Socius has `downloadErrorReport` / Copy [verified]. In the Claude Artifact, downloads go through `saveFile` [verified: ARCHITECTURE.md].
- **GitHub prefill** [reported: [GitHub Docs "Creating an issue" – query parameters](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue); limit from [github/docs #5136](https://github.com/github/docs/issues/5136) and the [github-limits collection](https://github.com/dead-claudia/github-limits)]:
  - Supported query parameters: `title`, `body`, `labels`, `assignees`, `milestone`, `projects`, `template`.
  - For issue **forms** (YAML templates), any field can be prefilled by its `id` as a query parameter, for example `?template=bug_report.yml&browser=…&error-report=…`.
  - The server-side limit is **8,191 bytes** for the URL, and a longer one returns **414 URI Too Long**. The budget is for the percent-encoded URL: non-ASCII text (Bengali or Devanagari labels, which are redacted anyway) expands 3× in UTF-8 and then again when percent-encoded.
  - The issue body limit is 65,536 characters [reported: community discussion #41331].
  - Socius caps at `MAX_FEEDBACK_URL = 6000`, trims whole lines, and appends "(shortened: use Copy report…)" [verified: `features/errorlog/actions.ts`]. That leaves margin for proxies. Good.
  - Also make sure the `template=` file name and field ids exist in `.github/ISSUE_TEMPLATE/bug_report.yml`. If they are missing, GitHub silently ignores the params [inferred].
- **User consent:** show the exact text that will go into the URL before opening GitHub. Issues are public, so warn "this will be visible to anyone". Default the summary to "last 5 errors" [verified: `formatSummary(5)`].

## 5. Error boundaries: practical rules [inferred unless noted]

- One **app-level** boundary (Socius `AppErrorBoundary` [verified]) plus **feature-level** boundaries around the Output viewer, each chart, each dialog, the coding workspace and the assistant panel. One broken chart must not blank the app. Reset keys: the dialog id or output item id.
- Boundaries do not catch errors in event handlers, async code or timers; those reach `error`/`unhandledrejection` or explicit `try/catch` + `logFailure` [reported: React docs].
- The fallback UI offers Retry (reset the boundary), "Copy error report", "Report on GitHub", and "Save your work" (export project). Never show the raw stack to users; keep it in the log.
- After a caught render error, check that the zustand store is still consistent. If the error came from a reducer, restore the last undo snapshot.

## 6. Security and privacy notes [inferred]

- **Shared origin on GitHub Pages:** user and project Pages sites all live on `https://<user>.github.io` and **share one origin**. Any other repository of `hackhead95` that enables Pages can read Socius's localStorage and IndexedDB: saved API keys, autosaved datasets, the error log. Mitigations:
  - Keep that account for Socius only.
  - Use a custom domain (for example `socius.example.org`) so the origin is unique.
  - At minimum, say so in the privacy section and in the AI settings next to "keys are stored in this browser".
- Never log request or response bodies from AI providers. They may contain excerpts.
- Offer "Clear error log" and include the log in "Clear all local data".
- No third-party error SaaS (Sentry and the like) unless it is opt-in: it would contradict the "nothing leaves your browser" promise.
