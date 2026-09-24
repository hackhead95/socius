---
id: src/features/errorlog/UpdateBanner.tsx
type: module
file: src/features/errorlog/UpdateBanner.tsx
area: features/errorlog
---

# src/features/errorlog/UpdateBanner.tsx

*Module* · area [[features - errorlog|features/errorlog]] · 23 lines

> The calm "Socius was updated" banner (see update.ts): shown when a code file of the old version could not be loaded, with a Reload button, instead of a broken feature.

## Imports
- `src/features/errorlog/errorlog.css` · side-effect
- [[update.ts]] · value
- [[Icon.tsx]] · value

## Tested by
- [[errorlog-install.test.tsx]] · import

## Imported by
- [[App.tsx]] · value
- [[errorlog-install.test.tsx]] · value

## Symbols

### UpdateBanner
*component* · line 7 · exported · note: [[UpdateBanner|<UpdateBanner>]]
- Renders: [[Icon|<Icon>]]
- Calls: [[update.ts#reloadForUpdate|reloadForUpdate()]], [[useUpdateNotice|useUpdateNotice()]]
- Uses: [[update.ts#dismissUpdateNotice|dismissUpdateNotice()]]
- Rendered by: [[Components/App|<App>]], [[errorlog-install.test.tsx]]
