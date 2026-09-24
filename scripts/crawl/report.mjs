#!/usr/bin/env node
// Turns the crawler's raw results ($CRAWL_OUT/raw/*.jsonl) into:
//   docs/qa/crawl-report.json   machine-readable, deduplicated findings with every occurrence
//   docs/qa/CRAWL-FINDINGS.md   the automatic findings as a readable list with a summary table
//   docs/qa/crawl-diff.md       new / fixed / still present compared with the previous report, and the
//                               status of every bug in docs/qa/UI-BUGS.md that names a crawler key
// A partial run (--areas, or fewer states/viewports) only replaces findings inside what it covered.
import { existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const qa = join(root, 'docs', 'qa');
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]] : acc), []));
const out = args.out ?? process.env.CRAWL_OUT ?? '/tmp/crawl/out';
const rawDir = join(out, 'raw');
const reportPath = join(qa, 'crawl-report.json');
const areasRun = args.areas ? String(args.areas).split(',') : null;

const AREAS = ['data', 'variables', 'transforms', 'analysis dialogs', 'output', 'charts', 'text coding', 'AI/assistant', 'shell/menus/search/help', 'mobile', 'theme'];
const PRI = ['P0', 'P1', 'P2'];

if (!existsSync(rawDir)) {
  console.error(`No raw results in ${rawDir}. Run node scripts/crawl/run.mjs first.`);
  process.exit(1);
}

const findings = [];
const coverage = [];
const owner = [];
const crawlErrors = [];
for (const f of readdirSync(rawDir).filter((f) => f.endsWith('.jsonl'))) {
  for (const line of readFileSync(join(rawDir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      continue;
    }
    if (r.type === 'coverage') coverage.push(r);
    else if (r.type === 'owner') owner.push(r);
    else if (r.type === 'crawl-error') crawlErrors.push(r);
    else findings.push(r);
  }
}

// ---- group by key ----
const groups = new Map();
for (const f of findings) {
  let g = groups.get(f.key);
  if (!g) {
    g = { key: f.key, rule: f.rule, priority: f.priority, area: f.area, title: f.title, detail: f.detail, selector: f.selector, label: f.label, screenshot: f.screenshot, steps: f.steps, where: `${f.state} @ ${f.viewport} ${f.theme}`, occurrences: [], data: f.data };
    groups.set(f.key, g);
  }
  if (PRI.indexOf(f.priority) < PRI.indexOf(g.priority)) g.priority = f.priority;
  if (!g.screenshot && f.screenshot) g.screenshot = f.screenshot;
  // Prefer the reproduction at the default desktop size (1440x900 light), then the one with the fewest steps.
  const rank = (vp, th, n) => (vp === '1440x900' ? 0 : vp === '1280x800' ? 1 : 2) * 1000 + (th === 'light' ? 0 : 500) + n;
  if (rank(f.viewport, f.theme, f.steps.length) < rank(g.vp ?? '', g.th ?? '', g.steps.length) || !g.vp) {
    g.vp = f.viewport;
    g.th = f.theme;
    g.steps = f.steps;
    g.where = `${f.state} @ ${f.viewport} ${f.theme}`;
    g.detail = f.detail;
  }
  const occ = `${f.state} @ ${f.viewport} ${f.theme}`;
  if (!g.occurrences.includes(occ)) g.occurrences.push(occ);
}
let list = [...groups.values()].map((g) => ({ ...g, count: g.occurrences.length }));

// ---- scope of this run, and merge with the previous report outside it ----
const combos = new Set(coverage.map((c) => `${c.state} @ ${c.viewport} ${c.theme}`));
// How deep each combination was crawled ('full' clicks every control in dialogs and panels, 'layout'
// only opens things). A shallower re-run cannot prove that a finding from a deeper run is fixed.
const DEPTH = { layout: 1, full: 2 };
const depthNow = {};
for (const c of coverage) {
  const k = `${c.state} @ ${c.viewport} ${c.theme}`;
  if (!c.project || c.project === 'prod') depthNow[k] = Math.max(depthNow[k] ?? 0, DEPTH[c.depth] ?? 1);
}
const scope = { areas: areasRun, combos: [...combos].sort() };
// The previous report: normally the one about to be replaced. --report-only reuses the copy kept
// from the last run, so re-generating does not compare a report with itself.
const prevCopy = join(out, 'prev-report.json');
let prev = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, 'utf8')) : null;
if (args['report-only'] && existsSync(prevCopy)) prev = JSON.parse(readFileSync(prevCopy, 'utf8'));
else if (prev) writeFileSync(prevCopy, JSON.stringify(prev));
const prevDepth = prev?.depths ?? Object.fromEntries((prev?.scope?.combos ?? []).map((k) => [k, DEPTH.full]));
const inScope = (g) => (!areasRun || areasRun.includes(g.area)) && g.occurrences.some((o) => combos.has(o) && (depthNow[o] ?? 0) >= (prevDepth[o] ?? DEPTH.full));
let carried = [];
if (prev) {
  carried = prev.findings.filter((g) => !inScope(g)).map((g) => ({ ...g, carriedOver: true }));
  const keys = new Set(list.map((g) => g.key));
  carried = carried.filter((g) => !keys.has(g.key));
}
const all = [...list, ...carried].sort((a, b) => PRI.indexOf(a.priority) - PRI.indexOf(b.priority) || AREAS.indexOf(a.area) - AREAS.indexOf(b.area) || b.count - a.count);

