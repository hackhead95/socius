# Socius

Socius is a research workbench for sociologists that runs entirely in your web browser. It opens SPSS `.sav` files with their variable labels, value labels and missing values, runs the statistics used in survey research (crosstabs, t-tests, ANOVA, correlation, linear, logistic and ordinal regression, reliability, factor analysis), and codes qualitative text such as interview transcripts and open-ended survey answers. Every result comes with SPSS-style tables, the equivalent SPSS syntax, a plain-language reading and an APA-style results sentence. Coded text can be turned into ordinary variables, so you can crosstab what people wrote against who they are.

**Privacy.** Your data stays in your browser. Files you open are read on your own computer and nothing is uploaded to any server. Your working session is autosaved in the browser's own storage (IndexedDB) on your computer so you can pick up where you left off. The only exception is the optional AI help, which is off until you set it up and only sends what you choose, when you click, to the provider you choose. With the on-device option nothing leaves your computer at all. Keys and AI settings are kept in your browser only, never in project files.

A step-by-step guide with worked examples on the bundled sample survey is in [docs/USER_GUIDE.md](docs/USER_GUIDE.md).

## What it does

### Data (SPSS files and others)

- Opens SPSS `.sav` (uncompressed and compressed) and `.zsav` files, including files written by SPSS, PSPP, R (haven) and Stata. Variable labels, value labels, user-missing values, measurement levels, display formats, dates, long variable names, long strings and the weight variable come with the file.
- Opens CSV, TSV and other delimited text (with a choice of separator and character encoding) and Excel `.xlsx` (with a choice of sheet).
- Data View and Variable View that work like SPSS: type or paste values, copy and paste to and from Excel, edit labels, value labels, missing values, measure and role, find values, go to a case, undo and redo.
- Saves back to SPSS `.sav` or `.zsav`, CSV or Excel (with codes or with value labels), and exports a codebook to Excel or CSV.

### Data management

