---
title: Socius: a beginner's guide
subtitle: Statistics and text coding for sociologists, in your browser
edition: Edition 1, September 2026
---

<!--
  Source of truth for the beginner's guide. Both builders read this file:
    node docs/guide/build-html.mjs   -> public/guide/index.html (and the PDF, via build-pdf.mjs)
    node docs/guide/build-docx.mjs   -> docs/guide/Socius-Beginners-Guide.docx
  Syntax (a small subset of Markdown, see docs/guide/README.md):
    # Chapter, ## Section, ### Minor heading
    ![Caption](img/name.png){width=60}     picture with caption, optional width in % of the text column
    :::tip Title  ...  :::                   box: tip, note, warn, apa (a results sentence), spss (for SPSS users)
    [[Ctrl+S]] keyboard key, **File > Save project** menu path, `name` variable name
    {{APP_URL}} {{SITE_URL}} {{GUIDE_URL}} {{FEEDBACK_URL}} are filled in by the builders
-->

# Welcome to Socius

Socius is a free research workbench for sociologists. It runs in your web browser. You can open SPSS files, run the statistics you know from SPSS, and code interviews and open-ended survey answers, all in one place.

This guide is for you if you are new to Socius, and also if you are new to statistics software. It takes you step by step from opening a file to a finished results section. Every example uses a practice survey that comes with Socius, so you can follow along on your own computer.

## Who Socius is for

- **Students** writing a dissertation or a methods assignment.
- **Researchers** who analyse survey data and interviews.
- **SPSS users** who want the same menus and tables without a licence. The Data View, Variable View, dialogs and output tables look and work much like SPSS.

## What it costs

Nothing. Socius is free to use. There is no account, no sign-up and no trial period.

## Your data stays on your computer

