/**
 * A small, durable cache for data the dashboards should keep showing when the
 * API is unreachable.
 *
 * Everything here is defensive on purpose: localStorage throws in private
 * windows, when a quota is exceeded, and when site data is blocked. A cache
 * that takes the page down with it is worse than no cache, so every read and
 * write is guarded and failure degrades to "no cached value".
 */

const PREFIX = "tvet_cache:";

/** Bump to discard everything written by an older shape of the app. */
const VERSION = 1;

export type CacheEntry<T> = {
  /** When the value was written, epoch ms. */
  savedAt: number;
  value: T;
};

type StoredEntry<T> = CacheEntry<T> & { v: number };

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function fullKey(key: string): string {
  return `${PREFIX}${key}`;
}

/** Read a cached value. Returns null when absent, unreadable, or stale-versioned. */
export function readCache<T>(key: string): CacheEntry<T> | null {
  const store = storage();
  if (!store) return null;

  try {
    const raw = store.getItem(fullKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredEntry<T>;
    if (!parsed || parsed.v !== VERSION || typeof parsed.savedAt !== "number") {
      return null;
    }
    return { savedAt: parsed.savedAt, value: parsed.value };
  } catch {
    return null;
  }
}

/**
 * Write a value. Silently does nothing if it cannot be stored — on a quota
 * error the app's own cache entries are dropped once and the write retried,
 * so one oversized payload cannot permanently poison the cache.
 */
export function writeCache<T>(key: string, value: T): void {
  const store = storage();
  if (!store) return;

  const payload: StoredEntry<T> = { v: VERSION, savedAt: Date.now(), value };

  try {
    store.setItem(fullKey(key), JSON.stringify(payload));
  } catch {
    try {
      clearCache();
      store.setItem(fullKey(key), JSON.stringify(payload));
    } catch {
      /* give up quietly; the app works without a cache */
    }
  }
}

/** Drop cached entries. With no prefix, drops every entry this module wrote. */
export function clearCache(keyPrefix = ""): void {
  const store = storage();
  if (!store) return;

  try {
    const target = `${PREFIX}${keyPrefix}`;
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const k = store.key(i);
      if (k && k.startsWith(target)) doomed.push(k);
    }
    doomed.forEach((k) => {
      try {
        store.removeItem(k);
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* ignore */
  }
}

/** True when the entry was written within `ttlMs`. */
export function isFresh<T>(
  entry: CacheEntry<T> | null | undefined,
  ttlMs: number
): boolean {
  if (!entry) return false;
  const age = Date.now() - entry.savedAt;
  return age >= 0 && age <= ttlMs;
}

/** "just now" / "5 minutes ago" / "2 hours ago", for a stale-data notice. */
export function describeAge(savedAt: number): string {
  const seconds = Math.max(0, Math.round((Date.now() - savedAt) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** Cache keys, kept together so they cannot drift apart across components. */
export const cacheKeys = {
  adminTickets: (categoryId: string | number | null | undefined) =>
    `admin_tickets:${categoryId ?? "all"}`,
  agentTickets: (userId: string | number | null | undefined) =>
    `agent_tickets:${userId ?? "me"}`,
  ticketChats: (ticketId: string | number | null | undefined) =>
    `ticket_chats:${ticketId ?? "none"}`,
  categories: () => "categories",
  faqs: () => "faqs",
} as const;
