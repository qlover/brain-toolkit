import { injectable } from '@shared/container';
import type {
  KvCacheInterface,
  KvCacheSetOptionsInterface
} from '@server/interfaces/KvCacheInterface';

type MemoryKvEntryType = {
  readonly json: string;
  readonly expiresAtMs: number | null;
};

const sharedKvStore = new Map<string, MemoryKvEntryType>();

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
    // If a default value was provided (non-options object), return it.
    if (arg2 !== undefined && !this.isKvOpt(arg2)) {
      return arg2 as T;
    }
    return null;
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
  }

  /**
   * @override
   */
  public async clear(): Promise<void> {
    sharedKvStore.clear();
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
