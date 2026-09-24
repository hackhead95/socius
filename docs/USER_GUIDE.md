# Socius user guide

This guide is a set of short recipes. Each one takes a common research task and walks through it on the sample survey that comes with Socius, so you can follow along and then repeat the steps on your own data. If you know SPSS, most of it will feel familiar: the Data View, Variable View, menus and output tables follow SPSS closely.

Menu paths are written like this: **Analyze > Descriptive Statistics > Crosstabs**. In the app, menu items that open a dialog end with "...".

**Can't find something? Search.** Press **Ctrl+K** (**Cmd+K** on a Mac), or **/**, or click **Search Socius** in the top bar (the magnifying glass on a phone). Type what you are after in your own words, for example "chi square", "t test", "alpha", "recode" or "select cases": the search finds the menu command (with its menu path), variables in your data (by name, label or value label), results in Output, sections of the user guide and, in Text coding, your codes and a "Search in texts" action. Use the arrow keys and **Enter**, or tap a result. On a variable, **Enter** selects its column in Data View; **Shift+Enter** opens it in Variable View and **Alt+Enter** opens Frequencies with it. With an empty search box you see your recent commands and some suggestions.

## Contents

1. [The sample survey](#the-sample-survey)
2. [Open your SPSS file](#open-your-spss-file)
3. [Check variables and missing values](#check-variables-and-missing-values)
4. [Recode age into groups](#recode-age-into-groups)
5. [Reverse-code an item and build a trust scale](#reverse-code-an-item-and-build-a-trust-scale)
6. [Count activities into an index](#count-activities-into-an-index)
7. [Weight cases](#weight-cases)
8. [Run and read a crosstab](#run-and-read-a-crosstab)
9. [Compare two groups](#compare-two-groups)
10. [Compare several groups](#compare-several-groups)
11. [Correlation](#correlation)
12. [Linear regression with blocks and dummy variables](#linear-regression-with-blocks-and-dummy-variables)
13. [Logistic regression and odds ratios](#logistic-regression-and-odds-ratios)
14. [Ordinal regression for Likert outcomes](#ordinal-regression-for-likert-outcomes)
15. [Factor analysis](#factor-analysis)
16. [Charts](#charts)
17. [Copy APA tables into Word and export the report](#copy-apa-tables-into-word-and-export-the-report)
18. [Reporting results in APA style](#reporting-results-in-apa-style)
19. [Code open-ended answers](#code-open-ended-answers)
20. [Turn codes into variables and crosstab them](#turn-codes-into-variables-and-crosstab-them)
21. [Code interview transcripts](#code-interview-transcripts)
22. [Intercoder reliability](#intercoder-reliability)
23. [Save your project and export back to SPSS](#save-your-project-and-export-back-to-spss)
24. [AI help (optional)](#ai-help-optional)
25. [Using Socius inside Claude](#using-socius-inside-claude)
26. [Troubleshooting and FAQ](#troubleshooting-and-faq)

## The sample survey

The "Urban Neighbourhoods and Social Trust Survey" is a synthetic teaching dataset: 640 households in Kolkata, Delhi, Mumbai, Bengaluru and Chennai. Every respondent and answer is invented. To follow along, click **Load sample survey** on the welcome screen the first time you open Socius, or use **File > Load sample survey** at any time.

The variables used in this guide:

| Variable | What it is |
|---|---|
| `city`, `area` | City (5 cities) and type of area (core city or peri-urban) |
| `gender` | 1 = Man, 2 = Woman, 3 = Other / prefer to self-describe |
| `age` | Age in completed years (17 respondents have no age recorded) |
| `educ` | Highest education, 1 = No formal schooling to 6 = Postgraduate |
| `hh_income` | Monthly household income in rupees (999999 = Refused, declared missing) |
| `migrant` | 0 = Born in this city, 1 = Migrated from another state or district |
| `yrs_nbhd` | Years lived in this neighbourhood |
| `trust1` to `trust5` | Five neighbourhood trust items, 1 = Strongly disagree to 5 = Strongly agree, with 8 = Don't know and 9 = Refused declared missing. `trust3` ("You have to be very careful with people in this neighbourhood") is worded the other way round |
| `civic_meet`, `civic_vol`, `civic_petition`, `civic_contact`, `civic_protest` | Civic activities in the last 12 months (0 = No, 1 = Yes) |
| `belong` | Sense of belonging, 1 = Not at all to 4 = Very strongly (9 = Refused, missing) |
| `life_sat` | Life satisfaction, 0 to 10 |
| `vote` | Voted in the last municipal election (0 = No, 1 = Yes) |
| `wt` | Design weight (mean 1) |
| `q_challenge`, `q_connect` | Two open-ended questions, in English with some answers in Hindi, Bengali and Tamil |

The Text coding part of the guide also uses three fictional interview transcripts (**Text coding > Load sample interviews**).

## Open your SPSS file

1. Choose **File > Open data file** (Ctrl+O, or Cmd+O on a Mac), or drag the file onto the Socius window.
2. Pick your `.sav` or `.zsav` file. Socius reads it on your computer; nothing is uploaded.
3. A message tells you how many cases and variables were read. Notes about the file (for example "multiple response sets were not imported") appear as small messages at the bottom of the screen.

Variable labels, value labels, missing values, measurement levels, formats and the weight variable come with the file. You can also open CSV, TSV and Excel `.xlsx` files: Socius shows a preview where you choose the separator, the sheet, the character encoding and whether the first row holds variable names.

Opening a new file replaces the open data. If you have unsaved changes, Socius asks first.

## Check variables and missing values

Before any analysis, spend five minutes in Variable View. It saves a lot of wrong results later.

1. Click the **Variable View** tab (or **View > Variable View**).
2. Check the **Measure** column. Nominal, ordinal and scale matter in Socius: regression treats nominal and ordinal variables that have value labels as categories and dummy-codes them automatically, and dialogs warn when a variable's level does not suit a box.
3. Check the **Missing** column. Click a cell and press Enter to open the missing values dialog. In the sample, `trust1` shows 8 and 9, and `hh_income` shows 999999. Declared missing values are left out of every statistic. You can choose **No missing values**, **Discrete missing values** (up to three codes) or **Range plus one optional discrete value** (type LO or HI for an open end, for example 90 to HI).
4. If a group of variables shares the same coding, set it once and use **Data > Copy variable properties** to copy value labels, missing values or the measure to the others (for example all items of a Likert battery).
5. Run **Analyze > Descriptive Statistics > Frequencies** on `trust1` and `belong`. The table lists the missing codes separately from the valid answers, as in SPSS. Run **Analyze > Descriptive Statistics > Descriptives** on `age` and `hh_income`: `age` has N = 623 and the income mean no longer includes the 999999 codes.

Tip: **View > Value labels in Data View** switches the data grid between codes and labels.

## Recode age into groups

Goal: a new variable `agegrp` with 1 = 18-29, 2 = 30-44, 3 = 45-64, 4 = 65+, keeping `age` as it is.

1. **Transform > Recode into different variables**.
2. Move `age` into the list on the left. Under **New variables**, change the name to `agegrp` and the label to `Age group`.
3. Add the rules one at a time. For each rule choose the type of old value, type the numbers, type the new value and click **Add**:
   - **System- or user-missing** to **System-missing**
   - **Lowest through** 29 to 1
   - **Range** 30 to 44 to 2
   - **Range** 45 to 64 to 3
   - **through Highest** 65 to 4
4. Under **Labels for the new codes**, type 18-29, 30-44, 45-64 and 65+.
5. Click **OK**.

The first matching rule wins, as in SPSS. Putting the missing rule first matters: ranges also catch user-missing codes, so without it a code such as 999 would land in "65+". Values without any rule become missing in the new variable.

The new variable appears next to the data, and Output logs the step with its SPSS syntax. **Edit > Undo** (Ctrl+Z) removes it if you made a mistake.

An alternative is **Transform > Visual binning**: pick `age`, choose **My own cutpoints**, type `29, 44, 64`, and Socius shows how many cases fall in each group before you create it. It can also make equal-width intervals or equal-size groups (quartiles, quintiles).

To change codes in place instead (for example to set 8 and 9 to system-missing in the original variables), use **Transform > Recode into same variables**.

## Reverse-code an item and build a trust scale

`trust3` says "You have to be very careful with people in this neighbourhood", so agreeing means *less* trust. It has to be flipped before the five items are combined.

**Step 1: reverse-code.**

1. **Transform > Reverse-code items**.
2. Pick `trust3`. Socius detects the scale as 1 to 5 from the value labels (the missing codes 8 and 9 are ignored).
3. Keep **Create new variables, named with the suffix** `_r` and click **OK**. You get `trust3_r`, where 1 became 5, 2 became 4 and so on. Value labels are flipped too, and 8 and 9 stay as they are.

**Step 2: build the scale.**

1. **Transform > Create scale / index**.
2. Pick `trust1`, `trust2`, `trust3_r`, `trust4`, `trust5`.
3. Name it `trust` and give it a label such as "Neighbourhood trust (mean of 5 items)".
4. Keep **Mean of the answered items**. This keeps the 1 to 5 answer scale, which is easier to describe than a sum.
5. **Minimum answered items** defaults to 4 of 5: a respondent who answered fewer gets system-missing. This is the same as SPSS `MEAN.4(...)`.
6. The dialog shows Cronbach's alpha for the items you picked. If you had picked the original `trust3` by mistake, it would warn you that the item "goes against the other items".
7. Click **OK**.

**Step 3: check reliability properly.** Run **Analyze > Scale > Reliability Analysis** with the same five items. The output gives Cronbach's alpha, McDonald's omega, item statistics and the "Item-Total Statistics" table. Look at "Corrected Item-Total Correlation" (items below about .30 fit poorly) and "Cronbach's Alpha if Item Deleted" (an item whose removal raises alpha clearly may not belong). For the sample, alpha is close to .78.

## Count activities into an index

To count how many of the five civic activities each respondent did:

1. **Transform > Count values within cases**.
2. Pick the five `civic_` variables, name the new variable `civic_n`, and label it "Number of civic activities".
3. Under **Values to count**, add the value 1 and click **OK**.

## Weight cases

The sample has a design weight `wt`. To use it:

1. **Data > Weight cases**.
2. Choose **Weight cases by** and pick `wt`. The dialog shows the weighted N and tells you if weights have decimals (fine for design weights).
3. Click **OK**. The bar above the data now says "Weighted by wt", and every analysis uses the weight, exactly like SPSS `WEIGHT BY`.

To stop weighting, use **Data > Turn weighting off**.

Keep in mind that SPSS treats weights as frequency weights: significance tests use the weighted N. With a design weight that averages 1 (as `wt` does), N stays about the same. Socius does not do design-based (complex survey) variance estimation, and neither does base SPSS.

For the rest of this guide it does not matter whether weighting is on; the steps are the same. The output always states whether cases were weighted.

Related: **Data > Select cases** analyses only some cases, for example `gender = 2 AND age > 30`, a random sample, or a range of case numbers. By default the other cases are filtered out (kept, but left out of analyses), not deleted. **Data > Turn filter off** brings them back.

## Run and read a crosstab

Question: do migrants and people born in the city differ in whether they voted, and does that hold in both core and peri-urban areas?

1. **Analyze > Descriptive Statistics > Crosstabs**.
2. Put `migrant` in **Row(s)** and `vote` in **Column(s)**. Put the variable that defines the groups you compare in the rows, and keep **Row percentages** ticked (the default). Then each row adds up to 100% and you compare rows.
3. Under **Cells**, also tick **Adjusted standardized residuals**.
4. Under **Statistics**, **Chi-square** and **Phi and Cramer's V** are already ticked.
5. Click **Run**.

**How to read it.**

- **The table.** Compare the row percentages: what share of born-here respondents voted, and what share of migrants?
- **Chi-Square Tests.** Read the "Pearson Chi-Square" row. A significance below .05 means an association this strong would be unlikely if the two variables were unrelated in the population. For a 2x2 table Socius also shows Fisher's exact test and the continuity correction. If more than 20% of cells have expected counts below 5, a warning appears; then use Fisher's exact test, or merge small categories.
- **Cramér's V** tells you how strong the association is: roughly .10 is weak, .30 moderate and .50 strong. With a large sample, a significant chi-square can come with a very small V.
- **Adjusted residuals** show which cells drive the result. A value above +1.96 means more cases than expected in that cell, below -1.96 fewer than expected (at the .05 level). With larger tables, such as `gender` by `trust5`, this is how you see *where* the difference lies.

**Add a control variable (layer).**

1. Open Crosstabs again (the dialog remembers your choices) and put `area` in **Layer (control variable)**.
2. For layered 2x2 tables, also tick **Cochran-Mantel-Haenszel (layered 2x2)** and **Risk (odds ratio, 2x2)**.
3. Click **Run**.

You now get one table for core-city respondents, one for peri-urban respondents, and the total, with chi-square for each. This is the classic elaboration: if the association holds in both areas, area does not explain it away; if it disappears, the original association may be spurious; if it appears in one area only, area specifies the relationship. The Cochran-Mantel-Haenszel test gives one combined test of the association controlling for area, and the Breslow-Day test tells you whether the odds ratio differs between areas.

Every result also has a **What this means** paragraph in plain language and an **APA-style report** sentence (see [Reporting results in APA style](#reporting-results-in-apa-style)).

## Compare two groups

Question: is life satisfaction different for migrants and people born in the city?

**Independent-samples t-test.**

1. **Analyze > Compare Means > Independent-Samples T Test**.
2. Put `life_sat` in **Test Variable(s)** and `migrant` in **Grouping Variable**.
3. Under **Groups**, choose the two values to compare: 0 (Born in this city) and 1 (Migrated).
4. Click **Run**.

Read the "Group Statistics" table for the means, then "Independent Samples Test". Levene's test tells you which row to read: if its significance is below .05 the variances differ and you read "Equal variances not assumed" (Welch's t-test). Socius says which row to read in the interpretation. Cohen's d in the "Independent Samples Effect Sizes" table gives the size of the difference: about 0.2 is small, 0.5 medium and 0.8 large.

For a grouping variable with more than two categories, such as `gender`, pick the two values you want to compare (1 = Man and 2 = Woman), or use **Cut point** for a numeric grouping variable.

**Mann-Whitney U.** When the outcome is ordinal (for example a single Likert item such as `trust5`) or clearly skewed, use **Analyze > Nonparametric Tests > Mann-Whitney U (2 independent samples)** with the same set-up. It compares the ranks of the two groups instead of their means.

For two measurements on the same people (before and after, or two related questions) use **Paired-Samples T Test** or **Wilcoxon Signed-Rank (2 related samples)**.

## Compare several groups

Question: does life satisfaction differ by education?

1. **Analyze > Compare Means > One-Way ANOVA**.
2. Put `life_sat` in **Dependent List** and `educ` in **Factor**.
3. Keep **Descriptive**, **Homogeneity of variance test**, **Welch** and **Estimate effect size** ticked (the defaults).
4. Under **Post hoc**, tick **Tukey**, and also **Games-Howell (unequal variances)**.
5. Optionally tick **Means plot** under **Options**.
6. Click **Run**.

**How to read it.**

- **ANOVA table.** A significant F (p < .05) means at least one group mean differs from another. It does not say which.
- **Test of homogeneity of variances** (Levene). If it is significant, the groups have unequal spread: rely on the Welch test ("Robust Tests of Equality of Means") and on Games-Howell rather than Tukey.
- **Effect size.** Eta squared is the share of variation in the outcome explained by the groups: about .01 is small, .06 medium and .14 large. Omega squared is a less biased version.
- **Multiple Comparisons** shows every pair of groups with its mean difference and adjusted significance. This is where you find out, for example, whether postgraduates differ from graduates.

The nonparametric alternative is **Analyze > Nonparametric Tests > Kruskal-Wallis H (k independent samples)**; tick **Pairwise comparisons (Dunn's test, Bonferroni-adjusted)** to see which groups differ.

For quick tables of means by one or more grouping variables, **Analyze > Compare Means > Means** works like SPSS MEANS (tick **ANOVA table and eta** for a test).

## Correlation

Question: are years in the neighbourhood, belonging, life satisfaction and trust related?

1. **Analyze > Correlate > Bivariate Correlations**.
2. Pick `yrs_nbhd`, `belong`, `life_sat` and `trust`.
3. `belong` is ordinal (four categories), so tick **Spearman** as well as **Pearson**. Optionally tick **Heatmap of the correlation matrix**.
4. Click **Run**.

Each cell shows the correlation, its significance and N. Significant correlations are flagged with stars. The sign gives the direction; as a rough guide, .10 is weak, .30 moderate and .50 strong. Missing values are excluded pairwise by default, so N can differ between cells; choose **Exclude cases listwise** under **Missing values** for one common set of cases.

To check whether a correlation survives a control, use **Analyze > Correlate > Partial Correlations** (for example `yrs_nbhd` and `belong`, controlling for `age`).

## Linear regression with blocks and dummy variables

Question: what predicts neighbourhood trust, and do migration and neighbourhood ties add anything beyond background characteristics?

1. **Analyze > Regression > Linear Regression**.
2. **Dependent:** `trust` (the scale you built).
3. **Independent(s): Block 1:** `age`, `gender`, `educ`.
4. **Block 2 (optional):** `migrant`, `yrs_nbhd`, `civic_n`.
5. Leave **Method** on **Enter**, **Dummy-code categorical predictors** ticked, and **Reference category** on **First (lowest code)**.
6. Click **Run**.

**Dummy variables are made for you.** Predictors that are nominal or ordinal *and* have value labels are turned into 0/1 dummy variables, one per category except the reference category. Here `gender` becomes two dummies (Woman, Other) compared with Man, and `educ` becomes five dummies compared with No formal schooling. `age` and `yrs_nbhd` are scale variables and go in as they are. If you would rather treat `educ` as one numeric predictor, set its **Measure** to Scale in Variable View first. The generated SPSS syntax contains the COMPUTE lines for the dummies, so the model can be reproduced in SPSS.

**How to read it.**

- **Model Summary.** R² is the share of variation in trust explained. With blocks, look at **R Square Change** and its significance for Model 2: this tells you whether migration, years in the neighbourhood and civic activity add explanatory power beyond the background variables.
- **ANOVA** tests each model as a whole.
- **Coefficients.** B is the change in trust (on its 1 to 5 scale) for one unit more of the predictor, holding the others constant. For a dummy, B is the difference from the reference category. Beta (standardized) lets you compare the strength of predictors measured in different units. Check the significance and confidence interval of each B.
- **Collinearity.** Tolerance below about .2 (VIF above 5) signals that predictors overlap too much.
- **Residual plots and casewise diagnostics** help you spot outliers and a badly fitting model.

**Stepwise** is available (choose it under **Method**), but for theory-driven sociology, entering blocks you have chosen is usually easier to defend.

## Logistic regression and odds ratios

Question: who votes in municipal elections?

1. **Analyze > Regression > Binary Logistic Regression**.
2. **Dependent (two categories):** `vote`.
3. **Covariates:** `age`, `yrs_nbhd`, `civic_n`, `educ`, `migrant`.
4. **Event (coded 1):** keep **Higher value of the dependent**, so the model predicts voting (1 = Yes).
5. Click **Run**.

**How to read it.**

- **Omnibus Tests of Model Coefficients.** A significant chi-square means the predictors together improve on a model with no predictors.
- **Model Summary.** Nagelkerke R² is a rough analogue of R² (it is not a share of variance explained; report it as a pseudo R²).
- **Hosmer and Lemeshow Test.** A non-significant result (p > .05) means the model's predicted probabilities fit the observed data acceptably.
- **Classification Table.** The share of cases predicted correctly at a 0.5 cutoff. Compare it with Block 0, which predicts everyone into the larger group.
- **Variables in the Equation.** **Exp(B)** is the odds ratio. An odds ratio of 1.05 for `age` means each extra year multiplies the odds of voting by 1.05 (5% higher odds), holding the others constant. Below 1 means lower odds. For a dummy such as `migrant`, Exp(B) compares migrants with the reference category. The 95% confidence interval for Exp(B) should not include 1 for a significant predictor.

Rules of thumb: aim for at least 10 cases in the rarer outcome per predictor. If Socius warns about perfect separation (a predictor that predicts the outcome perfectly in some category), merge categories or leave that predictor out.

Note that Socius uses the **first** category as the default reference for categorical predictors, while SPSS defaults to the last. Choose **Last (highest code), SPSS default** under **Reference category** if you need to match SPSS output exactly.

For an outcome with three or more unordered categories, use **Analyze > Regression > Multinomial Logistic Regression**.

## Ordinal regression for Likert outcomes

A single Likert item or an ordered scale such as `belong` (Not at all, Not very strongly, Fairly strongly, Very strongly) is not really a scale variable, and a binary logistic model would throw information away. Ordinal regression uses the order without assuming equal distances between categories.

1. **Analyze > Regression > Ordinal Regression**.
2. **Dependent (ordered categories):** `belong`. The categories are ordered by their codes, lowest first, and the missing code 9 is excluded.
3. **Predictors:** `yrs_nbhd`, `migrant`, `age`.
4. Keep **Test of parallel lines** and **Goodness-of-fit statistics** ticked.
5. Click **Run**.

**How to read it.**

- **Model Fitting Information** tests the model against one with only thresholds.
- **Parameter Estimates.** The "Threshold" rows are the cut-points between categories and are rarely interpreted. In the "Location" rows, a positive estimate means higher values of the predictor go with higher categories of the outcome (stronger belonging). Socius uses the same sign convention as SPSS PLUM, and the interpretation translates the estimates into odds ratios (for example "multiplies the odds of being in a higher category by 1.04").
- **Test of Parallel Lines.** The model assumes each predictor has the same effect at every cut-point (proportional odds). A non-significant result supports this. If it is significant, consider a binary logistic regression on a meaningful split, or a multinomial model.

## Factor analysis

Question: do the trust items and the civic activity items measure two separate things?

1. **Analyze > Dimension Reduction > Factor Analysis**.
2. **Variables:** `trust1` to `trust5` and the five `civic_` items. (Using the original `trust3` is fine here; it will simply load negatively.)
3. **Extraction method:** **Principal axis factoring** if you think of trust and civic engagement as underlying (latent) attitudes, or keep **Principal components** (the SPSS default) to summarise the items.
4. **Rotation:** **Varimax (orthogonal)** is the default. Choose **Promax (oblique)** or **Direct oblimin (oblique)** if you expect the factors to be correlated, which is common in social attitudes.
5. Under **Options**, tick **Sorted by size** and **Suppress small coefficients** (absolute value below .30) to make the loadings table readable.
6. Click **Run**.

**How to read it.**

- **KMO and Bartlett's Test.** KMO above .60 and a significant Bartlett test mean the items share enough correlation for factor analysis.
- **Total Variance Explained** and the **Scree Plot.** By default Socius keeps factors with eigenvalues above 1. Look for the "elbow" in the scree plot too; you can set **Fixed number of factors** instead.
- **Rotated factor (or component) matrix.** Each item's loading on each factor. Items that load strongly (above about .40) on the same factor belong together. Name each factor by what its items have in common. With an oblique rotation, read the **Pattern Matrix** and check the factor correlation matrix.

Then check each set of items with **Analyze > Scale > Reliability Analysis** before you build scales from them.

## Charts

All charts come from the **Graphs** menu or from options inside analyses. They appear in Output with a title, a caption and, where it makes sense, the statistics behind them.

- **Share of voters in each city:** **Graphs > Bar Chart**, **Category axis** `city`, **Cluster by** `vote`, **Bars show** Percent of cases, **Percentages within** Each category. Choose **Stacked** under **Clustered bars** for 100% stacked bars, and **Horizontal bars** when labels are long.
- **Mean trust by city with confidence intervals:** **Graphs > Bar Chart**, **Category axis** `city`, **Bars show** Mean of a variable, **Variable for means** `trust`.
- **Distribution of age:** **Graphs > Histogram** with `age`, normal curve on.
- **Trust by city, with outliers:** **Graphs > Box Plot**, **Variables** `trust`, **Group by** `city`.
- **Years in the neighbourhood and trust:** **Graphs > Scatter Plot**, X axis `yrs_nbhd`, Y axis `trust`, optionally **Colour by** `migrant`. The fit line comes with r and R².
- **Trust across age groups for men and women:** **Graphs > Line Chart**, **Category axis (ordered)** `agegrp`, **Variable (for means)** `trust`, **Separate lines for** `gender`.
- **Age structure of the sample:** **Graphs > Population Pyramid**, **Age variable** `age`, **Split by** `gender`, with Man on the left and Woman on the right. Comparing this with census figures is a quick way to see whether your sample needs weighting.

Under each chart: **Show data** lists the numbers behind it, **PNG** saves a picture for Word or PowerPoint, and **SVG** saves a sharp vector version for publication.

## Copy APA tables into Word and export the report

At the top of the **Output** tab:

- **APA tables / SPSS tables** switches the table style. APA tables have horizontal rules only, numbered titles and italic headings, ready for a thesis or article. SPSS tables look like the SPSS viewer, which helps when you compare with SPSS output.
- **Interpretations** and **Syntax** show or hide the plain-language readings and the SPSS syntax.

To put one result into Word:

1. Choose **APA tables**.
2. Click **Copy** at the top right of the output item.
3. Paste into Word or Google Docs. The tables keep their formatting.

The APA sentence has its own **Copy** button. The **Outline** button lists all items so you can jump between them, and you can move items up and down or delete them.

To export everything at once, click **Export report** in the Output tab (or **File > Export output report**) and choose:

- **Word document (.docx):** APA tables and figures, ready to edit.
- **Web page (.html):** standalone and printable. Open it in your browser and print, or save as PDF from the print dialog.
- **Excel workbook (.xlsx):** one sheet per table.
- **Plain text (.txt):** tables as aligned text.

## Reporting results in APA style

Each analysis has an **APA-style report** box with a draft results sentence following APA 7. For a crosstab it looks like this:

> A chi-square test of independence showed a significant association between Gender of respondent and I would feel safe walking alone here after dark, χ²(8, N = 630) = 35.02, p < .001, Cramér's V = .17.

What the sentence contains:

- **The test and the variables**, in words.
- **The test statistic with its degrees of freedom**, and N where APA expects it: χ²(df, N = ...), t(df), F(df1, df2), r(df).
- **The exact p-value** to three decimals (p = .032), or p < .001 for very small values. Socius never writes p = .000.
- **An effect size**: Cramér's V for crosstabs, Cohen's d for t-tests, η² for ANOVA, R² and R² change for regression, odds ratios with confidence intervals for logistic regression, Cronbach's alpha for scales.
- **Descriptive statistics** where they help the reader, for example M and SD for each group.
- **No leading zero** for numbers that cannot be larger than 1 (p = .032, r = .45, V = .17), and a leading zero otherwise (d = 0.36), as APA requires.

When you paste it into your paper:

- Put statistical symbols in *italics* (*t*, *F*, *p*, *M*, *SD*, *N*, *r*, *d*). Socius writes them as plain text because italics are lost when you copy plain text.
- Rewrite the variable names into the concepts your reader knows ("gender and feeling safe after dark"). Socius uses short variable labels where they exist and variable names otherwise, so the sentence often needs light editing.
- Treat it as a draft. Add the context, the direction and meaning of the effect, and any assumption checks you made. The "What this means" paragraph is written for you, to help you read the output; it is not meant for the paper.

## Code open-ended answers

The sample survey asks "What is the biggest challenge facing your neighbourhood today?" (`q_challenge`). Here is how to code it.

**Bring the answers in.**

1. **Text coding > Import open-ended answers from dataset**.
2. **Open-ended question (string variable):** `q_challenge`.
3. **Name responses by (optional):** `resp_id`.
4. Under **Attributes**, tick `gender`, `city`, `area` and `migrant`. These travel with each answer, so you can later compare codes by group.
5. Import. You land in the **Responses** view of the **Text coding** tab (also reachable with **Text coding > Code open-ended responses**).

**Build a codebook.** In the **Codebook** panel, type a code name and add it. Start with a handful of codes from reading 30 or 40 answers, for example: Water supply, Safety, Traffic, Garbage and drainage, Flooding, Jobs, Housing, No problem / don't know. Use a code's menu and **Edit definition and rules** to add a **Definition**, **Include when** and **Exclude when** criteria and an **Example**, and to place it under a **Theme (parent code)** if you want a hierarchy (**Add sub-code** does the same from the parent). Clear definitions keep your coding consistent over weeks, and they are what a second coder needs.

**Code with the keyboard.** The first nine codes in the codebook get the number keys 1 to 9 (the key strip above the list shows which is which). Click in the response list, then:

- `j` / `k` (or the arrow keys) move down and up.
- `1` to `9` apply that code to the whole response. Press the same number again to remove it. A response can have several codes.
- `/` opens a search box to find any code, or create a new one by typing its name.
- `x` or Space selects a response. With several selected, use **Apply a code** to code them all at once.
- `o` or Enter opens the response to code only part of it.

Filters at the top show **Not coded yet** responses, responses with a given code, or responses from one group (for example only Kolkata). The counter shows how many are coded.

**Auto-code with keyword rules.** For clear-cut themes, rules save time.

1. **Text coding > Auto-code with keyword rules**.
2. Pick a code on the left and type rules, one per line. For "Water supply": `water`, `tanker`, `borewell`. For "Flooding": `flood*`, `waterlogging`, `monsoon`. Plain words match whole words, ignoring case; `*` matches any ending; several words form a phrase; `/pattern/i` is a regular expression; lines starting with `#` are notes.
3. Choose what to code (**the whole response or document**, the sentence or the paragraph) and where (for example **responses you have not coded yet**).
4. Click **Preview matches**, untick false hits (such as "water" in "waterproofing" if a rule catches it), then click **Code ... passages**.

Auto-coded segments are marked as such. Always read a sample of them in **Text coding > Retrieve coded segments**. Keyword rules miss answers in other scripts (the sample has some answers in Hindi, Bengali and Tamil) and answers that describe a theme without the keyword, so code the rest by hand.

**Look at the results.** **Text coding > Code frequencies** counts responses per code; **Codes by attribute** shows how often each code appears in each group (for example by city); **Code co-occurrence** shows which codes go together; **Word frequencies** and **Keyword in context** help you find themes you have not coded yet. **Send to Output** puts a table in the Output tab with your statistics. **Memos** keep your analytic notes next to the data.

## Turn codes into variables and crosstab them

This is the bridge from qualitative codes back to statistics: each code becomes a 0/1 variable in the dataset.

1. **Text coding > Export codes to dataset**.
2. Pick the question (if you imported more than one) and, if several people coded, whose coding to use.
3. Tick the codes to export. Each gets a variable named `c_` plus the code name, for example `c_water_supply`. Optionally tick **Also add a count variable** for the number of codes mentioned.
4. Click **Add ... variables**.

The new variables are placed right after `q_challenge`, with value labels 1 = Mentioned, 0 = Not mentioned, and system-missing for respondents who gave no answer. They are ordinary variables now:

- **Analyze > Descriptive Statistics > Crosstabs** with `gender` in **Row(s)** and `c_safety` in **Column(s)** tests whether women mention safety more often than men (chi-square and Cramér's V as in [Run and read a crosstab](#run-and-read-a-crosstab)).
- `area` by `c_water_supply` shows whether water problems are more common in peri-urban areas.
- A code variable can also be the outcome of a binary logistic regression, or a predictor in a linear regression.

If you code more responses later, delete the old code variables (or undo) and export again.

## Code interview transcripts

1. **Text coding > Load sample interviews** adds three fictional interviews (Shyamali in Kolkata, Manoj in Bengaluru, Sunita in Delhi) with attributes such as age, gender, city and migration. For your own transcripts use **Text coding > Import documents**: Word `.docx`, `.txt` or `.md` files (one document per file), or paste text.
2. Open the **Documents** view and click an interview in the **Sources** panel.
3. Select a passage with the mouse. A small box appears: type to find a code, press Enter to apply it, or type a new name and choose **Create code** to add it to the codebook on the spot. You can also select text and click a code in the Codebook panel.
4. Coded passages are highlighted in the code's colour, with bars in the margin. Click a highlight to see or remove its codes. Passages can have several codes, and codes can overlap.
5. Use themes (parent codes) and sub-codes to build the hierarchy of your analysis as it develops. **Merge into another code** in a code's menu combines two codes when you realise they are the same.
6. **Text coding > Retrieve coded segments** lists every passage for a code, across all interviews, with the speaker's attributes. **Codes by attribute** compares, for example, migrants and non-migrants. **Memos** record your interpretations.
7. To edit a document's attributes (for example to add "age group"), choose **Rename or edit attributes** from the source's menu in the Sources panel.

For your report, **Text coding > Qualitative report** creates a Word or HTML document with the codebook, counts and example quotes for each code. **Text coding > Export coded segments** gives all coded passages in Excel or CSV. **Text coding > Codebook export and import** saves the codebook as a Word table (for a thesis appendix), CSV or JSON.

## Intercoder reliability

To show that your coding is reliable, a second person codes the same material independently and you compare.

1. Agree on the codebook first. Export it (**Text coding > Codebook export and import**) if your colleague works in a separate project.
2. **Text coding > Coders**: add a second coder, for example "Priya". The first coder is "Coder 1" unless you rename it.
3. Code as usual. When it is Priya's turn, use the **Coder** button in the Text coding toolbar and choose **Code as Priya**. Choose **Show only my segments** in the same menu so she does not see the first coder's work.
4. Both coders code the same responses or documents. If you work on different computers, one person saves the project (**File > Save project**), sends the `.socius.json` file to the other, who opens it, codes as themselves and saves it again.
5. **Text coding > Intercoder reliability**. Choose **Coder A** and **Coder B**.

**How to read it.**

- **Units.** Each open-ended response is one unit. Interview documents are split into sentences, and a sentence counts as coded when the coder applied the code anywhere in it. Only sources that both coders have coded are compared.
- **Per code:** how often both coders applied it, only one did, or neither did, the percent agreement, **Cohen's kappa** (agreement corrected for chance) and **Krippendorff's alpha**.
- **Overall:** Krippendorff's alpha across all codes, the mean Cohen's kappa and overall agreement.
- The **Strength** column uses the Landis and Koch (1977) bands (for example .61 to .80 "substantial"). For published work, kappa or alpha of at least .70 to .80 is usually expected. Codes below .60 are highlighted.
- **Disagreements to review** lists the units where the coders differ, with **Show in context**. Discuss these, sharpen the code definitions, and code a fresh sample if needed.

**Send to Output** puts the reliability table in the Output tab, from where it goes into your report.

## Save your project and export back to SPSS

Socius autosaves your session in this browser, but that copy lives only in this browser on this computer. Save a project file for anything you want to keep.

- **File > Save project** (Ctrl+S) saves one `.socius.json` file with the data (including new variables), all output and the text-coding project. **File > Open project** opens it again, on this or any other computer. **File > Recent projects** lists projects saved or opened in this browser.
- **File > Save data as > SPSS data (.sav)** saves the data for SPSS, including the variables you created (`agegrp`, `trust3_r`, `trust`, `civic_n`, the `c_` code variables) with their labels, value labels and missing values. **SPSS compressed (.zsav)** makes a smaller file for SPSS 21 or later. If something had to be changed to fit SPSS's rules (for example a value label longer than 120 bytes), a message tells you.
- **File > Save data as** also offers CSV and Excel, each with codes or with value labels.
- **File > Export codebook** saves a list of variables, labels, value labels and missing values to Excel or CSV, handy as a data appendix.
- To continue an analysis in SPSS, open the **Syntax** section under any output item and click **Copy syntax**: it contains the SPSS commands that reproduce the result, including any filter, weight and dummy variables.

## AI help (optional)

Socius can ask an AI model to explain results and to help with text coding. It is off until you set it up, and everything else works without it.

**Where to find it.** The **AI** menu (between Text coding and Help, also in the phone menu) lists everything AI can do. The small **AI** chip in the top bar shows whether AI is ready (and which provider) or not set up; click it for the same list and the settings. If you choose an AI item before AI is set up, the settings open and say what the item will do once it is. If the item needs something first (a result to explain, answers to code), a short message says what to do, with a button that does it.

- **Ask the Socius assistant:** opens the assistant, which answers questions about methods and your data (for example "Which test should I use to compare trust between three cities?").
- **Explain a result:** every result in Output has an **Explain with AI** button next to **Copy**. It first shows which provider will receive what, with a **What will be sent** preview: the result's tables (numbers and labels), Socius's own summary, the APA sentence and any warnings. Individual answers are never sent: scatter plot points, outlier values and tables that list single cases are left out. Click **Explain** and the answer appears under the result, in five parts: what was tested, what the numbers mean, whether the assumptions and warnings matter, how to report it, and cautions (such as association is not causation). **Stop** ends it, **Copy** copies it, and **Add to output** keeps it in the output as a note labelled AI-generated. **Discuss with the assistant** continues in the assistant. The explanation can be wrong: check every number against the tables.
- **Suggest a codebook:** the AI reads a sample of your excerpts and proposes codes with definitions, inclusion and exclusion criteria and example quotes. Add a research question or focus to steer it. You choose which codes to keep.
- **Suggest codes for open-ended answers:** the AI applies your existing codebook to open-ended responses, in batches. You review every suggestion and **Accept** or **Reject** it; nothing is coded without your approval. Accepted codes are marked as AI suggestions.
- **Summarise a code** (in Retrieve) drafts a short summary of the passages coded with one code, with representative quotes.

The AI menu is their one home. In the Text coding workspace the **AI suggestions** button is a shortcut to the three coding features (the Text coding menu itself lists only non-AI commands). When AI is not set up the button is shown greyed out with a **Set up AI** link next to it.

**Choose where the AI runs.** Open **AI > AI assistant settings...**, the one place for AI set-up. The AI chip in the top bar and every **Set up AI** button open the same settings:

- **On this computer (free, private).** A small language model runs inside your browser. Nothing leaves your computer, and after a one-time download it works offline. Choose **Small and fast** (about 1 GB to download) or **Better quality** (about 1.8 GB, needs more graphics memory). Click **Download model** and wait for the progress bar; the browser keeps the model for next time. It needs WebGPU, which recent Chrome and Edge offer on Windows, Mac and ChromeOS desktops and laptops; the settings say whether your browser can run it. It is slower and less accurate than the online options, and handles fewer excerpts at a time. This is the option to use for confidential interviews.
- **Google Gemini (free key).** Good and fast. To get a key: open [Google AI Studio](https://aistudio.google.com/apikey), sign in with a Google account, click **Create API key**, and paste the key into the settings. Leave the model empty: Socius then picks the newest free Flash model your key can use. Click **Test connection** to check it.
- **Other service (advanced).** Any OpenAI-compatible service: Groq and OpenRouter (choose them from the list to fill in the address, then paste your key; on OpenRouter, free models end in `:free`), or a model on your own computer with Ollama or LM Studio (the service must allow requests from the Socius page; for Ollama, start it with `OLLAMA_ORIGINS` set to the site's address).
- **Claude.** When Socius runs inside Claude, it uses Claude automatically.

After a successful **Test connection**, an **AI is ready. Try it:** panel offers a button for each AI feature; it closes the settings and takes you there.

Keys and settings are stored in this browser only. They are never saved in project files or exports. **Forget key** removes a key (do this on a shared computer).

**Research ethics.** Before anything is sent, each AI dialog says what will be sent where (for example "up to 150 excerpts will be sent to Google Gemini"), and nothing is sent until you click. Online services receive the excerpts you send. On Gemini's free tier, Google may use what you send to improve its products, and human reviewers may read it. So:

- Anonymise first: remove names, places, employers and rare details that could identify someone.
- Check that your participants' consent and your ethics approval allow sharing data with an outside service. If they do not, use the on-device option.
- Treat suggestions as a starting point for your own reading, not as findings. Check every quote against the data. Suggested codes are part of your codebook like any other and should go through intercoder reliability in the usual way.
- Say in your methods section that AI assistance was used, which model, and for what.

**If something goes wrong.** Messages say what happened in plain words: a key that was not accepted (paste it again, or create a new one), too many requests (wait a minute; free tiers have per-minute and per-day limits), a browser that cannot run the on-device model (use Chrome or Edge, or choose Gemini), or a reply in an unexpected format (try again with fewer items; small on-device models find long lists harder).

## Using Socius inside Claude

Socius can also run as a Claude artifact (the single file `socius.html`). It works the same way, with three differences.

**AI suggestions.** Inside Claude, AI help uses Claude automatically, with nothing to set up (see [AI help](#ai-help-optional) for what it does). The on-device option is not available inside Claude.

**Saving files.** Inside Claude, files are saved through Claude's download prompt; confirm it each time. Word, Excel, CSV, HTML, PNG, SVG and project (`.json`) files arrive as they are. SPSS `.sav` and `.zsav` files arrive **zipped** (as `.sav.zip`), because the download prompt does not accept those file types. Unzip the file before opening it in SPSS or in Socius.

**Autosave.** Browser storage may not be available inside Claude, so the session may not be restored next time. Save a project file (**File > Save project**) before you close the conversation.

## Troubleshooting and FAQ

**My file will not open.**
Socius opens `.sav`, `.zsav`, `.csv`, `.tsv`, `.txt` and `.xlsx` files. For other formats it tells you how to convert:

- SPSS portable files (`.por`): open in SPSS or PSPP and save as `.sav`.
- Old Excel (`.xls`): save as `.xlsx` or CSV in Excel.
- Stata, SAS or R files: export CSV, or save as `.sav` (in R, `haven::write_sav()`).
- SPSS output (`.spv`) or syntax (`.sps`) files are not data files; open the `.sav` instead.
- Zipped files: unzip first, then open the file inside.

If a `.sav` file is damaged or cut off, Socius reads what it can and tells you (for example "the data ends with an incomplete case, which was ignored").

**Letters look wrong (strange characters instead of Hindi, Bengali or accented letters).**
This is a text encoding problem. Recent SPSS files state their encoding and open correctly, including Indian scripts. Very old `.sav` files may not state it; Socius then reads them as UTF-8 if possible, otherwise as Windows-1252 (Western European), and shows a warning. For such a file, open it in SPSS in Unicode mode and save it again, or ask whoever made it which encoding it uses. For CSV files, choose the right **Character encoding** in the import preview (Excel on Windows often saves CSV as Windows-1252; "CSV UTF-8" in Excel's Save As avoids the problem).

**My results differ from SPSS.** Check these first:

- **Missing values.** Are the same codes declared missing in both? (Variable View, Missing column.)
- **Weighting and filtering.** Is the same weight on, and the same cases selected? The line under each output title says which cases were used.
- **Measurement level.** In regression, nominal and ordinal variables with value labels are dummy-coded automatically; SPSS REGRESSION would treat them as numbers.
- **Reference category.** In logistic, ordinal and multinomial regression, Socius's default reference for categorical predictors is the first category; SPSS uses the last. Choose "Last (highest code), SPSS default" to match.
- **Random samples** differ from SPSS even with the same seed, because Socius uses its own random number generator.
- **Small known differences:** the Lilliefors significance in Explore can differ in the third decimal when p is between .1 and .2; Shapiro-Wilk is not computed with fractional weights; box plots with fractional weights use weighted percentiles instead of Tukey's hinges; McDonald's omega can differ slightly from SPSS 27 and later.

Every procedure is tested against scipy, statsmodels and other reference software, and p-values agree to at least six significant digits. If you still see a difference, copy the syntax Socius shows and run it in SPSS to compare like with like.

**Where is my data stored?**
Only in your browser, on your computer. Files you open are never uploaded. The autosaved session and the Recent projects list are kept in the browser's own storage (IndexedDB). Files you save go wherever your browser puts downloads. The only data that can leave your computer is the excerpts you choose to send with the optional AI suggestion features, and only to the provider you chose in **AI > AI assistant settings** (with the on-device option, nothing leaves at all). AI keys are kept in the browser, never in project files.

**I lost my work after clearing the browser.**
Clearing your browser's history, cookies or site data, using a private or incognito window, or switching to another browser or computer loses the autosaved session. **File > Close data and start fresh** also clears it on purpose. The autosave is a convenience, not a backup: use **File > Save project** regularly and keep the `.socius.json` file with your other research files.

**I made a mistake in a transformation.**
**Edit > Undo** (Ctrl+Z) reverses data changes one step at a time, and **Edit > Redo** (Ctrl+Y) brings them back. Coding actions have their own **Undo** button in the Text coding toolbar.

**A dialog warns that a variable has the wrong measurement level.**
It is a warning, not a block. Socius suggests which levels suit each box (for example scale for a t-test outcome). Often the fix is to set the right measure in Variable View.

**Keyboard shortcuts.** **Help > Keyboard shortcuts** lists them all, including the Responses view keys in Text coding. **Help > Getting started** gives a six-step overview.

**Something is wrong, or I have a suggestion.** **Help > Send feedback or report a problem** (or **Feedback** in the top bar) opens a form on GitHub. Say what you did, what you expected and what happened; do not attach confidential data.
