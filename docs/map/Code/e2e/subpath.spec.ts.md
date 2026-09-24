---
id: e2e/subpath.spec.ts
type: e2e-spec
file: e2e/subpath.spec.ts
area: e2e
---

# e2e/subpath.spec.ts

*End-to-end spec* · area [[e2e]] · 90 lines

> Home links under the GitHub Pages sub-path (owner report: "Homepage redirect button doesn't work"). Serves the production build the way GitHub Pages serves https://<owner>.github.io/socius/, and points hackhead95.github.io at it, so the real 404.html logic runs.

## Test cases
  - the app, the guide, their links, and unknown addresses all lead home

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value
- [[node-fs|node:fs]] · value
- [[node-http|node:http]] · value
- [[node-path|node:path]] · value

## Calls
- [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]

## Tests
- [[User guide|Help > User guide]] · menu label
