import { injectable } from '@shared/container';
import type {
  KvCacheInterface,
  KvCacheSetOptionsInterface
} from '@server/interfaces/KvCacheInterface';

type MemoryKvEntryType = {
  readonly json: string;
  readonly expiresAtMs: number | null;
};

export type MemoryKvListEntryType = {
  readonly key: string;
  readonly value: unknown;
  readonly bytes: number;
  readonly expiresAtMs: number | null;
  readonly ttlMs: number | null;
};

/** Process-wide store — survives per-request IOC instances. */
const sharedKvStore = new Map<string, MemoryKvEntryType>();

/** Coalesce concurrent getOrSet factories for the same key. */
const sharedInflight = new Map<string, Promise<unknown>>();

@injectable()
export class MemoryKvCacheService implements KvCacheInterface {
  /**
   * @override
   */
  public async setItem<T>(
    key: string,
    value: T,
    options?: KvCacheSetOptionsInterface
  ): Promise<void> {
    this.assertKey(key);
    if (value === undefined) {
      throw new Error('KvCache value cannot be undefined');
    }
    const ttlMs = options?.ttlMs;
    if (ttlMs != null && (!Number.isFinite(ttlMs) || ttlMs <= 0)) {
      throw new Error('KvCache ttlMs must be a positive number');
    }
    sharedKvStore.set(key, {
      json: JSON.stringify(value),
      expiresAtMs: ttlMs == null ? null : Date.now() + ttlMs
    });
  }

  /**
   * @override
   */
  public async getItem<T>(
    key: string,
    options?: KvCacheSetOptionsInterface
  ): Promise<T | null>;
  /**
   * @override
   */
  public async getItem<T>(
    key: string,
    defaultValue: T,
    options?: KvCacheSetOptionsInterface
  ): Promise<T>;
  /**
   * @override
   */
  public async getItem<T>(
    key: string,
    arg2?: T | KvCacheSetOptionsInterface,
    _arg3?: KvCacheSetOptionsInterface
  ): Promise<T | null> {
    this.assertKey(key);
    const entry = sharedKvStore.get(key);
    if (entry) {
      if (entry.expiresAtMs == null || Date.now() < entry.expiresAtMs) {
        return JSON.parse(entry.json) as T;
      }
      sharedKvStore.delete(key);
    }
    if (arg2 !== undefined && !this.isKvOpt(arg2)) {
      return arg2 as T;
    }
    return null;
  }

  /**
   * Cache-aside: return cached value, or run `factory` once (coalesced) and store.
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: KvCacheSetOptionsInterface
  ): Promise<T> {
    this.assertKey(key);
    const hit = await this.getItem<T>(key);
    if (hit !== null) {
      return hit;
    }

    const existing = sharedInflight.get(key) as Promise<T> | undefined;
    if (existing) {
      return existing;
    }

    const pending = (async () => {
      const value = await factory();
      await this.setItem(key, value, options);
      return value;
    })().finally(() => {
      sharedInflight.delete(key);
    });

    sharedInflight.set(key, pending);
    return pending;
  }

  /**
   * @override
   */
  public async removeItem(
    key: string,
    _options?: KvCacheSetOptionsInterface
  ): Promise<void> {
    this.assertKey(key);
    sharedKvStore.delete(key);
    sharedInflight.delete(key);
  }

  /**
   * Drop keys that start with `prefix` (process store only).
   */
  public async removeByPrefix(prefix: string): Promise<number> {
    if (!prefix.trim()) {
      throw new Error('KvCache prefix must be non-empty');
    }
    let removed = 0;
    for (const key of [...sharedKvStore.keys()]) {
      if (key.startsWith(prefix)) {
        sharedKvStore.delete(key);
        sharedInflight.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  /**
   * Inspect live entries (drops expired keys while iterating).
   * Admin console only — values can be large (locale maps).
   */
  public async listEntries(prefix?: string): Promise<MemoryKvListEntryType[]> {
    const now = Date.now();
    this.purgeExpired(now);
    const needle = prefix?.trim() ?? '';
    const items: MemoryKvListEntryType[] = [];
    for (const [key, entry] of sharedKvStore) {
      if (needle && !key.startsWith(needle)) {
        continue;
      }
      let value: unknown;
      try {
        value = JSON.parse(entry.json) as unknown;
      } catch {
        value = entry.json;
      }
      items.push({
        key,
        value,
        bytes: new TextEncoder().encode(entry.json).length,
        expiresAtMs: entry.expiresAtMs,
        ttlMs:
          entry.expiresAtMs == null
            ? null
            : Math.max(0, entry.expiresAtMs - now)
      });
    }
    items.sort((a, b) => a.key.localeCompare(b.key));
    return items;
  }

  public async count(): Promise<number> {
    this.purgeExpired();
    return sharedKvStore.size;
  }

  /**
   * @override
   */
  public async clear(): Promise<void> {
    sharedKvStore.clear();
    sharedInflight.clear();
  }

  private purgeExpired(now = Date.now()): void {
    for (const [key, entry] of sharedKvStore) {
      if (entry.expiresAtMs != null && now >= entry.expiresAtMs) {
        sharedKvStore.delete(key);
        sharedInflight.delete(key);
      }
    }
  }

  protected assertKey(key: string): void {
    if (!key.trim()) {
      throw new Error('KvCache key must be non-empty');
    }
  }

  private isKvOpt(value: unknown): value is KvCacheSetOptionsInterface {
    return (
      typeof value === 'object' &&
      value != null &&
      'ttlMs' in (value as Record<string, unknown>)
    );
  }
}
