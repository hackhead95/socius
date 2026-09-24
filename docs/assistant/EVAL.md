# Spot-checking the Socius assistant

Twenty real prompts to try with a live AI service (for example Google Gemini with your own free key),
and what a good answer does. Use the bundled sample survey (**File > Load sample survey**) unless the
prompt says otherwise. Open the assistant with the round button at the bottom right or **Ctrl+J**
(**Cmd+J** on a Mac).

The automated suite (`tests/assistant/scenarios.test.ts`) checks the same behaviours with a scripted
model: which tools are called, that the numbers match Socius's own analyses, and that nothing in your
data changes until you click. This list checks what only a real model can show: judgement, wording and
teaching quality.

How to read the answer: open **What I did** under an answer to see every step (for example "Ran
Crosstabs: gender by trust5"). Every number in the answer should appear in one of those steps.

**Gemini free tier.** The assistant paces itself to about 10 requests a minute. A complex question can
use 3 to 5 requests. If you see "Pausing ... to stay within the free tier's limit", that is expected.

## Describing and cleaning data

1. **"Describe my dataset"**
   - Steps: dataset overview, then a summary of a few key variables.
   - Says 640 cases, no filter, not weighted; names the main blocks (demographics, five trust items,
     civic participation, life satisfaction, open-ended questions).
   - Mentions declared missing codes (8 = Don't know, 9 = Refused; 999999 = income refused) and that
     income is strongly skewed.
   - Flags `resp_id` as an identifier, not something to analyse.
   - Ends with next steps and menu paths.

2. **"Which variables need cleaning?"**
   - Uses the FLAGS from the overview. On the clean sample it should say there is little to fix, and
     point to `resp_id` (identifier) and the skewed income. It must not invent problems.
   - Try again after declaring nothing missing for `trust1` (Variable View, Missing column cleared).
     It should now warn that 8 and 9 are counted as real answers and say how to fix it.

3. **"How many people refused to give their income?"**
   - 33 (from the variable summary of `hh_income`), with the valid N (607).

## Choosing a test

4. **"Which test should I use to compare life satisfaction between migrants and non-migrants?"**
   - Checks `life_sat` (scale, 0 to 10) and `migrant` (two groups) first.
   - Recommends the independent-samples t-test, mentions Levene's test and the Welch row, and
     Mann-Whitney U as the alternative. Offers to run it or opens the dialog.

5. **"Which test for trust5 by gender?"**
   - Notices `trust5` is ordinal (a single 5-point item) and gender has three groups, one of only 19
     people.
   - Recommends Kruskal-Wallis or Crosstabs with chi-square (not a t-test), and warns about the small
     group.

6. **"I want to know if education predicts voting. What should I do?"**
   - `vote` is binary: Binary Logistic Regression (or Crosstabs as a first look). Explains odds ratios
     in plain words. Does not propose linear regression.

## Running and interpreting analyses

7. **"Is gender related to feeling safe walking alone after dark?"**
   - Runs Crosstabs (gender by trust5). Reports chi-square(8, N = 630) = 35.02, p < .001, Cramér's V =
     .17 (weak).
   - Points out that 3 cells have expected counts under 5, and suggests merging categories or an exact
     test.
   - Says association, not causation. Offers the "Add this analysis to Output" button.

8. **"Do migrants differ in life satisfaction?"**
   - Runs the t-test. t(628) = 4.51, p < .001, d = 0.36 (small). People born in the city are more
     satisfied (M = 6.37 vs 5.70).
   - Names possible confounders (age, income, years in the neighbourhood).

9. **"Which factors predict life satisfaction? Use age, gender, migrant status and education."**
   - Runs Linear Regression with dummies (reference: first category). Interprets coefficients with
     their reference groups, R squared, and mentions checking VIF and residual plots.

10. **"Is the trust scale reliable?"**
    - Runs Reliability Analysis on trust1 to trust5. Reports alpha = .31 and explains that `trust3` is
      reverse-worded (negative item-total correlation).
    - Proposes reverse-coding `trust3` (a card with a preview; nothing changes until Apply) and then
      re-running the analysis.

11. **"Build a trust scale"**
    - Checks the items, proposes `trust3_r`, then a mean scale of the five items (after you apply the
      first card). Explains the minimum number of answered items.

12. **"Now do the same with the survey weight on"** (after **Data > Weight cases**, `wt`)
    - Says the results are weighted by `wt` and that counts are weighted. Numbers change slightly.

13. **"Only look at women: how satisfied are they with life?"**
    - Explains **Data > Select cases** (condition `gender = 2`), or if you already set the filter,
      says the filter is on and uses 295 cases.

## Results and reporting

14. On the Output tab after running a One-Way ANOVA: **"Explain my latest result"** (or the button
    "Explain with AI" on the result, then "Discuss with the assistant")
    - Reads the result, explains F, df, p and eta squared in plain words, says which post hoc test to
      read, and gives the APA sentence.

15. **"How do I report this in APA style?"**
    - Uses the APA sentence Socius produced, explains the parts, and how to copy it (the Copy button
      in the APA-style report box).

## How-to questions

16. **"How do I open my SPSS file?"** (with no data open)
    - Follows the guide: **File > Open data file...**, .sav and .zsav, and that data stays on the
      computer.

17. **"How do I recode age into groups?"**
    - Follows **Transform > Recode into different variables...** from the guide, or offers a recode
      card for `age` with the missing rule first and a check that all ages are covered.

## Qualitative work

On the **Text coding** tab, load the worked example first ("Explore a worked example").

18. **"Summarise the main themes"**
    - Lists the codebook, reads quotes for the largest themes, summarises each theme with one or two
      short quotes and how many answers mention it. Reminds you to anonymise quotes.

19. **"Compare codes by gender"**
    - Uses codes by attribute; reports percentages per gender with the bases, notes small groups, and
      says counts describe the material rather than prove a difference. Points to **Text coding >
      Codes by attribute** and exporting codes to the dataset for a chi-square test.

## Privacy

20. **"Show me the five respondents with the highest income"**
    - With "Individual cases" off (the default): explains it cannot see individual cases, how to switch
      them on under "What the assistant can see", and that raw rows would then be sent to the AI
      service (check consent and ethics). Offers a summary instead (for example the top of the income
      distribution from Explore).
    - With it switched on: lists up to the requested rows and adds a short confidentiality reminder.

## What to look for in every answer

- No number without a step that produced it.
- Measurement levels, missing data, weights and filters are checked before a test is recommended.
- Assumptions are stated, with the alternative when they fail.
- Effect sizes with rules of thumb, not just p-values.
- Plain language first, then detail; 1 to 3 next steps with exact menu paths.
- Nothing in the data changes until you click Apply; Edit > Undo reverses it.
