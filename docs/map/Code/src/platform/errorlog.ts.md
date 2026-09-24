---
id: src/platform/errorlog.ts
type: module
file: src/platform/errorlog.ts
area: platform
---

# src/platform/errorlog.ts

*Module* · area [[platform]] · 646 lines

> Error log: a small ring buffer of problems the app noticed, kept in this browser (localStorage, or memory only when storage is unavailable or full). There is no server: users open Help > Error log and copy or download a plain-text report to send with their feedback. Privacy rules (enforced here, for every entry, whatever the caller passes): - Never store data values, variable names or labels, f...

## Imports
- [[buildInfo.ts]] · value

## Uses
- [[buildInfo.ts#BUILD_INFO|BUILD_INFO]]

## Reads
- [[socius.errorlog]]

## Writes
- [[socius.errorlog]]

## Tested by
- [[error-boundary.test.tsx]] · import
- [[errorlog.test.ts]] · import

## Imported by
- [[ErrorBoundary.tsx]] · value
- [[ProcedureDialog.tsx]] · value
- [[controller.ts]] · value
- [[ExportDialogs.tsx]] · value
- [[ImportDialog.tsx]] · value
- [[errorlog/actions.ts]] · value
- [[ErrorLogDialog.tsx]] · value
- [[FeedbackDialog.tsx]] · value
- [[install.ts]] · value
- [[output/actions.ts]] · value
- [[fileActions.ts]] · value
- [[persistence.ts]] · value
- [[CasesDialogs.tsx]] · value
- [[transform/common.tsx]] · value
- [[ComputeDialog.tsx]] · value
- [[MergeDialogs.tsx]] · value
- [[ai-diagnose.ts]] · value
- [[platform/ai.ts]] · value
- [[error-boundary.test.tsx]] · value
- [[errorlog.test.ts]] · value

## Types
LogLevel (line 25) · LogArea (line 26) · LogContext (line 31) · LogEntry (line 51)

## Private helpers
REPEAT_MS (line 74) · SECRET_PATTERNS (line 78) · URL_RE (line 96) · DATA_URL_RE (line 97) · EMAIL_RE (line 98) · QUOTED_RE (line 101) · FILE_RE (line 102) · TOKEN_RE (line 103) · removeSecrets() (line 117) · cleanUrl() (line 123) · escapeRe() (line 137) · removeTerms() (line 142) · truncate() (line 155) · trimStack() (line 195) · shortOf() (line 205) · describe() (line 222) · isNoise() (line 247) · softAiCode() (line 256) · contextProvider (line 271) · termsProvider (line 272) · entries (line 286) · persist (line 287) · seq (line 288) · seenCount (line 289) · lastRaw (line 290) · listeners (line 291) · loggedErrors (line 292) · storage() (line 294) · validEntry() (line 302) · readStored() (line 306) · capped() (line 319) · persistNow() (line 330) · notify() (line 354) · load() (line 364) · currentTerms() (line 369) · buildContext() (line 381) · add() (line 399) · safely() (line 439) · sessionErrors() (line 506) · envLines() (line 552) · contextText() (line 569)

## Symbols

### LOG_AREAS
*const* · line 28 · exported
- Used in: [[ErrorLogDialog.tsx]]

### LOG_LEVELS
*const* · line 29 · exported

### ERROR_LOG_KEY
*const* · line 66 · exported
- Used in: [[errorlog.test.ts]]

### MAX_ENTRIES
*const* · line 67 · exported
- Used in: [[errorlog.test.ts]]

### MAX_BYTES
*const* · line 68 · exported
- Used in: [[errorlog.test.ts]]

### MAX_MESSAGE
*const* · line 69 · exported

### MAX_DETAIL
*const* · line 70 · exported

### MAX_STACK_FRAMES
*const* · line 71 · exported

### SLOW_MS
*const* · line 72 · exported

### looksSecret
*function* · line 106 · exported
> A long string that looks random (a key, token or hash) rather than a word or a code identifier.
- Used in: [[errorlog.test.ts]]

### redact
*function* · line 163 · exported
> Make a string safe to log: remove keys, tokens, e-mail addresses, quoted text, file names and the given terms; strip URL query strings; truncate to `max` characters.
- Calls: [[errorlog.ts#looksSecret|looksSecret()]], [[errorlog.ts]]
- Uses: [[errorlog.ts#MAX_MESSAGE|MAX_MESSAGE]], [[errorlog.ts]]
- Used in: [[errorlog.test.ts]]

### fileKind
*function* · line 188 · exported
> The extension of a file name ("sav", "csv"...), or "" when there is none. Never the name itself.
- Used in: [[errorlog.test.ts]]

### isLikelyBug
*function* · line 262 · exported
> Programming errors (TypeError and friends) as opposed to messages the app raises on purpose.

### setLogContextProvider
*function* · line 275 · exported
> Called at each log to add the tab, dataset size, AI provider and model (sizes and ids only).
- Uses: [[errorlog.ts]]
- Used in: [[install.ts]], [[errorlog.test.ts]]

### setSensitiveTermsProvider
*function* · line 280 · exported
> Called at each log for the open project's names and labels, which are removed from logged text.
- Uses: [[errorlog.ts]]
- Used in: [[install.ts]], [[errorlog.test.ts]]

### SESSION_ID
*const* · line 284 · exported
- Used in: [[ErrorLogDialog.tsx]], [[FeedbackDialog.tsx]], [[errorlog.test.ts]]

### logError
*function* · line 450 · exported
> Log an error. Returns `err` unchanged, so it can wrap a throw: `throw logError('ai', e)`.
- Calls: [[errorlog.ts]]
- Used in: [[ErrorBoundary.tsx]], [[controller.ts]], [[install.ts]], [[persistence.ts]], [[ai-diagnose.ts]], [[platform/ai.ts]], [[error-boundary.test.tsx]], [[errorlog.test.ts]]

### logWarn
*function* · line 455 · exported
- Calls: [[errorlog.ts]]
- Used in: [[fileActions.ts]], [[persistence.ts]], [[errorlog.test.ts]]

### logInfo
*function* · line 459 · exported
- Calls: [[errorlog.ts]]
- Used in: [[errorlog.test.ts]]

### logFailure
*function* · line 467 · exported
> Log a caught failure: programming errors (TypeError, RangeError...) as errors, the messages the app raises on purpose (a file it cannot read, a formula with a typo) as warnings. Returns `err`.
- Calls: [[errorlog.ts#isLikelyBug|isLikelyBug()]], [[errorlog.ts]]
- Used in: [[ProcedureDialog.tsx]], [[ExportDialogs.tsx]], [[ImportDialog.tsx]], [[output/actions.ts]], [[fileActions.ts]], [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[MergeDialogs.tsx]], [[transform/common.tsx]], [[errorlog.test.ts]]

### logSlow
*function* · line 474 · exported
> Record an operation that took longer than 5 seconds (as info). `op` is a code identifier.
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts#SLOW_MS|SLOW_MS]]
- Used in: [[ProcedureDialog.tsx]], [[fileActions.ts]], [[errorlog.test.ts]]

### getLog
*function* · line 480 · exported
> All entries, newest first.
- Uses: [[errorlog.ts]]
- Used in: [[errorlog/actions.ts]], [[error-boundary.test.tsx]], [[errorlog.test.ts]]

### clearLog
*function* · line 484 · exported
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts#ERROR_LOG_KEY|ERROR_LOG_KEY]], [[errorlog.ts]]
- Writes: [[socius.errorlog]]
- Used in: [[ErrorLogDialog.tsx]], [[errorlog.test.ts]]

### subscribe
*function* · line 499 · exported
> Notified whenever the log changes.
- Uses: [[errorlog.ts]]
- Used in: [[errorlog/actions.ts]], [[errorlog.test.ts]]

### unseenErrorCount
*function* · line 511 · exported
> Errors logged in this session since the log was last opened (drives the Help menu dot).
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts]]
- Used in: [[errorlog/actions.ts]], [[error-boundary.test.tsx]], [[errorlog.test.ts]]

### markLogSeen
*function* · line 520 · exported
> The user opened the log: clear the "new errors" indicator.
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts]]
- Used in: [[ErrorLogDialog.tsx]], [[errorlog.test.ts]]

### logIsMemoryOnly
*function* · line 531 · exported
> True when the log is kept in memory only (storage unavailable or full).
- Uses: [[errorlog.ts]]
- Used in: [[ErrorLogDialog.tsx]], [[errorlog.test.ts]]

### describeBrowser
*function* · line 538 · exported
> "Chrome 140 on Windows" from a user-agent string (no other details).
- Used in: [[errorlog/actions.ts]], [[errorlog.test.ts]]

### formatEntry
*function* · line 583 · exported
> One entry as plain text (used by the report and the Error log dialog).
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts#SESSION_ID|SESSION_ID]]
- Used in: [[ErrorLogDialog.tsx]]

### formatReport
*function* · line 593 · exported
> The whole log as a plain-text report to paste into feedback.
- Calls: [[errorlog.ts#formatEntry|formatEntry()]], [[errorlog.ts#getLog|getLog()]], [[errorlog.ts]]
- Uses: [[errorlog.ts#SESSION_ID|SESSION_ID]]
- Used in: [[ErrorBoundary.tsx]], [[errorlog/actions.ts]], [[errorlog.test.ts]]

### formatSummary
*function* · line 616 · exported
> A short summary (version, browser, the last few errors) for prefilling a feedback form.
- Calls: [[errorlog.ts#getLog|getLog()]], [[errorlog.ts]]
- Uses: [[buildInfo.ts#BUILD_INFO|BUILD_INFO]], [[errorlog.ts]]
- Used in: [[FeedbackDialog.tsx]], [[errorlog/actions.ts]], [[errorlog.test.ts]]

### __resetErrorLogForTests
*function* · line 635 · exported
> Test hook: forget everything and optionally re-read storage.
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts]]
- Used in: [[error-boundary.test.tsx]], [[errorlog.test.ts]]
