---
id: src/app/links.ts
type: module
file: src/app/links.ts
area: app
---

# src/app/links.ts

*Module* · area [[Areas/app|app]] · 84 lines

> Links out of the app: the website, the user guide and the feedback form (GitHub issues). On GitHub Pages (https://<owner>.github.io/<repo>/) the links are derived from the address, so a renamed or forked repository keeps working. Elsewhere (the Claude artifact build, localhost, a saved file) the fallbacks below are used.

## Tested by
- [[error-boundary.test.tsx]] · import
- [[links.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[ErrorBoundary.tsx]] · value
- [[HelpDialogs.tsx]] · value
- [[helpTopics.ts]] · value
- [[menus.ts]] · value
- [[TopBar.tsx]] · value
- [[FeedbackDialog.tsx]] · value
- [[tools/help.ts]] · value
- [[error-boundary.test.tsx]] · value
- [[links.test.ts]] · value

## Types
AppLinks (line 14) · LocationLike (line 20)

## Private helpers
pageDir() (line 28) · currentLocation() (line 61) · links (line 70)

## Symbols

### FALLBACK_OWNER
*const* · line 8 · exported
> Links out of the app: the website, the user guide and the feedback form (GitHub issues).  On GitHub Pages (https://<owner>.github.io/<repo>/) the links are derived from the address, so a renamed or forked repository keeps working. Elsewh...

### FALLBACK_REPO
*const* · line 9 · exported

### FALLBACK_SITE_URL
*const* · line 10 · exported
- Uses: [[links.ts#FALLBACK_OWNER|FALLBACK_OWNER]], [[links.ts#FALLBACK_REPO|FALLBACK_REPO]]
- Used in: [[links.test.ts]]

### FALLBACK_FEEDBACK_URL
*const* · line 11 · exported
- Uses: [[links.ts#FALLBACK_OWNER|FALLBACK_OWNER]], [[links.ts#FALLBACK_REPO|FALLBACK_REPO]]
- Used in: [[error-boundary.test.tsx]], [[links.test.ts]]

### deriveLinks
*function* · line 33 · exported
> Work out the links for a page address. `mode` is the Vite build mode ('artifact' for the Claude build).
- Calls: [[links.ts]]
- Uses: [[links.ts#FALLBACK_FEEDBACK_URL|FALLBACK_FEEDBACK_URL]], [[links.ts#FALLBACK_SITE_URL|FALLBACK_SITE_URL]]
- Used in: [[links.test.ts]]

### SITE_URL
*const* · line 72 · exported
- Uses: [[links.ts]]
- Used in: [[HelpDialogs.tsx]], [[tools/help.ts]]

### GUIDE_URL
*const* · line 73 · exported
- Uses: [[links.ts]]
- Used in: [[HelpDialogs.tsx]], [[helpTopics.ts]], [[menus.ts]], [[tools/help.ts]]

### FEEDBACK_URL
*const* · line 74 · exported
- Uses: [[links.ts]]
- Used in: [[ErrorBoundary.tsx]], [[HelpDialogs.tsx]], [[TopBar.tsx]], [[FeedbackDialog.tsx]], [[tools/help.ts]]

### openExternal
*function* · line 77 · exported
> Open a link in a new tab (works in the artifact sandbox, which allows popups).
- Used in: [[CommandPalette.tsx]], [[menus.ts]], [[FeedbackDialog.tsx]]
