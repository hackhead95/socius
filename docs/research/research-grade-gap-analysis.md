# Research-grade gap analysis: Socius vs SPSS, jamovi, JASP, PSPP, Stata and QDA tools (September 2026)

## What to do (for implementers and the orchestrator)

1. **P0 for a sociology pilot:**
   - **Split File** (analysis by group; Data menu).
   - **Survey design** (sampling weights with strata and PSU/cluster, giving design-based standard errors). Without it NFHS, DHS, IHDS, NSS, ESS and WVS analyses are wrong.
   - **Interaction terms and categorical predictors in regression, plus predicted probabilities / marginal effects.**
   - **Factorial (two-way) ANOVA / ANCOVA.**
   - **A re-runnable syntax/log**, so every step can be replayed from the Output log.
2. **P1:**
   - Multiple-response sets.
   - Stata `.dta` import.
   - Restructure wide↔long.
   - Robust and cluster-robust standard errors.
   - Poisson / negative binomial regression.
   - Side-by-side regression tables (Model 1–3).
   - A "Table 1" descriptives-by-group builder.
   - Missing-data summary with pairwise options (multiple imputation later).
   - Mediation/moderation (PROCESS-style).
   - REFI-QDA (`.qdpx`) export and PDF import for text coding.
   - WCAG 2.2 AA audit.
3. **P2:**
   - Multilevel / mixed models.
   - CFA/SEM.
   - Repeated-measures ANOVA.
   - Correspondence analysis (MCA).
   - Inequality indices (Gini, Theil).
   - Power analysis.
   - Survival / event-history.
   - Audio transcription.
   - Bayesian counterparts.
4. **Socius is already strong** in data I/O (.sav round-trip), SPSS-style descriptives, crosstabs, t-tests and ANOVA, nonparametrics, linear, logistic, ordinal and multinomial regression, reliability/omega, EFA, APA output and qualitative coding with intercoder reliability and a quant bridge. Many free tools lack that combination. Do not spread effort thin: the P0 items unlock whole classes of real sociology papers.
5. **For the pilot, state known limits clearly** in the user guide (no complex-sample standard errors, no multilevel models). Methods reviewers will ask about them.

Labels: **[verified]** = checked in the Socius source, README, or an official site; **[reported]** = secondary sources; **[inferred]** = our judgement as sociology-methods reasoning. Priorities are judgement calls based on frequency in sociology teaching (intro stats and research-methods syllabi), empirical articles (survey regression dominates quantitative sociology), and the Indian large-scale survey context of the bundled sample.

---

## 1. What Socius already has [verified: README.md, `src/app/menus.ts`, `src/procedures/**` titles on 24 Sep 2026]

- **Data:**
  - Formats: .sav/.zsav read and write, CSV/TSV/xlsx import, codebook export.
  - Views: Data and Variable View.
  - Data menu: Define/Copy variable properties, Sort, Select cases (condition, random, range, filter variable), Weight cases (frequency), Merge (add cases/variables), Aggregate.
  - Transform menu: Compute, Count, Recode (same/different), Automatic recode, Visual binning, Reverse-code, Create scale, Standardize, Rank.
- **Descriptive:** Frequencies, Descriptives, Explore (normality tests, box plots), Crosstabs (full SPSS association measures, layers, CMH), Means.
- **Inferential:** one-sample, independent and paired t-tests with effect sizes; one-way ANOVA with Welch/Brown-Forsythe, post hoc tests and trend; Pearson/Spearman/Kendall, partial correlation; nonparametrics (chi-square GOF, binomial, Mann-Whitney, Kruskal-Wallis with Dunn, Wilcoxon, Friedman).
- **Models:** linear regression (blocks, stepwise, auto-dummies, diagnostics), binary logistic, ordinal (PLUM with parallel lines), multinomial logistic, reliability (alpha, omega), EFA (PCA/PAF, rotations).
- **Charts:** bar, histogram, box, scatter, line, pie, population pyramid.
- **Reporting:** SPSS or APA tables, interpretation, APA sentence, SPSS syntax per item, Word/HTML/xlsx/txt export, project file.
- **Qualitative:**
  - Import and codebook: docx/txt/md/paste/CSV/xlsx/string-variable import; codebook with sub-codes, definitions, inclusion/exclusion criteria.
  - Coding: highlight coding, keyboard fast coding, keyword/regex auto-code, memos.
  - Retrieval and analysis: retrieval, co-occurrence, codes × attributes, word frequency, KWIC.
  - Reliability: intercoder kappa, Krippendorff's alpha.
  - Bridges and exports: codes-to-variables bridge; exports; AI suggestions.
