# Socius beginner's guide: sources and build

The beginner's guide exists in three forms, all made from one source:

| Output | Where | Built by |
|---|---|---|
| Web page | `public/guide/index.html` (served at `<site>/guide/`, pictures in `public/guide/img/`) | `build-html.mjs` |
| PDF (A4) | `docs/guide/Socius-Beginners-Guide.pdf`, copied to `public/guide/` for download | `build-pdf.mjs` |
| Word | `docs/guide/Socius-Beginners-Guide.docx`, copied to `public/guide/` for download | `build-docx.mjs` |

The text lives in **`guide.md`**. Edit that file, never the generated HTML. `lib/guide-source.mjs` parses it; `lib/guide.css` styles the web page and the PDF (screen, dark mode, phone and print rules).

The more advanced recipe-style guide is `docs/USER_GUIDE.md`; it is separate and not built from this source.

## Rebuild everything

From the repository root:

```bash
# 1. Screenshots (only when the app's look changed). Build and serve the app, then capture.
npx vite build --outDir /tmp/guide-agent/dist --emptyOutDir
npx vite preview --outDir /tmp/guide-agent/dist --port 4251 --strictPort &
node docs/guide/tools/capture-screenshots.mjs            # raw PNGs in /tmp/guide-agent/raw
python docs/guide/tools/process-images.py                # -> public/guide/img/*.png (needs Pillow)

# 2. The three outputs
node docs/guide/build-html.mjs
node docs/guide/build-pdf.mjs                            # needs Chromium and Python with pypdf
node docs/guide/build-docx.mjs                           # LibreOffice optional (fills TOC page numbers)
```

Requirements beyond the repository's own `node_modules` (`playwright`, `docx`, `fflate` are already dependencies):

- **Chromium for Playwright.** `npx playwright install chromium`, or point `PW_CHROMIUM` at a Chrome/Chromium binary (the builders use `/opt/pw-browsers/chromium` when it exists).
- **Python 3** with `pypdf` (PDF page lookup and merging) and `Pillow` (screenshot processing): `pip install pypdf pillow`. Set `PYTHON` to choose the interpreter.
- **LibreOffice** (optional, `soffice` with Writer). `build-docx.mjs` converts the Word file once to find the page of each heading and stores those numbers in the table of contents. Without LibreOffice the contents list is still there, without page numbers. Word refreshes the contents when the file is opened (it asks to update fields).
- **Fonts.** The web page and PDF use IBM Plex Sans, Source Serif 4 and IBM Plex Mono from Google Fonts. With no internet access, install them locally and pass `--no-web-fonts` to `build-pdf.mjs` (and the capture script always blocks Google Fonts, so install them before capturing screenshots or the pictures fall back to other fonts).

## Web addresses

The web page links to the app with a relative `../` link and shows the real address with a line of script, so it keeps working wherever the site is served (a renamed repository, a fork, a local preview).

The PDF and Word files cannot use relative links. They take the site address from one setting:

```bash
SITE_URL=https://owner.github.io/repo/ node docs/guide/build-pdf.mjs
node docs/guide/build-docx.mjs --site-url https://owner.github.io/repo/
```

The default is `https://hackhead95.github.io/socius/`. From it the builders derive the guide address (`<site>guide/`) and, for a GitHub Pages address, the feedback form (`https://github.com/<owner>/<repo>/issues/new/choose`). Override the feedback address with `FEEDBACK_URL` or `--feedback-url`. In `guide.md` these appear as the tokens `{{APP_URL}}`, `{{SITE_URL}}`, `{{GUIDE_URL}}` and `{{FEEDBACK_URL}}`; do not type addresses into the text.

## Source syntax (`guide.md`)

A small subset of Markdown:

- `# Chapter` (numbered automatically; `# Appendix A: Title` for appendices), `## Section`, `### Minor heading`.
- Paragraphs, `- bullets`, `1. steps` (indent sub-items by three spaces), and pipe tables with a header row.
- `**bold**`; bold text containing ` > ` is shown as a menu path (**File > Save project**). `*italic*`, `` `variable_name` ``, `[[Ctrl+S]]` for keys, `[text](#section-id)` for cross-references (the PDF adds the page number) and `[text](https://...)` for web links.
- Pictures: `![Caption](img/name.png){width=60 .big}`. `width` is a percentage of the text column; `.big` lets full-screen pictures and result tables use more of a printed page.
- Boxes: `:::tip Title` ... `:::` with the kinds `tip`, `note`, `warn`, `apa` (a results sentence) and `spss` (for SPSS users). The title is optional.

House style: plain, warm, direct English; short sentences; second person; explain every technical term in one line; no em-dashes; menu paths and button labels exactly as they appear in the app (check `src/app/menus.ts`, the procedure titles in `src/procedures/**` and the dialogs in `src/features/**`).

## Screenshots

`tools/capture-screenshots.mjs` drives the built app with Playwright at 1440 x 900 (device scale factor 2, light theme) on the bundled sample survey. It follows the guide's own steps (recode age, reverse-code `trust3`, build the trust scale, run each analysis, search with Ctrl+K, load the worked coding example, code a sample interview, add a second coder), draws the numbered orange callouts into the page before each picture, and crops to the relevant part. The floating Assistant button appears only in full-screen pictures. Run it with section names (`tour`, `open`, `variables`, `prepare`, `analyses`, `charts`, `report`, `saving`, `search`, `help`, `codingmenu`, `coding`, `interviews`, `ai`) to capture only some, but note that later sections rely on the variables created in `prepare`. `tools/process-images.py` scales the pictures to at most 1600 px wide and saves them as 256-colour PNGs (about 3.1 MB in total).

The `ai` section runs in a fresh browser context (a first visit, AI not set up) and walks through the AI chapter: the AI menu, Google Gemini set-up and Test connection, the "AI is ready" panel, the AI chip, Explain with AI on the gender by `trust5` crosstab, the assistant panel (a t-test question and a trust-scale proposal) and the Text coding AI menu. No request reaches Google: the script answers the Gemini API itself with Playwright routes (model list, `generateContent` for Test connection, `streamGenerateContent` for the explanation, and function calls for the assistant, whose tools run on the live data in the page). The AI texts are written by hand to match the sample survey's real results, so the captions in the guide call them example answers. Change them in `EXPLAIN_TEXT` and `assistantParts()` if the analyses change.
