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

Socius runs entirely inside your browser. When you open a file, it is read on your computer and is never uploaded anywhere. Socius keeps a copy of your current work in the browser so it is there when you come back, but that copy lives only in this browser on this computer. To keep your work safe, save a project file (see [Saving and sharing your work](#saving-and-sharing-your-work)). **Help > About Socius** lists everything Socius keeps in the browser (see [What Socius keeps in your browser](#what-socius-keeps-in-your-browser)).

The one exception is the optional AI help. It is off until you set it up, and it never sends anything until you click a button or ask a question. Each AI feature tells you what it will send, and to whom, before it does (see [Getting help from AI](#getting-help-from-ai)).

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

1. **Home button and menu bar.** The **Socius** logo at the far left is the Home button: it takes you back to the start screen (see below). Everything Socius can do is in the menus next to it: File, Edit, View, Data, Transform, Analyze, Graphs, Text coding, AI and Help. Click a menu to open it; while it is open, point at another menu to open that one instead.
2. **Search.** Type what you are looking for, such as "chi square" or a variable name, and Socius finds the menu item, variable, result or help page (see [Finding anything with Search](#finding-anything-with-search)).
3. **AI, Feedback, Undo, Redo and theme.** The **AI** chip shows whether AI help is set up ("not set up" until you choose an option). **Feedback** opens a short dialog for reporting a problem or suggesting an idea (see [Giving feedback](#giving-feedback)). Undo and Redo reverse your last change in the tab you are in. The last button switches between light and dark colours.
4. **Dataset bar.** The name of the open dataset, how many cases (rows) and variables (columns) it has, and small labels that tell you when a weight or a filter is switched on.
5. **Main tabs.** **Data View** shows the data, one row per respondent. **Variable View** describes the variables. **Output** collects your results. **Text coding** is where you code interviews and open-ended answers.
6. **Variable list.** All your variables with their labels. Type in the search box to find one quickly. **View > Variable list** hides and shows it. In a narrow window (below about 900 pixels wide, such as a tablet), the list is hidden to give the data more room, and **View > Variable list** opens it as a drawer over the page.
7. **Toolbar.** Buttons for the current tab. In Data View you can switch between codes and value labels, add cases or variables, sort, and search.
8. **Data grid.** The data itself. Each row is a case (usually a respondent) and each column is a variable (usually a question).
9. **Assistant button.** At the right end of the row of tabs. It opens the Socius assistant, which answers questions about your data and methods once AI help is set up (see [The Socius assistant](#the-socius-assistant)). On a phone it shows only its icon.

:::spss For SPSS users
Data View, Variable View and the Output tab work like their SPSS counterparts. The main difference is that output lives in a tab of the same window instead of a separate viewer window.
:::

## Coming back to the start screen

Click the **Socius** logo (1) at any time to see the start screen again. From there you can open another data file or project, load the sample survey, or pick a recent project. While something is open, a bar at the top says what it is, for example "Open now: Urban trust survey (sample)". Click **Back to your data** (2), or any tab, to return to your work. (When only output or coding is open, the button says **Back to Output** or **Back to Text coding**.)

![The start screen, opened with the Socius logo (1). Back to your data (2) returns to your work.](img/home.png){width=100 .big}

Opening a file from the start screen replaces the open data, just like **File > Open data file**. If you have unsaved changes, Socius asks first.

## Small messages and dialogs

After many actions, a small message appears at the bottom of the screen for a few seconds, for example "Created agegrp by recoding age." Some messages have a button: **Undo** takes the action back, and **Show** takes you to the variable you just made. If the same message appears twice, the new one replaces the old one instead of piling up. Messages never cover the buttons of an open dialog.

A dialog with boxes to fill in or tick stays open if you click the dimmed area around it by mistake, so you do not lose your choices; its edge briefly lights up to show it is still waiting. To close it, click **Cancel** or press [[Esc]]. Dialogs that only show information close with a click outside.

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

# Finding anything with Search

You do not need to remember where things are in the menus. Search finds commands, variables, results and help pages for you.

## Open Search

- Press [[Ctrl+K]] ([[Cmd+K]] on a Mac), from anywhere in Socius.
- Or press [[/]] when you are not typing in a box or in the Data View grid.
- Or click the **Search Socius** box in the top bar. On a narrow screen it becomes a magnifying-glass button, and on a phone the search opens full screen.

Start typing. Use the arrow keys to move through the results, [[Enter]] to open one and [[Esc]] to close Search. Small typing mistakes are fine: "crostabs" still finds Crosstabs.

![Searching for "chi square". Type in the box (1). Commands (2) run the menu item, Help topics (3) open this guide at the right page, and the last line (4) asks the Socius assistant.](img/search-palette.png){width=75}

## What you can search for

| Type this | What you get |
|---|---|
| chi square | **Crosstabs** (under Analyze > Descriptive Statistics). Enter opens the dialog. |
| t test, anova, regression, alpha | The matching analysis. "alpha" or "reliability" finds Reliability Analysis. |
| recode, weight, filter | The matching Transform or Data command. |
| trust | Your variables whose name, label or value labels contain "trust". [[Enter]] selects its column in Data View; the **Variable View** and **Frequencies** buttons on each row open it there or in Frequencies. |
| the title of a result, such as Crosstabs | **Results in Output**: jumps to that result. |
| missing values | **Help topics**: opens this guide at that section, in a new tab. |
| a word from your interviews, such as water | Once you have texts in Text coding: **Search in texts for "water"** lists every passage that contains it (Keyword in context). |
| any question | **Ask the assistant: ...** (always the last line) sends your question to the Socius assistant. |

With an empty box, Search shows **Recent** (what you opened from Search lately) and **Suggestions**. Commands that cannot run yet are greyed out and say why, for example "Open or create a dataset first". If you choose one anyway, Search explains what is missing. When a command needs data, it offers two buttons: **Open data file...** and **Load sample survey**.

Greyed-out items in the menus work the same way: point at one to see why it is not available yet.

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

## Rename a variable

Short, clear names make your output easier to read. To rename a variable:

1. In Variable View, double-click its cell in the **Name** column (or click the cell and press [[Enter]] or [[F2]], or just start typing).
2. Type the new name. You can click inside the box to fix a typo.
3. Press [[Enter]] or [[Tab]], or click somewhere else.

In Data View, double-clicking a column heading takes you to Variable View with that variable's name ready to change.

The rules come from SPSS, so your file still opens there:

- Start with a letter. Letters from any alphabet work, so a Bengali name such as বয়স is fine.
- Use only letters, digits and `_ . @ # $`. No spaces: write `age_group`, not `age group`.
- Do not end with `.` or `_`.
- Every name must be different. Capitals do not count, so `age` and `AGE` are the same name. Changing only the capitals (`age` to `Age`) is fine.
- At most 64 bytes: 64 English letters, or about 21 Bengali letters.

If a name breaks a rule, a message under the cell says why and suggests a fix, for example "Names cannot contain spaces. Try age_group." Correct it and press [[Enter]] again, or press [[Esc]] to cancel. If you click elsewhere, the old name stays and a short message says why.

Renaming never breaks anything: weights, filters, exported codes and earlier results follow the variable, not its old name. **Edit > Undo** shows "Undo rename of" and the old name.

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
If many variables share the same coding, such as all items of a Likert scale, set the labels and missing values on one of them. Then use **Data > Copy variable properties** to copy them to the others. The next section shows a faster way to check many variables at once.
:::

## Check many variables at once: Define variable properties

Files from CSV or Excel often arrive without labels, and survey files often hide codes like 8 = Don't know or 99 = Refused among the real answers. **Data > Define variable properties** reads the values each variable really has and helps you label them, mark missing codes and set the measurement level, all in one place. It works like the SPSS command of the same name. You also find it on the Variable View toolbar and in the Variable View right-click menu.

**Step 1: choose the variables.** Tick the variables you want to check, for example `trust1` to `trust5` and `hh_income`, and click **Scan 6 variables** (the button counts them). Good first choices are questions from a CSV or Excel file and the items of a Likert scale. By default Socius scans all cases and shows at most 200 different values per variable; you can change both.

**Step 2: check each variable.** The list on the left (1) shows every scanned variable with its state, such as **Labels complete**, **3 values unlabelled** or **Suspected missing code**. Click a variable to see its values on the right.

![Checking trust1. The scanned variables (1), Socius's suggestion for the measurement level (2), codes already marked missing (3), a code that looks like a missing code (4) and Apply (5).](img/define-properties.png){width=100 .big}

- **Measurement level.** Socius suggests a level and says why (2), for example "Ordinal suggested: 5 ordered codes with labels like Strongly disagree ... Strongly agree." If the suggestion differs from the current level, a button such as **Use Ordinal** switches it.
- **The value grid.** Every value in the data, with its **Label**, a **Missing** box and a **Count**. Type a label straight into the grid. To label a code that does not occur in the data (yet), type it in the last row, **Label for a value not in the data**, and click **Add**.
- **Notes.** **missing code** (green, 3) means the code is already marked missing. **looks like a missing code** (amber, 4) flags a code such as 7, 8 or 9 on a 1 to 5 scale, 98, 99, 999, negative codes like -1, or a label such as "Don't know" or "Refused". Tick **Missing** if it is not a real answer. **unlabelled** marks a value with no label.
- **Suggest labels** offers ready-made labels that fit the values, such as an agreement scale from 1 to 5, yes/no, or labels for the missing codes 8 and 9. You see a preview before anything changes. Always check them against your questionnaire.
- **Copy properties from another variable...** and **Apply these properties to other variables...** copy the labels, missing values and level between variables. For a battery such as `trust1` to `trust5`, one click selects the other items.

Nothing changes until you click **Apply** (5). All your edits then become one change: **Edit > Undo** in Data View or Variable View takes all of them back at once. The SPSS syntax is written to Output. If you click **Cancel** after editing, Socius asks whether to discard your changes.

:::note SPSS limits, explained on the spot
SPSS allows at most three single missing values per variable (or a range plus one value), and limits labels to 120 bytes. If you go over a limit, Socius says so next to the value, and **Apply** waits until you fix it.
:::

## Measurement level: nominal, ordinal or scale

The measurement level tells Socius what kind of information a variable holds. Socius uses it to suggest suitable analyses and to warn you when a variable does not fit a box in a dialog.

- **Nominal:** categories with no order. Examples: gender, city, religion. You can count them, but "more" or "less" makes no sense.
- **Ordinal:** categories with a clear order, but the steps are not necessarily equal. Examples: education level, "Strongly disagree" to "Strongly agree".
- **Scale:** real numbers where differences are meaningful. Examples: age in years, income, a 0 to 10 satisfaction score.

Small icons next to each variable show its level: a cluster of circles for nominal, rising bars for ordinal and a ruler for scale. To change a level, click the **Measure** cell and pick another.

# Preparing your data

Real data rarely arrives ready to analyse. The **Transform** and **Data** menus help you reshape it. Each example here uses the sample survey. Every change is written to the Output tab together with the SPSS command that does the same thing, and **Edit > Undo** ([[Ctrl+Z]]) in Data View or Variable View reverses it. When a command creates a new variable, the message that appears offers **Show**, which selects the new column in Data View.

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

The new variable appears at the end of your data. Values without a rule become missing in the new variable, so check that your rules cover every age. If no rule says what to do with **All other values**, the dialog warns you in an orange box. When you want to keep every other value as it is, click **Keep them: add "All other values → Copy old value"** in that box, and Socius adds the rule for you. In this example the rules already cover every age (and missing ages stay missing), so you can leave the warning as it is.

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

:::note Large datasets
Most analyses finish in a moment. A large one (roughly 50,000 cells or more, for example 5,000 cases and 10 variables) runs in the background, so Socius stays usable. The dialog then shows a moving bar with "Running in the background" and the seconds so far, and **Cancel** becomes **Stop**. Click **Stop** if you want to change something first.
:::

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

All charts are in the **Graphs** menu. They appear in Output with a title and the numbers behind them. In APA style (the standard setting), each chart gets a number in bold, such as **Figure 3**, with its title in italics above it, just as tables are numbered Table 1, Table 2 and so on. Numbers count up through the whole Output tab, so charts that other analyses draw (such as the residual plots of a regression) count too.

## A bar chart

**Try it.** Did the share of voters differ between cities?

1. Choose **Graphs > Bar Chart**.
2. Put `city` in **Category axis** and `vote` in **Cluster by (optional)**.
3. Set **Bars show** to **Percent of cases** and **Percentages within** to **Each category**. Each city's bars then add up to 100%.
4. Click **Run**.


![Voting by city, numbered Figure 3 in APA style. In every city, fewer than half of respondents voted.](img/bar-result.png)

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

A PNG or SVG file keeps the chart's title inside the picture, so it still makes sense on its own. Charts are also included when you export the whole report to Word or as a web page (see the next chapter); in APA style they keep their "Figure" number and italic title there, ready for your thesis.

# Getting results into your report

Every analysis you run is added to the **Output** tab, newest at the bottom. The bar at the top of Output controls how results look and how you take them away.

![The Output tab. The numbers are explained below.](img/output-toolbar.png){width=100 .big}

1. **APA tables / SPSS tables** switches the table style.
2. **Interpretations** and **Syntax** show or hide the plain-language boxes and the SPSS commands.
3. **Export report** saves all the output in one file.
4. **Copy** at the top right of each result copies that result. Next to it, **Explain with AI** asks the optional AI help to explain the result (see [Explain a result](#explain-a-result)).
5. The **Outline** lists every result, so you can jump between them.

## APA style or SPSS style

**APA tables** have horizontal lines only, a numbered title and an italic heading. Charts get a matching "Figure" number. This is what most journals and theses expect. **SPSS tables** look like the SPSS viewer, which helps when you compare your results with SPSS or with a colleague who uses it; in SPSS style a chart keeps its title inside the chart instead of a Figure number.

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

Click **Export report** in the Output tab, or choose **File > Export output report**, and pick a format:

- **Word document (.docx):** APA tables and charts, ready to edit. This is the one most people want.
- **Web page (.html):** a standalone page you can open in any browser and print, or save as PDF from the print dialog.
- **Excel workbook (.xlsx):** one sheet per table.
- **Plain text (.txt):** tables as aligned text.

To tidy up before exporting, use the small arrows on each result to move it up or down, and the bin icon to delete it. After a delete, a message appears with an **Undo** button that brings the result back; **Edit > Undo** ([[Ctrl+Z]]) in the Output tab does the same. **Clear output** removes everything.

# Coding open-ended answers

Surveys often end with an open question, such as "What is the biggest challenge facing your neighbourhood today?". *Coding* means reading each answer and tagging it with one or more themes, called **codes**. The list of codes, with a definition for each, is your **codebook**. Once answers are coded, you can count the themes, compare them between groups, and even test the differences with statistics.

Everything for coding is in the **Text coding** menu and the **Text coding** tab. The optional AI helpers for coding are in the **AI** menu (see [AI in Text coding](#ai-in-text-coding)).

![The Text coding menu: import, code, analyse and export. The AI helpers are in the AI menu.](img/coding-menu.png){width=40}

## Start with the worked example

The quickest way to learn is the worked example. Click the **Text coding** tab. With the sample survey open, the start screen of Text coding shows a card called **Explore a worked example**.


Click it. Socius brings in the 630 answers to `q_challenge`, adds a starter codebook of 15 codes grouped into 4 themes, and codes most answers automatically with keyword rules, so you have something to review. A note above the answers explains what happened and lists the next steps, with buttons such as **Review coded answers**, **Show answers not coded** and **Codes by attribute**; **Hide note** puts it away. Straight after loading, one click on **Undo coding** in the Text coding toolbar removes the whole example again.

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

1. **Views.** Switch between Documents, Responses, Retrieve, Analyse, Reliability and Memos. Reliability says "needs 2 coders" until a second coder has coded. On a phone this row scrolls sideways; a fade and an arrow at the edge show that there is more.
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

Made a mistake? **Undo coding** in the toolbar takes back your last coding change. In the Text coding tab, **Edit > Undo** ([[Ctrl+Z]]) does the same, and **Edit > Redo** ([[Ctrl+Y]]) brings the change back. The Edit menu says what it will undo, for example "Undo code passage". Undo in Text coding only touches coding (codes, coded passages, memos and sources), never your data.

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

The new variables are a change to your data, so you take them back from Data View with **Edit > Undo**, not from Text coding.

Now run **Analyze > Descriptive Statistics > Crosstabs** with `gender` in **Row(s)** and `c_safety_at_night` in **Column(s)**:

![Women mention safety at night far more often than men.](img/code-crosstab.png){width=100 .big}

17.2% of women mention safety at night as the biggest challenge, against 4.0% of men, χ²(2, N = 630) = 28.86, p < .001. The answer to an open question has become a testable finding.

To see how often each code was used, choose **Text coding > Code frequencies**. A theme shows the total of its sub-codes, marked "theme total". To compare codes between groups without leaving Text coding, open the **Analyse** view and choose **Codes by attribute**:

![Codes by attribute: how often each code appears among men, women and people of other genders.](img/codes-by-attribute.png){width=100 .big}

# Coding interviews

Interview transcripts are coded in the **Documents** view. You highlight a passage and attach one or more codes to it.

## Import a transcript

Choose **Text coding > Import documents**. Drop your files on the dialog, or click to choose them.


- **Word (.docx)** and **plain text (.txt, .md)** files: one document per file.
- **Paste text** lets you paste a transcript directly.
- To practise, choose **Text coding > Load sample interviews** and click **Load 3 interviews**. It adds three fictional interviews from Kolkata, Bengaluru and Delhi. The same command is under **Import** in the Text coding toolbar.

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
2. Choose **Text coding > Coders** (or **Coders** under the **Coder** button in the toolbar). Add the second coder, for example "Priya", and click **Code as Priya**.
3. Priya codes the same answers or documents. While she codes, she does not see the first coder's codes, so her coding stays independent.
4. If you work on different computers, one person saves the project (**File > Save project**) and sends the `.socius.json` file to the other, who opens it, codes, and saves it again.
5. Open the **Reliability** view and choose **Coder A** and **Coder B**.

![Intercoder reliability between Coder 1 and Priya.](img/reliability.png){width=100 .big}

**How to read it.**

- **Agreement** is the share of decisions on which both coders agree. It looks high even by chance, because both coders leave most codes off most answers.
- **Cohen's κ (kappa)** and **Krippendorff's α (alpha)** correct for agreement by chance. For published work, .70 to .80 or higher is usually expected. The **Strength** column gives a verbal label ("substantial", "almost perfect").
- **Disagreements to review**, further down, lists the answers where you differ. Discuss them, sharpen the code definitions, and code a fresh sample if needed.

# Getting help from AI

Socius can ask an AI model to help you. Once it is set up, AI can:

- **answer your questions** about your data and methods, and run the analysis for you (the Socius assistant);
- **explain a result** in plain language, with what to watch out for and how to report it;
- **help with text coding**: suggest a codebook, suggest codes for open-ended answers and summarise a code.

AI help is optional and free. It is switched off until you set it up, and everything else in Socius works without it. Setting it up takes about two minutes.

## Set it up

1. Choose **AI > AI assistant settings**. This is the one place where AI help is set up. The **AI** chip at the top right and every **Set up AI** button (next to an AI feature that is greyed out) open the same settings.
2. Under **Where should the AI run?**, choose one of the free options below.
3. Follow the steps for that option, then click **Test connection**.

![The AI menu. Every AI feature starts here, and the last item opens the settings.](img/ai-menu.png){width=35}

### Option 1: Google Gemini with your own free key (recommended)

Google Gemini is fast and gives good answers. You need a free "API key" from Google: a long password that lets Socius use Gemini on your behalf. You only need a Google account (for example a Gmail address).

1. In the settings, choose **Google Gemini** (1).
2. Click the link **Google AI Studio** (2), or go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Sign in with your Google account.
3. Click **Create API key**. Accept the terms if Google asks.
4. Copy the key with the copy button next to it in AI Studio. New keys start with "AQ." and are long, for example `AQ.Ab8R...` followed by about 50 more characters. (Older keys start with "AIza". Google is retiring those, so if one stops working, create a new key.)
5. Back in Socius, paste it into **API key** (3). Socius removes stray spaces, line breaks and quotes for you. If the key looks too short or has an unusual start, an orange note under the box says so; you can still test it.
6. Decide whether Socius should **Remember this key on this computer** (4). See the box below.
7. Leave **Model** (5) on **Automatic: Flash-Lite (fastest, most free requests)**. Socius then picks the newest Flash-Lite model your key can use, and moves on to another one if Google retires it.
8. Click **Test connection** (6).

![Setting up Google Gemini: choose it (1), get a key from Google AI Studio (2), paste it (3), decide whether to remember it (4), leave Model on Automatic (5) and click Test connection (6).](img/ai-gemini.png){width=100 .big}

:::note Where your key is kept
The key never goes into project files or exports. By default, **Remember this key on this computer** is off: Socius forgets the key when you close the tab, and you paste it again next time. Tick the box to keep it in this browser until you click **Forget key**. Anyone who uses the same browser profile, and other websites published on the same github.io address as Socius, could read a remembered key, so leave the box off on shared or public computers.
:::

**Which model?** **Automatic: Flash-Lite** answers fastest and allows the most free requests per day, so it is the best choice for almost everyone. **Automatic: Flash** writes somewhat better answers but starts more slowly, and Google's free tier allows only about 5 requests a minute with it. The assistant's working steps and the coding suggestions always use Flash-Lite. **A model I type...** is for people who need one particular model.

### Test connection, step by step

**Test connection** sends a one-word test message and checks the connection one step at a time: **1. Internet connection**, **2. Reached Google**, **3. Key accepted**, **4. Model chosen** and **5. Got an answer**. Each step gets a tick when it passes. While the test runs, the line next to the button says what it is waiting for and for how long. **Stop** cancels it.

If a step fails, it gets a cross (1), the steps after it are marked "Not checked", and a red box (2) explains what went wrong and what to do.

![A refused key: steps 1 and 2 passed, step 3 failed (1). The red box (2) says what to do; Copy details (3) copies a report for a help request.](img/ai-check-failed.png){width=100 .big}

**Copy details** (3) copies a report of what was checked and what Google answered, to paste into a help request (see [Giving feedback](#giving-feedback)). The report never contains your key. **Show details** shows the same report on screen. The most common problems and their fixes are listed in [Troubleshooting and FAQ](#troubleshooting-and-faq) under "Test connection fails".

### Option 2: On this computer (private)

A small AI model runs inside your browser, on your computer's graphics chip. Nothing leaves your computer, and after a one-time download of 1 to 2 GB it even works offline. This is the right choice for confidential interviews.

1. In the settings, choose **On this computer**.
2. Socius checks whether your browser can run the model and says so at the top. It needs a recent **Chrome or Edge** on a desktop or laptop, with graphics acceleration turned on. If something is missing, the message says what.
3. Pick a model: **Small and fast** (a download of about 1 GB) or **Better quality** (about 1.8 GB). On a computer with little memory, Socius recommends Small and fast.
4. Click **Download model**. A bar shows the progress. If the download fails, **Try the download again** keeps the parts that already arrived.
5. Click **Test connection**.

Before a download starts, Socius checks that the browser has room for the model and still has space left for autosave. If not, an orange box says **Not enough browser storage for this model** and suggests what to do instead: delete a model you downloaded earlier, choose Small and fast, use Google Gemini or Ollama, or free disk space. **Browser storage (downloaded models)**, at the bottom of this section, shows how much room each downloaded model takes, with a **Delete** button for each (see [What Socius keeps in your browser](#what-socius-keeps-in-your-browser)).

The on-device model is slower and less accurate than Gemini. It is fine for explaining a result or suggesting codes, but it is noticeably weaker as the Socius assistant.

### Option 3: Ollama or LM Studio on your computer (for experienced users)

If you already use [Ollama](https://ollama.com) or LM Studio, programs that run AI models on your own computer, Socius can use them. Nothing leaves your computer. This takes a few more steps than the other options, but Socius guides you through them.

1. In the settings, choose **Other service**.
2. Under **Service**, choose **Ollama on this computer** or **LM Studio on this computer**. Socius fills in the address (for Ollama `http://localhost:11434/v1`) and a model.
3. Follow the steps in **Set up Ollama** (1) (or **Set up LM Studio**): install the program, download a model once (for Ollama, the box shows the command, such as `ollama pull llama3.2`, with a **Copy** button), and let the program accept this website.
4. Click **Test connection** (2).

The test checks five things: **Is the program running?** (3), **Does it allow this website?** (4), **Browser permission for this computer**, **Is the model installed?** and **Did it answer?**. When a step fails, it shows the fix for your computer.

![Ollama is running (3) but does not accept the Socius website yet (4). The buttons (5) show the exact steps for Windows, macOS or Linux.](img/ai-ollama.png){width=100 .big}

**Letting Ollama accept Socius.** Ollama only answers pages on your own computer, so at first it refuses the Socius website. The fix is a setting called `OLLAMA_ORIGINS` that lists the website's address: the start of the address in your browser's address bar, without the rest of the path and without spaces. For the Socius website that is `https://hackhead95.github.io`. Click **Windows**, **macOS** or **Linux** (5): Socius shows the steps with the right address filled in, and each command has a **Copy** button. In short:

- **Windows:** quit Ollama (right-click its icon near the clock and choose **Quit Ollama**), run the `setx OLLAMA_ORIGINS ...` command in Command Prompt, then start Ollama again from the Start menu. Instead of the command, you can add the setting under **Edit environment variables for your account**.
- **macOS:** run the `launchctl setenv OLLAMA_ORIGINS ...` command in Terminal, then quit and reopen Ollama. This setting is lost when the Mac restarts, so run the command again after a restart.
- **Linux:** add the `OLLAMA_ORIGINS` line to the Ollama service with `sudo systemctl edit ollama.service`, then restart the service.

Only list websites you trust: any website in that list can use your Ollama. For **LM Studio**, open its Developer tab, start the server and turn on **Enable CORS** in its settings instead.

**The browser's permission.** Chrome and Edge ask before a website may connect to programs on your computer. When the question appears, click **Allow**. If you clicked Block by mistake, click the icon at the left of the address bar, choose **Site settings**, and set **Apps on device** (called **Local network access** in some versions) to **Allow**, then reload the page. Safari does not let websites reach programs on your computer at all: use Chrome, Edge or Firefox for Ollama and LM Studio.

:::note Other services
Under **Other service** you can also connect Groq or OpenRouter with their own keys. If you open Socius inside Claude, a **Claude** option may also appear, which needs no set-up.
:::

### "AI is ready. Try it"

When the test works, the settings say "Connected" (1), every step has a tick (2), and a green panel appears (3).

![After a successful Test connection (1), all five steps are ticked (2) and the panel "AI is ready. Try it" (3) starts any AI feature with one click.](img/ai-ready.png)

Click one of the buttons to try a feature straight away, or click **Done**. The **AI** chip in the top bar now shows a green dot and the service, for example "AI Gemini". **Details**, under the steps, holds the same report as **Copy details**.

## Before you send anything

:::warn Protect your participants
With Google Gemini (or another online service), what you send leaves your computer and goes to that company. On free tiers, the provider may use it to improve its products, and people may read it. Before you use online AI help on real data:

- **Know what is sent.** Explain a result sends the result's tables and summary, never individual answers. The assistant sends variable information, summary statistics and analysis results; individual cases only if you switch that on. Text coding features send the excerpts you choose.
- **Anonymise first.** Remove names, places, employers and other details that could identify someone from texts before you send them.
- **Check consent and ethics approval.** Make sure your participants' consent and your ethics approval allow sharing data with an outside service.
- **Use On this computer for confidential material,** where nothing leaves your computer.
:::

Every AI feature says what it will send, and to whom, before you click. Nothing is sent until you do.

## Where to find AI in Socius

**The AI menu** in the menu bar lists everything AI can do:

| Menu item | What it does |
|---|---|
| **Ask the Socius assistant** | Opens the assistant, where you can ask questions in your own words ([[Ctrl+J]]). |
| **Explain a result** | Explains one result from Output in plain language. With several results, you choose which one. |
| **Suggest a codebook** | Reads a sample of your interviews or open-ended answers and proposes codes with definitions and example quotes. |
| **Suggest codes for open-ended answers** | Applies your codebook to survey answers and suggests codes for each answer, which you accept or reject. |
| **Summarise a code** | Drafts a short summary of the passages coded with one code. |
| **AI assistant settings** | Set-up, as described above. |

If something is missing, the menu tells you what to do first. For example, **Explain a result** with no results yet says **Run an analysis first** and offers a button **Open Crosstabs**. If AI is not set up, any item opens the settings and explains what that feature will do.

**The AI chip** at the top right shows the status of AI help. Click it to see the same features, each with a one-line description. It has four states:

- **not set up**: no AI option has been chosen yet.
- **Gemini, not tested** (a dashed dot): set up, but nothing has been tried yet. A new key or model starts here again.
- **Gemini, not connected** (a red dot): the last Test connection or AI request failed. Click the chip to see why.
- **Gemini** (a green dot): ready. A successful Test connection or AI answer puts the chip here.

Other services show their own name instead of "Gemini", such as "On device".

![The AI chip (1) with a green dot means AI help is ready. Click it for a list of the AI features.](img/ai-chip.png){width=40 .big}

You also find AI in three other places: the **Assistant** button at the right end of the row of tabs, the **Explain with AI** button on every result in Output, and **AI suggestions** in the Text coding toolbar. All three are described below.

## Explain a result

Every result in Output has an **Explain with AI** button. It asks the AI to explain the result as a patient statistics tutor would: what was tested, what the numbers mean, whether the warnings matter and how to report it.

**Try it** with the crosstab from [Crosstabs with chi-square](#crosstabs-with-chi-square-are-two-categories-related) (`gender` by `trust5`):

1. Run the crosstab, or scroll to it in Output.
2. Click **Explain with AI** at the top right of the result, next to **Copy** (see the picture below).
3. A panel opens under the result. It says what will be sent and to whom (1 in the second picture). Click **What will be sent** (2) to read the exact text. The tables, Socius's summary, the APA sentence and the warnings are sent; individual answers are not.
4. Click **Explain** (3).

![Explain with AI (1) is next to Copy on every result.](img/explain-button.png)

![Before anything is sent: who receives what (1), the exact text (2) and the Explain button (3).](img/explain-confirm.png){width=85 .big}

While the AI works, a line shows what it is doing and for how long, such as "Choosing model", "Waiting for Google", "Thinking" or "Writing". The answer appears bit by bit as it is written. If something goes wrong, a red message says why and what to do; the **Details** link under it shows a report, and **Copy details** copies it for a help request.

The explanation appears under five headings: **What was tested**, **What the numbers mean**, **Assumptions and warnings**, **How to report it** and **Cautions**.

![An explanation of the crosstab, labelled as AI-generated (1). Add to output (2) keeps it with the result; Discuss with the assistant (3) lets you ask follow-up questions. Example answer; your AI's wording will differ.](img/explain-done.png){width=85 .big}

- **Add to output** (2) attaches the explanation to the result as a note marked **AI-GENERATED**. It is exported with your report like any note.
- **Copy** copies the text; **Explain again** asks for a new version.
- **Discuss with the assistant** (3) opens the Socius assistant with this result attached, so you can ask follow-up questions such as "What does Cramér's V mean here?".

:::tip Read it critically
The AI can be wrong, even when it sounds sure. Check every number against the tables above it: here χ²(8, N = 630) = 35.02 and V = .17 match the Chi-Square Tests and Symmetric Measures tables. Watch for claims the tables cannot support, such as causes ("gender causes fear"). Use the explanation to understand your result, then write the results section in your own words.
:::

## The Socius assistant

The assistant is a chat panel where you ask questions in your own words, as you would ask a helpful methods tutor. It can look at your dataset, run analyses on it, read your results, prepare recodes and scales, and answer "how do I" questions from this guide.

### Open it

- Click the **Assistant** button at the right end of the row of tabs (number 9 in the [tour](#a-five-minute-tour)). On a phone it shows only its sparkle icon.
- Or press [[Ctrl+J]] ([[Cmd+J]] on a Mac). Press it again to close the panel.
- Or choose **AI > Ask the Socius assistant**, or type a question in Search and choose **Ask the assistant**.

The panel opens on the right, below the menus and tabs, so Undo, Search and the menus stay within reach. On a screen at least 1000 pixels wide, your data or output moves aside to make room for it, so nothing is hidden underneath. Drag the panel's left edge to make it wider. Close it with the cross at the top right or [[Esc]]. Your conversation stays while Socius is open, even when you switch tabs; reloading the page clears it.

If AI help is not set up yet and you send a question, the assistant does not lose it: the question stays in the box, and a note offers **Set up AI**. Once AI is set up, click **Send**.

![The assistant panel: the AI service in use (1), what the assistant can see (2), suggested questions (3) and the message box (4).](img/assistant-start.png){width=100 .big}

When the conversation is empty, the assistant suggests questions (3) that fit your data and the tab you are on. Click one to send it, or type your own question in the box (4) and press [[Enter]]. [[Shift+Enter]] starts a new line.

### What it can see

Click the eye button (2) to see and change what the assistant may send to the AI service.

![What the assistant can see. Individual cases are off unless you switch them on.](img/assistant-see.png){width=45}

- **Variable information and summary statistics** (on): names, labels, value labels, missing codes, counts, means and analysis results. No individual answers.
- **Individual cases** (off): the raw rows of your data, up to 30 at a time. Switch this on only for anonymised data that your ethics approval lets you share. It switches off again every time you reload the page.
- **Excerpts from coded texts** (on): quotes from your Text coding documents and answers. Anonymise names and places first.

The line at the bottom of the panel always says which AI service answers, and that only what is listed here is sent.

### Good first questions

With the sample survey open, try:

- "Describe my dataset"
- "Which test should I use to compare life satisfaction between migrants and non-migrants?"
- "Is trust in neighbours related to gender?"
- "Help me build a trust scale"
- "How do I export my results to Word?"

Ask one thing at a time and use your own words; you do not need variable names. You can ask follow-up questions ("Why not ANOVA?", "How do I report that?").

### What it does with your question

The assistant does not guess. It checks your variables, runs the analysis in Socius on your data and reads the real tables before it answers.

![The assistant answers a question about life satisfaction. What I did (1) lists each step; the card (2) adds the t-test to Output. Example answer; your AI's wording will differ.](img/assistant-answer.png){width=75 .big}

- **What I did** (1) lists every step it took, such as "Looked at the dataset overview", "Looked at life_sat, migrant" and "Ran Independent-Samples T Test: life_sat by migrant". Click it to see the steps.
- The answer quotes the real numbers, here t(628) = 4.51, p < .001, d = 0.36, the same as in [Comparing two groups](#comparing-two-groups-the-independent-samples-t-test).
- An analysis the assistant runs is **not** added to Output by itself. Click **Add this analysis to Output** (2) to keep it.
- Some answers end with **Open dialog**, which opens the analysis dialog with the variables filled in. Check them and click **Run**.

When a question needs new variables, the assistant prepares the change and shows it to you first.

![Asked to build a trust scale, the assistant first proposes to reverse trust3 (1). Nothing changes until you click Apply (2). Example answer; your AI's wording will differ.](img/assistant-proposal.png){width=75 .big}

A **Proposed change** card (1) describes the recode, reverse-coding, scale or computed variable, shows the first cases before and after, and gives the SPSS syntax. Nothing changes until you click **Apply** (2); **Dismiss** throws the proposal away. After Apply, the change is logged in Output like any Transform command, and **Edit > Undo** reverses it. The assistant only creates new variables; it never overwrites your data.

### Know its limits

- **It can be wrong.** It may misread a table, pick an unsuitable test or phrase a finding too strongly. Check its numbers against the tables in Output, and think about whether its advice fits your research question.
- **Free tiers have limits.** Google's free tier allows only a certain number of requests a minute and a daily allowance. The assistant paces itself, so a complex question can take 20 to 60 seconds. When Google asks it to slow down, the line under your question counts down, for example "Waiting 11 s for Google's free limit...", and then carries on by itself. If you see "Too many AI requests at once, or the free allowance is used up for now", wait a minute and click **Retry**. When the daily allowance is used up, the message says so; it starts again at midnight Pacific time (morning in Europe, early afternoon in India).
- **The on-device model is weaker.** On this computer, the assistant works with a small model: slower, with fewer tools and simpler answers. For the assistant, Gemini works much better. Use anonymised data with it.
- **It cannot replace your judgement** or your supervisor. It is a tutor at your side, not an authority.

## AI in Text coding

The coding helpers live in the **AI** menu. In the Text coding tab, the **AI suggestions** button in the toolbar is a shortcut to the same three items. If AI is not set up, the button is greyed out and a **Set up AI** link sits next to it.

![The AI suggestions menu (1) in the Text coding toolbar.](img/coding-ai.png){width=75}

- **Suggest a codebook** reads a sample of your documents or answers and proposes codes, each with a definition and an example quote. Keep the ones you want and click **Add** (the button shows how many codes). Treat them as a first draft: rename, merge and define them in your own terms.
- **Suggest codes for open-ended answers** applies your existing codebook to open-ended answers and suggests codes for each one. You **Accept** or **Reject** every suggestion, or **Accept all**. Accepted codes are marked as AI suggestions, so you can review them later.
- **Summarise a code** opens the **Retrieve** view. Pick a code and click **Summarise this code** for a short summary of its passages. **Save as memo** keeps it as a memo on the code. Check it against the quotes.

Each dialog says how many excerpts will be sent, and to whom, before you click. For intercoder reliability, AI suggestions do not count as a second coder: a person must code independently.

## Reporting AI use

If AI helped with your analysis, say so in your methods section, as you would for any software. Name the tool and the model, say what it did and how you checked it. For example:

:::apa An example for your methods section
Open-ended answers were coded in Socius. An initial codebook was drafted with AI assistance (Google Gemini, via Socius's "Suggest a codebook"), then revised by the author; all codes were applied and checked by hand. Plain-language explanations of statistical output were generated with the same model and checked against the output tables. No identifiable data were sent to the AI service.
:::

Follow your university's and your journal's rules on AI, which differ and change often. Keep a note of what you used AI for while you work; it is much harder to remember afterwards.

# Saving and sharing your work

## Save a project

A project file keeps everything together: the data (including the variables you created), all your output and the text coding. Choose **File > Save project** (or press [[Ctrl+S]]). Socius saves one file ending in `.socius.json` to your downloads folder.

![The File menu: Save project (1) and Save data as, with its formats.](img/save-menu.png){width=60}

To continue later, on this or any other computer, choose **File > Open project** and pick the file. **File > Recent projects** lists projects you saved or opened in this browser.

:::warn Autosave is a convenience, not a backup
Socius keeps a copy of your current session in the browser and restores it when you come back. But that copy disappears if you clear your browser's history or site data, use a private or incognito window, or switch to another browser or computer. Save a project file regularly and keep it with your other research files.
:::

If the browser runs out of room (usually after downloading an on-device AI model), autosave pauses and a bar at the bottom says **Browser storage is full, so autosave is paused.** Click **Save project** to save your work to a file straight away, then **Manage storage** to delete a downloaded AI model you do not need. Autosave keeps trying by itself and the bar disappears as soon as a save works again.

## What Socius keeps in your browser

**Help > About Socius** lists what Socius stores in this browser, under "What Socius stores in this browser":

- **Autosave:** the data, output and text-coding project you have open, and your list of recent projects.
- **Preferences:** the theme, view settings and your search history.
- **Error log:** technical messages only, without data values, names or keys (see [Troubleshooting with the error log](#troubleshooting-with-the-error-log)).
- **AI assistant settings:** the AI option and model you chose, and your API key only if you ticked **Remember this key on this computer**.

The About box also points out a limit of the free website: browsers treat all websites published on the same github.io account as one site, so another website published there could read what Socius stores. To keep confidential work safe, save it to project files instead of relying on autosave, use **File > Close data and start fresh** when you finish on a shared or public computer, and leave the remember option for your key off.

Under **Storage used**, the About box shows how much room Socius takes and how much the browser still allows, split into downloaded AI models (each with a **Delete** button), projects and autosave, and the error log and settings.

![Help > About Socius: what Socius stores in this browser, and how much room it uses.](img/about-storage.png){width=85}

**Ask the browser to keep it** asks the browser not to clear Socius's data when the disk runs low. Browsers decide this themselves, so it may say no.

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
**Edit > Undo** ([[Ctrl+Z]]) reverses your last change in the tab you are in: changes to the data in Data View and Variable View, coding changes in Text coding, and a deleted result in Output. **Edit > Redo** ([[Ctrl+Y]]) brings it back. The Undo item says what it will undo, for example "Undo rename of age" or "Undo new variable agegrp". While you type in a box, [[Ctrl+Z]] undoes your typing. Text coding also has an **Undo coding** button in its toolbar.

**I lost my work after clearing the browser.**
Clearing browsing data, a private window, or another browser or computer loses the autosaved session. Only a saved project file is safe. Save one regularly with **File > Save project**.

**Where is my data stored?**
Only in your browser, on your computer. Files you open are never uploaded. The only things that can leave your computer are what you choose to send with the optional online AI help (see [Before you send anything](#before-you-send-anything)). **Help > About Socius** lists what Socius keeps in the browser (see [What Socius keeps in your browser](#what-socius-keeps-in-your-browser)).

**A bar says "Browser storage is full, so autosave is paused".**
The browser has no room left for Socius, usually because of a downloaded on-device AI model. Click **Save project** first, then **Manage storage** and delete the AI model you do not use. Autosave starts again by itself. See [Save a project](#save-a-project).

**A message says "Socius was updated".**
A new version of Socius was published while you were working. Click **Reload**: your work is autosaved first, and the page opens again with the new version.

**I set up AI but I don't see a way to use it.**
Use the **AI** menu in the menu bar, the **Assistant** button at the right end of the tabs (or [[Ctrl+J]]), **Explain with AI** on any result in Output, or **AI suggestions** in the Text coding toolbar. The **AI** chip at the top right lists every AI feature. See [Where to find AI in Socius](#where-to-find-ai-in-socius).

**Test connection fails.**
Look at the list of steps: the first step with a cross shows where it stopped, and the red box below says what to do (see [Test connection, step by step](#test-connection-step-by-step)).

- **1. Internet connection** failed: this computer is offline. Connect, then test again.
- **2. Reached Google** failed ("Could not reach the AI service"): something between you and Google blocks it. Common causes are an ad or privacy blocker, antivirus web protection, a university or company firewall, or a VPN. Turn these off for this site, or try another network.
- **3. Key accepted** failed ("The AI service did not accept the key"): copy the key again from Google AI Studio with its copy button, and paste it into **API key**. A brand-new key can take a few minutes to work. If it still fails, create a new key.
- **4. Model chosen** failed: set **Model** to **Automatic: Flash-Lite**, so that Socius picks a model your key may use.
- Google says your location is not supported: the free Gemini API is not offered everywhere. If you use a VPN, turn it off; otherwise use **On this computer**.
- Google AI Studio asks you to be 18 or older. If you cannot create a key, use **On this computer** instead.

If you cannot solve it, click **Copy details** and send the report with **Help > Send feedback or report a problem**. The report never contains your key.

**Ollama or LM Studio does not connect.**
Use **Test connection** in the Ollama or LM Studio set-up: it checks each step and shows the fix. The most common one is "Ollama is running but refused this website": set `OLLAMA_ORIGINS` as the app shows and restart Ollama (see [Option 3](#option-3-ollama-or-lm-studio-on-your-computer-for-experienced-users)). In Safari, use Chrome, Edge or Firefox instead.

**AI replies are slow.**
Check that **Model** is **Automatic: Flash-Lite**, the fastest choice. The line under a request shows what it is waiting for. "Waiting ... for Google's free limit" means the free tier's per-minute limit was reached; Socius waits and continues by itself. The assistant often needs several steps for one question, so 20 to 60 seconds is normal. The on-device model is much slower than Gemini, especially the first time, while it loads.

**The AI says the free allowance is used up ("rate limit").**
Free tiers allow only a certain number of requests a minute and a limited number a day. For the per-minute limit, wait a minute and click **Retry** (or **Try again**). If the message says the daily allowance is used up, it starts again at midnight Pacific time (morning in Europe, early afternoon in India). Meanwhile, send fewer excerpts at a time, or switch to **On this computer**.

**"This browser cannot run the on-device model" (no WebGPU).**
The on-device model needs WebGPU, which only recent Chrome and Edge on a desktop or laptop offer reliably. The settings explain what is missing on your computer. Update your browser, or use another computer. Check that graphics acceleration is on (Chrome: Settings > System > "Use graphics acceleration when available"). On Linux, Ollama (Option 3) is usually the more reliable private choice. Otherwise use Google Gemini with anonymised data.

**The model download fails or says there is not enough space.**
A failed download can be tried again; the parts that already arrived are kept. If the browser has no room, delete a model you no longer use (**Browser storage (downloaded models)** in the settings, or **Help > About Socius**), choose **Small and fast**, or free disk space. Private windows allow very little storage, so use a normal window.

**AI buttons are greyed out.**
In Text coding, a grey **AI suggestions** button means AI help is not set up: click **Set up AI** next to it. If AI is set up but a single item is grey, it has nothing to work on yet: **Suggest a codebook** needs imported texts, **Suggest codes for open-ended answers** needs imported answers and at least one code, and **Summarise a code** needs coded passages. The **Explain** button in the Explain panel stays grey until AI help is set up.

**The assistant's numbers differ from Output.**
Trust the tables in Output. The assistant runs the same analyses, but it can misread or round them. Run the analysis from the menu (or click **Add this analysis to Output**) and report the numbers from Output.

**Can I use Socius on a phone?**
Yes, for looking at data and results. For coding and analysis, a computer with a mouse and keyboard is much easier. On a small screen the menus are in a **Menu** button, the variable list opens from **View > Variable list** as a drawer, and the assistant fills the screen.

**I clicked outside a dialog and it did not close.**
Dialogs with boxes to fill in stay open, so a stray click does not lose your choices. Click **Cancel** or press [[Esc]].

**Where are the keyboard shortcuts?**
**Help > Keyboard shortcuts** lists them all, including the keys of the Responses view in Text coding. The two most useful are [[Ctrl+K]] for Search and [[Ctrl+J]] for the assistant. **Help > Getting started** gives a six-step overview.

## Troubleshooting with the error log

When something goes wrong, Socius writes a short note in its **error log**, so you can tell us exactly what happened. Open it with **Help > Error log**. After a new error, a small blue dot appears next to **Help** in the menu bar; opening the log removes it.

![The error log. Filter by level or area (1), click a line to see its details (2), then Copy report (3) or Report a problem (4).](img/error-log.png){width=100 .big}

- Each line shows a level (**Error**, **Warning** or **Info**), the area (such as AI, Opening files or Analyses), the message and the time. Click a line (2) to see the technical details.
- **Level** and **Area** (1) filter the list.
- **Copy report** (3) copies the whole log as text; **Download report (.txt)** saves it as a file.
- **Report a problem...** (4) opens the feedback dialog (see [Giving feedback](#giving-feedback)).
- **Clear log...** deletes all entries, after asking.

The log stays in your browser; nothing is sent anywhere unless you paste it into a message yourself. It never contains your data values, variable names or labels, file names, quotes from your texts, email addresses or API keys: Socius removes them before anything is written. It keeps only the message, the kind of error, the size of the dataset (such as "640 cases x 34 variables"), which tab was open, the AI service and model, and the Socius version.

:::tip If Socius stops working
If a whole tab stops working, it shows a message with **Try again**, **Copy error report** and **Open the error log**; your data and the other tabs are not affected. If the whole page fails, a card says **Something went wrong**. Click **Copy error report** first, then **Reload**: your work is autosaved in the browser, although the last few seconds may be missing.
:::

# Giving feedback

Socius is young, and your experience helps make it better. If something does not work, confuses you, or you miss a feature, please tell us.

Choose **Help > Send feedback or report a problem**, or click **Feedback** at the top right of the screen. A small dialog opens first:

1. **Copy the error report.** It says how many problems are in the error log. Click **Copy error report**, and paste the report into your message later; it helps us find the cause quickly.
2. **Open the feedback form.** Keep **Fill in a short summary: version, browser and the last 5 problems** ticked to add that summary to the form for you (you can read it in the dialog first). Click **Open the feedback form** to report a problem, or **Suggest an idea instead**. The form opens on GitHub in a new tab.

![The feedback dialog: copy the error report, then open the form on GitHub.](img/feedback-dialog.png){width=75}

You can also go to the form directly: {{FEEDBACK_URL}}

![The Help menu, with the user guide, the keyboard shortcuts, the feedback dialog and the error log. The blue dot next to Help means a new error was logged. AI set-up is in the AI menu.](img/help-menu.png){width=40}

**Help > About Socius** shows the version you are using, for example "Version 0.1.0 (29e1e76, built 2026-09-24)". The error report includes it, so you do not need to copy it yourself.

- Posting on GitHub needs a free GitHub account. Creating one takes a minute.
- Say what you did, what you expected and what happened instead. A screenshot helps, and so does the error report.
- Never attach confidential data. If a problem only happens with your file, describe the file (for example "an SPSS file with 300 variables from 2012") instead of sending it.

Thank you for trying Socius.

# Appendix A: Quick reference card

| I want to... | Where to find it |
|---|---|
| Find any command, variable or result | Search box at the top, or [[Ctrl+K]] |
| Go back to the start screen | The **Socius** logo at the top left |
| Open an SPSS, CSV or Excel file | **File > Open data file** |
| See labels, missing values, measure | **Variable View** tab |
| Rename a variable | **Variable View**, Name column (or double-click the column heading in Data View) |
| Label values and find missing codes in many variables | **Data > Define variable properties** |
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
| Export all results to Word | **File > Export output report > Word document (.docx)** |
| Code open-ended answers | **Text coding > Import open-ended answers from dataset** |
| Import interview transcripts | **Text coding > Import documents** |
| Auto-code with keywords | **Text coding > Auto-code with keyword rules** |
| Turn codes into variables | **Text coding > Export codes to dataset** |
| Check agreement between coders | **Text coding > Intercoder reliability** |
| Set up AI | **AI > AI assistant settings** |
| Ask a question about my data or methods | **Assistant** button (right end of the tabs), or [[Ctrl+J]] |
| Explain a result in plain language | **Explain with AI** on the result in Output |
| Save everything | **File > Save project** ([[Ctrl+S]]) |
| Save data for SPSS | **File > Save data as > SPSS data (.sav)** |
| Undo (in the tab you are in) | **Edit > Undo** ([[Ctrl+Z]]) |
| Report a problem | **Help > Send feedback or report a problem** |
| See what went wrong | **Help > Error log** |
| See what Socius stores in the browser | **Help > About Socius** |

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
| AI model | A computer program trained on large amounts of text that writes answers in ordinary language. It can be wrong, so check what it says. |
| API key | A long password from an AI provider, such as Google, that lets Socius use its AI model on your behalf. Keep it private. |
| Socius assistant | The chat panel ([[Ctrl+J]]) where an AI model answers your questions, using Socius to look at your data and run analyses. |
| Search | The box at the top ([[Ctrl+K]]) that finds commands, variables, results and help pages. |
| Error log | Socius's list of problems it noticed in this browser (**Help > Error log**), without your data, to send with a problem report. |
| Rate limit | The number of requests a free AI service allows per minute or per day. |
| Figure | A numbered chart in APA style (Figure 1, Figure 2...), like a numbered table. |
