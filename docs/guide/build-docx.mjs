// Builds the Word version of the beginner's guide: docs/guide/Socius-Beginners-Guide.docx
// (and a copy in public/guide/ for download from the web page).
//
//   node docs/guide/build-docx.mjs [--site-url https://owner.github.io/repo/] [--no-page-numbers]
//
// Reads the same source as the web page (docs/guide/guide.md) and the pictures in public/guide/img/.
// Headings use Word's Heading 1-3 styles, so the Navigation Pane works, and the contents are a real
// TOC field. If LibreOffice (soffice) and Python with pypdf are available, the builder converts the
// file to PDF once to fill in the contents' page numbers; Word refreshes them when the file opens.

import {
  AlignmentType, Bookmark, BorderStyle, Document, ExternalHyperlink, Footer, ImageRun, InternalHyperlink, LevelFormat,
  Packer, PageNumber, Paragraph, ShadingType, Table, TableCell, TableLayoutType, TableOfContents, TableRow, TabStopType,
  TextRun, WidthType,
} from 'docx';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { GUIDE_DIR, loadGuide, plain, PUBLIC_GUIDE_DIR, resolveUrls } from './lib/guide-source.mjs';

const argv = process.argv.slice(2);
const urls = resolveUrls(argv);
const OUT = join(GUIDE_DIR, 'Socius-Beginners-Guide.docx');
const PY = process.env.PYTHON || (existsSync('/opt/oracle/bin/python') ? '/opt/oracle/bin/python' : 'python3');

// A4 with 20 mm margins. 1 mm = 56.7 twips.
const PAGE_W = 11906;
const MARGIN = 1134;
const TEXT_W = PAGE_W - 2 * MARGIN; // twips
const TEXT_W_PX = Math.round((TEXT_W / 1440) * 96); // ~642 px at 96 dpi
const INK = '2C4A9E';
const MUTED = '5D6878';
const FONT = 'Calibri';
const MONO = 'Consolas';

const CALLOUT = {
  tip: { title: 'Tip', fill: 'E3E9F8', bar: '2C4A9E', color: '2C4A9E' },
  note: { title: 'Note', fill: 'F2F4F7', bar: '9AA4B2', color: '3D4757' },
  warn: { title: 'Take care', fill: 'FBF0D9', bar: '9A6200', color: '8A5800' },
  apa: { title: 'How to report it', fill: 'FFFFFF', bar: '1F7A4D', color: '1F7A4D' },
  spss: { title: 'For SPSS users', fill: 'E0F1EF', bar: '2A7D74', color: '226B63' },
};

// ------------------------------------------------------------------ inline
function runs(inl, base = {}) {
  const out = [];
  for (const n of inl) {
    switch (n.t) {
      case 'text':
        out.push(new TextRun({ text: n.v, ...base }));
        break;
      case 'strong':
        out.push(new TextRun({ text: n.v, bold: true, ...base }));
        break;
      case 'em':
        out.push(new TextRun({ text: n.v, italics: true, ...base }));
        break;
      case 'code':
        out.push(new TextRun({ text: n.v, font: MONO, color: '1F3A82', size: base.size ? base.size - 2 : 20 }));
        break;
      case 'kbd':
        out.push(new TextRun({ text: ` ${n.v} `, font: MONO, size: 19, shading: { type: ShadingType.CLEAR, fill: 'E6EAEF', color: 'auto' } }));
        break;
      case 'link':
        if (n.href.startsWith('#')) out.push(new InternalHyperlink({ anchor: n.href.slice(1), children: [new TextRun({ text: n.v, style: 'Hyperlink', ...base })] }));
        else out.push(new ExternalHyperlink({ link: n.href, children: [new TextRun({ text: n.v, style: 'Hyperlink', ...base })] }));
        break;
      case 'token': {
        const url = urls[n.v] ?? '';
        out.push(new ExternalHyperlink({ link: url, children: [new TextRun({ text: url, style: 'Hyperlink', ...base })] }));
        break;
      }
      default:
        break;
    }
  }
  return out;
}

// ------------------------------------------------------------------ images
function pngSize(file) {
  const b = readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), data: b };
}

