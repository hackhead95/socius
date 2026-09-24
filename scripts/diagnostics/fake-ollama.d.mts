// Types for fake-ollama.mjs (used by e2e/ai-local.spec.ts).
export interface FakeOptions {
  port?: number;
  host?: string;
  cors?: 'ollama' | 'none' | 'all';
  origins?: string[];
  models?: string[];
  reply?: string;
  version?: string;
  chunkDelayMs?: number;
  flavour?: 'ollama' | 'lmstudio';
}

export interface FakeRequest {
  method: string;
  path: string;
  origin: string | null;
  auth: string | null;
  body: string;
}

export interface FakeOllama {
  port: number;
  url: string;
  requests: FakeRequest[];
  set(patch: Partial<FakeOptions>): void;
  close(): Promise<void>;
}

export function startFakeOllama(opts?: FakeOptions): Promise<FakeOllama>;
