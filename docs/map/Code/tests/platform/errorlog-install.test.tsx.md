---
id: tests/platform/errorlog-install.test.tsx
type: test
file: tests/platform/errorlog-install.test.tsx
area: tests
---

# tests/platform/errorlog-install.test.tsx

*Test file* · area [[tests]] · 171 lines

> @vitest-environment jsdom The running app's error capture (src/features/errorlog/install.ts): resources that fail to load, code files missing after an update (with the "Socius was updated" banner), and React's root error options (errors caught by other boundaries, uncaught and recovered errors).

## Test cases
- **resources that fail to load**
  - describes scripts and stylesheets as warnings and images as info, with the path only
  - logs a failed script from the capture-phase error event
- **code files missing after an update**
  - recognises the browsers' chunk-load messages
  - vite:preloadError logs a warning and shows the banner; the event is not cancelled
  - an unhandled chunk-load rejection is a warning with the banner, not an error
  - the banner says Socius was updated and reloads; right after a reload it suggests checking the connection
- **React root error options**
  - logs errors that another boundary caught, with component names only
  - leaves errors caught by Socius's own boundaries to them (logged once, with the boundary name)
  - logs recovered errors as warnings and uncaught ones as errors

## Imports
- [[@testing-library-react|@testing-library/react]] · value
- [[react]] · value
- [[react-dom]] · value
- [[ErrorBoundary.tsx]] · value
- [[install.ts]] · value
- [[update.ts]] · value
- [[UpdateBanner.tsx]] · value
- [[errorlog.ts]] · value
- [[vitest]] · value

## Calls
- [[errorlog.ts#__resetErrorLogForTests|__resetErrorLogForTests()]]
- [[update.ts#__resetUpdateNoticeForTests|__resetUpdateNoticeForTests()]]
- [[install.ts#describeResourceError|describeResourceError()]]
- [[errorlog.ts#getLog|getLog()]]
- [[update.ts#getUpdateNotice|getUpdateNotice()]]
- [[install.ts#installErrorLog|installErrorLog()]]
- [[update.ts#isChunkLoadError|isChunkLoadError()]]

## Renders
- [[UpdateBanner|<UpdateBanner>]]
- [[ErrorBoundary.tsx#ErrorBoundary|ErrorBoundary]]

## Uses
- [[install.ts#reactRootErrorOptions|reactRootErrorOptions]]

## Tests
- [[socius.reloadedForUpdate]] · storage key
- [[ErrorBoundary.tsx]] · import
- [[install.ts]] · import
- [[update.ts]] · import
- [[UpdateBanner.tsx]] · import
- [[errorlog.ts]] · import

## Private helpers
el() (line 33)
