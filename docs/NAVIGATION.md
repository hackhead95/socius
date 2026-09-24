# Where every command lives

This page is the map of Socius's navigation: the menus, the contextual shortcuts that mirror them, the rules that keep them consistent, and the findings of the navigation audit of September 2026.

The rules are checked by `tests/app/navigation-audit.test.tsx`. Run the diagnostic again at any time:

```bash
npx vitest run tests/app/navigation-audit.test.tsx
# write the whole menu model, with what each item does, to a file:
NAV_SNAPSHOT=/tmp/nav.json npx vitest run tests/app/navigation-audit.test.tsx
```

## The rules

1. **One home per command.** Every command appears in exactly one menu. The menus are defined once, in `src/app/menus.ts` (the Text coding menu in `src/features/coding/menu.ts`); the phone menu sheet and the search palette are built from the same model, so they follow automatically.
2. **Contextual shortcuts are welcome, with the same wording.** A toolbar button, a right-click item, a top-bar button or a set-up link may mirror a menu command where the user is working. It uses the menu's words, so it is recognisably the same thing. When space is short (an icon, a one-word toolbar button), the tooltip carries the menu wording.
3. **AI has one home: the AI menu.** Every AI feature and **AI assistant settings** live in the AI menu (settings is the last item). Other menus (Help, Text coding) have no AI items.
4. **One wording for AI set-up.** Where a feature needs AI and AI is not set up, the prompt says **Set up AI** and opens the same dialog as **AI > AI assistant settings**. Where AI is set up, a settings link says **AI assistant settings**.
5. **Views are switched from the View menu** (and the tabs under the menu bar). No other menu has an item that only switches the tab.
6. **"..." means "opens a dialog"**, written as three dots in every menu.
7. **Every disabled item says why** in its tooltip.
8. **Search finds the one home.** When an item is removed as a duplicate, the words people used for it become search synonyms of the surviving home (`SYNONYMS` in `src/app/search.ts`), and the palette shows one row per command.

The audit test checks rules 1, 3, 5, 6, 7 and 8 on the real menu model, checks that every procedure appears exactly once in Analyze or Graphs, that no two menu items share a keyboard shortcut, that every shortcut shown in a menu does what the item does and is listed in **Help > Keyboard shortcuts**, that AI feature labels match the AI menu, and that no source file still uses the old set-up wordings or points to removed menu places.

## The menus

| Menu | Items (submenus as "Parent > Item") |
|---|---|
| **File** | New dataset; Open data file... (Ctrl+O); Open project...; Recent projects...; Load sample survey; Save project (Ctrl+S); Save data as > SPSS data (.sav), SPSS compressed (.zsav), CSV with codes, CSV with value labels, Excel with codes, Excel with value labels; Export codebook > Excel (.xlsx), CSV; Export output report > Word document (.docx), Web page (.html), Excel workbook (.xlsx), Plain text (.txt); Close data and start fresh... |
| **Edit** | Undo (Ctrl+Z); Redo (Ctrl+Y); Find in data... (Ctrl+F); Go to case...; Clear output... |
| **View** | Data View; Variable View; Output; Text coding; Value labels in Data View; Variable list; Theme > Match my system, Light, Dark |
| **Data** | Copy variable properties...; Sort cases...; Select cases...; Weight cases...; Merge files > Add cases..., Add variables...; Aggregate...; Turn filter off (use all cases) and Turn weighting off (only while a filter or weight is on) |
| **Transform** | Compute variable...; Count values within cases...; Recode into same variables...; Recode into different variables...; Automatic recode...; Visual binning...; Reverse-code items...; Create scale / index...; Standardize (z-scores)...; Rank cases... |
| **Analyze** | Descriptive Statistics > Frequencies..., Descriptives..., Explore..., Crosstabs...; Compare Means > Means..., One-Sample T Test..., Independent-Samples T Test..., Paired-Samples T Test..., One-Way ANOVA...; Correlate > Bivariate Correlations..., Partial Correlations...; Regression > Linear Regression..., Binary Logistic Regression..., Ordinal Regression..., Multinomial Logistic Regression...; Nonparametric Tests > Chi-Square (goodness of fit)..., Binomial..., Mann-Whitney U (2 independent samples)..., Kruskal-Wallis H (k independent samples)..., Wilcoxon Signed-Rank (2 related samples)..., Friedman (k related samples)...; Scale > Reliability Analysis...; Dimension Reduction > Factor Analysis... |
| **Graphs** | Bar Chart...; Histogram...; Box Plot...; Scatter Plot...; Line Chart...; Pie Chart...; Population Pyramid... |
| **Text coding** | Import documents...; Import open-ended answers from dataset...; Load sample interviews; Code open-ended responses; Auto-code with keyword rules...; Retrieve coded segments; Code frequencies; Code co-occurrence; Codes by attribute; Word frequencies; Keyword in context; Intercoder reliability; Coders...; Memos; Export codes to dataset...; Export coded segments...; Qualitative report...; Codebook export and import... |
| **AI** | Ask the Socius assistant... (Ctrl+J); Explain a result...; Suggest a codebook...; Suggest codes for open-ended answers...; Summarise a code...; AI assistant settings... |
| **Help** | Getting started; User guide; Keyboard shortcuts; Send feedback or report a problem; About Socius |

