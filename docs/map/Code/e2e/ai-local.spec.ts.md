---
id: e2e/ai-local.spec.ts
type: e2e-spec
file: e2e/ai-local.spec.ts
area: e2e
---

# e2e/ai-local.spec.ts

*End-to-end spec* · area [[e2e]] · 248 lines

> A program on this computer (Ollama / LM Studio) from a website that is not localhost, against a fake Ollama server (scripts/diagnostics/fake-ollama.mjs) with Ollama's real CORS behaviour. The app is opened as https://socius.test (served through a route), so requests to http://localhost:11434 are cross-site exactly as from https://hackhead95.github.io: Ollama refuses them until OLLAMA_ORIGINS li...

## Test cases
  - Ollama: not running, then refusing this website (OLLAMA_ORIGINS), then model missing, then a streamed answer
  - Ollama allowing this website: "llama3.2" matches llama3.2:latest, a real AI feature works, Copy details has no key
  - Explain with AI streams from the local program; when it stops, the error points to the guided check
  - Browser permission for this computer: not answered yet, then blocked, then allowed
  - LM Studio with CORS off, then on; address advice when /v1 is missing

## Imports
- [[@playwright-test|@playwright/test]] · value
- [[e2e/helpers.ts]] · value
- `scripts/diagnostics/fake-ollama.mjs` · value

## Calls
- [[e2e/helpers.ts#loadSampleFromWelcome|loadSampleFromWelcome()]]

## Tests
- [[AI assistant settings|AI > AI assistant settings...]] · menu label
- [[Descriptive Statistics|Analyze > Descriptive Statistics]] · menu label
- [[Descriptive Statistics/Frequencies|Analyze > Descriptive Statistics > Frequencies...]] · menu label
- [[Procedures/frequencies|Frequencies]] · menu label
- [[socius.ai]] · storage key

## Private helpers
appPort (line 12) · SITE (line 13) · setLocalNetwork() (line 26) · cdp (line 36) · fake (line 46) · openLocal() (line 56) · step() (line 73)
