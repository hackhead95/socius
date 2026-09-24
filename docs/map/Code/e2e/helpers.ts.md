---
id: e2e/helpers.ts
type: test-helper
file: e2e/helpers.ts
area: e2e
---

# e2e/helpers.ts

*Test helper* · area [[e2e]] · 18 lines

> Shared e2e helpers. A first visit shows the welcome screen (the sample survey no longer loads by itself), so most specs start by choosing "Load sample survey" there.

## Imports
- [[@playwright-test|@playwright/test]] · value

## Imported by
- [[ai-check.spec.ts]] · value
- [[ai-features.spec.ts]] · value
- [[ai-local.spec.ts]] · value
- [[ai-speed.spec.ts]] · value
- [[ai.spec.ts]] · value
- [[assistant.spec.ts]] · value
- [[coding-output-fixes.spec.ts]] · value
- [[commands-smoke-analyze.spec.ts]] · value
- [[commands-smoke-app.spec.ts]] · value
- [[data.spec.ts]] · value
- [[define-properties.spec.ts]] · value
- [[errorlog.spec.ts]] · value
- [[qual.spec.ts]] · value
- [[quant.spec.ts]] · value
- [[search.spec.ts]] · value
- [[shell-fixes.spec.ts]] · value
- [[shell.spec.ts]] · value
- [[subpath.spec.ts]] · value
- [[transform-dialogs.spec.ts]] · value
- [[ui-overlays-focus.spec.ts]] · value

## Symbols

### loadSampleFromWelcome
*function* · line 6 · exported
> On the welcome screen, click Load sample survey and wait for the Data View.
- Used in: [[ai-local.spec.ts]], [[ai-speed.spec.ts]], [[data.spec.ts]], [[shell.spec.ts]], [[subpath.spec.ts]], [[ui-overlays-focus.spec.ts]]

### openWithSample
*function* · line 14 · exported
> Open the app fresh and load the bundled sample survey.
- Calls: [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]
- Used in: [[ai-check.spec.ts]], [[ai-features.spec.ts]], [[ai-speed.spec.ts]], [[ai.spec.ts]], [[assistant.spec.ts]], [[coding-output-fixes.spec.ts]], [[commands-smoke-analyze.spec.ts]], [[commands-smoke-app.spec.ts]], [[data.spec.ts]], [[define-properties.spec.ts]], [[errorlog.spec.ts]], [[qual.spec.ts]], [[quant.spec.ts]], [[search.spec.ts]], [[shell-fixes.spec.ts]], [[shell.spec.ts]], [[transform-dialogs.spec.ts]], [[ui-overlays-focus.spec.ts]]
