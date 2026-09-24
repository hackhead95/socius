---
id: tests/platform/links.test.ts
type: test
file: tests/platform/links.test.ts
area: tests
---

# tests/platform/links.test.ts

*Test file* · area [[tests]] · 57 lines

> Help menu links: derived from the GitHub Pages address, with fallbacks elsewhere.

## Test cases
- **deriveLinks**
  - project site on GitHub Pages: owner from the subdomain, repo from the first path segment
  - follows a renamed repository and ignores deeper paths, index.html and hashes
  - user site at the root of <owner>.github.io
  - artifact build: absolute fallbacks
  - localhost and other hosts: the guide next to the app, fallbacks for the rest
  - opened from disk

## Imports
- [[links.ts]] · value
- [[vitest]] · value

## Calls
- [[links.ts#deriveLinks|deriveLinks()]]

## Uses
- [[links.ts#FALLBACK_FEEDBACK_URL|FALLBACK_FEEDBACK_URL]]
- [[links.ts#FALLBACK_SITE_URL|FALLBACK_SITE_URL]]

## Tests
- [[links.ts]] · import

## Private helpers
loc() (line 5)
