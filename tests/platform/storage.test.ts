// Browser storage: what the on-device models take (web-llm's Cache Storage, mocked), deleting them,
// the space check before a download (no download that would fill the quota; a partial download
// removed when storage runs out), and autosave when IndexedDB reports QuotaExceededError (paused, logged
// once, retried with growing gaps and at once when space is freed, resumed by the first save that works).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SAFETY_MARGIN_BYTES, checkSpaceFor, deleteAllStoredModels, deleteStoredModel, estimateStorage, formatBytes, listWebLlmStorage, modelIdFromUrl, notifyStorageFreed,
} from '../../src/platform/ai-storage';
import { __setWebLlmLoader, prepareWebLlm } from '../../src/platform/ai-webllm';
import { __reloadAiSettings } from '../../src/platform/ai';
import { __resetErrorLogForTests, getLog } from '../../src/platform/errorlog';
import { memoryStorage } from './helpers';

const QWEN = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';
const LLAMA = 'Llama-3.2-3B-Instruct-q4f16_1-MLC';
const HF = (id: string, f: string) => `https://huggingface.co/mlc-ai/${id}/resolve/main/${f}`;
const WASM = 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/web-llm-models/v0_2_84/base/';

// ---------- a Cache Storage mock ----------

class MockCache {
  entries = new Map<string, Response>();
  async keys() {
    return [...this.entries.keys()].map((u) => new Request(u));
  }
  async match(r: Request | string) {
    const u = typeof r === 'string' ? r : r.url;
    return this.entries.get(u)?.clone();
  }
  async put(r: Request | string, res: Response) {
    this.entries.set(typeof r === 'string' ? r : r.url, res);
  }
  async delete(r: Request | string) {
    return this.entries.delete(typeof r === 'string' ? r : r.url);
  }
}

function mockCaches() {
  const stores = new Map<string, MockCache>();
  const api = {
    stores,
    keys: async () => [...stores.keys()],
    has: async (n: string) => stores.has(n),
    open: async (n: string) => {
      if (!stores.has(n)) stores.set(n, new MockCache());
      return stores.get(n)!;
    },
    delete: async (n: string) => stores.delete(n),
  };
  vi.stubGlobal('caches', api);
  return api;
}

const bytes = (n: number) => new Response(new Uint8Array(0), { headers: { 'content-length': String(n) } });

async function fillModel(c: ReturnType<typeof mockCaches>, id: string, shards: number, present = shards, size = 100e6) {
  const model = await c.open('webllm/model');
  await model.put(HF(id, 'tensor-cache.json'), new Response(JSON.stringify({ records: Array.from({ length: shards }, (_, i) => ({ dataPath: `params_shard_${i}.bin` })) }), { headers: { 'content-length': '2000' } }));
  for (let i = 0; i < present; i++) await model.put(HF(id, `params_shard_${i}.bin`), bytes(size));
  await model.put(HF(id, 'tokenizer.json'), bytes(7e6));
  const config = await c.open('webllm/config');
  await config.put(HF(id, 'mlc-chat-config.json'), bytes(2e3));
  const wasm = await c.open('webllm/wasm');
  const lib = id.startsWith('Qwen') ? 'Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm' : 'Llama-3.2-3B-Instruct-q4f16_1_cs1k-webgpu.wasm';
  await wasm.put(WASM + lib, bytes(5e6));
}

function stubEstimate(usage: number, quota: number) {
  const est = { usage, quota, usageDetails: { caches: usage - 1e6, indexedDB: 1e6 } };
  vi.stubGlobal('navigator', { storage: { estimate: vi.fn(async () => est), persisted: async () => false, persist: vi.fn(async () => true) } });
  return est;
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  __reloadAiSettings();
  __resetErrorLogForTests();
});
afterEach(() => {
  vi.useRealTimers();
  __setWebLlmLoader(null);
  vi.unstubAllGlobals();
});

