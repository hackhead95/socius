// The on-device models Socius offers (see ai-webllm.ts). Kept apart so that ai-storage.ts can name
// stored models without importing the engine code (and without an import cycle).

export interface WebLlmModelChoice {
  /** Model id for GPUs with 16-bit float shaders (most recent GPUs). */
  id: string;
  /** Fallback id for GPUs without the shader-f16 feature. */
  id32: string;
  label: string;
  detail: string;
  /** Approximate download, for the user. */
  download: string;
  /** Graphics memory needed, from the package's model list (16-bit files). */
  vramMB: number;
  /** Graphics memory needed by the 32-bit fallback files. */
  vramMB32: number;
  /** Approximate download (browser storage needed), in MB, for the 16-bit and 32-bit files. */
  downloadMB: number;
  downloadMB32: number;
  /** Model program (wasm) file names, to find them in the browser's cache. */
  libs?: string[];
}

// Ids checked against prebuiltAppConfig in @mlc-ai/web-llm 0.2.85 (tests/platform/webllm.test.ts).
export const WEBLLM_MODELS: WebLlmModelChoice[] = [
  {
    id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
    id32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
    label: 'Small and fast',
    detail: 'Qwen 2.5, 1.5 billion parameters. Works on most laptops with a recent browser.',
    download: 'about 1 GB',
    vramMB: 1630,
    vramMB32: 1889,
    downloadMB: 1000,
    downloadMB32: 1150,
    libs: ['Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm', 'Qwen2-1.5B-Instruct-q4f32_1_cs1k-webgpu.wasm'],
  },
  {
    id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC',
    id32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC',
    label: 'Better quality',
    detail: 'Llama 3.2, 3 billion parameters. Slower, needs a computer with more graphics memory.',
    download: 'about 1.8 GB',
    vramMB: 2264,
    vramMB32: 2952,
    downloadMB: 1800,
    downloadMB32: 2000,
    libs: ['Llama-3.2-3B-Instruct-q4f16_1_cs1k-webgpu.wasm', 'Llama-3.2-3B-Instruct-q4f32_1_cs1k-webgpu.wasm'],
  },
];
