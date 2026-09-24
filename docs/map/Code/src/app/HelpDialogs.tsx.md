---
id: src/app/HelpDialogs.tsx
type: module
file: src/app/HelpDialogs.tsx
area: app
---

# src/app/HelpDialogs.tsx

*Module* · area [[Areas/app|app]] · 163 lines

> Help menu dialogs: Getting started, Keyboard shortcuts, About Socius.

## Imports
- [[links.ts]] · value
- [[shortcuts.ts]] · value
- [[errorlog/actions.ts]] · value
- [[buildInfo.ts]] · value
- [[Modal.tsx]] · value

## Tested by
- [[navigation-audit.test.tsx]] · import

## Imported by
- [[DialogHost.tsx]] · value
- [[navigation-audit.test.tsx]] · value

## Symbols

### GettingStartedDialog
*component* · line 8 · exported · note: [[GettingStartedDialog|<GettingStartedDialog>]]
- Renders: [[Modal|<Modal>]]
- Uses: [[links.ts#GUIDE_URL|GUIDE_URL]]
- Rendered by: [[DialogHost|<DialogHost>]]

### ShortcutsDialog
*component* · line 40 · exported · note: [[ShortcutsDialog|<ShortcutsDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[shortcuts.ts#isMac|isMac()]]
- Rendered by: [[DialogHost|<DialogHost>]], [[navigation-audit.test.tsx]]

### AboutDialog
*component* · line 128 · exported · note: [[AboutDialog|<AboutDialog>]]
- Renders: [[Modal|<Modal>]]
- Calls: [[errorlog/actions.ts#openFeedback|openFeedback()]]
- Uses: [[buildInfo.ts#BUILD_INFO|BUILD_INFO]], [[errorlog/actions.ts#openErrorLog|openErrorLog()]], [[links.ts#FEEDBACK_URL|FEEDBACK_URL]], [[links.ts#GUIDE_URL|GUIDE_URL]], [[links.ts#SITE_URL|SITE_URL]]
- Rendered by: [[DialogHost|<DialogHost>]]
