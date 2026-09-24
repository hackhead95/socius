#!/usr/bin/env node
// Socius UI crawler runner: build the app, serve it under /socius/ like GitHub Pages, crawl it with
// Playwright (scripts/crawl/crawl.spec.ts) and write the report (scripts/crawl/report.mjs).
//
//   node scripts/crawl/run.mjs                       everything: 5 states × 5 viewports × 2 themes
//   node scripts/crawl/run.mjs --quick               1440x900 + 400x800, light, shallow (about 10 min)
//   node scripts/crawl/run.mjs --area output         only one area (see AREAS); others keep their last result
//   node scripts/crawl/run.mjs --state sample --viewport 1440x900 --theme dark
//   node scripts/crawl/run.mjs --react-dev           also crawl a development React build (React warnings)
//   node scripts/crawl/run.mjs --no-build --url http://127.0.0.1:4391/socius/   crawl a server you started
//   node scripts/crawl/run.mjs --report-only         rebuild the report from the last raw results
//
// Options: --workers N (default 3), --budget MIN (per combination, default 25), --depth full|layout,
// --out DIR (raw results, default /tmp/crawl/out), --port N (default 4391).
// The report goes to docs/qa/crawl-report.json, docs/qa/CRAWL-FINDINGS.md and docs/qa/crawl-diff.md
// (what is new, fixed and still there compared with the previous report).
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:net';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

export const AREAS = ['data', 'variables', 'transforms', 'analysis dialogs', 'output', 'charts', 'text coding', 'AI/assistant', 'shell/menus/search/help', 'mobile', 'theme'];
const AREA_ALIASES = { shell: 'shell/menus/search/help', menus: 'shell/menus/search/help', search: 'shell/menus/search/help', help: 'shell/menus/search/help', ai: 'AI/assistant', assistant: 'AI/assistant', analysis: 'analysis dialogs', dialogs: 'analysis dialogs', coding: 'text coding', transform: 'transforms', variable: 'variables', chart: 'charts' };

function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const k = a.slice(2);
    const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    o[k] = v;
  }
  return o;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log(readHeader());
  process.exit(0);
}
function readHeader() {
  return `Usage: node scripts/crawl/run.mjs [--quick] [--area a,b] [--state s] [--viewport WxH] [--theme light|dark] [--react-dev] [--no-build] [--url URL] [--report-only]\nAreas: ${AREAS.join(', ')}`;
}

const out = args.out ?? process.env.CRAWL_OUT ?? '/tmp/crawl/out';
let port = Number(args.port ?? 4391);

/** The first free port from `from` (a crawl left running elsewhere must not be crawled by mistake). */
function freePort(from) {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', () => resolve(freePort(from + 1)));
    s.listen(from, '127.0.0.1', () => s.close(() => resolve(from)));
  });
}
const distDir = '/tmp/crawl/dist';
const devDir = '/tmp/crawl/dist-dev';

const areas = args.area ? String(args.area).split(',').map((a) => AREA_ALIASES[a.trim().toLowerCase()] ?? a.trim()) : null;
if (areas) for (const a of areas) if (!AREAS.includes(a)) {
  console.error(`Unknown area "${a}". Areas: ${AREAS.join(', ')}`);
  process.exit(2);
}

function run(cmd, cmdArgs, opts = {}) {
  console.log(`$ ${cmd} ${cmdArgs.join(' ')}`);
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', ...opts });
  if (r.status !== 0 && !opts.allowFail) {
    console.error(`${cmd} failed (${r.status})`);
    process.exit(r.status ?? 1);
  }
  return r.status;
}

async function waitFor(url, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      /* not yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const children = [];
process.on('exit', () => children.forEach((c) => c.kill()));
process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

async function main() {
  if (!args['report-only']) {
    let url = args.url;
    let devUrl = null;
    if (!url) {
      if (!args['no-build']) {
        run('npx', ['vite', 'build', '--outDir', distDir, '--emptyOutDir', '--logLevel', 'warn']);
        if (args['react-dev']) run('npx', ['vite', 'build', '--mode', 'development', '--outDir', devDir, '--emptyOutDir', '--minify', 'false', '--logLevel', 'warn'], { env: { ...process.env, NODE_ENV: 'development' } });
      }
      if (!existsSync(join(distDir, 'index.html'))) {
        console.error(`No build in ${distDir}; run without --no-build.`);
        process.exit(1);
      }
      port = await freePort(port);
      const srv = spawn('node', [join(here, 'serve.mjs'), '--dir', distDir, '--port', String(port)], { stdio: 'inherit' });
      children.push(srv);
      url = `http://127.0.0.1:${port}/socius/`;
      if (args['react-dev'] && existsSync(join(devDir, 'index.html'))) {
        const devPort = await freePort(port + 1);
        const dev = spawn('node', [join(here, 'serve.mjs'), '--dir', devDir, '--port', String(devPort)], { stdio: 'inherit' });
        children.push(dev);
        devUrl = `http://127.0.0.1:${devPort}/socius/`;
        await waitFor(devUrl);
      }
      if (!(await waitFor(url))) {
        console.error(`Server did not start on ${url} (port busy? use --port)`);
        process.exit(1);
      }
    }
    rmSync(join(out, 'raw'), { recursive: true, force: true });
    mkdirSync(join(out, 'raw'), { recursive: true });
    const env = {
      ...process.env,
      CRAWL_URL: url,
      CRAWL_OUT: out,
      CRAWL_WORKERS: String(args.workers ?? 3),
      CRAWL_BUDGET_MIN: String(args.budget ?? 25),
    };
    if (devUrl) env.CRAWL_DEV_URL = devUrl;
    if (areas) env.CRAWL_AREAS = areas.join(',');
    if (args.state) env.CRAWL_STATES = String(args.state);
    if (args.viewport) env.CRAWL_VIEWPORTS = String(args.viewport);
    if (args.theme) env.CRAWL_THEMES = String(args.theme);
    if (args.depth) env.CRAWL_DEPTH = String(args.depth);
    if (args.quick) {
      env.CRAWL_QUICK = '1';
      env.CRAWL_VIEWPORTS ??= '1440x900,400x800';
      env.CRAWL_THEMES ??= 'light';
      env.CRAWL_BUDGET_MIN = String(args.budget ?? 8);
    }
    // Test failures (a crawl step crashing) should not stop the report.
    run('npx', ['playwright', 'test', '-c', join('scripts', 'crawl', 'playwright.crawl.config.ts')], { env, allowFail: true });
  }
  const repArgs = [join(here, 'report.mjs'), '--out', out];
  if (args['report-only']) repArgs.push('--report-only');
  if (areas) repArgs.push('--areas', areas.join(','));
  run('node', repArgs);
}

// The servers are children: exit explicitly so they are stopped (the 'exit' handler kills them).
main().then(() => process.exit(0), (e) => {
  console.error(e);
  process.exit(1);
});