describe('downloaded models in Cache Storage', () => {
  it('lists each model with its size and whether it is complete, including its program file', async () => {
    const c = mockCaches();
    await fillModel(c, QWEN, 10);
    await fillModel(c, LLAMA, 18, 7);
    const s = await listWebLlmStorage();
    expect(s.stores.sort()).toEqual(['webllm/config', 'webllm/model', 'webllm/wasm']);
    const q = s.models.find((m) => m.id === QWEN)!;
    expect(q).toMatchObject({ label: 'Small and fast', complete: true, files: 14 });
    expect(q.bytes).toBe(10 * 100e6 + 2000 + 7e6 + 2e3 + 5e6);
    const l = s.models.find((m) => m.id === LLAMA)!;
    expect(l).toMatchObject({ label: 'Better quality', complete: false });
    expect(formatBytes(l.bytes)).toBe('712 MB');
  });

  it('deletes one model (weights, tokenizer, settings and its program) and leaves the other', async () => {
    const c = mockCaches();
    await fillModel(c, QWEN, 3);
    await fillModel(c, LLAMA, 3);
    const freed = vi.fn();
    const { onStorageFreed } = await import('../../src/platform/ai-storage');
    const off = onStorageFreed(freed);
    expect(await deleteStoredModel(LLAMA)).toBeGreaterThan(300e6);
    off();
    const s = await listWebLlmStorage();
    expect(s.models.map((m) => m.id)).toEqual([QWEN]);
    expect([...c.stores.get('webllm/wasm')!.entries.keys()]).toEqual([WASM + 'Qwen2-1.5B-Instruct-q4f16_1_cs1k-webgpu.wasm']);
    expect(freed).toHaveBeenCalledTimes(1);
    await deleteAllStoredModels();
    expect(c.stores.size).toBe(0);
  });

  it('reads the model id from a file address', () => {
    expect(modelIdFromUrl(HF(QWEN, 'params_shard_3.bin'))).toBe(QWEN);
    expect(modelIdFromUrl('https://example.org/x.bin')).toBeNull();
  });

  it('no Cache Storage (older browsers, the Artifact viewer): empty, no errors', async () => {
    vi.stubGlobal('caches', undefined);
    expect(await listWebLlmStorage()).toEqual({ models: [], otherBytes: 0, totalBytes: 0, stores: [] });
    expect(await deleteStoredModel(QWEN)).toBe(0);
    vi.stubGlobal('navigator', {});
    expect(await estimateStorage()).toEqual({ usage: null, quota: null });
  });
});

describe('space check before downloading', () => {
  it('refuses when the download (plus 10% and a margin) does not fit, counting parts already stored', async () => {
    const c = mockCaches();
    await fillModel(c, LLAMA, 18); // 1.8 GB stored
    stubEstimate(2.0e9, 2.9e9); // 900 MB free
    const r = await checkSpaceFor(QWEN, 1000e6);
    expect(r.ok).toBe(false);
    expect(r.need).toBe(1000e6);
    expect(r.others.map((m) => m.id)).toEqual([LLAMA]);
    stubEstimate(0.2e9, 1.8e9); // 1.6 GB free
    expect((await checkSpaceFor(QWEN, 1000e6)).ok).toBe(1.6e9 >= 1000e6 * 1.1 + SAFETY_MARGIN_BYTES);
    // A model already stored needs nothing.
    stubEstimate(2.9e9, 2.9e9);
    await fillModel(c, QWEN, 10);
    expect((await checkSpaceFor(LLAMA, 1800e6 - 1)).ok).toBe(true);
  });

  it('the on-device model is not downloaded when it would not fit; a download stopped by a full quota is removed', async () => {
    const c = mockCaches();
    stubEstimate(2.5e9, 3e9);
    const reload = vi.fn(async () => undefined);
    class MLCEngine {
      reload = reload;
      unload = async () => undefined;
      interruptGenerate = async () => undefined;
      chat = { completions: { create: async () => (async function* () {})() } };
    }
    __setWebLlmLoader(async () => ({ MLCEngine, hasModelInCache: async () => false, deleteModelAllInfoInCache: async () => undefined }), { ok: true, reason: null, f16: true });
    await expect(prepareWebLlm(QWEN)).rejects.toMatchObject({ code: 'model_storage_full', detail: expect.stringMatching(/needs about 1.0 GB.*500 MB more/) });
    expect(reload).not.toHaveBeenCalled();

    // Enough room reported, but the browser's quota runs out part-way.
    stubEstimate(0.1e9, 3e9);
    reload.mockImplementation(async () => {
      await fillModel(c, QWEN, 10, 4);
      throw Object.assign(new Error("Failed to execute 'add' on 'Cache': Quota exceeded."), { name: 'QuotaExceededError' });
    });
    __setWebLlmLoader(async () => ({ MLCEngine, hasModelInCache: async () => false, deleteModelAllInfoInCache: async () => undefined }), { ok: true, reason: null, f16: true });
    await expect(prepareWebLlm(QWEN)).rejects.toMatchObject({ code: 'model_storage_full' });
    expect((await listWebLlmStorage()).models).toEqual([]);
  });
});