function figure(b) {
  const file = join(PUBLIC_GUIDE_DIR, b.src);
  const { w, h, data } = pngSize(file);
  // Screenshots are 2x: at most their 1x size, at most the requested share of the text width,
  // and not taller than about 80 mm (120 mm for full-screen pictures and result tables).
  let width = Math.min(w / 2, (TEXT_W_PX * (b.width ?? 100)) / 100);
  const maxH = ((b.big ? 120 : 82) / 25.4) * 96;
  let height = (width * h) / w;
  if (height > maxH) {
    height = maxH;
    width = (height * w) / h;
  }
  const alt = plain(b.caption, urls);
  return [
    new Paragraph({
      keepNext: true,
      spacing: { before: 160, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data,
          transformation: { width: Math.round(width), height: Math.round(height) },
          altText: { name: basename(b.src), title: alt.slice(0, 120), description: alt },
        }),
      ],
    }),
    new Paragraph({ style: 'Caption', children: runs(b.caption) }),
  ];
}

// ------------------------------------------------------------------ lists and tables
let listInstance = 0;
function list(l, level = 0, inCell = false) {
  const inst = ++listInstance;
  const out = [];
  l.items.forEach((it, idx) => {
    const lastTop = level === 0 && !inCell && idx === l.items.length - 1 && !it.sub;
    out.push(
      new Paragraph({
        numbering: { reference: l.type === 'ol' ? 'steps' : 'bullets', level, instance: l.type === 'ol' ? inst : 0 },
        spacing: { after: lastTop ? 160 : inCell ? 40 : 60 },
        children: runs(it.inl),
      }),
    );
    if (it.sub) out.push(...list(it.sub, level + 1, inCell));
  });
  return out;
}

const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: 'D5DBE3' };
function table(b) {
  const n = b.head.length;
  const first = n === 2 ? 0.34 : 0.3;
  const widths = n === 2 ? [first, 1 - first] : Array.from({ length: n }, () => 1 / n);
  const tw = widths.map((f) => Math.round(TEXT_W * f));
  const cell = (inl, i, head) =>
    new TableCell({
      width: { size: tw[i], type: WidthType.DXA },
      shading: head ? { type: ShadingType.CLEAR, fill: 'E6EAEF', color: 'auto' } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ spacing: { after: 0 }, children: runs(inl, head || i === 0 ? { bold: true, size: head ? 19 : 20 } : { size: 20 }) })],
    });
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: tw,
    layout: TableLayoutType.FIXED,
    borders: { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder, insideHorizontal: thinBorder, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: b.head.map((h, i) => cell(h, i, true)) }),
      ...b.rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, i, false)) })),
    ],
  });
}

function callout(b) {
  const k = CALLOUT[b.kind] ?? CALLOUT.note;
  const title = b.title || k.title;
  const children = [new Paragraph({ spacing: { after: 60 }, keepNext: true, children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 17, color: k.color, characterSpacing: 20 })] })];
  for (const x of b.blocks) {
    if (x.type === 'p') children.push(new Paragraph({ spacing: { after: 80 }, children: runs(x.inl, b.kind === 'apa' ? { font: 'Cambria', size: 22 } : {}) }));
    else if (x.type === 'ul' || x.type === 'ol') children.push(...list(x, 0, true));
  }
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: [TEXT_W],
    borders: { top: none, bottom: none, right: none, insideHorizontal: none, insideVertical: none, left: { style: BorderStyle.SINGLE, size: 24, color: k.bar } },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: TEXT_W, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: k.fill, color: 'auto' },
            margins: { top: 120, bottom: 60, left: 200, right: 200 },
            borders: b.kind === 'apa' ? { top: thinBorder, bottom: thinBorder, right: thinBorder, left: { style: BorderStyle.SINGLE, size: 24, color: k.bar } } : undefined,
            children,
          }),
        ],
      }),
    ],
  });
}

