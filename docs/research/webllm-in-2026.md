# WebLLM (on-device AI) in September 2026

## What to do (for implementers)

1. **Stay on `@mlc-ai/web-llm` 0.2.85.** It is the latest, published 8 Sep 2026, and already in `node_modules`. Its model libraries are `v0_2_84/base`. Use only ids from `prebuiltAppConfig.model_list`; the source calls it "the only source of truth" for compatible libraries.
2. **Keep the current defaults** (`Qwen2.5-1.5B-Instruct-q4f16_1-MLC`, about 1.6 GB VRAM, with a `q4f32_1` fallback when `shader-f16` is missing; `Llama-3.2-3B-Instruct`, about 2.3 GB). Consider adding `Qwen3-1.7B-q4f16_1-MLC` (2.0 GB) or `Qwen3-4B-q4f16_1-MLC` (3.4 GB) with `extra_body: { enable_thinking: false }`. For JSON use `response_format: { type: 'json_object', schema: JSON.stringify(schema) }` (grammar-constrained). Do not rely on WebLLM `tools` for small models: it is only enabled for the Hermes 8B family.
3. **Check support before download:** `navigator.gpu` exists, then `requestAdapter()` is non-null, then `adapter.features.has('shader-f16')` (choose f16 or f32), then `adapter.limits.maxStorageBufferBindingSize` and `maxBufferSize` (small limits mean mobile or integrated GPUs, so offer only models under 1 GB), then `navigator.storage.estimate()` (need model size plus about 20% free). Call `navigator.storage.persist()` before the download.
4. **Map errors to plain advice:** `WebGPUNotAvailableError`/`WebGPUNotFoundError` means no WebGPU (browser or OS); `ShaderF16SupportError` means retry with the q4f32 id; `DeviceLostError` means out of GPU memory (smaller model, close tabs); `QuotaExceededError` means disk quota (free space or delete cached models); a TypeError on fetch to `huggingface.co` or `raw.githubusercontent.com` means the network blocks the model host (common on university networks).
5. **Browser guidance:**
   - Chrome/Edge on Windows, macOS, ChromeOS: yes.
   - Chrome on Linux: Intel Gen12+ (144+) and NVIDIA on Wayland (147+) only; others behind flags.
   - Firefox: Windows (141+) and macOS (145+ on Apple Silicon with macOS 26, 147+ on all macOS); **not Linux or Android yet**.
   - Safari 26 on macOS, iOS and iPadOS: yes, but iOS memory is tight, so offer at most about 1 GB models there.

Labels: **[verified]** = package source, official repo or wiki; **[reported]** = issues, blogs; **[inferred]** = ours.

---

## 1. Version and packaging [verified: `npm view`, `npm pack @mlc-ai/web-llm@0.2.85`]

- Recent releases: 0.2.81 (17 Feb 2026), 0.2.82 (13 Mar), 0.2.83 (29 Apr), 0.2.84 (27 May), **0.2.85 (8 Sep 2026, latest)**. Socius `node_modules` has 0.2.85.
- `modelVersion = "v0_2_84/base"`. WASM libraries load from `https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/...`. Weights load from `https://huggingface.co/mlc-ai/<model_id>`. Both hosts must be reachable. A CSP `connect-src` would have to allow them; GitHub Pages sets no CSP.
- Cache backends (`AppConfig.cacheBackend`): `"cache"` (the default, Cache API), `"indexeddb"`, `"opfs"`, and `"cross-origin"` (experimental Chrome Cross-Origin Storage extension, which falls back to cache if the extension is missing). `hasModelInCache` and `deleteModelAllInfoInCache` are exported. [verified: README and `config.d.ts`]
- Structured output: `response_format.type` is one of `text | json_object | grammar | structural_tag`. `schema` is a **JSON string**. It is implemented with xgrammar in WASM, so the output is guaranteed to parse. [verified: `openai_api_protocols/chat_completion.d.ts`]
- `extra_body.enable_thinking` (Qwen3 only) turns off `<think>` output. [verified: same file]
- Function calling: `functionCallingModelIds` = Hermes-2-Pro-Llama-3-8B (f16/f32), Hermes-2-Pro-Mistral-7B, Hermes-3-Llama-3.1-8B (f16/f32). The README says it is "WIP… preliminary support". For other models use manual JSON tool calling, which Socius's JSON fallback already does. [verified]

## 2. Prebuilt models (0.2.85), q4f16_1 variants unless noted [verified: parsed from `prebuiltAppConfig` in `lib/index.js`]

