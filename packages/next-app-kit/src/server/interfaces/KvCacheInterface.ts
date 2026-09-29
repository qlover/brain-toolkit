import type { AsyncStorageInterface } from '@qlover/fe-corekit/storage';

/**
 * KV cache options (in-memory now, Redis later).
 */
export interface KvCacheSetOptionsInterface {
  readonly ttlMs?: number;
}

/**
 * Async KV cache contract, built on top of fe-corekit's AsyncStorageInterface.
 *
 * Drops the get/set/delete aliases in favour of the standard
 * setItem / getItem / removeItem / clear from AsyncStorageInterface.
 * Switching to a Redis backend later only requires a new implementation class.
 */
export type KvCacheInterface = AsyncStorageInterface<
  string,
  unknown,
  KvCacheSetOptionsInterface
>;
