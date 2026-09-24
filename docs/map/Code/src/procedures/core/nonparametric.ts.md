---
id: src/procedures/core/nonparametric.ts
type: module
file: src/procedures/core/nonparametric.ts
area: procedures
---

# src/procedures/core/nonparametric.ts

*Module* · area [[procedures]] · 537 lines

> Analyze > Nonparametric Tests (SPSS NPAR TESTS): chi-square goodness of fit, binomial, Mann-Whitney U, Wilcoxon signed-rank, Kruskal-Wallis H and Friedman.

## Imports
- [[core/data.ts]] · value
- [[output.ts]] · type-only
- [[procedure.ts]] · type-only
- [[core/types.ts]] · type-only
- [[stats/nonparametric.ts]] · value
- [[core/common.ts]] · value

## Calls
- [[core/common.ts#apaNum|apaNum()]]
- [[core/common.ts#apaP|apaP()]]
- [[stats/nonparametric.ts#binomialTest|binomialTest()]]
- [[core/common.ts#blank|blank()]]
- [[core/common.ts#caseNote|caseNote()]]
- [[core/common.ts#categoriesOf|categoriesOf()]]
- [[output.ts#cell|cell()]]
- [[stats/nonparametric.ts#chiSquareGof|chiSquareGof()]]
- [[stats/nonparametric.ts#dunnTest|dunnTest()]]
- [[core/common.ts#fmtN|fmtN()]]
- [[stats/nonparametric.ts#friedman|friedman()]]
- [[output.ts#hcell|hcell()]]
- [[core/common.ts#item|item()]]
- [[stats/nonparametric.ts#kruskalWallis|kruskalWallis()]]
- [[core/common.ts#labelEta2|labelEta2()]]
- [[core/common.ts#labelR|labelR()]]
- [[core/common.ts#labelW|labelW()]]
- [[core/common.ts#listProse|listProse()]]
- [[stats/nonparametric.ts#mannWhitney|mannWhitney()]]
- [[core/common.ts#numericValues|numericValues()]]
- [[core/common.ts#one|one()]]
- [[core/common.ts#optBool|optBool()]]
- [[core/common.ts#optNum|optNum()]]
- [[core/common.ts#optStr|optStr()]]
- [[core/common.ts#parseNumberList|parseNumberList()]]
- [[core/common.ts#pcell|pcell()]]
- [[core/common.ts#requireNumeric|requireNumeric()]]
- [[core/common.ts#sameValue|sameValue()]]
- [[core/data.ts#selectCases|selectCases()]]
- [[core/common.ts#selMissing|selMissing()]]
- [[core/common.ts#selN|selN()]]
- [[core/common.ts#tableBlock|tableBlock()]]
- [[core/common.ts#text|text()]]
- [[core/common.ts#twoGroups|twoGroups()]]
- [[core/common.ts#valueText|valueText()]]
- [[core/common.ts#vars|vars()]]
- [[core/common.ts#vlabel|vlabel()]]
- [[core/common.ts#vprose|vprose()]]
- [[stats/nonparametric.ts#wilcoxonSignedRank|wilcoxonSignedRank()]]

## Uses
- [[core/common.ts#COHEN_NOTE|COHEN_NOTE]]
- [[core/common.ts#syntaxValue|syntaxValue()]]
- [[core/common.ts#vprose|vprose()]]

## Imported by
- [[core/index.ts]] · value

## Private helpers
runGof() (line 50) · runBinomial() (line 137) · runMannWhitney() (line 232) · runWilcoxon() (line 315) · runKruskal() (line 394) · runFriedman() (line 487)

## Symbols

### chiSquareGofProc
*const* · line 99 · exported
- Calls: [[core/common.ts#parseNumberList|parseNumberList()]]
- Uses: [[core/nonparametric.ts]]
- Used in: [[core/index.ts]]

### binomialProc
*const* · line 204 · exported
- Uses: [[core/nonparametric.ts]]
- Used in: [[core/index.ts]]

### mannWhitneyProc
*const* · line 294 · exported
- Uses: [[core/nonparametric.ts]]
- Used in: [[core/index.ts]]

### wilcoxonProc
*const* · line 375 · exported
- Uses: [[core/nonparametric.ts]]
- Used in: [[core/index.ts]]

### kruskalProc
*const* · line 470 · exported
- Uses: [[core/nonparametric.ts]]
- Used in: [[core/index.ts]]

### friedmanProc
*const* · line 527 · exported
- Uses: [[core/nonparametric.ts]]
- Used in: [[core/index.ts]]
