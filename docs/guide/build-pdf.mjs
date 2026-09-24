// Builds docs/guide/Socius-Beginners-Guide.pdf from the same source as the web page, and copies it
// next to the web page (public/guide/) so readers can download it.
//
//   node docs/guide/build-pdf.mjs [--site-url https://owner.github.io/repo/] [--no-web-fonts]
//
// Needs Playwright's Chromium (set PW_CHROMIUM to use a specific browser binary) and Python with
// pypdf (set PYTHON to choose the interpreter). Steps:
//   1. render the print version of the guide (cover + contents + chapters) to A4 with Chromium;
//   2. look up the page of every chapter and section in the text of that PDF (tools/pdf-tool.py);
//   3. render again with those page numbers in the contents and cross-references;
//   4. put the cover (no page number) in front of the numbered pages.
// --no-web-fonts blocks Google Fonts and uses locally installed IBM Plex Sans / Source Serif 4.

import { chromium } from 'playwright';
import { copyFileSync, existsSync, mkdtempSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderHtml } from './build-html.mjs';
import { GUIDE_DIR, loadGuide, PUBLIC_GUIDE_DIR, resolveUrls } from './lib/guide-source.mjs';

const argv = process.argv.slice(2);
const urls = resolveUrls(argv);
const noWebFonts = argv.includes('--no-web-fonts');
const PY = process.env.PYTHON || (existsSync('/opt/oracle/bin/python') ? '/opt/oracle/bin/python' : 'python3');
const EXE = process.env.PW_CHROMIUM || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = join(GUIDE_DIR, 'Socius-Beginners-Guide.pdf');
const tmp = mkdtempSync(join(tmpdir(), 'socius-guide-'));
const base = pathToFileURL(PUBLIC_GUIDE_DIR + '/').href;

const FOOTER = `
<div style="width:100%;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:8px;color:#6b7482;padding:0 16mm;display:flex;justify-content:space-between;">
  <span>Socius: a beginner's guide</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;

async function renderPdf(page, pages, part, file) {
  let html = renderHtml({ mode: 'print', pages, urls }).replace('<head>', `<head>\n<base href="${base}">`);
  // One print file, two passes: the cover alone, and everything after it.
  const hide = part === 'cover' ? '.print-toc, .layout { display: none !important; }' : '.cover { display: none !important; }';
  html = html.replace('</style>', `@media print { ${hide} }\n</style>`);
  const htmlFile = join(tmp, `${part}.html`);
  writeFileSync(htmlFile, html);
  await page.goto(pathToFileURL(htmlFile).href, { waitUntil: 'load' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = [...document.images].filter((im) => im.offsetParent !== null);
    await Promise.race([
      Promise.all(visible.map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; })))),
      new Promise((r) => setTimeout(r, 30000)),
    ]);
  });
  await page.pdf({
    path: file,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '18mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: part !== 'cover',
    headerTemplate: '<div></div>',
    footerTemplate: FOOTER,
    outline: part !== 'cover',
    tagged: true,
  });
}

function findPages(pdf) {
  const guide = loadGuide();
  const heads = [];
  for (const c of guide.toc) {
    heads.push({ id: c.id, title: c.title, level: 1 });
    for (const s of c.sections) heads.push({ id: s.id, title: s.title, level: 2 });
  }
  const hf = join(tmp, 'headings.json');
  writeFileSync(hf, JSON.stringify(heads));
  const out = execFileSync(PY, [join(GUIDE_DIR, 'tools', 'pdf-tool.py'), 'find-pages', pdf, hf], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
  return JSON.parse(out);
}

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
try {
  const context = await browser.newContext();
  if (noWebFonts) await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  const cover = join(tmp, 'cover.pdf');
  const body = join(tmp, 'body.pdf');
  await renderPdf(page, null, 'cover', cover);
  // The contents list takes the same space with or without numbers, so two passes settle the numbers.
  let pages = null;
  for (let pass = 1; pass <= 3; pass++) {
    await renderPdf(page, pages, 'body', body);
    const found = findPages(body);
    const same = pages && Object.keys(found).length === Object.keys(pages).length && Object.entries(found).every(([k, v]) => pages[k] === v);
    pages = found;
    console.log(`pass ${pass}: ${Object.keys(found).length} headings located${same ? ', page numbers stable' : ''}`);
    if (same) break;
  }
  const meta = loadGuide().meta;
  execFileSync(PY, [join(GUIDE_DIR, 'tools', 'pdf-tool.py'), 'merge', cover, body, OUT, meta.title || 'Socius guide', 'Socius'], { stdio: 'inherit' });
  copyFileSync(OUT, join(PUBLIC_GUIDE_DIR, 'Socius-Beginners-Guide.pdf'));
  console.log(`wrote ${OUT} (${(statSync(OUT).size / 1024 / 1024).toFixed(2)} MB) and a copy in public/guide/`);
} finally {
  await browser.close();
}
