// Builds the web version of the beginner's guide: public/guide/index.html (images in public/guide/img/).
//
//   node docs/guide/build-html.mjs [--site-url https://owner.github.io/repo/]
//
// The page links to the app with a relative "../" link, so it keeps working wherever the site is
// served. The absolute site address (default https://hackhead95.github.io/socius/, or the SITE_URL
// environment variable / --site-url) is used only for text that also appears in print.
// build-pdf.mjs imports renderHtml() to make the print version.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGuide, plain, PUBLIC_GUIDE_DIR, resolveUrls } from './lib/guide-source.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** PNG width and height from the file header. */
export function pngSize(file) {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function renderInline(inl, ctx) {
  return inl
    .map((n) => {
      switch (n.t) {
        case 'text':
          return esc(n.v);
        case 'strong':
          return n.menu
            ? `<strong class="menu">${n.v.split(' > ').map(esc).join('<span class="sep" aria-hidden="true"> &gt; </span><span class="sr-only"> then </span>')}</strong>`
            : `<strong>${esc(n.v)}</strong>`;
        case 'em':
          return `<em>${esc(n.v)}</em>`;
        case 'code':
          return `<code>${esc(n.v)}</code>`;
        case 'kbd':
          return `<kbd>${esc(n.v)}</kbd>`;
        case 'link': {
          if (n.href.startsWith('#')) {
            const pg = ctx.pages?.[n.href.slice(1)];
            return `<a href="${esc(n.href)}">${esc(n.v)}</a>${pg ? `<span class="pageref"> (page ${pg})</span>` : ''}`;
          }
          return `<a href="${esc(n.href)}">${esc(n.v)}</a>`;
        }
        case 'token': {
          const url = ctx.urls[n.v] ?? '';
          if (n.v === 'APP_URL' && ctx.mode === 'web') return `<a class="applink" href="../">${esc(url)}</a>`;
          return `<a href="${esc(url)}">${esc(url)}</a>`;
        }
        default:
          return '';
      }
    })
    .join('');
}

function renderList(list, ctx) {
  const tag = list.type;
  return `<${tag}>${list.items.map((it) => `<li>${renderInline(it.inl, ctx)}${it.sub ? renderList(it.sub, ctx) : ''}</li>`).join('')}</${tag}>`;
}

const CALLOUT_TITLES = { tip: 'Tip', note: 'Note', warn: 'Take care', apa: 'How to report it', spss: 'For SPSS users' };

function renderBlocks(blocks, ctx) {
  const out = [];
  let open = false; // inside a <section class="chapter">
  for (const b of blocks) {
    switch (b.type) {
      case 'h1': {
        if (open) out.push('</section>');
        open = true;
        const label = b.appendix ? `Appendix ${b.appendix}` : `Chapter ${b.number}`;
        out.push(
          `<section class="chapter${b.appendix ? ' appendix' : ''}" aria-labelledby="${b.id}">` +
            `<h2 id="${b.id}"><span class="chnum">${esc(label)}</span>${esc(b.title)}</h2>`,
        );
        break;
      }
      case 'h2':
        out.push(`<h3 id="${b.id}">${esc(b.text)}</h3>`);
        break;
      case 'h3':
        out.push(`<h4 id="${b.id}">${esc(b.text)}</h4>`);
        break;
      case 'p':
        out.push(`<p>${renderInline(b.inl, ctx)}</p>`);
        break;
      case 'ul':
      case 'ol':
        out.push(renderList(b, ctx));
        break;
      case 'table': {
        const wide = b.head.length > 2 ? ' wide' : '';
        const keys = b.rows.some((r) => r.some((c) => c.some((n) => n.t === 'kbd'))) ? ' keys' : '';
        out.push(
          `<div class="table-wrap${wide}${keys}"><table><thead><tr>${b.head.map((h) => `<th scope="col">${renderInline(h, ctx)}</th>`).join('')}</tr></thead><tbody>` +
            b.rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${renderInline(c, ctx)}</th>` : `<td>${renderInline(c, ctx)}</td>`)).join('')}</tr>`).join('') +
            '</tbody></table></div>',
        );
        break;
      }
      case 'img': {
        const file = join(PUBLIC_GUIDE_DIR, b.src);
        let dims = { w: 1600, h: 1000 };
        try {
          dims = pngSize(file);
        } catch {
          console.warn(`missing image ${b.src}`);
        }
        // Screenshots are captured at 2x: show them at most at their 1x size.
        const cssW = Math.round(dims.w / 2);
        const pct = b.width ?? 100;
        const alt = plain(b.caption, ctx.urls);
        out.push(
          `<figure${b.big ? ' class="big"' : ''} style="--w:${pct}%;--max:${cssW}px"><a class="zoom" href="${esc(b.src)}" aria-label="Open the full-size picture: ${esc(alt)}"><img src="${esc(b.src)}" width="${dims.w}" height="${dims.h}" alt="${esc(alt)}"${ctx.mode === 'print' ? '' : ' loading="lazy" decoding="async"'}></a>` +
            `<figcaption>${renderInline(b.caption, ctx)}</figcaption></figure>`,
        );
        break;
      }
      case 'callout': {
        const title = b.title || CALLOUT_TITLES[b.kind] || '';
        out.push(`<aside class="callout ${esc(b.kind)}"${title ? ` aria-label="${esc(title)}"` : ''}>${title ? `<p class="callout-title">${esc(title)}</p>` : ''}${renderBlocks(b.blocks, ctx)}</aside>`);
        break;
      }
      default:
        break;
    }
  }
  if (open) out.push('</section>');
  return out.join('\n');
}

