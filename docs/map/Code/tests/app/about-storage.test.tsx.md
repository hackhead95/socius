---
id: tests/app/about-storage.test.tsx
type: test
file: tests/app/about-storage.test.tsx
area: tests
---

# tests/app/about-storage.test.tsx

*Test file* · area [[tests]] · 44 lines

> @vitest-environment jsdom Help > About Socius: the note on what Socius stores in this browser, that other websites on the same github.io account could read it, and what to do about it.

## Test cases
- **About: what Socius stores in this browser**
  - recognises a GitHub Pages host, whose sites share one origin
  - lists what is stored and says that other sites on the github.io account could read it
  - elsewhere, gives the general caution without naming github.io
  - names AI > AI assistant settings for the remember option, without a second way into settings

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[HelpDialogs.tsx]] · value
- [[vitest]] · value

## Calls
- [[HelpDialogs.tsx#sharedPagesHost|sharedPagesHost()]]

## Renders
- [[AboutDialog|<AboutDialog>]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Close data and start fresh|File > Close data and start fresh...]] · menu label
- [[Save project|File > Save project]] · menu label
- [[Error log|Help > Error log...]] · menu label
- [[HelpDialogs.tsx]] · import