VRAM is `vram_required_MB`. "Low" is `low_resource_required` (the maintainers' "runs on low-end devices" flag). The context is 4096 unless noted. The q4f32_1 twin needs about 20–40% more VRAM but no `shader-f16`.

| Model id | VRAM MB | Low | Notes |
|---|---|---|---|
| `SmolLM2-360M-Instruct-q4f16_1-MLC` | 376 | yes | needs shader-f16; toy quality |
| `gemma3-1b-it-q4f16_1-MLC` | 711 | yes | smallest decent chat |
| `Llama-3.2-1B-Instruct-q4f16_1-MLC` | 879 | yes | |
| `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` | 945 | yes | |
| `Qwen3-0.6B-q4f16_1-MLC` | 1403 | yes | thinking model |
| `Qwen2.5-1.5B-Instruct-q4f16_1-MLC` | 1630 | yes | **current Socius default**; q4f32 1.9 GB |
| `Qwen3.5-0.8B-q4f16_1-MLC` | 1629 | yes | new in 0.2.8x |
| `DeepSeek-R1-Distill-Qwen-1.5B-q4f16_1-MLC` | 1630 | yes | reasoning; verbose |
| `SmolLM2-1.7B-Instruct-q4f16_1-MLC` | 1774 | yes | needs shader-f16 |
| `OLMo-2-0425-1B-Instruct-q4f16_1-MLC` | 1777 | yes | |
| `gemma-2-2b-it-q4f16_1-MLC` | 1895 | no | needs shader-f16 |
| `Qwen3-1.7B-q4f16_1-MLC` | 2037 | yes | good JSON with thinking off [inferred] |
| `Qwen3.5-2B-q4f16_1-MLC` | 2245 | no | |
| `Llama-3.2-3B-Instruct-q4f16_1-MLC` | 2264 | yes | Socius "larger" option |
| `Hermes-3-Llama-3.2-3B-q4f16_1-MLC` | 2264 | yes | tool-tuned, but not in WebLLM `tools` list |
| `Qwen2.5-3B-Instruct-q4f16_1-MLC` | 2505 | yes | strong JSON at 3B [reported widely] |
| `Ministral-3-3B-Instruct-2512-BF16-q4f16_1-MLC` | 2864 | yes | Dec-2025 Mistral small model |
| `Qwen3-4B-q4f16_1-MLC` | 3432 | yes | best small general model here [inferred] |
| `Phi-4-mini-instruct-q4f16_1-MLC` | 3438 | no | |
| `Phi-3.5-mini-instruct-q4f16_1-MLC` | 3672 | no | |
| `Qwen3.5-4B-q4f16_1-MLC` | 3868 | no | |
| `Hermes-2-Pro-Mistral-7B-q4f16_1-MLC` | 4033 | no | WebLLM `tools` supported |
| `Hermes-3-Llama-3.1-8B-q4f16_1-MLC` | 4876 | no | WebLLM `tools` supported |
| `Llama-3.1-8B-Instruct-q4f16_1-MLC` | 5001 | no | |
| `Qwen2.5-7B-Instruct-q4f16_1-MLC` | 5107 | no | |
| `Qwen3-8B-q4f16_1-MLC` | 5696 | no | |
| `Qwen3.5-9B-q4f16_1-MLC` | 6433 | no | |

The list also has Coder, Math and vision variants (`Phi-3.5-vision`), `-1k` short-context variants (less VRAM), q0 (unquantised) variants, Llama-2/3, 70B q3 (31 GB), and embedding models: 165 ids in total. Download size is roughly equal to the VRAM figure minus the KV cache. For download estimates, use `vram_required_MB` as an upper bound [inferred].

**Recommended for Socius (JSON and tool-style tasks) [inferred, from sizes and general model reputation]:**
- Default: `Qwen2.5-1.5B-Instruct` (f16, fallback f32). It is a safe fit for 4 GB GPUs and most laptops.
- "Better answers" option: `Qwen3-4B` with `enable_thinking:false`, or `Qwen2.5-3B-Instruct`. Offer only when the adapter looks desktop-class: `maxBufferSize` of at least 2 GB is a reasonable heuristic.
- Phones and iPad: `Llama-3.2-1B` or `gemma3-1b`.
- Always use `response_format: json_object` with a schema for structured tasks. Keep prompts well under the 4096-token context (WebLLM throws `ContextWindowSizeExceededError`).

## 3. WebGPU availability by browser and OS [verified: gpuweb wiki "Implementation Status", fetched 24 Sep 2026]

| Browser | Windows | macOS | Linux | Android | iOS/iPadOS |
|---|---|---|---|---|---|
| Chrome/Edge | ✅ 113 (x64); ARM64 behind flag | ✅ 113 | ✅ Intel Gen12+ (144); ✅ NVIDIA 535.183+ on **Wayland** (147); others need flags | ✅ Android 12+ ARM/Qualcomm/Intel (121); Imagination (139, Android 16+); Samsung Xclipse about 154 | n/a (WebKit) |
| Firefox | ✅ 141 | ✅ 145 (Apple Silicon, macOS 26+), ✅ 147 all macOS | ❌ Nightly only ("expects to ship in 2026") | ❌ flag | n/a |
| Safari | n/a | ✅ 26 (Tahoe) | n/a | n/a | ✅ 26 |

Implications [inferred]:
- Many Linux users (Chrome on X11, AMD, or older Intel; Firefox) have **no WebGPU**. Show "Use Chrome on Windows or macOS, or connect Ollama" rather than a generic error.
- Safari/iOS: WebGPU is present, but the per-tab memory limit is low. Large models give `DeviceLostError` or the tab reloads.

## 4. Failure modes and detection

| Failure | How it shows | Detect early | Advice |
|---|---|---|---|
| No WebGPU API | `navigator.gpu` undefined → `WebGPUNotAvailableError` | `'gpu' in navigator` | browser/OS table above; on Linux Chrome, flags |
| No adapter (blocklisted GPU, remote desktop, VM, battery saver) | `requestAdapter()` returns `null` → `WebGPUNotFoundError` "Cannot find WebGPU in the environment" [verified message] | call `requestAdapter()` yourself first | update drivers; Chrome: check `chrome://gpu` |
| `shader-f16` missing | `ShaderF16SupportError` ("requires WebGPU extension shader-f16") [verified] | `adapter.features.has('shader-f16')` | pick the `q4f32_1` id automatically. Some drivers advertise f16 and still fail, so fall back to f32 on the first compile error [reported: [web-llm #254](https://github.com/mlc-ai/web-llm/issues/254), dev.to guide] |
| GPU out of memory | `DeviceLostError` "device was lost… often… OOM" [verified]; also "Binding size is larger than the maximum binding size" on low `maxStorageBufferBindingSize` (128 MB on many mobiles) [reported] | read `adapter.limits` | smaller model, `-1k` variant, close other GPU tabs |
| Storage quota | `QuotaExceededError: Failed to execute 'add' on 'Cache'` [reported: [web-llm #144](https://github.com/mlc-ai/web-llm/issues/144)] | `navigator.storage.estimate()` → `quota - usage` | free disk; delete other cached models (`deleteModelAllInfoInCache`); `navigator.storage.persist()`. Quotas: Chromium up to about 60% of disk per origin; Firefox best-effort about 10% of disk or 10 GiB per site (more when persisted); Safari 17+ about 60% for the browser app [reported, MDN/WebKit storage docs; not re-fetched] |
| Private/incognito window | tiny quota → QuotaExceeded or cache failure | `estimate().quota` < 1 GB | "Use a normal window" |
| Model host blocked | `TypeError: Failed to fetch` on `huggingface.co/...` or `raw.githubusercontent.com/...`; HF anonymous rate limits shared per IP on campus NAT [reported] | `HEAD`-probe a small file such as the model's `mlc-chat-config.json` with `mode:'cors'` | try another network; later: self-host weights on the same origin (needs its own hosting; GitHub Pages has a 1 GB site limit, so not feasible) |
| Tab killed or reloaded mid-download | partial cache; next load resumes per shard [inferred from shard-level caching] | n/a | keep tab in foreground |
| Context too long | `ContextWindowSizeExceededError` | count prompt chars (about 4 per token) | trim table excerpts |
| Artifact (claude.ai) build | module aliased to a stub | n/a | already handled |

Other WebLLM behaviours to note [verified from lib]:
- `ModelNotFoundError` for an id not in `appConfig`.
- `MissingModelWasmError` if `model_lib` is missing.
- Errors are classes with `.name`. Match on `.name`, not on message text, which is already partly done in `ai-webllm.ts` (`ShaderF16SupportError`, `DeviceLostError`).
- Run the engine in a **Web Worker** (`CreateWebWorkerMLCEngine`) so the UI stays responsive during prefill. The README recommends it. Socius currently constructs `MLCEngine` on the main thread (`ai-webllm.ts`), so long prefills freeze menus [inferred; worth a task].

## 5. Sources

- npm: `@mlc-ai/web-llm@0.2.85` tarball: `lib/index.js` (`prebuiltAppConfig`, `functionCallingModelIds`, error classes), `lib/config.d.ts`, `lib/openai_api_protocols/chat_completion.d.ts`, `README.md`.
- gpuweb wiki Implementation Status: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status (raw fetched).
- Issues: https://github.com/mlc-ai/web-llm/issues/254 , https://github.com/mlc-ai/web-llm/issues/144 , https://github.com/mlc-ai/web-llm/issues/836 (Adreno device lost).
