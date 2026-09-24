---
id: src/platform/errorlog.ts
type: module
file: src/platform/errorlog.ts
area: platform
---

# src/platform/errorlog.ts

*Module* · area [[platform]] · 705 lines

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
- [[ai-keys.test.ts]] · import
- [[ai-pace.test.ts]] · import
- [[errorlog-install.test.tsx]] · import
- [[errorlog.test.ts]] · import
- [[storage.test.ts]] · import

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
- [[ai-timing.ts]] · value
- [[platform/ai.ts]] · value
- [[error-boundary.test.tsx]] · value
- [[ai-keys.test.ts]] · value
- [[ai-pace.test.ts]] · value
- [[errorlog-install.test.tsx]] · value
- [[errorlog.test.ts]] · value
- [[storage.test.ts]] · value

## Types
LogLevel (line 25) · LogArea (line 26) · LogContext (line 31) · LogEntry (line 51)

## Private helpers
REPEAT_MS (line 77) · SECRET_PATTERNS (line 81) · URL_RE (line 99) · DATA_URL_RE (line 100) · EMAIL_RE (line 101) · QUOTED_RE (line 104) · FILE_RE (line 105) · TOKEN_RE (line 106) · PHONE_CC_RE (line 111) · PHONE_RE (line 112) · AADHAAR_RE (line 113) · LONG_DIGITS_RE (line 114) · removeSecrets() (line 134) · cleanUrl() (line 140) · escapeRe() (line 154) · removeTerms() (line 159) · truncate() (line 172) · trimStack() (line 234) · shortOf() (line 244) · describe() (line 261) · isNoise() (line 286) · softAiCode() (line 295) · contextProvider (line 310) · termsProvider (line 311) · entries (line 325) · persist (line 326) · seq (line 327) · seenCount (line 328) · lastRaw (line 329) · listeners (line 330) · loggedErrors (line 331) · absorbed (line 333) · storage() (line 335) · validEntry() (line 343) · readStored() (line 347) · capped() (line 360) · persistNow() (line 371) · notify() (line 395) · load() (line 405) · currentTerms() (line 410) · buildContext() (line 422) · add() (line 440) · sameProblem() (line 492) · safely() (line 496) · sessionErrors() (line 564) · envLines() (line 610) · contextText() (line 627)

## Symbols

### LOG_AREAS
*const* · line 28 · exported
- Used in: [[ErrorLogDialog.tsx]]

### LOG_LEVELS
*const* · line 29 · exported

### ERROR_LOG_KEY
*const* · line 69 · exported
- Used in: [[errorlog.test.ts]]

### MAX_ENTRIES
*const* · line 70 · exported
- Used in: [[errorlog.test.ts]]

### MAX_BYTES
*const* · line 71 · exported
- Used in: [[errorlog.test.ts]]

### MAX_MESSAGE
*const* · line 72 · exported

### MAX_DETAIL
*const* · line 73 · exported

### MAX_STACK_FRAMES
*const* · line 74 · exported

### SLOW_MS
*const* · line 75 · exported

### NUMBER_REMOVED
*const* · line 115 · exported
- Used in: [[errorlog.test.ts]]