- **Not present** (menus.ts has no entry):
  - Split File.
  - Restructure.
  - Syntax editor or running syntax.
  - Multiple response.
  - Complex samples.
  - GLM (factorial ANOVA/ANCOVA/repeated measures).
  - Count models.
  - Mixed models.
  - SEM/CFA.
  - Missing-value analysis or imputation.
  - Custom tables.
  - .dta/.por/.xls import (README says they cannot be opened).

## 2. Gaps by area

### A. Data management

| Gap | Priority | Why it matters | Reference tools |
|---|---|---|---|
| **Split File** (compare groups / organise output by groups) | **P0** | Among the most used SPSS commands in teaching and papers ("run the same model for men and women", "by state"). Stata's `by:` and jamovi's split-by options are the everyday equivalents. Easy to implement: re-run the procedure per group and label the output. | SPSS SPLIT FILE; Stata `by`; jamovi "split by" in most analyses [inferred] |
| **Multiple-response sets** (define sets; MR frequencies and crosstabs) | P1 | Check-all-that-apply questions are ubiquitous in surveys. Socius currently skips MR sets on import (README). | SPSS MULT RESPONSE / Custom Tables |
| **Import Stata `.dta`** (and `.por`, `.xls`) | P1 | IHDS, DHS/NFHS, ESS and many archives distribute Stata files; many Indian datasets come as .dta. A reader for .dta 114–119 is modest work (well-documented format). | PSPP (partial), jamovi and JASP (.dta via haven) [reported] |
| **Restructure wide↔long** (VARSTOCASES / CASESTOVARS) | P1 | Panel and household-roster data; needed before repeated-measures or multilevel work. | SPSS Restructure wizard; Stata `reshape` |
| Duplicate cases / identify unusual cases; ID checks | P2 | Data cleaning. | SPSS Identify Duplicate Cases |
| Date/time wizard, string functions | have partly | — | — |

### B. Descriptive and reporting tables

| Gap | Priority | Why |
|---|---|---|
| **"Table 1" builder** (descriptives by group: mean(SD) or n(%) with tests, weighted) | **P1** | Nearly every empirical sociology article starts with a sample-characteristics table. SPSS Custom Tables (CTABLES) and Stata `table`/`dtable`/`tabstat` fill this role; students hand-assemble it otherwise. |
| Weighted percentages with CIs under a survey design | P0 (with survey design) | Reporting prevalence (for example "% women with secondary education") from NFHS/DHS requires design-based CIs. |
| Custom tables (nested, stacked) | P2 | Nice to have. |

### C. Inferential

| Gap | Priority | Why |
|---|---|---|
| **Factorial ANOVA and ANCOVA** (UNIANOVA: two-way with interaction, covariates, simple effects, estimated marginal means, partial η²) | **P0** | Standard in methods courses and experimental/vignette sociology. jamovi and JASP have it in base. [reported: JASP/jamovi feature lists] |
| Repeated-measures / mixed ANOVA | P2 | Less common in sociology than in psychology; panel designs use regression. |
| Pairwise deletion options where SPSS offers them (correlations/descriptives) | P1 | Parity; Socius partly has it (the grep found "pairwise" in correlations/descriptives). |
| Chi-square with survey design (Rao-Scott) | P0 (with survey design) | Design-correct crosstabs. |
| Power analysis / sample size | P2 | Planning; G*Power fills the gap; jamovi has jpower. |
| Bayesian counterparts | P2 | JASP's niche; not a sociology norm. |

### D. Regression and models

