---
id: tests/platform/ai-keys.test.ts
type: test
file: tests/platform/ai-keys.test.ts
area: tests
---

# tests/platform/ai-keys.test.ts

*Test file* · area [[tests]] · 148 lines

> API keys: kept in this tab (sessionStorage) unless "Remember this key on this computer" is ticked (localStorage, which every site on hackhead95.github.io can read); keys saved by earlier versions keep working and show as remembered; the "Automatic: Flash" setting of earlier versions becomes Flash-Lite once, with a note; keys never reach the error log or reports.

## Test cases
- **where keys are kept**
  - a new key stays in this tab only by default (not in localStorage)
  - "Remember this key" keeps it in localStorage; unticking removes it from there
  - keys saved by earlier versions keep working and show as remembered
  - Forget key removes it from localStorage and from this tab
  - storedAiSettings leaves out keys that are not remembered
  - keys never reach the error log or error reports
- **Automatic Flash from earlier versions**
  - becomes Flash-Lite once, with a note; Flash chosen after the change is kept
  - the note is dismissed for good; choosing Flash again survives a reload
- **AI status follows the last check (UI-003) and expected failures are warnings (UI-021)**
  - a typed key is "not tested"; a failed check is "failed" with the reason; a success is "ok"; a new key is untested again
  - wrong key, no connection or a limit are warnings; malformed requests and unexplained failures are errors

## Imports
- [[ai-diagnose.ts]] · value
- [[platform/ai.ts]] · dynamic, value
- [[errorlog.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[errorlog.ts#__resetErrorLogForTests|__resetErrorLogForTests()]]
- [[ai-diagnose.ts#aiErrorReport|aiErrorReport()]]
- [[platform/ai.ts#dismissAiNotice|dismissAiNotice()]]
- [[platform/ai.ts#forgetAiKey|forgetAiKey()]]
- [[errorlog.ts#formatReport|formatReport()]]
- [[platform/ai.ts#getAiSettings|getAiSettings()]]
- [[errorlog.ts#getLog|getLog()]]
- [[errorlog.ts#logError|logError()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[platform/ai.ts#parseAiSettings|parseAiSettings()]]
- [[platform/ai.ts#saveAiSettings|saveAiSettings()]]
- [[platform/ai.ts#setRememberKey|setRememberKey()]]
- [[platform/ai.ts#storedAiSettings|storedAiSettings()]]

## Uses
- [[platform/ai.ts#AI_SESSION_KEYS|AI_SESSION_KEYS]]
- [[platform/ai.ts#AI_SETTINGS_KEY|AI_SETTINGS_KEY]]

## Reads
- [[aiSettings/gemini|aiSettings.gemini]] · alias, getter
- [[notice|aiSettings.notice]] · getter
- [[provider|aiSettings.provider]] · getter
- [[remember|aiSettings.remember]] · alias, getter

## Writes
- [[aiSettings/gemini|aiSettings.gemini]] · setter
- [[provider|aiSettings.provider]] · setter
- [[remember|aiSettings.remember]] · setter

## Tests
- [[socius.ai.check]] · storage key
- [[ai-diagnose.ts]] · import
- [[platform/ai.ts]] · import
- [[errorlog.ts]] · import

## Private helpers
KEY (line 13) · local (line 14) · session (line 15) · storedKey() (line 28)