107 commands, each in one place. On a phone the **Menu** button opens a sheet with the same menus.

## Contextual shortcuts and their home

| Shortcut | Where | Home |
|---|---|---|
| Tabs **Data View**, **Variable View**, **Output**, **Text coding** | Under the menu bar | View menu |
| Search box, and the search icon on narrow screens (the same control, shown by width) | Top bar | Search (Ctrl+K or /); searches the menus |
| **AI** chip: the five AI features, then **Set up AI** or **AI assistant settings** | Top bar | AI menu |
| **Feedback** (tooltip: "Send feedback or report a problem ...") | Top bar | Help > Send feedback or report a problem |
| Undo, Redo icons | Top bar | Edit > Undo, Edit > Redo |
| Theme icon (tooltip: "Theme: Match my system", "Theme: Light", "Theme: Dark") | Top bar | View > Theme |
| Weight and filter chips (change, or turn off) | Dataset bar | Data > Weight cases..., Select cases..., Turn weighting off, Turn filter off |
| **Open data file**, **Open project**, **Load sample survey**, **New dataset**, recent projects | Welcome screen | File menu |
| **Getting started: six steps** | Welcome screen | Help > Getting started |
| **Value labels** (tooltip names View > Value labels in Data View) | Data View toolbar | View > Value labels in Data View |
| **Find in data** (Ctrl+F), **Go to case** | Data View toolbar | Edit > Find in data..., Edit > Go to case... |
| **Copy variable properties...** | Variable View right-click | Data > Copy variable properties... |
| **Clear output** | Output toolbar | Edit > Clear output... |
| Frequencies, Crosstabs, Independent-Samples T Test (buttons named after the procedure) | Empty Output tab | Analyze menu |
| **Explain with AI** (explains this result) | Every Output result | AI > Explain a result... (which lets you pick a result) |
| **Coders...** in the **Coder** button | Text coding toolbar | Text coding > Coders... |
| **Import**: Import documents..., Paste text..., Import open-ended answers from dataset..., Sample interviews... | Text coding toolbar | Text coding menu (Paste text and Sample interviews are tabs of the same Import dialog) |
| **Auto-code** (tooltip: Auto-code with keyword rules) | Text coding toolbar | Text coding > Auto-code with keyword rules... |
| **AI suggestions**: Suggest a codebook..., Suggest codes for open-ended answers..., Summarise a code...; **Set up AI** next to it when AI is not set up | Text coding toolbar | AI menu |
| **Export**: Export codes to dataset..., Export coded segments..., Qualitative report..., Codebook export and import... | Text coding toolbar | Text coding menu |
| **More**: Auto-code with keyword rules..., Suggest a codebook... (AI), Codebook export and import... | Codebook panel | Text coding menu, AI menu |
| **Suggest codes with AI...** (for the selected answers) | Responses view, when answers are selected | AI > Suggest codes for open-ended answers... |
| **Summarise this code** | Retrieve view | AI > Summarise a code... |
| **Set up AI** | Explain panel, coding AI dialogs, Text coding note, the assistant panel | AI > AI assistant settings... |
| **AI assistant settings** link | "What will be sent" notes in AI dialogs, the assistant's error messages | AI > AI assistant settings... |
| **Assistant** button (Ctrl+J) | Bottom right of every screen | AI > Ask the Socius assistant... |