| Gap | Priority | Why |
|---|---|---|
| **Interaction terms (continuous×categorical, categorical×categorical) in linear, logistic, ordinal and multinomial regression, with centring** | **P0** | Moderation ("does the education effect differ by caste/gender?") is core to sociological hypotheses. |
| **Predicted probabilities / average marginal effects (AMEs) and plots** | **P0/P1** | Sociology journals increasingly expect AMEs or predicted probabilities instead of odds ratios (Mood 2010, *European Sociological Review*, on comparing logit coefficients across groups [reported, well-known]). Stata `margins`/`marginsplot` is the reference. |
| **Robust (HC1/HC3) and cluster-robust standard errors** | **P1** | The Stata default habit (`, robust`, `vce(cluster psu)`). Also the minimum defence for clustered survey data when full design support is missing. |
| **Poisson and negative binomial** (and zero-inflated later) | P1 | Count outcomes (number of children, number of organisations joined, days of work). SPSS GENLIN; Stata `poisson`/`nbreg`. |
| **Side-by-side model tables** (M1, M2, M3 with SEs/stars, N, R²/pseudo-R², AIC/BIC) | **P1** | The universal article table; Stata `esttab`, R `modelsummary`, SPSS needs manual work. Socius's hierarchical blocks are halfway there. |
| Comparing coefficients across nested models (KHB) and groups | P2 | Advanced but sociology-specific (Karlson, Holm, Breen). |
| **Multilevel / mixed-effects models** (random intercepts and slopes; linear and logistic) | P2 for pilot, P1 later | Neighbourhoods, schools, villages within districts; common in sociology journals. SPSS MIXED, jamovi GAMLj, JASP Mixed Models. Heavy to implement (REML); consider later. |
| CFA / SEM | P2 | Scale validation; JASP SEM and jamovi SEMLj via lavaan. |
| Mediation / moderation (PROCESS-style: bootstrap indirect effects, simple slopes, Johnson-Neyman) | P1 | Very common in student theses; PROCESS for SPSS is the de facto tool; jamovi medmod. |
| Log-linear models; correspondence analysis / MCA | P2 | MCA is signature Bourdieusian sociology; SPSS CORRESPONDENCE/HOMALS. |
| Event history (Cox, discrete-time) | P2 | Life-course research. |
| Inequality measures (Gini, Theil, concentration index), decomposition | P2 | Stratification research; Stata `ineqdeco`. |

### E. Survey weights and complex samples (**the largest correctness gap**)

