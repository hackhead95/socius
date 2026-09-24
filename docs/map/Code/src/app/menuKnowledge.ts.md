---
id: src/app/menuKnowledge.ts
type: module
file: src/app/menuKnowledge.ts
area: app
---

# src/app/menuKnowledge.ts

*Module* · area [[Areas/app|app]] · 55 lines

> What the Socius assistant knows about the menus: generated at run time from the real menu model (menus.ts, every command whatever is open), so a new command is known as soon as it is in a menu. Registered with the assistant's prompt from main.tsx (the prompt lives in src/lib, below the app).

## Imports
- [[menus.ts]] · value
- [[shortcuts.ts]] · value
- [[prompt.ts]] · value
- [[procedures/index.ts]] · value
- [[Menu.tsx]] · type-only

## Uses
- [[procedures/index.ts#procedures|procedures]]

## Tested by
- [[menu-knowledge.test.ts]] · import

## Imported by
- [[main.tsx]] · value
- [[menu-knowledge.test.ts]] · value

## Private helpers
HINTS (line 11) · procIds (line 23) · itemText() (line 25)

## Symbols

### menuKnowledgeText
*function* · line 36 · exported
> One line per menu: "- File: New dataset; Open data file... (Ctrl+O) (...); Save data as > SPSS data (.sav), ...".
- Calls: [[menus.ts#allMenus|allMenus()]], [[shortcuts.ts#modKey|modKey()]]
- Uses: [[menuKnowledge.ts]]
- Used in: [[menu-knowledge.test.ts]]

### registerMenuKnowledge
*function* · line 52 · exported
> Give the assistant's prompt the live menu knowledge (called once from main.tsx).
- Calls: [[menuKnowledge.ts#menuKnowledgeText|menuKnowledgeText()]], [[prompt.ts#setMenuKnowledgeProvider|setMenuKnowledgeProvider()]]
- Used in: [[main.tsx]], [[menu-knowledge.test.ts]]
