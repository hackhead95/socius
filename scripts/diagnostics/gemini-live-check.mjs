#!/usr/bin/env node
// Real-network check of Socius's Google Gemini connection, in a real browser (Chromium via Playwright),
// using the app's own AI assistant settings > Test connection. Development and support only: not part
// of the app build or of CI.
//
// With GEMINI_API_KEY set, it runs the full step-by-step check against Google with that key and expects
// success. Without a key, it checks the "key not accepted" paths with made-up keys (one "AQ." auth key,
// one older "AIza" key), which reach Google and must be refused with the right plain-English message.
// The key is only typed into the page (as a user would); it is never printed, and the report the app
// produces is checked to be free of it.
//
// Usage:
//   GEMINI_API_KEY=AQ.... node scripts/diagnostics/gemini-live-check.mjs            # build and serve locally
//   GEMINI_API_KEY=AQ.... node scripts/diagnostics/gemini-live-check.mjs --url https://hackhead95.github.io/socius/
//   node scripts/diagnostics/gemini-live-check.mjs                                   # no key: refusal paths only
// Options: --url <address of a running Socius> (default: build this checkout and serve it on --port,
// default a free port), --model <name> (default automatic), --headed.
// Behind a proxy (HTTPS_PROXY set), the browser uses it and accepts the proxy's TLS certificate.
// Exit code 0 when every expectation holds, 1 otherwise.

import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const realKey = (process.env.GEMINI_API_KEY ?? '').trim();
const model = opt('model', process.env.GEMINI_MODEL ?? '');
let port = Number(opt('port', '0'));
let url = opt('url', '');

const FAKE_AQ = 'AQ.Ab8RN6LsociusLiveCheckFakeKey_0123456789abcdefghijklmnop';
const FAKE_AIZA = 'AIzaSyD-sociusLiveCheckFakeKey0123456';

const log = (...a) => console.log(...a);
let failures = 0;
const expect = (ok, what) => {
  log(`  ${ok ? 'PASS' : 'FAIL'}  ${what}`);
  if (!ok) failures++;
};

function run(cmd, cmdArgs, { wait = true } = {}) {
  const child = spawn(cmd, cmdArgs, { stdio: wait ? 'inherit' : 'ignore', shell: process.platform === 'win32' });
  if (!wait) return child;
  return new Promise((resolve, reject) => child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${cmdArgs.join(' ')} exited with ${code}`)))));
}

/** A port nobody is listening on (so we never test someone else's server by mistake). */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
  });
}

async function waitForServer(address, ms = 60_000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try {
      const r = await fetch(address);
      if (r.ok) return;
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No server at ${address}`);
}

/** Open Socius with this Gemini key, run Test connection, and return the steps and the report. */
async function checkWithKey(browser, key, label) {
  const context = await browser.newContext({ ignoreHTTPSErrors: !!process.env.HTTPS_PROXY });
  const page = await context.newPage();
  await page.addInitScript(
    ({ k, m }) => {
      localStorage.setItem('socius.ai', JSON.stringify({ provider: 'gemini', gemini: { apiKey: k, model: m } }));
    },
    { k: key, m: model },
  );
  await page.goto(url);
  await page.getByRole('menuitem', { name: 'AI', exact: true }).click({ timeout: 60_000 });
  await page.getByRole('menuitem', { name: 'AI assistant settings...' }).click();
  const dlg = page.getByRole('dialog', { name: 'AI assistant' });
  await dlg.getByRole('button', { name: 'Test connection' }).click();
  try {
    await dlg.locator('.ai-check[data-result="ok"], .ai-check[data-result="fail"]').waitFor({ timeout: 150_000 });
  } catch (e) {
    log(`\n=== ${label}: the check did not finish in 150 s. The dialog shows: ===\n${await dlg.innerText().catch(() => '(unreadable)')}`);
    await context.close();
    throw e;
  }
  const result = await dlg.locator('.ai-check').getAttribute('data-result');
  const steps = await dlg.locator('.ai-check-step').evaluateAll((els) =>
    els.map((e) => {
      const label = e.querySelector('.ai-check-label')?.cloneNode(true);
      label?.querySelector('.sr-only')?.remove();
      const detail = e.querySelector('.ai-check-detail')?.textContent ?? '';
      return { id: e.getAttribute('data-step'), state: e.getAttribute('data-state'), text: `${label?.textContent?.trim() ?? ''}${detail ? `: ${detail}` : ''}` };
    }),
  );
  const status = (await dlg.locator('.ai-test-result').innerText()).trim();
  const reason = result === 'fail' ? (await dlg.locator('.ai-check-reason').innerText()).trim() : '';
  await dlg.locator('.ai-check-details summary').first().click();
  const report = await dlg.locator('.ai-check-report').first().innerText();
  await context.close();

  log(`\n=== ${label} ===`);
  log(`Status line: ${status}`);
  for (const s of steps) log(`  [${s.state}] ${s.text}`);
  if (reason) log(`Reason shown: ${reason}`);
  log('--- Copy details report ---');
  log(report);
  log('---------------------------');
  return { result, steps, reason, report };
}