Commands that have no menu home on purpose, because they only make sense where they are: the Data View right-click and toolbar actions on the selection (Insert case above, Insert variable, Delete cases, Sort ascending or descending by the current column, Column statistics), the Output toolbar (APA tables or SPSS tables, Interpretations, Syntax, Outline, Export report), and the per-result buttons (Copy, Move up, Move down, Delete).

## What changed: before and after

Every action that existed before still has exactly one menu home (checked by the audit test against `tests/app/navigation-before.json`, the menu model recorded before the change). Six menu items were removed because another menu item already did the same thing:

| Removed | Now only at | Found in Search by |
|---|---|---|
| Help > AI assistant settings... | AI > AI assistant settings... | "ai settings", "gemini key", "api key", "set up ai", "settings" |
| Text coding > AI assistant settings... | AI > AI assistant settings... | (as above) |
| Text coding > Suggest a codebook with AI... | AI > Suggest a codebook... | "suggest a codebook", "codebook" |
| Text coding > Suggest codes for responses with AI... | AI > Suggest codes for open-ended answers... | "suggest codes", "code responses" |
| Text coding > Open coding workspace | View > Text coding | "open coding workspace", "coding workspace" |
| Data > Define variable properties | View > Variable View | "define variable properties", "value labels", "missing values" |

All other 107 menu items keep their menu, their place and their action. The only menu label changes are in the Text coding menu, where "…" became "..." like every other menu.

## Audit findings

The audit read the code and clicked through the app (desktop and a 400 px phone) before and after the change.

| Issue | Where | Decision | Change |
|---|---|---|---|
| AI assistant settings in three menus | Help, Text coding, AI | Real duplicate. One home: AI (last item) | Removed from Help and Text coding; Search finds the AI item by the old words |
| Search listed "AI assistant settings" three times | Search palette (Ctrl+K) | Consequence of the duplicate | One row now; test checks one row per command for many queries |
| Suggest a codebook, Suggest codes in two menus, with different names and different behaviour when AI was not set up | Text coding ("... with AI"), AI | Real duplicate. One home: AI | Removed from Text coding; the toolbar's AI suggestions button stays as a contextual shortcut, now with the AI menu's labels |
| Five different wordings for AI set-up: "Set up free AI help", "Set up AI help", "Set up free AI", "Set up AI", "Open AI assistant settings" | AI chip, Explain panel, coding dialogs, coding note, assistant panel | Contextual set-up prompts, kept | All say **Set up AI** and open the same settings dialog; settings links when AI is ready say **AI assistant settings** (was "Change", "AI settings") |
| "AI assistant settings..." inside the Text coding toolbar's AI suggestions button | Text coding toolbar | Settings entry inside Text coding, which the owner reported | Removed; the **Set up AI** button next to it remains while AI is not set up |
| AI assistant settings button in About Socius | Help > About Socius | Another way into settings from Help | Replaced by text naming "AI > AI assistant settings" |
| Assistant named "Ask the assistant" in the AI chip and settings, "Ask the Socius assistant" in the AI menu | AI chip, AI settings "Try it" panel | Inconsistent naming | "Ask the Socius assistant" everywhere (the Search row "Ask the assistant: your question" is a different action and keeps its name) |
| Suggest codes dialog titled "Suggest codes for responses", menu says "for open-ended answers" | AI coding dialog | Inconsistent naming | Dialog title now "Suggest codes for open-ended answers" |
| Open coding workspace did exactly what View > Text coding does | Text coding, View | Real duplicate. Home: View | Removed from Text coding |
| Define variable properties only switched to Variable View | Data, View | Real duplicate (unlike SPSS, it opened no wizard). Home: View | Removed from Data; Search finds Variable View by "define variable properties" |
| Text coding menu used "…", all other menus "..." | Text coding menu | Inconsistent | "..." everywhere |
| Text coding toolbar Import and Export items named differently from the menu ("Documents and files", "Codes to dataset variables", "Coded segments (Excel, CSV)", "Codebook...") | Text coding toolbar | Contextual shortcuts, kept | Same labels as the Text coding menu, formats shown as a hint |
| "Manage coders..." vs "Coders..." | Coder button vs Text coding menu | Same dialog | "Coders..." in both |
| Codebook panel's More menu had "Import codebook" and "Export codebook", both opening the same dialog tab | Codebook panel | Duplicate within one menu | One item, "Codebook export and import..." |
| "Descriptive statistics" (right-click), "Column statistics" (toolbar), "Quick statistics" (tooltip) for one popover; "Descriptive statistics" also clashes with Analyze > Descriptive Statistics | Data View | Inconsistent naming | "Column statistics" everywhere |
| Toolbar "Find" vs Edit > "Find in data" | Data View toolbar | Contextual shortcut | Tooltip and name "Find in data (Ctrl+F)" |
| Toolbar "Insert case" vs right-click "Insert case above" | Data View | Inconsistent naming | "Insert case above" in both |
| Toolbar "Value labels" vs View > "Value labels in Data View" | Data View toolbar | Contextual shortcut; the short label fits the toolbar | Tooltip names the menu item |
| "Copy properties to other variables..." vs Data > "Copy variable properties..." | Variable View right-click | Same dialog | "Copy variable properties..." |
| Theme button "Theme: match system" vs View > Theme > "Match my system" | Top bar | Contextual shortcut | "Theme: Match my system", "Theme: Light", "Theme: Dark" |
| Feedback link vs Help > Send feedback or report a problem | Top bar | Legitimate shortcut | Kept; tooltip names the Help item |
| Search box vs search icon | Top bar | The same control shown at different widths | No change |
| "New empty dataset" vs File > "New dataset" | Welcome screen | Inconsistent naming | "New dataset" (with "Empty: type or paste data yourself" below) |
| "Read the six-step guide" opens Help > Getting started | Welcome screen | Inconsistent naming | "Getting started: six steps" |
| Empty Output tab button "Compare means" opened the Independent-Samples T Test | Output | Misleading label | Buttons use the procedure's menu title |
| Getting started vs User guide vs About | Help | Three different things (six steps in the app, the full guide, version and privacy) | No change; Getting started now names AI > AI assistant settings |
| Keyboard shortcuts: "/" is also "find a code" in the Responses view; Ctrl+Z undoes coding changes in the Text coding tab; neither was documented | Help > Keyboard shortcuts | Intentional context-specific keys | Documented (new "Text coding: Responses view" group; Ctrl+Z row); the Ctrl+J row names the AI menu |
| Menu shortcuts (Ctrl+O, S, Z, Y, F, J) | Menus, global keys | Checked: no key bound to two menu items; each does what its item does and is listed in Help | No change |
| Error messages and the assistant's menu knowledge pointed to "Help > AI assistant settings" and "Text coding > Suggest a codebook with AI" | `src/platform/ai.ts`, `src/lib/assistant/**` | Stale paths | Now "AI > AI assistant settings" and "AI > Suggest a codebook..." |
| Every procedure once in Analyze or Graphs; every disabled item has a tooltip | Analyze, Graphs, all menus | Checked | No change needed |

