---
id: tests/app/guideLinks.test.ts
type: test
file: tests/app/guideLinks.test.ts
area: tests
---

# tests/app/guideLinks.test.ts

*Test file* · area [[tests]] · 26 lines

> The beginner's guide (docs/guide/guide.md, built to public/guide/index.html) must not have broken cross-references or missing pictures. The in-app help topics are checked in helpTopics.test.ts.

## Test cases
- **beginner guide**
  - every #link in the built page points at a heading that exists
  - every picture in guide.md exists in public/guide/img
  - uses no em-dashes

## Imports
- [[node-fs|node:fs]] · value
- [[vitest]] · value
