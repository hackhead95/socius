---
id: src/app/HelpDialogs.tsx
type: module
file: src/app/HelpDialogs.tsx
area: app
---

# src/app/HelpDialogs.tsx

*Module* · area [[Areas/app|app]] · 218 lines

> Help menu dialogs: Getting started, Keyboard shortcuts, About Socius.

## Imports
- [[links.ts]] · value
- [[shortcuts.ts]] · value
- [[StorageManager.tsx]] · value
- [[errorlog/actions.ts]] · value
- [[buildInfo.ts]] · value
- [[Modal.tsx]] · value

## Tested by
- [[about-storage.test.tsx]] · import
- [[navigation-audit.test.tsx]] · import

## Imported by
- [[DialogHost.tsx]] · value
- [[about-storage.test.tsx]] · value
- [[navigation-audit.test.tsx]] · value

## Private helpers
currentHostname() (line 138)

## Symbols

### GettingStartedDialog
*component* · line 9 · exported · note: [[GettingStartedDialog|<GettingStartedDialog>]]
- Renders: [[Modal|<Modal>]]
- Uses: [[links.ts#GUIDE_URL|GUIDE_URL]]
- Rendered by: [[DialogHost|<DialogHost>]]

### ShortcutsDialog
*component* · line 41 · exported · note: [[ShortcutsDialog|<ShortcutsDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[shortcuts.ts#isMac|isMac()]]
- Rendered by: [[DialogHost|<DialogHost>]], [[navigation-audit.test.tsx]]

### sharedPagesHost
*function* · line 133 · exported
> The host whose websites all share Socius's storage, when Socius runs on GitHub Pages ("hackhead95.github.io"): every Pages site of one account has the same origin. Null elsewhere.
- Used in: [[about-storage.test.tsx]]

### BrowserStorageNote
*component* · line 147 · exported · note: [[BrowserStorageNote|<BrowserStorageNote>]]
> Help > About: what Socius keeps in this browser, who else could read it, and how to stay safe.
- Calls: [[HelpDialogs.tsx#sharedPagesHost|sharedPagesHost()]], [[HelpDialogs.tsx]]

### AboutDialog
*component* · line 178 · exported · note: [[AboutDialog|<AboutDialog>]]
- Renders: [[BrowserStorageNote|<BrowserStorageNote>]], [[Modal|<Modal>]], [[StorageManager|<StorageManager>]]
- Calls: [[errorlog/actions.ts#openFeedback|openFeedback()]]
- Uses: [[buildInfo.ts#BUILD_INFO|BUILD_INFO]], [[errorlog/actions.ts#openErrorLog|openErrorLog()]], [[links.ts#FEEDBACK_URL|FEEDBACK_URL]], [[links.ts#GUIDE_URL|GUIDE_URL]], [[links.ts#SITE_URL|SITE_URL]]
- Rendered by: [[DialogHost|<DialogHost>]], [[about-storage.test.tsx]]
