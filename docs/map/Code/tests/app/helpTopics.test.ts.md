---
id: tests/app/helpTopics.test.ts
type: test
file: tests/app/helpTopics.test.ts
area: tests
---

# tests/app/helpTopics.test.ts

*Test file* · area [[tests]] · 19 lines

> Help topics in the search palette must point at real sections of the beginner's guide.

## Test cases
- **help topics**
  - has unique anchors and builds guide links with the anchor

## Imports
- [[node-fs|node:fs]] · value
- [[helpTopics.ts]] · value
- [[vitest]] · value

## Calls
- [[helpTopics.ts#helpTopicUrl|helpTopicUrl()]]

## Uses
- [[helpTopics.ts#HELP_TOPICS|HELP_TOPICS]]

## Tests
- [[helpTopics.ts]] · import