// ------------------------------------------------------------------ document
function build(tocPages) {
  listInstance = 0;
  const guide = loadGuide();
  const { meta, blocks, toc } = guide;
  const body = [];

  // Title page
  body.push(
    new Paragraph({ spacing: { before: 2800, after: 200 }, children: [new TextRun({ text: 'USER GUIDE', bold: true, color: INK, size: 20, characterSpacing: 40 })] }),
    new Paragraph({ style: 'Title', children: [new TextRun(meta.title || 'Socius guide')] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: meta.subtitle || '', size: 30, color: '3D4757' })] }),
    new Paragraph({ spacing: { after: 1600 }, children: [new TextRun({ text: meta.edition || '', size: 20, color: MUTED })] }),
    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Web version of this guide: ', size: 20, color: MUTED }), new ExternalHyperlink({ link: urls.GUIDE_URL, children: [new TextRun({ text: urls.GUIDE_URL, style: 'Hyperlink', size: 20 })] })] }),
    new Paragraph({ children: [new TextRun({ text: 'Socius: ', size: 20, color: MUTED }), new ExternalHyperlink({ link: urls.SITE_URL, children: [new TextRun({ text: urls.SITE_URL, style: 'Hyperlink', size: 20 })] })] }),
  );

  // Contents (a real TOC field, with cached entries so it is readable before Word updates it)
  const entries = [];
  for (const c of toc) {
    entries.push({ title: `${c.appendix ? c.label + ': ' : c.label + '  '}${c.title}`, level: 1, page: tocPages?.[c.id], href: c.id });
    for (const s of c.sections) entries.push({ title: s.title, level: 2, page: tocPages?.[s.id], href: s.id });
  }
  body.push(
    new Paragraph({ pageBreakBefore: true, spacing: { after: 240 }, children: [new TextRun({ text: 'Contents', font: 'Cambria', size: 44, bold: true, color: '19202B' })] }),
    new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2', cachedEntries: entries, beginDirty: true }),
  );

  for (const b of blocks) {
    switch (b.type) {
      case 'h1':
        body.push(
          new Paragraph({
            heading: 'Heading1',
            pageBreakBefore: true,
            children: [new Bookmark({ id: b.id, children: [new TextRun(b.appendix ? `${b.label}: ${b.title}` : `${b.number}  ${b.title}`)] })],
          }),
        );
        break;
      case 'h2':
        body.push(new Paragraph({ heading: 'Heading2', children: [new Bookmark({ id: b.id, children: [new TextRun(b.text)] })] }));
        break;
      case 'h3':
        body.push(new Paragraph({ heading: 'Heading3', children: [new Bookmark({ id: b.id, children: [new TextRun(b.text)] })] }));
        break;
      case 'p':
        body.push(new Paragraph({ spacing: { after: 140 }, children: runs(b.inl) }));
        break;
      case 'ul':
      case 'ol':
        body.push(...list(b));
        break;
      case 'table':
        body.push(new Paragraph({ spacing: { after: 0 }, keepNext: true, children: [] }), table(b), new Paragraph({ spacing: { after: 120 }, children: [] }));
        break;
      case 'img':
        body.push(...figure(b));
        break;
      case 'callout':
        body.push(new Paragraph({ spacing: { after: 0 }, keepNext: true, children: [] }), callout(b), new Paragraph({ spacing: { after: 80 }, children: [] }));
        break;
      default:
        break;
    }
  }
  body.push(new Paragraph({ spacing: { before: 400 }, children: [new TextRun({ text: `Socius beginner's guide. ${meta.edition || ''}. The sample survey and interviews are fictional teaching material.`, size: 18, color: MUTED })] }));

  const footer = new Footer({
    children: [
      new Paragraph({
        style: 'Footer',
        tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
        children: [
          new TextRun({ text: "Socius: a beginner's guide", size: 16, color: MUTED }),
          new TextRun({ text: '\tPage ', size: 16, color: MUTED }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
          new TextRun({ text: ' of ', size: 16, color: MUTED }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
        ],
      }),
    ],
  });

  return new Document({
    creator: 'Socius',
    title: meta.title,
    description: "Beginner's guide to Socius",
    features: { updateFields: true },
    styles: {
      default: {
        document: { run: { font: FONT, size: 22, color: '19202B' }, paragraph: { spacing: { after: 120, line: 288 } } },
        heading1: { run: { font: 'Cambria', size: 40, bold: true, color: '19202B' }, paragraph: { spacing: { before: 0, after: 240 }, keepNext: true } },
        heading2: { run: { font: 'Cambria', size: 30, bold: true, color: INK }, paragraph: { spacing: { before: 360, after: 120 }, keepNext: true } },
        heading3: { run: { font: FONT, size: 24, bold: true, color: '19202B' }, paragraph: { spacing: { before: 240, after: 80 }, keepNext: true } },
        title: { run: { font: 'Cambria', size: 64, bold: true, color: '19202B' }, paragraph: { spacing: { after: 240 } } },
        hyperlink: { run: { color: INK, underline: { type: 'single', color: INK } } },
      },
      paragraphStyles: [
        { id: 'Footer', name: 'footer', basedOn: 'Normal', run: { size: 16, color: MUTED }, paragraph: { spacing: { after: 0 } } },
        { id: 'Caption', name: 'Caption', basedOn: 'Normal', next: 'Normal', run: { size: 18, color: MUTED, italics: false }, paragraph: { spacing: { before: 40, after: 240 } } },
        { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 21 }, paragraph: { spacing: { before: 120, after: 40 } } },
        { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', run: { size: 20, color: '3D4757' }, paragraph: { spacing: { after: 20 }, indent: { left: 360 } } },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [
            { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } },
            { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 800, hanging: 260 } } } },
          ],
        },
        {
          reference: 'steps',
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { run: { bold: true, color: INK }, paragraph: { indent: { left: 400, hanging: 300 } } } },
            { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 800, hanging: 260 } } } },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          titlePage: true,
          page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, footer: 560 } },
        },
        footers: { default: footer, first: new Footer({ children: [new Paragraph('')] }) },
        children: body,
      },
    ],
  });
}