### removeLongNumbers
*function* · line 118 · exported
> Replace phone numbers, Aadhaar-like numbers and long digit runs (see the patterns above).
- Uses: [[errorlog.ts#NUMBER_REMOVED|NUMBER_REMOVED]], [[errorlog.ts]]

### looksSecret
*function* · line 123 · exported
> A long string that looks random (a key, token or hash) rather than a word or a code identifier.
- Used in: [[errorlog.test.ts]]

### redact
*function* · line 180 · exported
> Make a string safe to log: remove keys, tokens, e-mail addresses, quoted text, file names and the given terms; strip URL query strings; truncate to `max` characters.
- Calls: [[errorlog.ts#looksSecret|looksSecret()]], [[errorlog.ts#removeLongNumbers|removeLongNumbers()]], [[errorlog.ts]]
- Uses: [[errorlog.ts#MAX_MESSAGE|MAX_MESSAGE]], [[errorlog.ts]]
- Used in: [[install.ts]], [[errorlog.test.ts]]

### fileKind
*function* · line 206 · exported
> The extension of a file name ("sav", "csv"...), or "" when there is none. Never the name itself.
- Used in: [[errorlog.test.ts]]

### componentStackText
*function* · line 217 · exported
> React's component stack reduced to component names ("at DataGrid"), without file URLs, query hashes or line numbers. At most `max` lines.
- Used in: [[ErrorBoundary.tsx]], [[install.ts]], [[errorlog.test.ts]]

### isLikelyBug
*function* · line 301 · exported
> Programming errors (TypeError and friends) as opposed to messages the app raises on purpose.

### setLogContextProvider
*function* · line 314 · exported
> Called at each log to add the tab, dataset size, AI provider and model (sizes and ids only).
- Uses: [[errorlog.ts]]
- Used in: [[install.ts]], [[errorlog.test.ts]]

### setSensitiveTermsProvider
*function* · line 319 · exported
> Called at each log for the open project's names and labels, which are removed from logged text.
- Uses: [[errorlog.ts]]
- Used in: [[install.ts]], [[errorlog.test.ts]]

### SESSION_ID
*const* · line 323 · exported
- Used in: [[ErrorLogDialog.tsx]], [[FeedbackDialog.tsx]], [[errorlog.test.ts]]

### logError
*function* · line 507 · exported
> Log an error. Returns `err` unchanged, so it can wrap a throw: `throw logError('ai', e)`.
- Calls: [[errorlog.ts]]
- Used in: [[ErrorBoundary.tsx]], [[controller.ts]], [[install.ts]], [[persistence.ts]], [[platform/ai.ts]], [[error-boundary.test.tsx]], [[ai-keys.test.ts]], [[errorlog.test.ts]]

### logWarn
*function* · line 512 · exported
- Calls: [[errorlog.ts]]
- Used in: [[controller.ts]], [[install.ts]], [[fileActions.ts]], [[persistence.ts]], [[platform/ai.ts]], [[errorlog.test.ts]]

### logInfo
*function* · line 516 · exported
- Calls: [[errorlog.ts]]
- Used in: [[install.ts]], [[persistence.ts]], [[ai-timing.ts]], [[errorlog.test.ts]]

### logFailure
*function* · line 524 · exported
> Log a caught failure: programming errors (TypeError, RangeError...) as errors, the messages the app raises on purpose (a file it cannot read, a formula with a typo) as warnings. Returns `err`.
- Calls: [[errorlog.ts#isLikelyBug|isLikelyBug()]], [[errorlog.ts]]
- Used in: [[ProcedureDialog.tsx]], [[ExportDialogs.tsx]], [[ImportDialog.tsx]], [[output/actions.ts]], [[fileActions.ts]], [[CasesDialogs.tsx]], [[ComputeDialog.tsx]], [[MergeDialogs.tsx]], [[transform/common.tsx]], [[errorlog.test.ts]]

### logSlow
*function* · line 531 · exported
> Record an operation that took longer than 5 seconds (as info). `op` is a code identifier.
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts#SLOW_MS|SLOW_MS]]
- Used in: [[ProcedureDialog.tsx]], [[fileActions.ts]], [[errorlog.test.ts]]

### getLog
*function* · line 537 · exported
> All entries, newest first.
- Uses: [[errorlog.ts]]
- Used in: [[errorlog/actions.ts]], [[error-boundary.test.tsx]], [[ai-keys.test.ts]], [[ai-pace.test.ts]], [[errorlog-install.test.tsx]], [[errorlog.test.ts]], [[storage.test.ts]]

### clearLog
*function* · line 541 · exported
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts#ERROR_LOG_KEY|ERROR_LOG_KEY]], [[errorlog.ts]]
- Writes: [[socius.errorlog]]
- Used in: [[ErrorLogDialog.tsx]], [[errorlog.test.ts]]

### subscribe
*function* · line 557 · exported
> Notified whenever the log changes.
- Uses: [[errorlog.ts]]
- Used in: [[errorlog/actions.ts]], [[errorlog.test.ts]]

### unseenErrorCount
*function* · line 569 · exported
> Errors logged in this session since the log was last opened (drives the Help menu dot).
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts]]
- Used in: [[errorlog/actions.ts]], [[error-boundary.test.tsx]], [[errorlog.test.ts]]

### markLogSeen
*function* · line 578 · exported
> The user opened the log: clear the "new errors" indicator.
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts]]
- Used in: [[ErrorLogDialog.tsx]], [[errorlog.test.ts]]

### logIsMemoryOnly
*function* · line 589 · exported
> True when the log is kept in memory only (storage unavailable or full).
- Uses: [[errorlog.ts]]
- Used in: [[ErrorLogDialog.tsx]], [[errorlog.test.ts]]

### describeBrowser
*function* · line 596 · exported
> "Chrome 140 on Windows" from a user-agent string (no other details).
- Used in: [[errorlog/actions.ts]], [[errorlog.test.ts]]

### formatEntry
*function* · line 641 · exported
> One entry as plain text (used by the report and the Error log dialog).
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts#SESSION_ID|SESSION_ID]]
- Used in: [[ErrorLogDialog.tsx]]

### formatReport
*function* · line 652 · exported
> The whole log as a plain-text report to paste into feedback.
- Calls: [[errorlog.ts#formatEntry|formatEntry()]], [[errorlog.ts#getLog|getLog()]], [[errorlog.ts]]
- Uses: [[errorlog.ts#SESSION_ID|SESSION_ID]]
- Used in: [[ErrorBoundary.tsx]], [[errorlog/actions.ts]], [[ai-keys.test.ts]], [[errorlog.test.ts]]

### formatSummary
*function* · line 675 · exported
> A short summary (version, browser, the last few errors) for prefilling a feedback form.
- Calls: [[errorlog.ts#getLog|getLog()]], [[errorlog.ts]]
- Uses: [[buildInfo.ts#BUILD_INFO|BUILD_INFO]], [[errorlog.ts]]
- Used in: [[FeedbackDialog.tsx]], [[errorlog/actions.ts]], [[errorlog.test.ts]]

### __resetErrorLogForTests
*function* · line 694 · exported
> Test hook: forget everything and optionally re-read storage.
- Calls: [[errorlog.ts]]
- Uses: [[errorlog.ts]]
- Used in: [[error-boundary.test.tsx]], [[ai-keys.test.ts]], [[ai-pace.test.ts]], [[errorlog-install.test.tsx]], [[errorlog.test.ts]], [[storage.test.ts]]
