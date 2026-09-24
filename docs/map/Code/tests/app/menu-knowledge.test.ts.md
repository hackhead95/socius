---
id: tests/app/menu-knowledge.test.ts
type: test
file: tests/app/menu-knowledge.test.ts
area: tests
---

# tests/app/menu-knowledge.test.ts

*Test file* · area [[tests]] · 68 lines

> @vitest-environment jsdom The Socius assistant's knowledge of the menus is generated from the real menu model, so every command (including new ones) is in its system prompt, with the analysis ids run_analysis needs.

## Test cases
- **assistant menu knowledge**
  - names every menu and every top-level menu item, from the live menu model
  - includes every command in submenus too, and the analysis ids
  - knows the commands the old static list missed
  - follows the menu model: a new command appears without touching the prompt
  - still lists the analyses and Text coding when the app has not registered the menus

## Imports
- [[menuKnowledge.ts]] · value
- [[menus.ts]] · value
- [[coding-types.ts]] · value
- [[prompt.ts]] · value
- [[assistant/types.ts]] · value
- [[procedures/index.ts]] · value
- [[Menu.tsx]] · type-only
- [[vitest]] · value

## Calls
- [[menus.ts#allMenus|allMenus()]]
- [[coding-types.ts#emptyCodingProject|emptyCodingProject()]]
- [[menuKnowledge.ts#menuKnowledgeText|menuKnowledgeText()]]
- [[menuKnowledge.ts#registerMenuKnowledge|registerMenuKnowledge()]]
- [[prompt.ts#setMenuKnowledgeProvider|setMenuKnowledgeProvider()]]
- [[prompt.ts#systemPrompt|systemPrompt()]]

## Uses
- [[assistant/types.ts#DEFAULT_PERMISSIONS|DEFAULT_PERMISSIONS]]
- [[procedures/index.ts#procedures|procedures]]

## Tests
- [[Define variable properties|Data > Define variable properties...]] · menu label
- [[Clear output|Edit > Clear output...]] · menu label
- [[Go to case|Edit > Go to case...]] · menu label
- [[Close data and start fresh|File > Close data and start fresh...]] · menu label
- [[Export output report|File > Export output report]] · menu label
- [[Recent projects|File > Recent projects...]] · menu label
- [[Error log|Help > Error log...]] · menu label
- [[menuKnowledge.ts]] · import
- [[menus.ts]] · import
- [[coding-types.ts]] · import
- [[prompt.ts]] · import
- [[assistant/types.ts]] · import
- [[procedures/index.ts]] · import
- [[Menu.tsx]] · import
- [[Load sample interviews|Text coding > Load sample interviews...]] · menu label
- [[Variable list|View > Variable list]] · menu label

## Private helpers
prompt() (line 13) · leaves() (line 17)