Socius runs entirely inside your browser. When you open a file, it is read on your computer and is never uploaded anywhere. Socius keeps a copy of your current work in the browser so it is there when you come back, but that copy lives only in this browser on this computer. To keep your work safe, save a project file (see [Saving and sharing your work](#saving-and-sharing-your-work)).

The one exception is the optional AI help for text coding. It is off until you set it up, and it never sends anything until you click a button that asks it to (see [AI help](#ai-help-optional)).

## What you need

- A computer with a recent version of **Chrome, Edge, Firefox or Safari**.
- An internet connection to open the Socius page. After that, your data does not travel anywhere.
- A mouse or trackpad and a keyboard. Socius opens on tablets and phones, which is fine for looking at results, but a computer is much easier for real work.

To start, open Socius at {{APP_URL}}. You can come back to this guide at any time from **Help > User guide**.

:::tip How to read this guide
Menu paths are written like this: **Analyze > Descriptive Statistics > Frequencies**. It means: click **Analyze** in the menu bar, then **Descriptive Statistics**, then **Frequencies**. In the app, items that open a dialog end with "...". Variable names from the practice survey look like this: `life_sat`.
:::

# A five-minute tour

When you open Socius for the first time, you see the welcome screen. It offers four ways to start: open your own data file, open a project you saved before, load the sample survey, or type data into an empty dataset.

![The welcome screen. Click Load sample survey (1) to follow this guide.](img/welcome.png)

Click **Load sample survey** now. The practice data opens, and you see the main screen.

![The main screen with the sample survey open.](img/tour.png){width=100 .big}

The numbers in the picture show the parts of the screen:

1. **Menu bar.** Everything Socius can do is in these menus: File, Edit, View, Data, Transform, Analyze, Graphs, Text coding and Help.
2. **Dataset bar.** The name of the open dataset, how many cases (rows) and variables (columns) it has, and small labels that tell you when a weight or a filter is switched on.
3. **Main tabs.** **Data View** shows the data, one row per respondent. **Variable View** describes the variables. **Output** collects your results. **Text coding** is where you code interviews and open-ended answers.
4. **Variable list.** All your variables with their labels. Type in the search box to find one quickly. **View > Variable list** hides and shows it.
5. **Toolbar.** Buttons for the current tab. In Data View you can switch between codes and value labels, add cases or variables, sort, and search.
6. **Data grid.** The data itself. Each row is a case (usually a respondent) and each column is a variable (usually a question).
7. **Feedback, Undo, Redo and theme.** **Feedback** opens a form to tell us about a problem. Undo and Redo reverse your last changes. The last button switches between light and dark colours.

:::spss For SPSS users
Data View, Variable View and the Output tab work like their SPSS counterparts. The main difference is that output lives in a tab of the same window instead of a separate viewer window.
:::

## The sample survey

The practice data is the "Urban Neighbourhoods and Social Trust Survey": 640 households in Kolkata, Delhi, Mumbai, Bengaluru and Chennai. It is invented for teaching, so no real person is described. You can load it again at any time with **File > Load sample survey**.

These are the variables this guide uses:

| Variable | What it is |
|---|---|
| `gender` | 1 = Man, 2 = Woman, 3 = Other / prefer to self-describe |
| `age` | Age in years (17 people did not give their age) |
| `educ` | Highest education, from 1 = No formal schooling to 6 = Postgraduate |
| `migrant` | 0 = Born in this city, 1 = Moved here from another state or district |
| `yrs_nbhd` | Years lived in this neighbourhood |
| `trust1` to `trust5` | Five statements about trust in the neighbourhood, from 1 = Strongly disagree to 5 = Strongly agree |
| `life_sat` | Life satisfaction, from 0 to 10 |
| `vote` | Voted in the last municipal election (0 = No, 1 = Yes) |
| `wt` | A survey weight |
| `q_challenge` | Open question: "What is the biggest challenge facing your neighbourhood today?" |

# Opening your data

## Open an SPSS file

1. Choose **File > Open data file** (or press [[Ctrl+O]], [[Cmd+O]] on a Mac). You can also drag the file from your computer onto the Socius window.
2. Pick your `.sav` file (or a compressed `.zsav` file) and click **Open**.
3. A short message tells you how many cases and variables were read.

![The File menu. Open data file (1) opens your own file; Load sample survey (2) brings back the practice data.](img/file-menu.png){width=45}

Everything that makes an SPSS file useful comes with it: variable labels (the full question text), value labels (for example 1 = Man, 2 = Woman), missing value codes, measurement levels and the weight variable.

## Open a CSV or Excel file

Socius also opens CSV files (`.csv`, `.tsv`) and Excel workbooks (`.xlsx`). Use the same **File > Open data file**. Before the data opens, Socius shows a preview so you can check that the columns are split correctly.

![The preview for a CSV file. Check the separator, the character encoding and whether the first row holds variable names, then click Open.](img/csv-preview.png)

- **Separator:** leave it on **Detect automatically** unless the preview looks wrong.
- **Character encoding:** if letters look strange (for example in Hindi, Bengali or accented names), try another encoding here.
- **First row has variable names:** keep this ticked if your first row holds column headings.
- For Excel files, you also choose which sheet to open.

CSV and Excel files do not store labels or missing value codes. After opening one, spend a few minutes in Variable View to add them (see the next chapter). If a column holds words, such as "Woman" and "Man", **Transform > Automatic recode** turns it into numbered categories with value labels, which is what most analyses need.

:::note Opening a file replaces the open data
Socius works on one dataset at a time. If you have unsaved changes, it asks before it replaces them.
:::

# Understanding your variables

Before you analyse anything, spend five minutes in **Variable View**. It prevents many wrong results later. Click the **Variable View** tab.

![Variable View. Each row describes one variable of your data.](img/variable-view.png)

The most important columns are:

1. **Name.** A short name used in menus and output, such as `life_sat`.
2. **Label.** The full description, often the question wording. Socius shows labels in dialogs and tables.
3. **Values.** Value labels: what each code means, such as 1 = Man.
4. **Missing.** Codes that mean "no real answer", such as 8 = Don't know or 9 = Refused.
5. **Measure.** The measurement level: nominal, ordinal or scale.

## Value labels

Click a cell in the **Values** column and then the small **...** button (or press [[Enter]]) to see or edit the value labels.

![The value labels of trust1. Codes 8 and 9 are marked as missing.](img/value-labels.png){width=70}

To add a label, type the value and the label at the top and click **Add**. **Paste a list** lets you paste many labels at once, one per line, such as `1=Strongly disagree`.

## Missing values

Surveys often use special codes for "Don't know" or "Refused". If you declare them as missing, Socius leaves them out of every percentage, mean and test. If you forget, a code like 9 would be treated as a real answer and pull your averages up.

Click a cell in the **Missing** column and then its **...** button.

![The missing values of trust1: 8 and 9 are declared missing.](img/missing-values.png){width=48}

You can choose **No missing values**, **Discrete missing values** (up to three codes, such as 8 and 9), or **Range plus one optional discrete value** (for example 90 to 99).

:::tip Declare it once, use it everywhere
If many variables share the same coding, such as all items of a Likert scale, set the labels and missing values on one of them. Then use **Data > Copy variable properties** to copy them to the others.
:::

## Measurement level: nominal, ordinal or scale

The measurement level tells Socius what kind of information a variable holds. Socius uses it to suggest suitable analyses and to warn you when a variable does not fit a box in a dialog.

- **Nominal:** categories with no order. Examples: gender, city, religion. You can count them, but "more" or "less" makes no sense.
- **Ordinal:** categories with a clear order, but the steps are not necessarily equal. Examples: education level, "Strongly disagree" to "Strongly agree".
- **Scale:** real numbers where differences are meaningful. Examples: age in years, income, a 0 to 10 satisfaction score.

Small icons next to each variable show its level: a cluster of circles for nominal, rising bars for ordinal and a ruler for scale. To change a level, click the **Measure** cell and pick another.

# Preparing your data

Real data rarely arrives ready to analyse. The **Transform** and **Data** menus help you reshape it. Each example here uses the sample survey. Every change is written to the Output tab together with the SPSS command that does the same thing, and **Edit > Undo** ([[Ctrl+Z]]) reverses it.

## Recode age into groups

Goal: a new variable `agegrp` with four age groups, keeping the original `age`.

1. Choose **Transform > Recode into different variables**.
2. Tick `age` in the list on the left.
3. Under **New variables**, type the name `agegrp` and the label `Age group`.
4. Add the rules on the right, one at a time. For each rule, choose the kind of old value, type the numbers, type the new value and click **Add**:
   - **System- or user-missing** becomes **System-missing** (so missing ages stay missing)
   - **Lowest through** 29 becomes 1
   - **Range** 30 to 44 becomes 2
   - **Range** 45 to 64 becomes 3
   - **through Highest** 65 becomes 4
5. Under **Labels for the new codes**, type 18-29, 30-44, 45-64 and 65 and over.
6. Click **OK**.

![Recoding age into four groups. The rules are checked from top to bottom, and the first rule that fits is used.](img/recode.png)

The new variable appears at the end of your data. Values without a rule become missing, so check that your rules cover every age.

## Reverse-code a question

Four of the trust statements are positive ("Most people in this neighbourhood can be trusted"). One is negative: `trust3` says "You have to be very careful with people in this neighbourhood". Agreeing with it means *less* trust. Before you combine the five items, flip `trust3` so that a high score always means more trust.

1. Choose **Transform > Reverse-code items**.
2. Tick `trust3`. Socius reads the answer scale (1 to 5) from the value labels.
3. Keep **Create new variables, named with the suffix** `_r` and click **OK**.


You now have `trust3_r`. Its value labels are flipped too, and the missing codes 8 and 9 stay as they are.

## Build a scale and check Cronbach's alpha

A scale (or index) combines several questions about the same idea into one score. It is usually more reliable than any single question.

1. Choose **Transform > Create scale / index**.
2. Tick `trust1`, `trust2`, `trust3_r`, `trust4` and `trust5`. Use `trust3_r`, not `trust3`.
3. Type the name `trust` and the label `Neighbourhood trust (mean of 5 items)`.
4. Keep **Mean of the answered items**. The score then stays on the familiar 1 to 5 scale.
5. **Minimum answered items** is 4: a person who answered fewer than four of the five gets no score.
6. Click **OK**.

![Creating a trust scale. The box (1) shows Cronbach's alpha for the items you picked.](img/scale.png)

**What Cronbach's alpha means.** Alpha tells you how well the items hang together, that is, whether people who agree with one tend to agree with the others. It runs from 0 to 1. As a rough guide, .70 or higher is acceptable for a research scale and .80 or higher is good. Here alpha is .78, so the five items form an acceptable scale. If you had used the original `trust3` by mistake, alpha would drop and Socius would warn you that the item "goes against the other items".

For the full picture, run **Analyze > Scale > Reliability Analysis** with the same five items.

## Select cases

Sometimes you want to analyse only part of your sample, for example only women aged 30 and over.

1. Choose **Data > Select cases**.
2. Choose **Cases that meet a condition** and type the condition: `gender = 2 AND age >= 30`.
3. Keep **Filtered out** for unselected cases. They stay in the file but are left out of analyses.
4. Click **OK**.

![Selecting women aged 30 and over. The box below the condition says how many cases would be selected.](img/select-cases.png)

While a filter is on, the dataset bar shows **Filter on** with the number of cases in use. To use everyone again, choose **Data > Turn filter off (use all cases)**, or click the small cross on that label.

## Weight cases

Many surveys come with a weight that corrects for how the sample was drawn. The sample survey has one called `wt`.

1. Choose **Data > Weight cases**.
2. Choose **Weight cases by** and pick `wt`.
3. Click **OK**.


The dataset bar now says **Weighted by wt**, and every analysis uses the weight until you switch it off with **Data > Turn weighting off** (or the cross on the label).

![The label in the dataset bar shows that a weight is on (1).](img/weight-chip.png){width=60}

:::note
The rest of this guide uses the unweighted data, so switch weighting off again if you tried it. Each result in Output says whether cases were weighted.
:::

# Your first analyses

All analyses live in the **Analyze** menu, and they all work the same way:

1. Pick an analysis from the menu. A dialog opens.
2. Move variables from the list on the left into the boxes on the right. Double-click a variable, drag it, or select it and click the arrow.
3. Check the options below the boxes, if you need to.
4. Click **Run**. The result appears in the **Output** tab.

Every analysis dialog has a **When to use this** link at the top that explains in plain words what the analysis is for.

Every result comes with two extra boxes. **What this means** explains the result in plain language, to help you read it. **APA-style report** gives you a draft sentence for your results section, written in the style of the American Psychological Association (APA 7), which most sociology journals and departments accept.

## Frequencies: how often does each answer occur?

**When to use it.** To describe one variable at a time: how many people gave each answer, and what percentage that is. It is usually the first thing you run on any survey.

**Try it.** How educated is the sample?

1. Choose **Analyze > Descriptive Statistics > Frequencies**.
2. Find `educ` in the list (1) and move it into **Variable(s)** (3) with the arrow (2).
3. Click **Run** (4).

![The Frequencies dialog with educ in the Variable(s) box.](img/freq-dialog.png)

![The result: a frequency table for education, a plain-language summary and a draft APA sentence.](img/freq-result.png){width=100 .big}

**How to read it.**

- **Frequency** is the number of people who gave each answer.
- **Percent** is the share of all cases, including missing ones.
- **Valid Percent** leaves out missing answers. This is usually the number to report.
- **Cumulative Percent** adds the valid percentages up as you go down the table. Here 40.9% have secondary education or less.

The most common answer is "Secondary" (24.7%), and the least common is "No formal schooling" (6.3%).

:::apa How to report it
Of the 640 respondents, 24.7% had completed secondary school, 23.8% held a graduate degree and 12.2% a postgraduate degree; 6.3% had no formal schooling.
:::

## Crosstabs with chi-square: are two categories related?

**When to use it.** When both variables are categories (nominal or ordinal), and you want to know whether they are related. For example: do women and men feel equally safe in their neighbourhood?

**Try it.** Does the feeling of safety after dark differ by gender?

1. Choose **Analyze > Descriptive Statistics > Crosstabs**.
2. Put `gender` in **Row(s)** and `trust5` ("I would feel safe walking alone here after dark") in **Column(s)**.
3. On the **Cells** tab, keep **Row percentages** ticked. Put the variable that defines your groups in the rows; then each row adds up to 100% and you compare rows.
4. On the **Statistics** tab, **Chi-square** and **Phi and Cramer's V** are already ticked.
5. Click **Run**.

![The Crosstabs dialog, Statistics tab. Chi-square and Cramer's V are ticked by default.](img/crosstab-stats.png)

![The crosstabulation: counts and row percentages for each gender.](img/crosstab-table.png){width=100 .big}

**How to read the table.** Compare the percentages across each row. Among men, 32.7% agree and 12.1% strongly agree that they feel safe after dark: 44.8% in total. Among women the total is 29.3% (21.0% plus 8.3%). Women are also more likely to strongly disagree (14.5% against 5.3% of men).

![The chi-square test and the strength of the association (Cramer's V).](img/crosstab-tests.png){width=100 .big}

**How to read the test.**

- **Pearson Chi-Square** asks: could a difference this large appear by chance if gender and feeling safe were unrelated? The **p-value** (in the "Significance" column) answers it. Here p < .001, far below the usual .05 limit, so the difference is very unlikely to be chance. We call it *statistically significant*.
- **Cramer's V** tells you how *strong* the relationship is, from 0 (none) to 1 (perfect). As a rough guide, .10 is weak, .30 moderate and .50 strong. Here V = .17: a real but weak relationship.
- The note under the table warns you if many cells have very few people ("expected count less than 5"). If more than 20% of cells are affected, the test becomes unreliable; merge small categories or use the **Exact** tab.

![Socius explains the result in plain words and drafts the APA sentence.](img/crosstab-reading.png){width=80}

:::apa How to report it
A chi-square test of independence showed a significant association between gender and feeling safe walking alone after dark, χ²(8, N = 630) = 35.02, p < .001, Cramér's V = .17. Men were more likely than women to agree that they felt safe (44.8% vs. 29.3%).
:::

Click **Copy** in the APA box to copy the sentence. Before you paste it into your paper, replace the long question wording with a short description, and put the statistical symbols (χ², N, p, V) in italics.

## Comparing two groups: the independent-samples t-test

**When to use it.** When you compare the *average* of a scale variable between exactly two groups. For example: are people who were born in the city more satisfied with life than people who moved there?

**Try it.**

1. Choose **Analyze > Compare Means > Independent-Samples T Test**.
2. Put `life_sat` in **Test Variable(s)** and `migrant` in **Grouping Variable**.
3. Under **Groups**, Socius fills in the two values of `migrant`: "Born in this city (0)" and "Migrated from another state or district (1)".
4. Click **Run**.


![Group means and the t-test.](img/ttest-tables.png){width=100 .big}

**How to read it.**

- **Group Statistics** shows the mean (average) for each group. People born in the city score 6.37 on average; migrants score 5.70.
- **Levene's Test** checks whether the two groups are equally spread out. If its "Sig." is above .05 (here .595), read the row **Equal variances assumed**. If it is below .05, read **Equal variances not assumed**. The plain-language box tells you which row to read.
- **t**, **df** and **Two-Sided p** give the test. Here t(628) = 4.51, p < .001: the difference is statistically significant.
- **Cohen's d** (in the effect sizes table) tells you how big the difference is: about 0.2 is small, 0.5 medium and 0.8 large. Here d = 0.36, a small to medium difference.


:::apa How to report it
Respondents born in the city reported higher life satisfaction (M = 6.37, SD = 1.80) than migrants (M = 5.70, SD = 1.85), t(628) = 4.51, p < .001, d = 0.36.
:::

## Comparing several groups: one-way ANOVA

**When to use it.** Like the t-test, but for three or more groups. For example: does life satisfaction differ by level of education?

**Try it.**

1. Choose **Analyze > Compare Means > One-Way ANOVA**.
2. Put `life_sat` in **Dependent List** and `educ` in **Factor**.
3. On the **Post hoc** tab, tick **Tukey**. This compares every pair of groups.
4. Click **Run**.

![Descriptives, Levene's test and the ANOVA table.](img/anova-tables.png){width=100 .big}

**How to read it.**

- **Descriptives** lists the mean for each group. Life satisfaction rises with education, from 4.95 (no formal schooling) to 7.00 (postgraduate).
- **ANOVA** tests whether *any* of the group means differ. Here F(5, 624) = 8.67, p < .001, so they do. It does not say which groups differ.
- **ANOVA Effect Sizes** gives eta squared (η²): the share of the differences in life satisfaction that education accounts for. Here η² = .065, about 6.5%. As a rough guide, .01 is small, .06 medium and .14 large.
- **Multiple Comparisons** (the Tukey test) shows every pair of groups. A star (*) marks pairs that differ significantly, for example postgraduates and graduates.
- If Levene's test is significant (below .05), the groups are unequally spread. Then rely on the **Welch** test and choose **Games-Howell** instead of Tukey.


:::apa How to report it
A one-way ANOVA showed that life satisfaction differed significantly by education, F(5, 624) = 8.67, p < .001, η² = .06. Tukey post hoc tests showed that postgraduates (M = 7.00) were more satisfied than every other group.
:::

## Correlation: do two numbers move together?

**When to use it.** When both variables are scale (or ordinal) and you want to know whether higher values of one go with higher (or lower) values of the other.

**Try it.** Choose **Analyze > Correlate > Bivariate Correlations**, move `age`, `yrs_nbhd`, `life_sat` and `trust` (the scale you built) into **Variables**, and click **Run**.

![A correlation matrix. Each cell shows Pearson's r, its significance and the number of cases.](img/corr-table.png){width=100 .big}

**How to read it.** Each cell pairs two variables. The **Pearson Correlation** (r) runs from -1 to +1:

- A positive r means both rise together; a negative r means one rises as the other falls.
- As a rough guide, .10 is weak, .30 moderate and .50 strong.
- Stars mark significant correlations.

Here, people who have lived longer in the neighbourhood trust their neighbours more (r = .37, moderate), and people with more trust are more satisfied with life (r = .29, weak). Remember that a correlation does not show which causes which.

:::apa How to report it
Neighbourhood trust was positively correlated with years lived in the neighbourhood, r(637) = .37, p < .001, and with life satisfaction, r(627) = .29, p < .001.
:::

:::tip Ordinal variables
For a single Likert item or other ordered categories, also tick **Spearman** in the dialog. It uses ranks and does not assume equal steps between answers.
:::

## A simple linear regression

**When to use it.** To predict a scale outcome from one or more other variables, and to see how much the outcome changes for each one-unit change in a predictor.

**Try it.** How much does life satisfaction rise with neighbourhood trust?

1. Choose **Analyze > Regression > Linear Regression**.
2. Put `life_sat` in **Dependent** and `trust` in **Independent(s): Block 1**.
3. Click **Run**.

![Model Summary, ANOVA and Coefficients tables.](img/regression-tables.png){width=100 .big}

**How to read it.**

- **Model Summary: R Square** is the share of the differences in the outcome that the model explains. Here R² = .083: trust explains about 8% of the differences in life satisfaction.
- **ANOVA** tests the model as a whole. Here it is significant (p < .001).
- **Coefficients: B** is the key number. For each one-point rise in trust (on its 1 to 5 scale), life satisfaction rises by 0.63 points (on its 0 to 10 scale). The **(Constant)** is the predicted value when the predictor is zero, and is rarely interpreted.
- **Beta** is the same effect in standard units, useful for comparing predictors measured in different units.


:::apa How to report it
A simple linear regression showed that neighbourhood trust predicted life satisfaction, B = 0.63, 95% CI [0.47, 0.79], β = .29, t(627) = 7.56, p < .001. The model explained 8.3% of the variance, F(1, 627) = 57.10, p < .001.
:::

With one predictor Socius calls it a "simple" linear regression; with two or more, a "multiple" linear regression.

You can add more predictors to Block 1. Categorical predictors such as `gender` or `educ` are turned into 0/1 "dummy" variables for you, each compared with the first category.

## Where to go next

Once you are comfortable with the analyses above, these are the natural next steps. They work the same way: pick variables, click **Run**, and read the plain-language box and the APA sentence.

- **Binary logistic regression** (**Analyze > Regression > Binary Logistic Regression**) predicts a yes/no outcome, such as whether someone voted. It reports odds ratios.
- **Reliability analysis** (**Analyze > Scale > Reliability Analysis**) gives Cronbach's alpha with item statistics, so you can see which question fits a scale worst.
- **Factor analysis** (**Analyze > Dimension Reduction > Factor Analysis**) shows which questions group together, for example whether trust items and civic activity items measure two different things.
- **Nonparametric tests** (**Analyze > Nonparametric Tests**) such as Mann-Whitney U and Kruskal-Wallis are alternatives to the t-test and ANOVA for ordinal or very skewed data.

# Charts

All charts are in the **Graphs** menu. They appear in Output with a title and the numbers behind them.

## A bar chart

**Try it.** Did the share of voters differ between cities?

1. Choose **Graphs > Bar Chart**.
2. Put `city` in **Category axis** and `vote` in **Cluster by (optional)**.
3. Set **Bars show** to **Percent of cases** and **Percentages within** to **Each category**. Each city's bars then add up to 100%.
4. Click **Run**.


![Voting by city. In every city, fewer than half of respondents voted.](img/bar-result.png)

For a single variable, leave **Cluster by** empty. To compare an average, such as mean trust by city, set **Bars show** to **Mean of a variable** and put the scale variable in **Variable for means**.

## A histogram

A histogram shows the shape of a scale variable. Choose **Graphs > Histogram**, put `age` in **Variable** and click **Run**.

![The age distribution with a normal curve. The buttons below the chart (1) show the data or save the chart as a picture.](img/histogram-result.png)

Here the middle half of respondents are between 30 and 51 years old, with a long tail of older people. Socius calls this "right-skewed".

## Saving a chart

Under every chart you find three buttons:

- **Show data** lists the numbers behind the chart.
- **PNG** saves a picture you can insert in Word or PowerPoint.
- **SVG** saves a sharp vector version that stays crisp at any size, useful for publications.

Charts are also included when you export the whole report to Word (see the next chapter).

# Getting results into your report

Every analysis you run is added to the **Output** tab, newest at the bottom. The bar at the top of Output controls how results look and how you take them away.

![The Output tab. The numbers are explained below.](img/output-toolbar.png){width=100 .big}

1. **APA tables / SPSS tables** switches the table style.
2. **Interpretations** and **Syntax** show or hide the plain-language boxes and the SPSS commands.
3. **Export report** saves all the output in one file.
4. **Copy** at the top right of each result copies that result.
5. The **Outline** lists every result, so you can jump between them.

## APA style or SPSS style

**APA tables** have horizontal lines only, a numbered title and an italic heading. This is what most journals and theses expect. **SPSS tables** look like the SPSS viewer, which helps when you compare your results with SPSS or with a colleague who uses it.

![The same frequency table in APA style.](img/apa-style.png)

![And in SPSS style.](img/spss-style.png)

## Copy one table into Word

1. Choose **APA tables** at the top of Output.
2. Click **Copy table** under the table you want (or **Copy** at the top of a result to copy all of it).
3. Paste into Word or Google Docs with [[Ctrl+V]]. The table keeps its lines and formatting.

**Excel**, next to **Copy table**, saves that one table as a spreadsheet.

## Copy the APA sentence

Click **Copy** in the **APA-style report** box and paste the sentence into your results section. Treat it as a draft:

- Rewrite long question wording into short concepts your reader knows ("feeling safe after dark").
- Put statistical symbols in italics: *t*, *F*, *p*, *M*, *SD*, *N*, *r*, *d*. Socius copies plain text, so italics are lost.
- Add the direction and meaning of the result in your own words.

## Export the whole report

Click **Export report** and choose a format:

- **Word (.docx):** APA tables and charts, ready to edit. This is the one most people want.
- **Web page (.html):** a standalone page you can open in any browser and print, or save as PDF from the print dialog.
- **Excel (.xlsx):** one sheet per table.
- **Plain text (.txt):** tables as aligned text.

To tidy up before exporting, use the small arrows on each result to move it up or down, and the bin icon to delete it. **Clear output** removes everything.

# Coding open-ended answers

Surveys often end with an open question, such as "What is the biggest challenge facing your neighbourhood today?". *Coding* means reading each answer and tagging it with one or more themes, called **codes**. The list of codes, with a definition for each, is your **codebook**. Once answers are coded, you can count the themes, compare them between groups, and even test the differences with statistics.

## Start with the worked example

The quickest way to learn is the worked example. Click the **Text coding** tab. With the sample survey open, the start screen of Text coding shows a card called **Explore a worked example**.


Click it. Socius brings in the 630 answers to `q_challenge`, adds a starter codebook of 15 codes grouped into 4 themes, and codes most answers automatically with keyword rules, so you have something to review. One click on **Undo** in the Text coding toolbar removes the whole example again.

## Import answers from a survey question

For your own data, bring in the answers yourself:

1. Choose **Text coding > Import open-ended answers from dataset**.
2. Under **Open-ended question (string variable)**, pick the question, for example `q_challenge`.
3. Under **Name responses by (optional)**, pick an ID such as `resp_id`.
4. Tick the characteristics you want to compare later, such as `gender`, `city`, `area` and `migrant`. These travel with each answer as *attributes*.
5. Click **Import 630 answers** (the button shows how many answers will come in).

![Importing the answers to q_challenge with four attributes.](img/import-answers.png)

## The Responses view

The answers appear in the **Responses** view of the Text coding tab.

![The Responses view with the worked example loaded.](img/responses.png){width=100 .big}

1. **Views.** Switch between Documents, Responses, Retrieve, Analyse, Reliability and Memos.
2. **Search and filters.** Find answers with a word, show only answers not yet coded, or only one group (for example only women).
3. **Number keys.** The first nine codes get the keys 1 to 9.
4. **An answer** with its attributes and its codes. Click **+ code** to add a code with the mouse, or the small cross on a code to remove it.
5. **Codebook.** Your codes, grouped under themes, with how many passages and sources each has.

## Build a codebook

To add a code, type its name in **New code name** at the top of the Codebook panel and click **Add**. Start with a handful of codes from reading 30 or 40 answers; you can add more as you go.

Good codes have clear definitions. Open a code's menu (the small arrow at the right of its row) and choose **Edit definition and rules**.

![Editing a code: its theme, definition, when to include and exclude it, an example and keyword rules.](img/code-definition.png){width=75}

- **Theme (parent code)** groups codes into a hierarchy, such as "Water supply" under "Infrastructure and services".
- **Definition**, **Include when**, **Exclude when** and **Example** keep your coding consistent over weeks, and they are exactly what a second coder needs.

## Code with the number keys

Coding by keyboard is fast. Click in the list of answers, then:

| Key | What it does |
|---|---|
| [[j]] or [[↓]] | Next answer |
| [[k]] or [[↑]] | Previous answer |
| [[1]] to [[9]] | Apply that code; press again to remove it |
| [[/]] | Find any code by name, or create a new one |
| [[x]] or [[Space]] | Select an answer (to code several at once) |
| [[o]] or [[Enter]] | Open the answer to code only part of it |

An answer can have several codes. The counter at the top right shows how many answers you have coded so far.

## Auto-code with keyword rules

For clear-cut themes, rules save time. Choose **Text coding > Auto-code with keyword rules** (or the **Auto-code** button).

![Keyword rules for the code "Safety at night".](img/autocode.png)

1. Pick a code on the left.
2. Type its rules on the right, one per line. A plain word matches that whole word, ignoring capitals. `*` matches any ending (`flood*` finds flood, floods and flooding). Lines starting with `#` are notes to yourself.
3. Choose **What gets coded** (the whole answer, or only the sentence with the match) and **Search in**.
4. Click **Preview matches**, untick any wrong hits, then click the button to code them.

:::warn Always check automatic codes
Keyword rules miss answers that describe a theme in other words or in another language, and they sometimes catch a word used in passing. Read a sample of the auto-coded answers, and use the filter **Not coded yet** to find the ones the rules missed.
:::

## Turn codes into variables and crosstab them

This is where qualitative and quantitative work meet. Each code can become a 0/1 variable in your dataset (1 = the person mentioned it, 0 = did not).

1. Choose **Text coding > Export codes to dataset**.
2. Tick the codes you want. Each gets a variable name starting with `c_`, such as `c_safety_at_night`.
3. Click **Add ... variables**.

![Exporting codes as variables. The last column shows how many answers mention each code.](img/export-codes.png){width=75}

Now run **Analyze > Descriptive Statistics > Crosstabs** with `gender` in **Row(s)** and `c_safety_at_night` in **Column(s)**:

![Women mention safety at night far more often than men.](img/code-crosstab.png){width=100 .big}

17.2% of women mention safety at night as the biggest challenge, against 4.0% of men, χ²(2, N = 630) = 28.86, p < .001. The answer to an open question has become a testable finding.

To compare codes between groups without leaving Text coding, open the **Analyse** view and choose **Codes by attribute**:

![Codes by attribute: how often each code appears among men, women and people of other genders.](img/codes-by-attribute.png){width=100 .big}

# Coding interviews

Interview transcripts are coded in the **Documents** view. You highlight a passage and attach one or more codes to it.

## Import a transcript

Choose **Text coding > Import documents**. Drop your files on the dialog, or click to choose them.


- **Word (.docx)** and **plain text (.txt, .md)** files: one document per file.
- **Paste text** lets you paste a transcript directly.
- To practise, choose **Text coding > Load sample interviews**. It adds three fictional interviews from Kolkata, Bengaluru and Delhi.

## Highlight and code a passage

1. Open the **Documents** view and click an interview in the **Sources** panel on the left.
2. Select a passage with the mouse, as you would to copy it.
3. A small box appears. Type the name of a code. Press [[Enter]] to apply an existing code, or choose **Create code** to add a new one on the spot.

![Selecting a passage and creating the code "Belonging".](img/quick-code.png){width=100 .big}

Coded passages are highlighted in the code's colour, with a stripe in the margin. A passage can have several codes, and codes can overlap.

![A coded interview: the Sources (1), coded passages (2) and the Codebook (3).](img/documents.png){width=100 .big}

## Write memos

Memos are your analytic notes. There are two kinds:

- **A memo on a passage.** Click a highlighted passage. A panel shows its codes, with a box for a memo on each.
- **A memo on the project or a code.** Open the **Memos** view and click **New memo**, or choose **Write a memo on this code** from a code's menu.

![Clicking a coded passage shows its codes and a memo box for each.](img/segment-memo.png){width=100 .big}


## Retrieve quotes

The **Retrieve** view collects every passage with a given code, across all your documents and answers, with the speaker's attributes. Pick a code at the top.

![All passages coded "Safety at night".](img/retrieve.png)

- **Copy quotes** copies them with their sources, ready for your write-up.
- **Show in context** jumps to the passage in its document.
- **Export CSV** and **Export Excel** save them as a table.

For a report of the whole codebook with counts and example quotes, choose **Text coding > Qualitative report**.

## Intercoder reliability: do two coders agree?

To show that your coding is trustworthy, a second person codes the same material independently, and you measure how often you agree.

1. Agree on the codebook with written definitions first.
2. Choose **Text coding > Coders** (or **Coder > Manage coders** in the toolbar). Add the second coder, for example "Priya", and click **Code as Priya**.
3. Priya codes the same answers or documents. While she codes, she does not see the first coder's codes, so her coding stays independent.
4. If you work on different computers, one person saves the project (**File > Save project**) and sends the `.socius.json` file to the other, who opens it, codes, and saves it again.
5. Open the **Reliability** view and choose **Coder A** and **Coder B**.

![Intercoder reliability between Coder 1 and Priya.](img/reliability.png){width=100 .big}

**How to read it.**

- **Agreement** is the share of decisions on which both coders agree. It looks high even by chance, because both coders leave most codes off most answers.
- **Cohen's κ (kappa)** and **Krippendorff's α (alpha)** correct for agreement by chance. For published work, .70 to .80 or higher is usually expected. The **Strength** column gives a verbal label ("substantial", "almost perfect").
- **Disagreements to review**, further down, lists the answers where you differ. Discuss them, sharpen the code definitions, and code a fresh sample if needed.

# AI help (optional)

Socius can ask an AI model to help with text coding: it can suggest a codebook, suggest codes for your open-ended answers, and summarise the passages under a code. It is switched off until you set it up, and everything else in Socius works without it.

## Set it up

1. Choose **Help > AI assistant settings**.
2. Choose where the AI should run.
3. Follow the short set-up steps for that choice, then click **Test connection**.


There are two free options:

- **On this computer.** A small AI model runs inside your browser. Nothing leaves your computer, and after a one-time download of 1 to 2 GB it even works offline. It needs a recent Chrome or Edge on a desktop or laptop, and it is slower and less accurate than online services.
- **Google Gemini.** Good and fast. You need a free key from Google: the settings explain how to get one in a minute with a Google account, and where to paste it. Leave **Model** empty: Socius picks a suitable free model for you.

![Google Gemini selected: paste your free key, then click Test connection (1).](img/ai-gemini.png)

Your settings and keys are stored in this browser only, never in project files.

## Before you send anything

:::warn Protect your participants
With an online service, the excerpts you send leave your computer. On free tiers, the provider may use them to improve its products, and people may read them. Before you use online AI help on real data:

- Remove names, places, employers and other details that could identify someone.
- Check that your participants' consent and your ethics approval allow sharing data with an outside service.
- For confidential interviews, use **On this computer**, where nothing leaves your computer.
:::

Each AI dialog says what will be sent where before you click, and nothing is sent until you do. Suggestions are only suggestions: you accept or reject every one. Read them as a starting point for your own analysis, check every quote against the data, and say in your methods section that AI assistance was used and how.

# Saving and sharing your work

## Save a project

A project file keeps everything together: the data (including the variables you created), all your output and the text coding. Choose **File > Save project** (or press [[Ctrl+S]]). Socius saves one file ending in `.socius.json` to your downloads folder.

![The File menu: Save project (1) and Save data as, with its formats.](img/save-menu.png){width=60}

To continue later, on this or any other computer, choose **File > Open project** and pick the file. **File > Recent projects** lists projects you saved or opened in this browser.

:::warn Autosave is a convenience, not a backup
Socius keeps a copy of your current session in the browser and restores it when you come back. But that copy disappears if you clear your browser's history or site data, use a private or incognito window, or switch to another browser or computer. Save a project file regularly and keep it with your other research files.
:::

## Save your data for SPSS, Excel or R

**File > Save data as** writes your data in other formats:

- **SPSS data (.sav):** opens in SPSS with all labels, value labels and missing values, including the variables you created in Socius. **SPSS compressed (.zsav)** is a smaller file for SPSS 21 or later.
- **CSV with codes** or **CSV with value labels:** plain text that almost any program reads, including R and Stata.
- **Excel with codes** or **Excel with value labels:** a spreadsheet.

**File > Export codebook** saves a list of all variables with their labels, value labels and missing values, handy for a thesis appendix.

## Share with a colleague

Send your colleague the `.socius.json` project file (by email or a shared drive). They open Socius and choose **File > Open project**. If they use SPSS, send the `.sav` file instead. Under every result in Output, the **Syntax** section holds the SPSS commands that reproduce it.

# Troubleshooting and FAQ

**My file will not open.**
Socius opens `.sav`, `.zsav`, `.csv`, `.tsv`, `.txt` and `.xlsx` files. For other formats:

- Old Excel files (`.xls`): open in Excel and save as `.xlsx` or CSV.
- SPSS portable files (`.por`): open in SPSS or PSPP and save as `.sav`.
- Stata, SAS or R files: export them as CSV, or save as `.sav` (in R, `haven::write_sav()`).
- SPSS output (`.spv`) and syntax (`.sps`) files are not data. Open the `.sav` file instead.
- Zipped files: unzip first.

**Letters look wrong (strange symbols instead of Hindi, Bengali or accented letters).**
This is a text encoding problem. For a CSV file, choose another **Character encoding** in the preview. In Excel, saving as "CSV UTF-8" avoids the problem. Recent SPSS files open correctly; for a very old one, open and save it again in a recent SPSS.

**My results differ from SPSS.**
Check that the same codes are declared missing (Variable View, Missing column), and that the same weight and filter are on. The line under each result title says how many cases were used and whether they were weighted.

**A dialog warns that a variable has the wrong measurement level.**
It is a warning, not a block. Often the fix is to set the right level in the Measure column of Variable View.

**I made a mistake.**
**Edit > Undo** ([[Ctrl+Z]]) reverses changes to the data one step at a time, and **Edit > Redo** ([[Ctrl+Y]]) brings them back. Text coding has its own **Undo** button in its toolbar.

**I lost my work after clearing the browser.**
Clearing browsing data, a private window, or another browser or computer loses the autosaved session. Only a saved project file is safe. Save one regularly with **File > Save project**.

**Where is my data stored?**
Only in your browser, on your computer. Files you open are never uploaded. The only thing that can leave your computer is the text excerpts you choose to send with the optional online AI help.

**Can I use Socius on a phone?**
Yes, for looking at data and results. For coding and analysis, a computer with a mouse and keyboard is much easier.

**Where are the keyboard shortcuts?**
**Help > Keyboard shortcuts** lists them all. **Help > Getting started** gives a six-step overview.

# Giving feedback

Socius is young, and your experience helps make it better. If something does not work, confuses you, or you miss a feature, please tell us.

Choose **Help > Send feedback or report a problem**, or click **Feedback** at the top right of the screen. A form opens on GitHub in a new tab. You can also go there directly: {{FEEDBACK_URL}}

![The Help menu, with the user guide, the AI settings and the feedback form.](img/help-menu.png){width=40}

- Posting on GitHub needs a free GitHub account. Creating one takes a minute.
- Say what you did, what you expected and what happened instead. A screenshot helps.
- Never attach confidential data. If a problem only happens with your file, describe the file (for example "an SPSS file with 300 variables from 2012") instead of sending it.

Thank you for trying Socius.

# Appendix A: Quick reference card

| I want to... | Where to find it |
|---|---|
| Open an SPSS, CSV or Excel file | **File > Open data file** |
| Load the practice survey | **File > Load sample survey** |
| See labels, missing values, measure | **Variable View** tab |
| Show labels instead of codes in the data | **View > Value labels in Data View** |
| Copy labels to other variables | **Data > Copy variable properties** |
| Group ages or incomes | **Transform > Recode into different variables** |
| Flip a negatively worded item | **Transform > Reverse-code items** |
| Build a scale with Cronbach's alpha | **Transform > Create scale / index** |
| Compute a new variable with a formula | **Transform > Compute variable** |
| Analyse only some cases | **Data > Select cases** |
| Use a survey weight | **Data > Weight cases** |
| Count answers | **Analyze > Descriptive Statistics > Frequencies** |
| Mean, SD, minimum, maximum | **Analyze > Descriptive Statistics > Descriptives** |
| Relate two categorical variables | **Analyze > Descriptive Statistics > Crosstabs** |
| Compare two group means | **Analyze > Compare Means > Independent-Samples T Test** |
| Compare three or more group means | **Analyze > Compare Means > One-Way ANOVA** |
| Correlate scale variables | **Analyze > Correlate > Bivariate Correlations** |
| Predict a scale outcome | **Analyze > Regression > Linear Regression** |
| Predict a yes/no outcome | **Analyze > Regression > Binary Logistic Regression** |
| Check a scale's reliability | **Analyze > Scale > Reliability Analysis** |
| Make a bar chart or histogram | **Graphs > Bar Chart**, **Graphs > Histogram** |
| Copy a table into Word | **Copy table** under the table in Output |
| Export all results to Word | **Export report > Word (.docx)** in Output |
| Code open-ended answers | **Text coding > Import open-ended answers from dataset** |
| Import interview transcripts | **Text coding > Import documents** |
| Auto-code with keywords | **Text coding > Auto-code with keyword rules** |
| Turn codes into variables | **Text coding > Export codes to dataset** |
| Check agreement between coders | **Text coding > Intercoder reliability** |
| Set up AI help | **Help > AI assistant settings** |
| Save everything | **File > Save project** ([[Ctrl+S]]) |
| Save data for SPSS | **File > Save data as > SPSS data (.sav)** |
| Undo | **Edit > Undo** ([[Ctrl+Z]]) |
| Report a problem | **Help > Send feedback or report a problem** |

# Appendix B: Glossary

| Term | Meaning |
|---|---|
| Case | One row of data, usually one respondent. |
| Variable | One column of data, usually one question. |
| Value label | The words behind a code, such as 2 = Woman. |
| Missing value | A code that means "no real answer", such as 9 = Refused. Left out of statistics. |
| Nominal, ordinal, scale | Measurement levels: unordered categories; ordered categories; real numbers. |
| p-value | The probability of a result at least this strong if there were really no relationship. Below .05 is usually called statistically significant. It says nothing about how big or important an effect is. |
| Statistically significant | Unlikely to be due to chance alone (usually p < .05). |
| Chi-square (χ²) | A test of whether two categorical variables are related, used with crosstabs. |
| Cramér's V | The strength of a relationship in a crosstab, from 0 (none) to 1 (perfect). About .10 is weak, .30 moderate, .50 strong. |
| Mean (M) and standard deviation (SD) | The average, and how far values typically lie from it. |
| t-test | A test of whether the means of two groups differ. |
| ANOVA | Analysis of variance: a test of whether the means of three or more groups differ. |
| Effect size | How big a difference or relationship is, regardless of sample size. Examples: Cohen's d, eta squared (η²), Cramér's V, r. |
| Cohen's d | The difference between two means in standard deviation units. About 0.2 is small, 0.5 medium, 0.8 large. |
| Correlation (r) | How closely two variables move together, from -1 to +1. About .10 is weak, .30 moderate, .50 strong. |
| Regression coefficient (B) | How much the outcome changes for a one-unit increase in a predictor, holding other predictors constant. |
| R squared (R²) | The share of the differences in an outcome that a regression model explains. |
| Cronbach's alpha | How consistently a set of items measures the same thing, from 0 to 1. .70 or higher is usually acceptable. |
| Degrees of freedom (df) | A number based on sample size and groups that is reported with a test statistic, as in t(628). |
| Code | A label for a theme that you attach to a passage of text. |
| Codebook | The list of your codes with a definition, inclusion and exclusion rules and an example for each. |
| Theme | A group of related codes (a parent code). |
| Memo | Your analytic note on a passage, a code or the project. |
| Intercoder reliability | How far two coders who code the same material independently agree, beyond chance. Measured with Cohen's kappa (κ) or Krippendorff's alpha (α); .70 to .80 or higher is usually expected. |
| APA style | The reporting style of the American Psychological Association (7th edition), used by many social science journals. |
| Syntax | The SPSS commands that reproduce a result. Socius shows them under each result. |