/** Like checkWithKey, but tries once more when no answer came back at all (a network blip). */
async function checkTwiceIfNoAnswer(browser, key, label) {
  const first = await checkWithKey(browser, key, label);
  if (!/Error: code (network|timeout|offline)\b/.test(first.report)) return first;
  log(`\n(No answer from Google on the first attempt: trying once more, in case it was a passing network problem.)`);
  return checkWithKey(browser, key, `${label}, second attempt`);
}

async function main() {
  let server = null;
  if (!url) {
    const out = mkdtempSync(join(tmpdir(), 'socius-live-'));
    log(`Building Socius into ${out} ...`);
    await run('npx', ['vite', 'build', '--outDir', out, '--emptyOutDir', '--logLevel', 'warn']);
    if (!port) port = await freePort();
    server = run('npx', ['vite', 'preview', '--outDir', out, '--port', String(port), '--strictPort'], { wait: false });
    url = `http://localhost:${port}/`;
    await waitForServer(url);
  }
  const executablePath = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
  log(`Socius: ${url}`);
  log(`Browser: Chromium${executablePath ? ` (${executablePath})` : ''}${proxy ? ', through the HTTPS_PROXY' : ''}`);
  log(`Key: ${realKey ? `from GEMINI_API_KEY (${realKey.length} characters, starts with "${realKey.startsWith('AQ.') ? 'AQ.' : realKey.slice(0, 4)}")` : 'none given: checking the refusal paths with made-up keys'}`);
  log(`Model setting: ${model || 'automatic'}`);
  const browser = await chromium.launch({ executablePath, proxy, headless: !flag('headed') });
  try {
    if (realKey) {
      const r = await checkTwiceIfNoAnswer(browser, realKey, 'Your key');
      expect(r.result === 'ok', 'Test connection succeeded (all five steps ticked)');
      expect(!r.report.includes(realKey) && !r.report.includes(realKey.slice(4, 24)), 'The report does not contain the key');
    } else {
      const aq = await checkTwiceIfNoAnswer(browser, FAKE_AQ, 'Made-up "AQ." key');
      const byId = (r, id) => r.steps.find((s) => s.id === id)?.state;
      expect(byId(aq, 'internet') === 'ok' && byId(aq, 'reach') === 'ok', 'Reached Google (a real HTTP answer came back)');
      expect(byId(aq, 'key') === 'fail', '"Key accepted" failed');
      expect(/code key_not_accepted, HTTP 401, status UNAUTHENTICATED, reason ACCESS_TOKEN_TYPE_UNSUPPORTED/.test(aq.report), 'Google answered 401 ACCESS_TOKEN_TYPE_UNSUPPORTED, shown as key_not_accepted');
      expect(/Google did not accept this key/.test(aq.reason), 'The plain-English reason says Google did not accept the key');
      expect(!aq.report.includes(FAKE_AQ.slice(3, 30)), 'The report does not contain the key');

      const aiza = await checkTwiceIfNoAnswer(browser, FAKE_AIZA, 'Made-up "AIza" key');
      expect(byId(aiza, 'reach') === 'ok' && byId(aiza, 'key') === 'fail', '"Key accepted" failed after reaching Google');
      expect(/code invalid_key, HTTP 400, status INVALID_ARGUMENT, reason API_KEY_INVALID/.test(aiza.report), 'Google answered 400 API_KEY_INVALID, shown as invalid_key');
      expect(/retiring older keys/.test(aiza.reason), 'The reason mentions that Google is retiring "AIza" keys');
      expect(!aiza.report.includes(FAKE_AIZA.slice(4, 30)), 'The report does not contain the key');
    }
  } finally {
    await browser.close();
    server?.kill();
  }
  log(failures ? `\n${failures} expectation(s) failed.` : '\nAll expectations held.');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