/** docx gives every heading bookmark the same w:id; Word expects unique ids, so renumber them. */
function fixBookmarkIds(buf) {
  const files = unzipSync(new Uint8Array(buf));
  let id = 0;
  const xml = strFromU8(files['word/document.xml']).replace(/<w:bookmark(Start|End)\b([^>]*?)w:id="\d+"/g, (m, kind, attrs) => {
    if (kind === 'Start') id++;
    return `<w:bookmark${kind}${attrs}w:id="${id}"`;
  });
  files['word/document.xml'] = strToU8(xml);
  return Buffer.from(zipSync(files, { level: 6 }));
}

async function write(tocPages) {
  const buf = fixBookmarkIds(await Packer.toBuffer(build(tocPages)));
  writeFileSync(OUT, buf);
  return buf.length;
}

/** Convert to PDF with LibreOffice and find the page of each heading (pages counted from the title page). */
function pagesFromLibreOffice() {
  const soffice = ['soffice', 'libreoffice'].find((c) => {
    try {
      execFileSync('which', [c], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  });
  if (!soffice) return null;
  const tmp = mkdtempSync(join(tmpdir(), 'socius-docx-'));
  try {
    // Via ODT: some LibreOffice versions crash exporting this .docx straight to PDF.
    execFileSync(soffice, ['--headless', '--convert-to', 'odt', '--outdir', tmp, OUT], { stdio: 'ignore', timeout: 180000 });
    const odt = join(tmp, basename(OUT).replace(/\.docx$/, '.odt'));
    execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', tmp, odt], { stdio: 'ignore', timeout: 180000 });
    const pdf = odt.replace(/\.odt$/, '.pdf');
    const guide = loadGuide();
    const heads = [];
    for (const c of guide.toc) {
      heads.push({ id: c.id, title: c.appendix ? `${c.label}: ${c.title}` : `${c.label} ${c.title}`, level: 1 });
      for (const s of c.sections) heads.push({ id: s.id, title: s.title, level: 2 });
    }
    const hf = join(tmp, 'h.json');
    writeFileSync(hf, JSON.stringify(heads));
    const out = execFileSync(PY, [join(GUIDE_DIR, 'tools', 'pdf-tool.py'), 'find-pages', pdf, hf, '--from-start'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
    return JSON.parse(out);
  } catch (e) {
    console.warn(`page numbers skipped: ${e.message}`);
    return null;
  }
}

let size = await write(null);
if (!argv.includes('--no-page-numbers')) {
  const pages = pagesFromLibreOffice();
  if (pages && Object.keys(pages).length) {
    size = await write(pages);
    console.log(`contents page numbers filled in for ${Object.keys(pages).length} headings (from a LibreOffice rendering)`);
  }
}
copyFileSync(OUT, join(PUBLIC_GUIDE_DIR, 'Socius-Beginners-Guide.docx'));
console.log(`wrote ${OUT} (${(size / 1024 / 1024).toFixed(2)} MB) and a copy in public/guide/`);
