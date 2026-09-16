import { injectable } from '@shared/container';
import type {
  KvCacheInterface,
  KvCacheSetOptionsInterface
} from '@server/interfaces/KvCacheInterface';

type MemoryKvEntryType = {
  readonly json: string;
  readonly expiresAtMs: number | null;
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
   * @override
   */
  public async clear(): Promise<void> {
    sharedKvStore.clear();
    sharedInflight.clear();
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
