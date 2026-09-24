# SPSS "Define Variable Properties" and the jamovi / JASP equivalents

## What to do (for implementers)

1. **Match SPSS's two-step flow.** Step 1 is "Variables to Scan", with two optional checkboxes: *Limit number of cases scanned to N* and *Limit number of values displayed to N* (display default 200). Step 2 is the editor: a scanned-variable list on the left and a per-variable form on the right, with a value grid whose columns are **Changed, Missing, Count, Value, Label**. Socius already has `DEFAULT_MAX_VALUES = 200` and `SCALE_MIN_UNIQUE = 24`, which is correct.
2. **Keep the per-variable form fields:** Label, Measurement Level plus a **Suggest** button (a dialog that gives the reason and has Accept/Cancel), Role, Type/Width/Decimals, **Attributes…** (custom attributes), "Unlabeled values: n", "Cases scanned / Value list limit". Add the buttons **Automatic Labels** (label = value text for unlabeled values) and **Copy Properties → From Another Variable… / To Other Variables…**.
3. **Paste syntax like SPSS:** `*Define Variable Properties.`, then per variable a `*varname.` comment followed by `VARIABLE LABELS`, `VALUE LABELS`, `MISSING VALUES`, `VARIABLE LEVEL`, `VARIABLE ROLE`, `FORMATS`/`ALTER TYPE` and `VARIABLE ATTRIBUTE` for whatever changed, then `EXECUTE.`
4. **What users hate about SPSS here:** it scans only the first N cases, so rare codes are missed; the value-grid limit silently hides values; there is no bulk edit across many variables except Copy Properties; the Suggest rules are opaque; "Unknown" measurement level blocks dialogs. Socius should scan all cases by default (it is fast in JS), always say when the list is truncated, and offer "apply to all selected variables".
5. **jamovi and JASP have no dedicated dialog.** They edit properties inline per column: jamovi's Setup panel supports multi-column edits and missing-value *expressions* (`== 99`); JASP has a label editor and per-column missing values. What users like about those tools: inline editing, levels shown with counts, bulk changes. Borrow those.

Evidence note: IBM's documentation site (ibm.com, public.dhe.ibm.com) and university guides were **blocked** from this environment. Statements marked **[IBM docs, recalled]** come from the SPSS Statistics Core System User's Guide (versions 24–31) as remembered. They are consistent with search-result snippets and with an open-source SPSS clone (Statify), but a human with SPSS should confirm them before we treat them as spec. **[reported]** = snippets or third-party sources; **[verified]** = source code we read.

---

## 1. Where it is and what it is for

- **Data > Define Variable Properties…** (SPSS 11.5+). It scans the data to find values actually present, shows counts, and flags values that have no value label. You can then set labels, missing values, measurement level, role and type, and copy these properties between variables. It "is particularly useful for categorical variables that use numeric codes" **[reported: Kent State LibGuide snippet; IBM docs, recalled]**.
- Related SPSS tools:
  - **Data > Copy Data Properties** (a wizard that copies the dictionary from another dataset or file).
  - **Data > Set Measurement Level for Unknown** (assigns levels in bulk for variables whose level is "Unknown").
  - Variable View for direct editing.
  - **[IBM docs, recalled]**

## 2. Step 1: "Define Variable Properties" (variables to scan)