- **Data menu:** Define variable properties, Copy variable properties, Sort cases, Select cases (condition, random sample, range of cases or filter variable; filter or delete), Weight cases, Merge files (Add cases, Add variables, with key matching and lookup tables), Aggregate.
- **Transform menu:** Compute variable (SPSS-style formulas with functions such as MEAN, SUM, RND, MISSING, ANY, RANGE, string and date functions), Count values within cases, Recode into same variables, Recode into different variables, Automatic recode, Visual binning, Reverse-code items, Create scale / index (shows Cronbach's alpha as you pick items), Standardize (z-scores), Rank cases.
- Transformations follow SPSS rules for missing values, and each step is logged in Output with its SPSS syntax.

### Statistics

All procedures are under **Analyze**, grouped as in SPSS:

| Menu | Procedures |
|---|---|
| Descriptive Statistics | Frequencies, Descriptives, Explore (confidence intervals, percentiles, Kolmogorov-Smirnov with Lilliefors correction and Shapiro-Wilk normality tests, box plots), Crosstabs (chi-square, Fisher's exact, Phi and Cramér's V, contingency coefficient, lambda, Goodman-Kruskal tau, gamma, Somers' d, Kendall's tau-b and tau-c, kappa, risk/odds ratio, McNemar, Cochran-Mantel-Haenszel; expected counts, row/column/total percentages, standardized and adjusted residuals; a layer (control) variable) |
| Compare Means | Means (with ANOVA table and eta), One-Sample T Test, Independent-Samples T Test (Levene's test, Welch, Cohen's d, Hedges' g, Glass's delta), Paired-Samples T Test, One-Way ANOVA (Welch, Brown-Forsythe, eta, epsilon and omega squared, linear trend, Tukey, Bonferroni, Scheffe, Games-Howell post hoc tests, homogeneous subsets, means plot) |
| Correlate | Bivariate Correlations (Pearson, Spearman, Kendall's tau-b, optional heatmap), Partial Correlations |
| Regression | Linear Regression (up to three blocks with R² change, Enter or Stepwise, automatic dummy coding, collinearity diagnostics, part and partial correlations, Durbin-Watson, casewise diagnostics, residual plots), Binary Logistic Regression (odds ratios with confidence intervals, Hosmer-Lemeshow test, classification table), Ordinal Regression (proportional odds with the test of parallel lines), Multinomial Logistic Regression |
| Nonparametric Tests | Chi-Square (goodness of fit), Binomial, Mann-Whitney U (2 independent samples), Kruskal-Wallis H (k independent samples, with Dunn's pairwise tests), Wilcoxon Signed-Rank (2 related samples), Friedman (k related samples, with Kendall's W) |
| Scale | Reliability Analysis (Cronbach's alpha, McDonald's omega, item-total statistics, alpha if item deleted) |
| Dimension Reduction | Factor Analysis (principal components or principal axis factoring; Varimax, Promax or Direct oblimin rotation; KMO and Bartlett's test; scree plot) |

Filters, frequency weights (decimals allowed, like SPSS `WEIGHT BY`) and user-missing values are respected by every procedure. Warnings appear when assumptions are doubtful, for example expected counts below 5, very small groups, perfect separation or a model that did not converge.

### Charts

The **Graphs** menu has Bar Chart (counts, percentages or means with 95% confidence intervals, clustered or stacked), Histogram (with normal curve), Box Plot, Scatter Plot (with linear fit), Line Chart, Pie Chart and Population Pyramid. Many procedures also offer their own charts (clustered bars in Crosstabs, means plots, residual plots, a scree plot, a correlation heatmap). Every chart can be saved as PNG or SVG, and "Show data" displays the numbers behind it.

### Text coding (qualitative analysis)

- Import interview transcripts and field notes (Word `.docx`, `.txt`, `.md`, or pasted text), open-ended answers from a CSV or Excel file, or open-ended answers straight from a string variable in your dataset, keeping respondent characteristics as attributes.
- Build a codebook with themes and sub-codes, definitions, inclusion and exclusion criteria and examples. Highlight passages to code them, or code open-ended responses at speed with the keyboard (number keys 1 to 9, `j`/`k` to move).
- Auto-code with keyword rules (whole words, wildcards such as `migra*`, phrases, regular expressions), with a preview before anything is coded.
- Retrieve coded segments, code frequencies, code co-occurrence, codes by attribute, word frequencies and keyword in context. Tables can be sent to Output. Memos keep your analytic notes.
- **Mixed-methods bridge:** Export codes to dataset turns each code into a 0/1 variable (1 = mentioned, 0 = not mentioned, missing = no answer), so you can run Crosstabs, t-tests or regression on what people wrote.
- **Intercoder reliability:** several coders can code the same sources independently, then compare with Cohen's kappa, Krippendorff's alpha and percent agreement per code, and review the disagreements in context.
- Export coded segments (Excel, CSV), a qualitative report (Word, HTML) and the codebook (Word table, CSV, JSON; codebooks can be imported into another project).
- **AI suggestions (optional, free options):** Suggest a codebook, Suggest codes for responses and Summarise a code. You review and accept every suggestion. Set up under **AI > AI assistant settings** (see [AI help](#ai-help) below).

### Finding things

- **Search** (Ctrl+K / Cmd+K, **/**, or **Search Socius** in the top bar; a magnifying glass on phones) finds menu commands in your own words ("chi square", "t test", "alpha", "select cases"), variables, results in Output, user-guide sections and coded text. Disabled commands say why.

### Output and export

- Output appears as numbered tables and figures, in APA 7 style or SPSS style (a toggle at the top of Output), with a "What this means" reading, an APA-style sentence you can copy, and the SPSS syntax that reproduces the result.
- **Copy** on any output item puts it on the clipboard with formatting, ready to paste into Word or Google Docs.
- **Export report** saves all output as Word (`.docx`, APA tables and figures), a standalone web page (`.html`), Excel (`.xlsx`, one sheet per table) or plain text.
- **File > Save project** keeps data, output and the text-coding project together in one `.socius.json` file.

## How to use it

**Live app:** https://hackhead95.github.io/socius/ (free, runs in your browser; nothing is uploaded)

Open the link in a recent version of Chrome, Edge, Firefox or Safari. The first visit shows a welcome screen: **Open data file** (or drag a file onto the window) for your own data, **Open project**, **Load sample survey** to try things on a fictional survey, or **New empty dataset**. After that, your last session is restored when you come back.

### AI help

AI help is optional. The **AI** menu and the **AI** chip in the top bar list what it can do: ask the Socius assistant, **Explain a result** (an **Explain with AI** button on every Output item: what was tested, what the numbers mean, whether warnings matter, how to report it; only tables, summaries and warnings are sent, never individual answers), and the text-coding helpers. Choose where it runs in **AI > AI assistant settings** (also under Help):

| Option | Cost | Where your excerpts go | Notes |
|---|---|---|---|
| **On this computer** | Free | Nowhere: the model runs in your browser | One-time download (about 1 GB for the small model, 1.8 GB for the better one), then cached. Needs WebGPU: a recent Chrome or Edge on a desktop or laptop. Slower and less accurate than online models. Recommended for confidential interviews. |
| **Google Gemini** | Free key from [Google AI Studio](https://aistudio.google.com/apikey) | Google | Fast and good. On the free tier Google may use what you send to improve its products and humans may review it, so anonymise excerpts first and check your consent forms and ethics approval. |
| **Other service** | Depends | That service | Any OpenAI-compatible service: Groq, OpenRouter (free models end in `:free`), or Ollama / LM Studio on your own computer. |
| **Claude** | Your Claude plan | Anthropic | Used automatically when Socius runs as a Claude artifact. |

Every AI dialog says which provider will receive what before anything is sent (Explain with AI also shows the exact text), and nothing is sent until you click. Report AI assistance in your methods section.

### Feedback

**Help > Send feedback or report a problem** (or **Feedback** in the top bar) opens the issue form on GitHub. The full user guide is under **Help > User guide**.

### Run it on your own computer

You need [Node.js](https://nodejs.org/) 22 or later.

```bash
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

### Build the static site

```bash
npm run build      # writes the site to dist/
npm run preview    # serves dist/ locally to check it
```

`dist/` uses relative paths, so it works from any folder on any static host.

### Build the single-file version (for Claude)

```bash
npm run build:artifact
```

This writes `dist-artifact/socius.html`, one self-contained HTML file with everything inlined, including the sample data. It is the file to publish as a Claude artifact. Inside Claude the page runs in a sandbox, so files are saved through Claude's download prompt instead of a normal download, and file types Claude does not accept (such as `.sav` and `.zsav`) arrive as a `.zip` that you unzip first. Inside Claude, AI help uses Claude automatically. The on-device AI library is left out of this build (it is a separate, lazily loaded file on the static site), so `socius.html` stays about 2 MB.

### Deploy to GitHub Pages

The workflow `.github/workflows/pages.yml` builds the static site and publishes it every time `main` changes (it can also be started by hand from the Actions tab). One-time setup: in the repository go to **Settings > Pages** and set **Source** to **GitHub Actions**.

A second workflow, `.github/workflows/ci.yml`, runs on every pull request and push to `main`: type check, unit tests, both builds, and it keeps `socius.html` as a downloadable build artifact.

## SPSS compatibility

**What round-trips.** Opening a `.sav` in Socius and saving it again keeps variable names (including long names), variable labels, value labels (also for long string variables), user-missing values (up to three discrete values, or a range plus one value), measurement level, role, display format, column width and alignment, dates and times, long strings, the weight variable, the file label, documents and custom variable attributes. Files are written with UTF-8 text encoding, and `.sav` files are saved with SPSS's standard (bytecode) compression; `.zsav` uses the newer zlib compression (SPSS 21 or later). The files open in SPSS, PSPP, R (haven) and Python (pyreadstat).

**Known limits.**

- Multiple response sets defined in a `.sav` file are not imported. The variables themselves are, and Socius tells you the sets were skipped.
- SPSS's own limits apply when saving, and Socius tells you what it had to change: value labels longer than 120 bytes and variable labels longer than 256 bytes are shortened, more than three missing values are cut to three, a missing-value range on a text variable is dropped (SPSS does not allow it), string missing values longer than 8 bytes are dropped, and invalid variable names are renamed (for example `bad name!` becomes `bad_name`). Note that the limits are in bytes: text in Hindi, Bengali, Tamil and other Indian scripts uses about three bytes per character in UTF-8, so a Devanagari value label is cut at about 40 characters.
- SPSS portable files (`.por`), old Excel (`.xls`), Stata, SAS and R files cannot be opened directly. Socius explains how to convert each of them.
- Older `.sav` files that do not state their text encoding are read as UTF-8 when possible and otherwise as Windows-1252 (Western European), with a warning.

**How the statistics are checked.** Each statistical routine is tested against independent reference results produced with scipy, statsmodels, pingouin, scikit-posthocs, factor_analyzer, mpmath (distribution functions at 40 significant digits) and the `krippendorff` package, plus direct transcriptions of SPSS's published algorithms where no library implements them (for example stepwise selection, Hosmer-Lemeshow grouping and principal axis factoring with SPSS's stopping rule). p-values match to at least 1e-6 relative error. The SPSS file reader and writer are checked against pyreadstat and against IBM's own SPSS I/O library (the code SPSS Statistics uses to open files). The reference results are committed as JSON fixtures, so the test suite runs without Python.

**Where results may differ from SPSS.**

- **Random samples.** Select cases > A random sample uses Socius's own random number generator. The same seed always gives the same sample in Socius, but not the same cases SPSS would pick.
- **Lilliefors significance.** The Kolmogorov-Smirnov normality test in Explore uses the Dallal-Wilkinson approximation, as SPSS does, and shows `.200` as a lower bound when p is above .2. Between .1 and .2 the approximation is less exact, so the third decimal can differ slightly from SPSS.
- **Shapiro-Wilk with weights.** Shapiro-Wilk is computed only when case weights are whole numbers; with fractional weights it is left out (a footnote says so).
- **Box plots with fractional weights.** Without weights, boxes use Tukey's hinges as SPSS does. When weights are not all 1, the box is drawn from weighted percentiles (SPSS HAVERAGE definition), so hinges can differ a little from SPSS.
- **Reference categories.** Linear, binary logistic, ordinal and multinomial regression dummy-code categorical predictors (string variables, and nominal or ordinal variables with value labels) against the **first** (lowest) category by default. SPSS's default is the last category; choose "Last (highest code), SPSS default" in the dialog to match SPSS output exactly.
- **Automatic dummy coding** in Linear Regression has no direct SPSS equivalent (SPSS REGRESSION needs dummy variables made by hand). The generated syntax includes the COMPUTE lines that create the same dummies.
- **McDonald's omega** is estimated from a one-factor maximum likelihood model. SPSS 27 and later can report omega too, but its estimation method may give slightly different values.
- **Non-integer weights in Crosstabs.** By default cell counts are rounded, as in SPSS. With "No adjustment", exact tests are not available.

## Development

### Project structure

| Path | What is there |
|---|---|
| `src/app/` | App shell: menu bar (`menus.ts`), search palette (`CommandPalette.tsx`, ranking in `search.ts`, guide sections in `helpTopics.ts`), tabs, welcome screen, help dialogs, keyboard shortcuts |
| `src/core/` | Shared contracts: dataset and variable types, missing-value and weighting rules, output model, procedure definitions, the app store |
| `src/platform/host.ts` | Saving files, with the differences between a normal browser and the Claude artifact |
| `src/platform/ai.ts` | AI provider layer (`askAI`, `askAIJson`, settings, status): Claude in the artifact (`claude.ts`), on-device WebLLM (`ai-webllm.ts`), Gemini and OpenAI-compatible services (`ai-http.ts`) |
| `src/app/links.ts` | Website, user guide and feedback links (derived from the GitHub Pages address) |
| `src/lib/io/` | SPSS `.sav`/`.zsav` reader and writer, CSV and Excel import and export, codebook |
| `src/lib/stats/` | Statistics: distributions, descriptives, crosstabs, t-tests, ANOVA, nonparametric tests, correlation, regression, logistic and ordinal models, reliability, factor analysis |
| `src/lib/transform/` | Compute expressions, recode, binning, scales, select and weight cases, merge, aggregate |
| `src/lib/coding/` | Text coding: importers, segments, keyword rules, analysis, reliability, exports, code-to-variable conversion |
| `src/procedures/` | The Analyze and Graphs procedures (`core/`, `models/`, `graphs/`): dialog definitions and output |
| `src/features/` | Screens and dialogs: `data/` (Data View, Variable View), `transform/`, `analysis/` (procedure dialog), `output/` (viewer and exports), `charts/`, `coding/`, `ai/` (AI settings, the AI menu features, Explain with AI), `project/` (open, save, autosave) |
| `src/ui/`, `src/styles/` | Shared components and design tokens |
| `src/samples/` | Bundled sample survey (`urban_trust_survey.sav`) and three interview transcripts |
| `tests/` | Unit tests (vitest) with committed reference fixtures |
| `e2e/` | Browser tests (Playwright) |
| `scripts/` | Python oracle and fixture generators, sample data generator, single-file build step |
| `docs/` | `ARCHITECTURE.md` (developer notes) and `USER_GUIDE.md` |

### Tests

```bash
npm test             # unit tests (vitest)
npm run typecheck    # TypeScript type check
npx playwright test  # browser tests; builds and serves the site first
```

The Playwright config looks for Chromium at `/opt/pw-browsers/chromium`. On your own machine, run `npx playwright install chromium` and set `PW_CHROMIUM` to the path of that Chromium executable.

A few I/O tests also call Python live to compare files with pandas, pyreadstat, openpyxl and IBM's SPSS I/O library. They run only when `/opt/oracle/bin/python` exists (and, for the SPSS I/O check, the `savReaderWriter` package is installed); otherwise they are skipped. Set `SOCIUS_NO_ORACLE=1` to skip them on purpose.

### Regenerating the reference fixtures

The Python scripts expect an environment with pyreadstat, pandas, numpy, scipy, statsmodels, pingouin, scikit-posthocs, mpmath, factor_analyzer, krippendorff and openpyxl (the paths below use `/opt/oracle/bin/python`; any Python with these packages works). Run them from the repository root.

| Script | Writes |
|---|---|
| `scripts/oracle/core_oracle.py` | `tests/stats-core/fixtures/core.json` (descriptives, t-tests, ANOVA, crosstabs, nonparametric tests, correlations) |
| `scripts/oracle/core_oracle_dist.py` | `tests/stats-core/fixtures/distributions.json` (distribution functions) |
| `scripts/oracle/models_oracle.py` | `tests/stats-models/fixtures/*.json` (regression, logistic, ordinal, multinomial, reliability, factor analysis, matrix routines) |
| `scripts/fixtures/make_fixtures.py` | `tests/io/fixtures/*.sav`, `*.zsav` and the JSON that pyreadstat reads from them (uses `dump_sav.py`) |
| `scripts/fixtures/spssio_dump.py` | Reads a file with IBM's SPSS I/O library (used by the tests, needs `savReaderWriter`) |
| `scripts/samples/make_survey.py` | The sample survey `src/samples/urban_trust_survey.sav` and `public/samples/urban_trust_survey.csv` (seeded, reproducible) |
| `scripts/samples/check_survey.py` | Prints the checks a sociologist would run on the sample survey |

Example: `/opt/oracle/bin/python scripts/oracle/models_oracle.py`

## Sample data

The bundled "Urban Neighbourhoods and Social Trust Survey" (640 households in Kolkata, Delhi, Mumbai, Bengaluru and Chennai) and the three interview transcripts are synthetic teaching material. Every respondent, answer and number is invented, and any resemblance to real people is coincidental. No real people were interviewed. Use them to learn the tool, not as evidence about Indian cities.
