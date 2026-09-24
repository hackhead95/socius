// Client-side request pacing for free tiers. Counts requests in a sliding one-minute window, per
// provider and key. The limit can change while in use (Gemini's real per-model limits are learned from
// its 429 replies: see src/platform/ai-pace.ts, which uses this class).

export class RateLimiter {
  private stamps: number[] = [];
  constructor(
    public perMinute: number,
    private now: () => number = () => Date.now(),
  ) {}

  /** Milliseconds until another request may be sent (0 = now). */
  waitMs(): number {
    const t = this.now();
    this.stamps = this.stamps.filter((s) => t - s < 60_000);
    if (this.stamps.length < this.perMinute) return 0;
    // The request that must leave the window before another fits (the limit may have been lowered).
    const oldest = this.stamps[this.stamps.length - this.perMinute];
    return Math.max(0, 60_000 - (t - oldest) + 50);
  }

  record(): void {
    this.stamps.push(this.now());
  }

  /** Requests counted in the last minute. */
  count(): number {
    const t = this.now();
    return this.stamps.filter((s) => t - s < 60_000).length;
  }
}

const limiters = new Map<string, RateLimiter>();

export function limiterFor(key: string, perMinute: number): RateLimiter {
  let l = limiters.get(key);
  if (!l || l.perMinute !== perMinute) {
    l = new RateLimiter(perMinute);
    limiters.set(key, l);
  }
  return l;
}

/** Sleep that ends early (rejecting) when the signal aborts. */
export function abortableSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Aborted', 'AbortError'));
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