// ---------- autosave with a full quota ----------

/** A small IndexedDB mock whose writes can fail with QuotaExceededError. */
function mockIndexedDb() {
  const data = new Map<string, unknown>();
  const state = { full: false, writes: 0, attempts: 0 };
  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    transaction(_store: string) {
      const t: any = { error: null, oncomplete: null, onerror: null, onabort: null };
      t.objectStore = () => ({
        put(v: unknown, k: string) {
          state.attempts++;
          const req: any = {};
          queueMicrotask(() => {
            if (state.full) {
              t.error = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
              t.onabort?.();
              return;
            }
            state.writes++;
            data.set(k, v);
            req.result = k;
            req.onsuccess?.();
            t.oncomplete?.();
          });
          return req;
        },
        get(k: string) {
          const req: any = {};
          queueMicrotask(() => {
            req.result = data.get(k);
            req.onsuccess?.();
            t.oncomplete?.();
          });
          return req;
        },
      });
      return t;
    },
  };
  vi.stubGlobal('indexedDB', {
    open() {
      const req: any = {};
      queueMicrotask(() => {
        req.result = db;
        req.onsuccess?.();
      });
      return req;
    },
  });
  return state;
}

describe('autosave when browser storage is full', () => {
  it('pauses (one log entry), does not write every 1.5 s, retries with growing gaps and resumes by itself', async () => {
    vi.useFakeTimers();
    const idb = mockIndexedDb();
    const p = await import('../../src/features/project/persistence');
    p.__resetAutosaveForTests();
    const state = { dataset: null, outputs: [], coding: {} } as any;
    expect(await p.saveSession(state)).toBe(true);
    idb.full = true;
    expect(await p.saveSession(state)).toBe(false);
    expect(p.getAutosaveState()).toMatchObject({ paused: true, failures: 1 });
    // Autosave keeps calling every 1.5 s: nothing is written, nothing more is logged.
    for (let i = 0; i < 6; i++) {
      await vi.advanceTimersByTimeAsync(1500);
      expect(await p.saveSession(state)).toBe(false);
    }
    expect(idb.attempts).toBe(2);
    // The scheduled retry (after 15 s) fails too; the next one waits longer.
    await vi.advanceTimersByTimeAsync(6000);
    expect(idb.attempts).toBe(3);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(idb.attempts).toBe(3);
    await vi.advanceTimersByTimeAsync(11_000);
    expect(idb.attempts).toBe(4);
    const errors = getLog().filter((e) => e.area === 'storage' && e.level === 'error');
    expect(errors).toHaveLength(1);
    expect(errors[0].context?.op).toBe('autosave paused (browser storage full)');
    // Space freed by Socius (a model deleted): retried at once and resumed.
    idb.full = false;
    notifyStorageFreed();
    await vi.advanceTimersByTimeAsync(0);
    expect(p.getAutosaveState().paused).toBe(false);
    expect(idb.writes).toBe(2);
    expect(getLog().some((e) => e.level === 'info' && /Autosave resumed after 3 saves failed/.test(e.message))).toBe(true);
    expect(await p.saveSession(state)).toBe(true);
  });

  it('a retry that works resumes autosave without any action', async () => {
    vi.useFakeTimers();
    const idb = mockIndexedDb();
    const p = await import('../../src/features/project/persistence');
    p.__resetAutosaveForTests();
    idb.full = true;
    await p.saveSession({ dataset: null, outputs: [], coding: {} } as any);
    expect(p.getAutosaveState().paused).toBe(true);
    idb.full = false;
    await vi.advanceTimersByTimeAsync(15_100);
    expect(p.getAutosaveState().paused).toBe(false);
  });
});
