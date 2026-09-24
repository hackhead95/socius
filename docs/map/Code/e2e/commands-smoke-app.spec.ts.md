---
id: e2e/commands-smoke-app.spec.ts
type: e2e-spec
file: e2e/commands-smoke-app.spec.ts
area: e2e
---

# e2e/commands-smoke-app.spec.ts

*End-to-end spec* · area [[e2e]] · 196 lines

> Command smoke test, every menu except Analyze and Graphs (those are in commands-smoke-analyze.spec.ts): with the sample survey loaded, every command in File, Edit, View, Data, Transform, Text coding (with the worked example loaded), AI and Help is chosen from the live menubar, so a new command is included automatically. What each one must do: - saves and exports: a non-empty download; - Open da...

## Test cases
  - File, Edit and View: every command does its job
  - Data and Transform: every command opens, runs or turns off
  - Text coding: every command works on the worked example
  - AI and Help: every command opens its dialog, panel or page

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[commands-smoke-helpers.ts]] · value
- [[e2e/helpers.ts]] · value
- [[node-fs|node:fs]] · dynamic

## Calls
- [[commands-smoke-helpers.ts#errorLogErrors|errorLogErrors()]]
- [[commands-smoke-helpers.ts#invoke|invoke()]]
- [[commands-smoke-helpers.ts#menuTree|menuTree()]]
- [[e2e/helpers.ts#openWithSample|openWithSample()]]
- [[commands-smoke-helpers.ts#settle|settle()]]
- [[commands-smoke-helpers.ts#watchErrors|watchErrors()]]

## Tests
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Select cases|Data > Select cases...]] · menu label
- [[Weight cases|Data > Weight cases...]] · menu label
- [[Load sample survey|File > Load sample survey]] · menu label
- [[New dataset|File > New dataset]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[View/Text coding|View > Text coding]] · menu label
- [[Dark|View > Theme > Dark]] · menu label
- [[Light|View > Theme > Light]] · menu label
- [[Variable View|View > Variable View]] · menu label

## Private helpers
kindOf() (line 21) · OPENED (line 35) · exercise() (line 37) · runAll() (line 90) · addOutput() (line 108)
