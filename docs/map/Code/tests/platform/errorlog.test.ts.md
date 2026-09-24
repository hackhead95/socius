---
id: tests/platform/errorlog.test.ts
type: test
file: tests/platform/errorlog.test.ts
area: tests
---

# tests/platform/errorlog.test.ts

*Test file* · area [[tests]] · 285 lines

> @vitest-environment jsdom Error log: redaction (no keys, tokens, data values, names or file names ever stored), the ring buffer (entry and size caps, repeats counted, storage failures), context and reports.

## Test cases
- **redact**
  - removes API keys and tokens of every known format
  - removes bearer tokens, key= parameters and key headers
  - strips query strings and fragments from URLs but keeps the host, path and stack position
  - removes data: URLs, e-mail addresses, quoted text and file names
  - removes the project's own names and labels as whole words
  - removes long random-looking strings but keeps words and code identifiers
  - truncates long strings and never throws
  - fileKind keeps only the extension
- **logging**
  - stores level, area, message, detail and context, newest first
  - never stores keys, names or values, even in stacks, service messages or the file name
  - never serialises unknown objects
  - skips cancelled requests and benign browser notices; not-configured AI is a warning
  - logs the same error object once, and returns it
  - counts repeats instead of storing them again
  - logFailure: programming errors are errors, app messages are warnings
  - logSlow records only operations over 5 seconds
  - never throws, even when the context provider fails
- **ring buffer and storage**
  - stays under the size cap
  - persists to localStorage and reloads
  - ignores a corrupt stored log
  - falls back to memory when storage is full or blocked
  - clearLog empties memory and storage and notifies subscribers
  - counts unseen errors of this session until the log is opened
- **reports**
  - formatReport lists version, browser and every entry in plain text
  - formatSummary is short and lists the last problems
  - describeBrowser names the browser and system only

## Imports
- [[claude.ts]] · value
- [[errorlog.ts]] · value
- [[vitest]] · value

## Calls
- [[errorlog.ts#__resetErrorLogForTests|__resetErrorLogForTests()]]
- [[claude.ts#AiUnavailableError|AiUnavailableError]]
- [[errorlog.ts#clearLog|clearLog()]]
- [[errorlog.ts#describeBrowser|describeBrowser()]]
- [[errorlog.ts#fileKind|fileKind()]]
- [[errorlog.ts#formatReport|formatReport()]]
- [[errorlog.ts#formatSummary|formatSummary()]]
- [[errorlog.ts#getLog|getLog()]]
- [[errorlog.ts#logError|logError()]]
- [[errorlog.ts#logFailure|logFailure()]]
- [[errorlog.ts#logInfo|logInfo()]]
- [[errorlog.ts#logIsMemoryOnly|logIsMemoryOnly()]]
- [[errorlog.ts#logSlow|logSlow()]]
- [[errorlog.ts#logWarn|logWarn()]]
- [[errorlog.ts#looksSecret|looksSecret()]]
- [[errorlog.ts#markLogSeen|markLogSeen()]]
- [[errorlog.ts#redact|redact()]]
- [[errorlog.ts#setLogContextProvider|setLogContextProvider()]]
- [[errorlog.ts#setSensitiveTermsProvider|setSensitiveTermsProvider()]]
- [[errorlog.ts#subscribe|subscribe()]]
- [[errorlog.ts#unseenErrorCount|unseenErrorCount()]]

## Uses
- [[errorlog.ts#ERROR_LOG_KEY|ERROR_LOG_KEY]]
- [[errorlog.ts#MAX_BYTES|MAX_BYTES]]
- [[errorlog.ts#MAX_ENTRIES|MAX_ENTRIES]]
- [[errorlog.ts#SESSION_ID|SESSION_ID]]

## Tests
- [[claude.ts]] · import
- [[errorlog.ts]] · import

## Private helpers
KEYS (line 12)
