---
id: tests/platform/ai-local.test.ts
type: test
file: tests/platform/ai-local.test.ts
area: tests
---

# tests/platform/ai-local.test.ts

*Test file* · area [[tests]] · 289 lines

> The guided check for an AI program on this computer (src/platform/ai-local.ts), against a fake fetch that behaves like Ollama / LM Studio seen from another website. The same logic is exercised in a real browser against scripts/diagnostics/fake-ollama.mjs by e2e/ai-local.spec.ts.

## Test cases
- **addresses**
  - knows local addresses, the program kind and the server root
  - advises /v1, http for local programs and localhost instead of 0.0.0.0 (127.0.0.1 is fine)
- **this browser**
  - detects the operating system and browser
  - reads the local network permission under its Chrome 145+ or 142-144 name, else null
- **Ollama instructions**
  - use this website's address for every operating system
  - match "llama3.2" to an installed llama3.2:latest and read both model lists
- **runLocalCheck**
  - not running: step 1 fails with how to start Ollama, the rest is skipped
  - blocked by the browser permission: says so, with where to allow it
  - localhost unreachable but 127.0.0.1 answers: carries on there and suggests that address
  - asks Chrome for the loopback address space on every probe
  - Safari blocks it outright: say so and suggest Chrome, Edge or Firefox
  - Firefox: no permission query, but names its "Device apps and services" setting
  - running but refusing this website: shows the OLLAMA_ORIGINS fix
  - LM Studio refusing this website: Enable CORS
  - model missing: lists the installed ones and gives the pull command, without asking the model
  - no models at all, and no model chosen
  - success: streams the answer with the installed model name, and reports each step
  - an OpenAI-style server without an Ollama API lists models from /v1/models
  - a key the program wants
  - times out when nothing answers, and stops when asked
  - an invalid address fails at once
- **Copy details**
  - describes the set-up and each step, never the key

## Imports
- [[ai-local.ts]] · value
- [[platform/ai.ts]] · value
- [[platform/helpers.ts]] · value
- [[vitest]] · value

## Calls
- [[platform/ai.ts#__reloadAiSettings|__reloadAiSettings()]]
- [[ai-local.ts#addressAdvice|addressAdvice()]]
- [[ai-local.ts#detectBrowser|detectBrowser()]]
- [[ai-local.ts#detectOs|detectOs()]]
- [[ai-local.ts#isLocalServiceUrl|isLocalServiceUrl()]]
- [[ai-local.ts#isLoopbackUrl|isLoopbackUrl()]]
- [[platform/helpers.ts#jsonResponse|jsonResponse()]]
- [[ai-local.ts#localDiagnostics|localDiagnostics()]]
- [[ai-local.ts#localKind|localKind()]]
- [[ai-local.ts#matchModel|matchModel()]]
- [[platform/helpers.ts#memoryStorage|memoryStorage()]]
- [[ai-local.ts#ollamaOriginsFix|ollamaOriginsFix()]]
- [[ai-local.ts#parseModelList|parseModelList()]]
- [[ai-local.ts#queryLocalNetworkPermission|queryLocalNetworkPermission()]]
- [[ai-local.ts#runLocalCheck|runLocalCheck()]]
- [[ai-local.ts#serverRoot|serverRoot()]]
- [[platform/helpers.ts#sseResponse|sseResponse()]]

## Tests
- [[ai-local.ts]] · import
- [[platform/ai.ts]] · import

## Private helpers
ORIGIN (line 12) · CHROME_WIN (line 13) · fakeFetch() (line 33) · nav() (line 58) · OLLAMA (line 69) · status() (line 70)