- Socius supports **frequency weights only** (like SPSS `WEIGHT BY`) [verified: README]. Applying NFHS/DHS weights as frequency weights gives correct point estimates only after normalisation, but **standard errors, CIs and p-values are wrong** because clustering and stratification are ignored. Ignoring clustering underestimates variance; ignoring strata overestimates it. The DHS Program tells analysts to use strata plus the PSU (`v021`) and the weight [reported: [DHS Guide to DHS Statistics, "Analyzing DHS Data"](https://dhsprogram.com/data/Guide-to-DHS-Statistics/Analyzing_DHS_Data.htm)].
- **P0 minimum:** a "Survey design" setting (weight, strata, PSU, optional FPC). Taylor-linearised SEs for means, proportions, totals, crosstabs (Rao-Scott χ²), linear and logistic regression. Label every output "design-based".
- **P0 fallback if the full design is too big for the pilot:** block the misuse. When a non-integer weight looks like a sampling weight, warn that "SEs assume simple random sampling", offer cluster-robust SEs on the PSU (P1), and say so in the APA text.
- Reference tools: SPSS Complex Samples (paid add-on), Stata `svyset`/`svy:`, R `survey`. jamovi and JASP base have no design-based variance [reported], so doing this well would be a real differentiator.

### F. Missing data

| Gap | Priority | Why |
|---|---|---|
| Missing-data summary (per-variable % missing, patterns, Little's MCAR test) | P1 | Reviewers ask; SPSS MVA; cheap to build. |
| Multiple imputation (chained equations) with pooled estimates (Rubin's rules) | P2 | Increasingly expected; heavy. |
| Explicit missing-handling choice per procedure (listwise vs pairwise), shown in the case note | P1 | Transparency; Socius shows case notes already. |

### G. Reproducibility and reporting

| Gap | Priority | Why |
|---|---|---|
| **Runnable log / syntax** (at minimum: export the full ordered SPSS syntax of the session as a `.sps` file that runs in SPSS/PSPP; ideally a Socius "journal" that re-plays transforms and analyses on a new file) | **P0** | Reproducibility is expected in theses and journals. Socius already emits syntax per item [verified], so bundling it into one exported `.sps` in order is small. Replay inside Socius is P1. |
| Session info block (Socius version, build hash, data file hash, date) in reports | P1 | Provenance. `buildInfo.ts` exists. |
| APA tables for model comparison; figure numbering (partly done) | P1 | See D. |
| Export to R/Stata script equivalents | P2 | Helps collaborators. |

### H. Qualitative coding vs NVivo / ATLAS.ti / MAXQDA / Taguette / QualCoder

- Strengths already present: codebook with criteria, coding, auto-code, memos, retrieval, co-occurrence, codes × attributes, intercoder κ and α, a mixed-methods bridge, docx/HTML reports.

| Gap | Priority | Why |
|---|---|---|
| **REFI-QDA `.qdpx` project export (and codebook `.qdc`)** | **P1** | The open exchange standard supported by ATLAS.ti, MAXQDA, NVivo, Quirkos, Transana, QDA Miner, f4analyse and Dedoose [reported: [MAXQDA help](https://www.maxqda.com/help/report-and-export/export-and-import-refi-qda-projects), [ATLAS.ti](https://atlasti.com/features/project-export-in-qdpx-format)]. Taguette exports QDC codebooks [reported: [Taguette](https://www.taguette.org/)]. Lets pilot users move work to their institution's tool: reduces lock-in fear and eases ethics and archiving. |
| **PDF import** (text layer) | P1 | Field notes, policy documents and articles are often PDFs; Taguette imports PDF, EPUB, ODT, RTF and HTML. |
| Audio/video with timestamped transcripts; on-device transcription | P2 | NVivo, MAXQDA and ATLAS.ti offer AI transcription; heavy for a browser app. |
| Code hierarchy operations (merge, split, move codes with segments), code colours, visual maps | P1/P2 | Everyday codebook refactoring. |
| Framework matrices (cases × themes summaries) | P2 | Common in UK/Indian policy research. |
| Image and region coding | P2 | — |

### I. Accessibility and usability

| Gap | Priority | Why |
|---|---|---|
| WCAG 2.2 AA audit (keyboard-only runs of every dialog, focus order, screen-reader table semantics, colour contrast in charts, `prefers-reduced-motion`) | **P1** | University procurement and ethics boards increasingly require it; SPSS and jamovi have known screen-reader gaps, so this is a chance to lead. |
| Localisation (Hindi, Bengali UI) | P2 | Indian pilot audiences. |
| Large-file performance (100k+ cases × 1,000 vars, typical of NFHS) | **P1** | NFHS-5 individual recode is hundreds of MB; test memory and virtualisation limits and fail gracefully [inferred]. |

## 3. Suggested pilot sequencing [inferred]

1. Split File. Exported session `.sps`. Interaction terms. Factorial ANOVA.
2. Survey design (weights, strata, PSU) for descriptives, crosstabs and linear/logistic regression. Robust/cluster SEs.
3. Margins/predicted probabilities. Model comparison tables. Table 1.
4. .dta import. Multiple response. Restructure.
5. Qualitative: REFI-QDA export, PDF import.
6. Accessibility audit and large-file hardening.

## 4. Sources

- Socius README and source (menus, procedures) as of 24 Sep 2026.
- DHS Program: https://dhsprogram.com/data/Guide-to-DHS-Statistics/Analyzing_DHS_Data.htm ; NFHS strata variable listing: https://microdata.worldbank.org/index.php/catalog/3110/variable/B/B_STRATA?name=B_STRATA
- jamovi/JASP comparisons: https://en.wikipedia.org/wiki/Jamovi , https://en.wikipedia.org/wiki/JASP , https://metricgate.com/blogs/jasp-vs-jamovi/ ; JASP 0.96 (Mar 2026): https://jasp-stats.org/2026/03/17/introducing-jasp-0-96-an-online-module-library-improvements-to-quality-control-tamil-and-basque-language-support-and-more/
- REFI-QDA: https://www.maxqda.com/help/report-and-export/export-and-import-refi-qda-projects , https://atlasti.com/features/project-export-in-qdpx-format , https://www.quirkos.com/learn-qualitative/refi-qda-exchange-atlasti-nvivo-maxqda.html
- Taguette: https://www.taguette.org/
- Limitation: we could not fetch systematic content analyses of methods in sociology journals from this environment. Frequency rankings here are expert judgement, not measured.
