---
id: src/features/coding/menu.ts
type: module
file: src/features/coding/menu.ts
area: features/coding
---

# src/features/coding/menu.ts

*Module* · area [[features - coding|features/coding]] · 36 lines

> The "Text coding" menu. The app shell renders these; selecting one switches to the coding tab and calls openDialog({ kind: 'coding', id }). Ids starting with "view:" switch the workspace view (CodingDialog handles them and closes immediately). Only non-AI coding commands live here. The coding AI features (Suggest a codebook, Suggest codes for open-ended answers, Summarise a code) and AI assista...

## Tested by
- [[navigation-audit.test.tsx]] · import
- [[shell-fixes.test.ts]] · import

## Imported by
- [[menus.ts]] · value
- [[prompt.ts]] · value
- [[navigation-audit.test.tsx]] · value
- [[shell-fixes.test.ts]] · value

## Types
CodingMenuItem (line 9)

## Symbols

### codingMenuItems
*const* · line 16 · exported
- Used in: [[menus.ts]], [[prompt.ts]], [[navigation-audit.test.tsx]], [[shell-fixes.test.ts]]