function renderToc(toc, ctx, { withSections = true, pages = null } = {}) {
  const pg = (id) => (pages?.[id] ? `<span class="pg">${pages[id]}</span>` : '');
  return `<ol class="toc-list">${toc
    .map(
      (c) =>
        `<li class="toc-ch${c.appendix ? ' toc-app' : ''}" data-ch="${c.id}"><a href="#${c.id}"><span class="toc-num">${esc(c.label)}</span><span class="toc-t">${esc(c.title)}</span>${pg(c.id)}</a>` +
        (withSections && c.sections.length ? `<ol>${c.sections.map((s) => `<li><a href="#${s.id}"><span class="toc-t">${esc(s.title)}</span>${pg(s.id)}</a></li>`).join('')}</ol>` : '') +
        '</li>',
    )
    .join('')}</ol>`;
}

export function renderHtml({ mode = 'web', pages = null, urls = resolveUrls() } = {}) {
  const guide = loadGuide();
  const ctx = { mode, pages, urls };
  const { meta, toc } = guide;
  const body = renderBlocks(guide.blocks, ctx);
  const css = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), 'lib', 'guide.css'), 'utf8');
  const title = meta.title || 'Socius guide';
  const desc = "A step-by-step beginner's guide to Socius: open SPSS files, prepare data, run and report statistics, and code interviews and open-ended answers, all in your browser.";
  const print = mode === 'print';
  return `<!doctype html>
<html lang="en"${print ? ' class="print-build"' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Socius beginner's guide</title>
<meta name="description" content="${esc(desc)}">
<meta name="color-scheme" content="light dark">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%232c4a9e'/%3E%3Ctext x='16' y='23' font-family='Georgia,serif' font-style='italic' font-weight='600' font-size='21' fill='white' text-anchor='middle'%3ES%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap">
<style>
${css}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to the guide</a>
<header class="topbar">
  <div class="topbar-in">
    <a class="brand" href="#top" aria-label="Socius beginner's guide, back to the top"><span class="glyph" aria-hidden="true">S</span><span class="brand-word">Socius</span><span class="brand-sub">Beginner's guide</span></a>
    <nav class="top-links" aria-label="Guide links">
      <a class="dl" href="Socius-Beginners-Guide.pdf">PDF</a>
      <a class="dl" href="Socius-Beginners-Guide.docx">Word</a>
      <a class="btn-open" href="../">Open Socius</a>
    </nav>
  </div>
</header>

<section class="cover" id="top">
  <div class="cover-in">
    <p class="eyebrow">User guide</p>
    <h1>${esc(title)}</h1>
    <p class="lede">${esc(meta.subtitle || '')}</p>
    <p class="cover-meta">${esc(meta.edition || '')}</p>
    <p class="cover-actions"><a class="btn-open big" href="../">Open Socius</a> <a class="btn-ghost" href="#welcome-to-socius">Start reading</a></p>
    <p class="print-only cover-url">Web version: ${esc(urls.GUIDE_URL)}<br>Socius: ${esc(urls.SITE_URL)}</p>
  </div>
</section>

<section class="print-toc print-only" aria-label="Contents">
  <h2 class="print-toc-h">Contents</h2>
  ${renderToc(toc, ctx, { withSections: true, pages })}
</section>

<div class="layout">
  <aside class="side" aria-label="Contents">
    <nav class="toc" aria-label="Table of contents">
      <p class="toc-head">Contents</p>
      ${renderToc(toc, ctx)}
    </nav>
  </aside>
  <details class="toc-mobile">
    <summary>Contents</summary>
    <nav aria-label="Table of contents">${renderToc(toc, ctx, { withSections: false })}</nav>
  </details>
  <main id="main" tabindex="-1">
${body}
    <footer class="endnote">
      <p>Socius beginner's guide. ${esc(meta.edition || '')}. The sample survey and interviews are fictional teaching material.</p>
      <p><a href="../">Open Socius</a> · <a href="#top">Back to the top</a></p>
    </footer>
  </main>
</div>
${
  print
    ? ''
    : `<script>
// Show the real address of the app next to "../" links, and highlight the current chapter in the contents.
(function () {
  try {
    if (/^https?:$/.test(location.protocol)) {
      var abs = new URL('../', location.href).href;
      document.querySelectorAll('a.applink').forEach(function (a) { a.textContent = abs; });
    }
  } catch (e) {}
  var items = {};
  document.querySelectorAll('.side .toc-ch').forEach(function (li) { items[li.getAttribute('data-ch')] = li; });
  if (!('IntersectionObserver' in window)) return;
  var current = null;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var id = e.target.getAttribute('aria-labelledby');
      if (current) current.classList.remove('is-current');
      current = items[id] || null;
      if (current) current.classList.add('is-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('section.chapter').forEach(function (s) { io.observe(s); });
  document.documentElement.classList.add('js');
  document.querySelectorAll('.toc-mobile a').forEach(function (a) {
    a.addEventListener('click', function () { a.closest('details').open = false; });
  });
})();
</script>`
}
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = join(PUBLIC_GUIDE_DIR, 'index.html');
  writeFileSync(out, renderHtml({ mode: 'web' }));
  console.log(`wrote ${out}`);
}
