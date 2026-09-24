---
id: src/platform/buildInfo.ts
type: module
file: src/platform/buildInfo.ts
area: platform
---

# src/platform/buildInfo.ts

*Module* · area [[platform]] · 39 lines

> Build information injected by Vite (`define` in vite.config.ts): the package.json version, the short git commit when the build ran in a git checkout, and the build date. Shown in Help > About Socius and in error reports. Every value has a fallback, so tests and unusual builds still work.

## Imported by
- [[HelpDialogs.tsx]] · value
- [[projectFile.ts]] · value
- [[ai-diagnose.ts]] · value
- [[errorlog.ts]] · value

## Types
BuildInfo (line 18)

## Private helpers
__APP_VERSION__ (line 5) · __APP_COMMIT__ (line 6) · __APP_BUILD_DATE__ (line 7) · read() (line 9) · version (line 29) · commit (line 30) · date (line 31)

## Symbols

### BUILD_INFO
*const* · line 33 · exported
- Uses: [[buildInfo.ts]]
- Used in: [[HelpDialogs.tsx]], [[projectFile.ts]], [[ai-diagnose.ts]], [[errorlog.ts]]
