// Shared test helpers for the AI provider layer: an in-memory localStorage and fetch responses.

export function memoryStorage(opts: { throwOnSet?: boolean; throwOnGet?: boolean } = {}): Storage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => {
      if (opts.throwOnGet) throw new Error('SecurityError');
      return data.has(k) ? data.get(k)! : null;
    },
    setItem: (k: string, v: string) => {
      if (opts.throwOnSet) throw new Error('QuotaExceededError');
      data.set(k, String(v));
    },
    removeItem: (k: string) => void data.delete(k),
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A text/event-stream response delivered in the given raw chunks (which may split lines). */
export function sseResponse(chunks: string[], status = 200): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
      c.close();
    },
  });
  return new Response(stream, { status, headers: { 'Content-Type': 'text/event-stream' } });
}
