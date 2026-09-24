---
id: src/platform/host.ts
type: module
file: src/platform/host.ts
area: platform
---

# src/platform/host.ts

*Module* · area [[platform]] · 95 lines

> Host abstraction. The app runs in three places: 1. Inside a claude.ai Artifact viewer (sandboxed iframe): plain <a download> is blocked, so files go through the `downloads` capability; Claude can be asked via the `sample` capability. 2. A normal static host (GitHub Pages, `npm run preview`, a saved file): anchor downloads work, AI help comes from a provider the user sets up (see ./ai). 3. Tests...

## Imports
- [[fflate]] · dynamic
- [[platform/ai.ts]] · re-export
- [[claude.ts]] · re-export, value

## Tested by
- [[ai.test.ts]] · import

## Imported by
- [[ErrorBoundary.tsx]] · value
- [[AiBits.tsx]] · value
- [[ConnectionChecklist.tsx]] · value
- [[ExplainPanel.tsx]] · value
- [[LocalSetup.tsx]] · value
- [[controller.ts]] · value
- [[coding/hooks.ts]] · value
- [[MemosView.tsx]] · value
- [[RetrievalView.tsx]] · value
- [[DataView.tsx]] · value
- [[errorlog/actions.ts]] · value
- [[output/actions.ts]] · value
- [[fileActions.ts]] · value
- [[ai.test.ts]] · value

## Types
SaveOutcome (line 18)

## Symbols

### ARTIFACT_SAFE_EXTENSIONS
*const* · line 13 · exported
> Extensions the artifact `downloads` capability accepts. Others must be wrapped in a .zip.

### saveFile
*function* · line 25 · exported
> Save a file for the user. In the artifact viewer, uses the downloads capability (the viewer confirms); files with extensions the viewer does not accept (e.g. .sav) are zipped first. Elsewhere, triggers a normal browser download.
- Calls: [[claude.ts#isInArtifactViewer|isInArtifactViewer()]], [[useCapability|useCapability()]]
- Uses: [[host.ts#ARTIFACT_SAFE_EXTENSIONS|ARTIFACT_SAFE_EXTENSIONS]]
- Used in: [[coding/hooks.ts]], [[errorlog/actions.ts]], [[output/actions.ts]], [[fileActions.ts]]

### copyToClipboard
*function* · line 65 · exported
> Copy text (and optionally HTML, for pasting formatted tables into Word). Must be called from a click handler.
- Used in: [[ErrorBoundary.tsx]], [[AiBits.tsx]], [[ConnectionChecklist.tsx]], [[ExplainPanel.tsx]], [[LocalSetup.tsx]], [[controller.ts]], [[MemosView.tsx]], [[RetrievalView.tsx]], [[DataView.tsx]], [[errorlog/actions.ts]], [[output/actions.ts]]