## Needs the owner's decision

These look similar but are not clear duplicates, so they were left as they are.

1. **Resolved: Export report has no menu home.** Now **File > Export output report**, with the Output toolbar's **Export report** as its shortcut (same formats, same wording).
   Original note: The Output toolbar's **Export report** (Word, web page, Excel, plain text) is the only way to export results, so Search cannot find it. A **File > Export report** submenu would give it a home, with the toolbar button as its shortcut.
2. **Resolved: two ways to clear the output with different confirmations.** Both now call one shared confirmation (`confirmAndClearOutputs`).
   Original note: Edit > Clear output... and the Output toolbar's **Clear output** do the same thing but ask with different messages. They could share one confirmation.
3. **Sample interviews: two different actions.** Text coding > **Load sample interviews** loads all three interviews at once; the toolbar's Import > **Sample interviews...** opens the Import dialog where you pick them. Keep both, or make the toolbar item load them directly?
4. **Ctrl+Z in Text coding.** In the Text coding tab Ctrl+Z undoes the last coding change (if any) while **Edit > Undo**, which shows Ctrl+Z, always undoes the last data change. It is now documented; the owner may prefer Edit > Undo to follow the tab too.
5. **Explain with AI vs Explain a result.** The per-result button keeps its own name because it explains that result, while the AI menu item asks which result. Renaming the button to "Explain a result" would make them identical but less clear.
6. **Define variable properties.** SPSS users know Data > Define Variable Properties as a separate wizard. Socius's item only switched to Variable View, so it was removed as a duplicate; if a real wizard is added later, it would belong back in the Data menu.
