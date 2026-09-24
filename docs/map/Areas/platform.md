---
id: "area:platform"
type: area
area: platform
---

# Area: platform

11 files, 4988 lines.

## Used by areas
- [[features - ai|features/ai]]: 24
- [[features - errorlog|features/errorlog]]: 8
- [[lib - assistant|lib/assistant]]: 8
- [[features - coding|features/coding]]: 7
- [[features - assistant|features/assistant]]: 5
- [[features - project|features/project]]: 4
- [[features - transform|features/transform]]: 4
- [[Areas/app|app]]: 3
- [[features - output|features/output]]: 3
- [[features - analysis|features/analysis]]: 1
- [[features - data|features/data]]: 1

## Files
- [[ai-diagnose.ts]]: Step-by-step "Test connection" for AI assistant settings, and plain-text reports for support. Google Gemini: 1) Internet connection, 2) Reac…
- [[ai-http.ts]]: AI over HTTP: Google Gemini and any OpenAI-compatible chat completions service (Groq, OpenRouter, a local Ollama or LM Studio, ...). Browser…
- [[ai-local.ts]]: A guided check for an AI program on this computer (Ollama, LM Studio, or another OpenAI-compatible server on localhost), used by AI assistan…
- [[ai-tools.ts]]: Tool calling ("function calling") for the Socius assistant, next to the plain-text adapters. - Google Gemini: the Interactions API (POST /v1…
- [[ai-webllm.ts]]: On-device AI with WebLLM (@mlc-ai/web-llm): a small language model runs on this computer's graphics chip through WebGPU. Nothing leaves the …
- [[platform/ai.ts]]: AI provider layer. Every AI request in the app goes through askAI / askAIJson here, on a user click. Providers: - claude : inside the claude…
- [[buildInfo.ts]]: Build information injected by Vite (`define` in vite.config.ts): the package.json version, the short git commit when the build ran in a git …
- [[claude.ts]]: The claude.ai Artifact runtime: the `claude` global and its capabilities (`downloads`, `sample`). Only present when the app is opened as a C…
- [[errorlog.ts]]: Error log: a small ring buffer of problems the app noticed, kept in this browser (localStorage, or memory only when storage is unavailable o…
- [[host.ts]]: Host abstraction. The app runs in three places: 1. Inside a claude.ai Artifact viewer (sandboxed iframe): plain <a download> is blocked, so …
- [[webllm-stub.ts]]: Stand-in for @mlc-ai/web-llm in the single-file Claude artifact build (`vite build --mode artifact` aliases the package here), so the large …

## Hooks
[[useCapability|useCapability()]]
