---
id: src/platform/ai-local.ts
type: module
file: src/platform/ai-local.ts
area: platform
---

# src/platform/ai-local.ts

*Module* · area [[platform]] · 691 lines

> A guided check for an AI program on this computer (Ollama, LM Studio, or another OpenAI-compatible server on localhost), used by AI assistant settings > Other service when the address is local. Why a local program often "does not connect" from a website such as https://hackhead95.github.io: - It is not running, or listens on another address or port. - It rejects requests from other websites (CO...

## Imports
- [[ai-http.ts]] · value
- [[platform/ai.ts]] · value
- [[claude.ts]] · value

## Calls
- [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]]

## Tested by
- [[ai-local.test.ts]] · import

## Imported by
- [[AiSettingsDialog.tsx]] · value
- [[LocalSetup.tsx]] · value
- [[WebLlmSetup.tsx]] · value
- [[ai-local.test.ts]] · value

## Types
LocalKind (line 26) · LocalOs (line 27) · AddressAdvice (line 70) · BrowserFamily (line 147) · PermissionStateX (line 159) · LocalNetworkPermission (line 161) · FixStep (line 200) · OsFix (line 207) · StepId (line 266) · StepStatus (line 267) · LocalStep (line 269) · LocalModel (line 281) · LocalCheckConfig (line 287) · LocalCheckResult (line 294) · LocalCheckOptions (line 310)

## Private helpers
LOOPBACK_HOST (line 31) · PRIVATE_HOST (line 32) · parse() (line 34) · nav() (line 116) · currentProtocol() (line 120) · ORDER (line 330) · programName() (line 332) · Timeout (line 336)

## Symbols

### isLoopbackUrl
*function* · line 43 · exported
> Is this address a program on this computer (loopback)?
- Calls: [[ai-local.ts]]
- Uses: [[ai-local.ts]]
- Used in: [[ai-local.test.ts]]

### isLocalServiceUrl
*function* · line 49 · exported
> Is this address on this computer or the local network (not the internet)?
- Calls: [[ai-local.ts]]
- Uses: [[ai-local.ts]]
- Used in: [[AiSettingsDialog.tsx]], [[ai-local.test.ts]]

### localKind
*function* · line 55 · exported
> Which kind of local program: from the chosen preset, else from the port.
- Calls: [[ai-local.ts]]
- Used in: [[LocalSetup.tsx]], [[ai-local.test.ts]]

### serverRoot
*function* · line 65 · exported
> Server root (scheme, host, port) of a base URL, e.g. http://localhost:11434.
- Calls: [[ai-local.ts]]
- Used in: [[ai-local.test.ts]]

### addressAdvice
*function* · line 81 · exported
> Common address mistakes: no /v1 at the end, 0.0.0.0 (a listening address, which browsers refuse to connect to) instead of localhost, https for a local program, or plain http to another computer from an https page. (localhost and 127.0.0....
- Calls: [[ai-local.ts]]
- Uses: [[ai-local.ts]]
- Used in: [[LocalSetup.tsx]], [[ai-local.test.ts]]

### siteOrigin
*function* · line 129 · exported
> The address of this website, which the local program must allow (e.g. https://hackhead95.github.io).
- Used in: [[LocalSetup.tsx]]

### detectOs
*function* · line 138 · exported
- Calls: [[ai-local.ts]]
- Used in: [[LocalSetup.tsx]], [[WebLlmSetup.tsx]], [[ai-local.test.ts]]

### detectBrowser
*function* · line 149 · exported
- Calls: [[ai-local.ts]]
- Used in: [[LocalSetup.tsx]], [[WebLlmSetup.tsx]], [[ai-local.test.ts]]

### queryLocalNetworkPermission
*function* · line 171 · exported
> The browser's permission for this website to reach programs on this computer, or null when the browser has no such permission (then it does not ask; older Chrome, Firefox, Safari).
- Calls: [[ai-local.ts]]
- Used in: [[ai-local.test.ts]]

### permissionHelp
*function* · line 186 · exported
> Where to change the permission, in this browser's words.
- Calls: [[ai-local.ts#detectBrowser|detectBrowser()]]

### SAFARI_LOCAL_BLOCKED
*const* · line 195 · exported
> Safari blocks https pages from reaching http://localhost (mixed content), whatever the program allows.
- Used in: [[LocalSetup.tsx]]

### ollamaOriginsFix
*function* · line 214 · exported
> How to let Ollama accept requests from this website, for each operating system.
- Calls: [[ai-local.ts#siteOrigin|siteOrigin()]]
- Used in: [[LocalSetup.tsx]], [[ai-local.test.ts]]

### lmStudioCorsFix
*function* · line 250 · exported
- Used in: [[LocalSetup.tsx]]

### pullCommand
*function* · line 260 · exported
- Used in: [[LocalSetup.tsx]]

### STEP_TITLES
*const* · line 322 · exported
- Used in: [[LocalSetup.tsx]]

### timedFetch
*function* · line 344
> fetch with a time limit that also follows the caller's signal.
- Calls: [[ai-local.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]]

### matchModel
*function* · line 366 · exported
> Does "llama3.2" match an installed "llama3.2:latest"? Returns the installed name, or null.
- Used in: [[ai-local.test.ts]]

### parseModelList
*function* · line 382 · exported
> Parse Ollama's /api/tags or an OpenAI-style /models list.
- Used in: [[ai-local.test.ts]]

### runLocalCheck
*function* · line 389 · exported
> Run the checklist. Never throws (except when stopped): every problem ends up in a step.
- Calls: [[ai-http.ts#askOpenAiCompatible|askOpenAiCompatible()]], [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-local.ts#addressAdvice|addressAdvice()]], [[ai-local.ts#detectBrowser|detectBrowser()]], [[ai-local.ts#isLocalServiceUrl|isLocalServiceUrl()]], [[ai-local.ts#isLoopbackUrl|isLoopbackUrl()]], [[ai-local.ts#lmStudioCorsFix|lmStudioCorsFix()]], [[ai-local.ts#localKind|localKind()]], [[ai-local.ts#matchModel|matchModel()]], [[ai-local.ts#parseModelList|parseModelList()]], [[ai-local.ts#permissionHelp|permissionHelp()]], [[ai-local.ts#pullCommand|pullCommand()]], [[ai-local.ts#queryLocalNetworkPermission|queryLocalNetworkPermission()]], [[ai-local.ts#serverRoot|serverRoot()]], [[ai-local.ts#siteOrigin|siteOrigin()]], [[ai-local.ts#timedFetch|timedFetch()]], [[ai-local.ts]], [[claude.ts#AiUnavailableError|AiUnavailableError]], [[platform/ai.ts#aiErrorText|aiErrorText()]], [[platform/ai.ts#stripThinking|stripThinking()]]
- Uses: [[ai-local.ts#SAFARI_LOCAL_BLOCKED|SAFARI_LOCAL_BLOCKED]], [[ai-local.ts#STEP_TITLES|STEP_TITLES]], [[ai-local.ts]]
- Used in: [[LocalSetup.tsx]], [[ai-local.test.ts]]

### localDiagnostics
*function* · line 667 · exported
> A plain-text report for asking for help. Contains no API key.
- Calls: [[ai-http.ts#normaliseBaseUrl|normaliseBaseUrl()]], [[ai-local.ts#detectOs|detectOs()]], [[ai-local.ts#siteOrigin|siteOrigin()]], [[ai-local.ts]]
- Used in: [[LocalSetup.tsx]], [[ai-local.test.ts]]
