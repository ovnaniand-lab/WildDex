/**
 * Low-level HTTP client for WildDex Phase 2 API services.
 *
 * Responsibilities (shared by GBIF + iNaturalist modules):
 *  - request timeout via AbortController
 *  - one automatic retry with small backoff on transient failures
 *  - in-memory TTL cache to avoid duplicate/expensive requests
 *  - structured error type the UI can present with a retry affordance
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface CacheEntry {
  at: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes — biodiversity data changes slowly
const TIMEOUT_MS = 12_000;
const MAX_RETRIES = 1;

/** Clear the response cache (used by pull-to-refresh / tests). */
export function clearApiCache(): void {
  cache.clear();
}

function cachedGet<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data as T;
  if (hit) cache.delete(key);
  return undefined;
}

async function fetchOnce(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * GET JSON with timeout, retry, de-duplication and TTL caching.
 * Identical concurrent URLs share one network request.
 */
export async function getJson<T>(url: string, opts: { noCache?: boolean } = {}): Promise<T> {
  if (!opts.noCache) {
    const hit = cachedGet<T>(url);
    if (hit !== undefined) return hit;

    const pending = inflight.get(url);
    if (pending) return pending as Promise<T>;
  }

  const task = (async (): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetchOnce(url);
        if (res.status === 429) {
          // Rate limited — wait once, then retry (both APIs ask for polite backoff).
          await new Promise((r) => setTimeout(r, 1500));
          throw new ApiError('Rate limited by the server, please retry.', 429, url);
        }
        if (!res.ok) throw new ApiError(`Request failed (HTTP ${res.status})`, res.status, url);
        const data = (await res.json()) as T;
        if (!opts.noCache) cache.set(url, { at: Date.now(), data });
        return data;
      } catch (e) {
        lastError = e;
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
      }
    }
    if (lastError instanceof ApiError) throw lastError;
    const msg =
      lastError instanceof Error && lastError.name === 'AbortError'
        ? 'The request timed out. Check your connection and try again.'
        : 'Network unavailable. Check your connection and try again.';
    throw new ApiError(msg, undefined, url);
  })();

  if (!opts.noCache) {
    inflight.set(url, task);
    task.finally(() => inflight.delete(url)).catch(() => {});
  }

  return task;
}

/** Build a URL with query params, skipping empty values. */
export function withParams(base: string, params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${base}?${qs}` : base;
}