- Two lists: *Variables* (all variables in the file) and *Variables to Scan*. Both numeric and string variables are allowed **[IBM docs, recalled]**.
- **Limit number of cases scanned to: [N]**: useful for very large files. A limit means "values that only occur in later cases are not shown". Default: unchecked. The Statify clone uses 50 when checked; the IBM default number is not confirmed **[inferred]**.
- **Limit number of values displayed to: [N]**: default **200** **[IBM docs, recalled; the Statify clone also uses 200 ([source](https://github.com/wilskk/statify/blob/273586ed49182fd52c73e0a9c5e42e434ae50ede/frontend/components/Modals/Data/DefineVarProps/hooks/useVariablesToScan.ts))]**. Values beyond the limit are not listed in the grid, but existing labels for them are kept.
- **Continue** runs the scan and opens the main dialog.

## 3. Step 2: the main dialog

**Left: Scanned Variable List.** Columns: an *Unlabeled* marker (whether the variable has values without labels), a *Measurement level* icon, a *Role* icon, and *Name*. Clicking a row loads it into the right-hand panel. Edits are kept per variable until OK **[IBM docs, recalled]**.

**Right: Current Variable panel**
- **Label** (variable label, up to 256 bytes in .sav).
- **Measurement Level**: Nominal / Ordinal / Scale (and "Unknown" for new or read-in data). The **Suggest** button opens "Suggest Measurement Level": it shows the current level, the suggested level, the **explanation** (the rule that fired) and descriptions of the three levels, with **Continue** (accept) or **Cancel** **[reported: snippet "opens a new window displaying the currently selected variable, the current measurement level, and SPSS's suggested level… an explanation for the suggestion, and a description of each possible type"]**.
- **Role**: Input, Target, Both, None, Partition, Split.
- **Type** and **Width/Decimals** (a Change button or a type dropdown).
- **Attributes…**: custom variable attributes (name/value pairs, saved in .sav; the syntax is `VARIABLE ATTRIBUTE`). It can also show hidden attributes **[IBM docs, recalled]**.
- **Unlabeled values: n** count.
- **Value Label grid**, one row per distinct scanned value (plus labelled values not seen in the data). The columns are:
  - **Changed**: a ✓ shows when the row was edited.
  - **Missing**: a checkbox that makes the value user-missing. It is limited by SPSS rules: at most 3 discrete values, or one range plus one value.
  - **Count**: frequency in the scanned cases.
  - **Value**: the value; you can type new values that are absent from the data.
  - **Label**: the value label, up to 120 bytes.
  - Confirmed by the clone's column list **[verified in clone: `PropertiesEditor.tsx` columns Changed, Missing, Count, Value, Label]**.
- Below the grid: **Cases scanned: N** and **Value list limit: N** (read-only), and the **Automatic Labels** button, which creates labels for unlabeled values using the value itself as text **[IBM docs, recalled; clone has "Auto Label"]**.
- **Copy Properties**: **From Another Variable…** (pick a source; copies labels, missing values, level, role and so on into the current variable) and **To Other Variables…** (pick targets). It copies "value labels and the measurement level" plus the other properties. When types differ, only compatible properties are copied **[reported: IBM "Copying Variable Properties" snippet; details recalled]**.
- **OK** applies all changes. **Paste** writes syntax. **Reset**, **Cancel**, **Help**.

### Suggested measurement level: rules **[IBM docs, recalled; verify]**

SPSS explains its choice with messages based on a small set of heuristics:
- String variable: **Nominal**.
- Numeric with **24 or more unique values**: **Scale**. The threshold is the Options > Data setting "Minimum number of data values for scale" (Assigning Measurement Level), default **24** **[reported: search snippet "N is a user-specified cut-off value. The default is 24"]**.
- Numeric with fewer than 24 unique values: **Nominal**, unless an ordinal signal is present:
  - value labels that look ordered;
  - the values are consecutive small integers.
  - SPSS mostly suggests Nominal here, and its docs tell users to review it.
- Negative values or non-integer values point to **Scale**.
- Date/time and currency formats point to **Scale**.
- No valid values point to Nominal.

Socius's `properties.ts` already uses 24. Show the rule text in the UI (SPSS's best feature here). Add the ordinal hint "labels such as *Strongly disagree … Strongly agree*".

## 4. Pasted syntax (shape) **[IBM docs, recalled; commands are standard SPSS syntax]**

```spss
*Define Variable Properties.
*q5.
VARIABLE LABELS  q5 'Trust in local government'.
VALUE LABELS q5
  1 'No trust at all'
  2 'Not much trust'
  3 'Some trust'
  4 'A lot of trust'
  8 'Don''t know'
  9 'Refused'.
MISSING VALUES q5(8, 9).
VARIABLE LEVEL  q5(ORDINAL).
VARIABLE ROLE /INPUT q5.
*region.
FORMATS  region(F2.0).
VARIABLE ATTRIBUTE VARIABLES=region ATTRIBUTE=Source('2024 wave').
EXECUTE.
```

- `VALUE LABELS` **replaces** all labels for the variable. `ADD VALUE LABELS` adds to them. DVP pastes `VALUE LABELS` with the full set.
- `MISSING VALUES x ()` clears missing values.
- Type changes paste `ALTER TYPE` (string↔numeric) or `FORMATS`.
- Only changed properties are pasted.

## 5. What users like and dislike (SPSS) **[reported/inferred; forum threads were blocked, synthesised from tutorials and common teaching notes]**

Liked:
- It shows **counts next to values**, so typos and unlabeled codes (for example a stray `7` on a 1–5 scale) jump out.
- Suggest measurement level, with an explanation (good for teaching).
- Copy Properties saves time on Likert batteries.
- Paste produces a reproducible syntax record.

Disliked or pain points:
- The cases-scanned limit hides rare codes. Users don't notice that the scan was partial.
- The 200-value display limit makes it useless for IDs and open text, with no clear warning in some versions.
- One variable at a time. "To Other Variables" is the only bulk path, and there is no "set missing 8,9 for q1–q40" in one step. Users fall back to syntax (`MISSING VALUES q1 TO q40 (8,9).`).
- The 3-discrete-missing-values limit confuses users coming from survey codebooks with -1…-9 codes. A range plus one value is the workaround.
- The "Unknown" measurement level (SPSS 20+) blocks some dialogs until it is set. Users meet "Set Measurement Level for Unknown" by surprise ([UCLA FAQ](https://stats.oarc.ucla.edu/spss/faq/why-cant-i-see-my-variables-in-some-of-the-spss-dialog-boxes/)).
- Label byte limits (120/256) apply to UTF-8 bytes, which hits non-Latin scripts (Bengali, Hindi) harder. **Relevant to Socius users. `properties.ts` already checks bytes.**

## 6. jamovi and JASP equivalents

**jamovi** (no DVP dialog) **[reported: jamovi docs snippet, LSJ book, forum]**
- Double-click a column header (or Data → Setup) to open the **Setup** panel: name, description, **measure type** (Nominal / Ordinal / Continuous / ID), **data type** (Integer / Decimal / Text), a **Levels** list where each level shows its value and an editable label and can be reordered (the order matters for ordinal), a "Retain unused levels" option, and **Missing values** as *expressions* such as `== 99` or `<= -1`.
- **Several columns can be selected and set up together** (bulk measure type or missing values). Users praise this.
- It auto-detects the measure type on import. Labels come from .sav value labels.
- Pain points: no counts in the setup panel (you run Frequencies); integer versus level-label confusion; missing values as expressions are unfamiliar to SPSS users.

**JASP** **[reported: JASP 0.19 blog, jasp-issues, users' guide]**
- Click a column header to open the variable settings / **label editor**: type (**Scale / Ordinal / Nominal**; "Nominal text" in older versions), level labels with a filter checkbox per level (the checkbox filters cases), and reordering.
- 0.19 (Jul 2024) added **type casting** (analyses cast variables to the required type) and per-column settings. JASP 0.96 (Mar 2026) is the current stable line.
- Missing values: global list under File → Preferences → Data (Import settings) and, in newer versions, per column **[reported; per-column detail not confirmed]**.
- Pain points (jasp-issues #356, #2384, #417, #3933): type switching bugs, values reset when switching type, and ordinal treated as scale in filters.

**PSPP**: Variable View only, with the same syntax commands (`VALUE LABELS`, `MISSING VALUES`, `VARIABLE LEVEL`). There is no DVP dialog **[inferred from PSPP docs knowledge]**.

## 7. Recommendations for Socius (beyond parity) **[inferred]**

- Scan **all** cases by default and show "Scanned 12,345 of 12,345 cases". Make the limit opt-in.
- Truncation banner: "Showing 200 of 1,834 distinct values. This looks like an ID or open-text variable."
- **Batch mode:** select several variables, then set level, missing codes or a label set for all of them at once. This is the biggest win over SPSS; jamovi users expect it.
- **Label-set templates:** the common Likert sets (agree 5-point, frequency, trust) and "Don't know/Refused" codes.
- **Missing-code sniffer:** highlight values like 8/9, 98/99, 999, -1…-9 whose labels contain "don't know", "refused" or "NA", and offer "mark as missing". Socius already does part of this.
- Keep Suggest's explanation text verbatim in the output log with the pasted syntax, for reproducibility.