// ---- diff with the previous report ----
const prevKeys = new Map((prev?.findings ?? []).map((g) => [g.key, g]));
const nowKeys = new Map(list.map((g) => [g.key, g]));
const fresh = list.filter((g) => !prevKeys.has(g.key));
const fixed = (prev?.findings ?? []).filter((g) => inScope(g) && !nowKeys.has(g.key) && !g.carriedOver);
const still = list.filter((g) => prevKeys.has(g.key));

// ---- summary table ----
const summary = {};
for (const a of AREAS) summary[a] = { P0: 0, P1: 0, P2: 0 };
for (const g of all) (summary[g.area] ??= { P0: 0, P1: 0, P2: 0 })[g.priority]++;
const byRule = {};
for (const g of all) byRule[g.rule] = (byRule[g.rule] ?? 0) + 1;
const cov = {};
for (const c of coverage) for (const [k, v] of Object.entries(c.coverage)) cov[k] = (cov[k] ?? 0) + v;

let commit = '';
try {
  commit = execSync('git rev-parse --short HEAD', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch {
  /* not a checkout */
}

const report = {
  generatedAt: new Date().toISOString(),
  commit,
  scope,
  // Deepest crawl depth per combination behind this report (1 = layout, 2 = full).
  depths: Object.fromEntries([...new Set([...Object.keys(prevDepth), ...Object.keys(depthNow)])].map((k) => [k, Math.max(prevDepth[k] ?? 0, depthNow[k] ?? 0)])),
  coverage: { combinations: coverage.length, ...cov, minutes: Math.round(coverage.reduce((a, c) => a + c.ms, 0) / 60000) },
  // A partial run keeps the coverage of the fuller run its carried-over findings come from.
  baseCoverage: carried.length ? (prev?.baseCoverage && prev.baseCoverage.combinations > (prev.coverage?.combinations ?? 0) ? prev.baseCoverage : prev?.coverage) ?? null : null,
  baseGeneratedAt: carried.length ? (prev?.baseGeneratedAt ?? prev?.generatedAt ?? null) : null,
  ownerReports: owner,
  crawlErrors,
  summary,
  byRule,
  findings: all,
};
writeFileSync(reportPath, JSON.stringify(report, null, 1) + '\n');

// ---- markdown ----
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (s) => {
  const rows = Object.entries(s).filter(([, v]) => v.P0 + v.P1 + v.P2);
  const tot = rows.reduce((a, [, v]) => ({ P0: a.P0 + v.P0, P1: a.P1 + v.P1, P2: a.P2 + v.P2 }), { P0: 0, P1: 0, P2: 0 });
  return ['| Area | P0 | P1 | P2 | Total |', '|---|---:|---:|---:|---:|', ...rows.map(([a, v]) => `| ${a} | ${v.P0} | ${v.P1} | ${v.P2} | ${v.P0 + v.P1 + v.P2} |`), `| **All** | **${tot.P0}** | **${tot.P1}** | **${tot.P2}** | **${tot.P0 + tot.P1 + tot.P2}** |`].join('\n');
};
const md = [];
md.push('# Automatic crawl findings');
md.push('');
md.push(`Generated ${report.generatedAt.slice(0, 16).replace('T', ' ')} UTC from commit \`${commit || '?'}\` by \`node scripts/crawl/run.mjs\`. ${coverage.length} state/viewport/theme combinations, ${cov['menu-items'] ?? 0} menu items chosen, ${cov.dialogs ?? 0} dialogs opened, ${cov['dialog-controls'] ?? 0} dialog controls and ${cov['toolbar-buttons'] ?? 0} toolbar buttons clicked, ${cov.checks ?? 0} layout checks.`);
md.push('');
if (report.baseCoverage) md.push(`Partial run: ${carried.length} findings are carried over from the fuller run of ${String(report.baseGeneratedAt).slice(0, 16).replace('T', ' ')} UTC (${report.baseCoverage.combinations} combinations, ${report.baseCoverage['menu-items'] ?? 0} menu items, ${report.baseCoverage.dialogs ?? 0} dialogs).`, '');
md.push('This file is regenerated on every run. The curated, prioritised list with reproduction steps is [UI-BUGS.md](UI-BUGS.md); this is the raw, deduplicated output behind it. Keys are stable across runs, so `crawl-diff.md` can tell what was fixed.');
md.push('');
md.push('## Summary');
md.push('');
md.push(table(summary));
md.push('');
md.push('By check: ' + Object.entries(byRule).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(', ') + '.');
md.push('');
if (owner.length) {
  md.push('## Owner reports (automated verdicts)');
  md.push('');
  const seen = new Map();
  for (const o of owner) seen.set(`${o.id}|${o.combo.replace(/ \[.*\]$/, '')}`, o);
  for (const o of [...seen.values()].sort((a, b) => a.id.localeCompare(b.id))) md.push(`- **${o.id}** (${o.combo.replace(/ \[.*\]$/, '')}): ${o.status}. ${esc(o.note).slice(0, 600)}`);
  md.push('');
}
if (crawlErrors.length) {
  md.push('## Crawler health');
  md.push('');
  md.push('Modules that stopped early (crawler problems, not app bugs; the rest of each combination still ran):');
  md.push('');
  for (const e of crawlErrors) md.push(`- ${e.combo} · ${e.module}: ${esc(e.error).slice(0, 200)}`);
  md.push('');
}
for (const p of PRI) {
  const items = all.filter((g) => g.priority === p);
  if (!items.length) continue;
  md.push(`## ${p} (${items.length})`);
  md.push('');
  for (const g of items) {
    md.push(`### ${esc(g.title).slice(0, 140)}`);
    md.push('');
    md.push(`- Key \`${g.key}\` · check \`${g.rule}\` · area **${g.area}** · seen in ${g.count} combination${g.count === 1 ? '' : 's'}${g.carriedOver ? ' · (carried over from the previous run: outside this run\'s scope)' : ''}`);
    md.push(`- What: ${esc(g.detail)}`);
    if (g.selector) md.push(`- Element: \`${esc(g.selector).slice(0, 220)}\``);
    md.push(`- Where: ${g.occurrences.slice(0, 8).join('; ')}${g.occurrences.length > 8 ? `; +${g.occurrences.length - 8} more` : ''}`);
    md.push(`- Steps (${g.where}):`);
    g.steps.forEach((s, i) => md.push(`  ${i + 1}. ${esc(s)}`));
    if (g.screenshot) md.push(`- Screenshot: ![${g.key}](${g.screenshot.replace(/^docs\/qa\//, '')})`);
    md.push('');
  }
}
writeFileSync(join(qa, 'CRAWL-FINDINGS.md'), md.join('\n'));

// ---- diff + curated bug status ----
const d = [];
d.push('# Crawl diff');
d.push('');
d.push(`Run ${report.generatedAt.slice(0, 16).replace('T', ' ')} UTC (commit \`${commit || '?'}\`) against the previous report (${prev ? prev.generatedAt.slice(0, 16).replace('T', ' ') + ' UTC, commit `' + (prev.commit || '?') + '`' : 'none'}).`);
d.push(`Scope: ${areasRun ? `areas ${areasRun.join(', ')}` : 'all areas'}; ${combos.size} combination(s).`);
d.push('');
d.push(`- New: ${fresh.length}`);
d.push(`- Fixed (in scope, not seen any more): ${fixed.length}`);
d.push(`- Still present: ${still.length}`);
d.push('');
const lines = (arr) => arr.map((g) => `- ${g.priority} \`${g.key}\` ${g.area}: ${esc(g.title).slice(0, 120)}`);
if (fixed.length) d.push('## Fixed', '', ...lines(fixed), '');
if (fresh.length) d.push('## New', '', ...lines(fresh), '');
const bugsPath = join(qa, 'UI-BUGS.md');
if (existsSync(bugsPath)) {
  const text = readFileSync(bugsPath, 'utf8');
  const rows = [];
  const re = /^###\s+(UI-\d+)[^\n]*\n([\s\S]*?)(?=^###\s|^##\s|$(?![\s\S]))/gm;
  let m;
  while ((m = re.exec(text))) {
    const keys = [...m[2].matchAll(/key `([0-9a-f]{10})`/g)].map((k) => k[1]);
    if (!keys.length) continue;
    const present = keys.filter((k) => nowKeys.has(k));
    const covered = keys.some((k) => {
      const g = prevKeys.get(k) ?? nowKeys.get(k);
      return !g || inScope(g);
    });
    rows.push(`| ${m[1]} | ${keys.map((k) => `\`${k}\``).join(' ')} | ${present.length ? '**still present**' : covered ? 'not seen (fixed?)' : 'outside this run'} |`);
  }
  if (rows.length) d.push('## Curated bugs (UI-BUGS.md) with crawler keys', '', '| Bug | Keys | Status in this run |', '|---|---|---|', ...rows, '');
}
writeFileSync(join(qa, 'crawl-diff.md'), d.join('\n'));

// ---- prune screenshots nothing refers to ----
const used = new Set(all.map((g) => g.screenshot).filter(Boolean).map((s) => s.split('/').pop()));
// Keep the screenshots the curated list links to, even after the crawler stops seeing the bug.
if (existsSync(bugsPath)) for (const m of readFileSync(bugsPath, 'utf8').matchAll(/shots\/(c-[0-9a-f]{10}\.jpg)/g)) used.add(m[1]);
const shotDir = join(qa, 'shots');
if (existsSync(shotDir)) for (const f of readdirSync(shotDir)) if (f.startsWith('c-') && !used.has(f)) unlinkSync(join(shotDir, f));

console.log(`\nCrawl report: ${all.length} findings (${list.length} from this run${carried.length ? `, ${carried.length} carried over` : ''}).`);
console.log(table(summary));
console.log(`\nNew ${fresh.length} · fixed ${fixed.length} · still ${still.length}. See docs/qa/CRAWL-FINDINGS.md and docs/qa/crawl-diff.md`);
