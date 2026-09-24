---
id: src/app/helpTopics.ts
type: module
file: src/app/helpTopics.ts
area: app
---

# src/app/helpTopics.ts

*Module* · area [[Areas/app|app]] · 71 lines

> Sections of the beginner's guide (public/guide/index.html, built from docs/guide/guide.md) offered by the search palette. Each `anchor` must be an id in the guide page; tests/app/helpTopics.test.ts checks that, so a renamed heading in the guide shows up as a failing test instead of a dead link.

## Imports
- [[links.ts]] · value

## Tested by
- [[helpTopics.test.ts]] · import

## Imported by
- [[CommandPalette.tsx]] · value
- [[helpTopics.test.ts]] · value

## Types
HelpTopic (line 6)

## Symbols

### HELP_TOPICS
*const* · line 14 · exported
- Used in: [[CommandPalette.tsx]], [[helpTopics.test.ts]]

### helpTopicUrl
*function* · line 68 · exported
- Uses: [[links.ts#GUIDE_URL|GUIDE_URL]]
- Used in: [[CommandPalette.tsx]], [[helpTopics.test.ts]]
