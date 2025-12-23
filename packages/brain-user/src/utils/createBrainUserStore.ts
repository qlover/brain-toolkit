import { isUserStoreInterface } from '@qlover/corekit-bridge/gateway-auth';
import type { BrainUserStoreOptions } from '../BrainUserStore';
import { BrainUserStore } from '../BrainUserStore';
import { defaultBrainStoreOptions } from '../config/common';
import type { BrainUserStoreInterface } from '../interface/BrainUserStoreInterface';

/**
 * BrainUserStore Creation Options
 *
 * Configuration options for creating a BrainUserStore instance.
 * All properties are optional and will use sensible defaults if not provided.
 *
 * ## Configuration Properties Table
 *
 * | Property | Type | Required | Default | Description |
 * |----------|------|----------|---------|-------------|
 * | `storage` | `'localStorage' \| 'sessionStorage' \| SyncStorageInterface` | No | `'localStorage'` | Storage mechanism for persisting user data |
 * | `persistUserInfo` | `boolean` | No | `false` | Whether to persist user information in storage |
 * | `credentialStorageKey` | `string` | No | `'brain_token'` | Storage key for user credentials/token |
 * | `featureTags` | `DynamicFeatureTags<Tags>` | No | Auto-created | Feature tags handler for permission checking |
 * | `userProfile` | `UserProfile` | No | Auto-created | User profile handler for profile data management |
 *
 * ## Storage Options Explained
 *
 * ### 1. Predefined Storage Types
 *
 * Use built-in browser storage:
 *
 * ```ts
 * // Use localStorage (default)
 * { storage: 'localStorage' }
 *
 * // Use sessionStorage (clears on browser close)
 * { storage: 'sessionStorage' }
 * ```
 *
 * ### 2. Custom Storage Interface
 *
 * Provide any object implementing `SyncStorageInterface`:
 *
 * ```ts
 * interface SyncStorageInterface<K, V> {
 *   length: number;
 *   setItem(key: K, value: V): void;
 *   getItem(key: K): V | null;
 *   removeItem(key: K): void;
 *   clear(): void;
 *   key(index: number): K | null;
 * }
 * ```
 *
 * ### 3. Cookie Storage
 *
 * Use `CookieStorage` from `@qlover/corekit-bridge`:
 *
 * ```ts
 * import { CookieStorage } from '@qlover/corekit-bridge';
 *
 * {
 *   storage: new CookieStorage({
 *     expires: 30,        // Cookie expires in 30 days
 *     path: '/',          // Available on all paths
 *     domain: '.example.com',  // Available on all subdomains
 *     secure: true,       // HTTPS only
 *     sameSite: 'Strict'  // CSRF protection
 *   })
 * }
 * ```
 *
 * ## Usage Examples
 *
 * ### Basic Usage (Default Configuration)
 *
 * ```ts
 * const store = createBrainUserStore({});
 * // Uses localStorage, no persistence, default keys
 * ```
 *
 * ### With Persistence Enabled
 *
 * ```ts
 * const store = createBrainUserStore({
 *   storage: 'localStorage',
 *   persistUserInfo: true,
 *   credentialStorageKey: 'my_app_token'
 * });
 * ```
 *
 * ### With Session Storage
 *
 * ```ts
 * const store = createBrainUserStore({
 *   storage: 'sessionStorage',
 *   persistUserInfo: true
 * });
 * // Data will be cleared when browser tab is closed
 * ```
 *
 * ### With Cookie Storage (Cross-Domain)
 *
 * ```ts
 * import { CookieStorage } from '@qlover/corekit-bridge';
 *
 * const store = createBrainUserStore({
 *   storage: new CookieStorage({
 *     expires: 7,              // 7 days
 *     path: '/',
 *     domain: '.myapp.com',    // Works on app.myapp.com, api.myapp.com, etc.
 *     secure: true,            // HTTPS only
 *     sameSite: 'Lax'
 *   }),
 *   persistUserInfo: true,
 *   credentialStorageKey: 'auth_token'
 * });
 * ```
 *
 * ### With Custom Storage Implementation
 *
 * ```ts
 * class CustomStorage implements SyncStorageInterface<string, string> {
 *   private data = new Map<string, string>();
 *
 *   get length() { return this.data.size; }
 *
 *   setItem(key: string, value: string) {
 *     this.data.set(key, value);
 *     // Custom logic: sync to server, encrypt, etc.
 *   }
 *
 *   getItem(key: string) {
 *     return this.data.get(key) ?? null;
 *   }
 *
 *   removeItem(key: string) {
 *     this.data.delete(key);
 *   }
 *
 *   clear() {
 *     this.data.clear();
 *   }
 *
 *   key(index: number) {
 *     return Array.from(this.data.keys())[index] ?? null;
 *   }
 * }
 *
 * const store = createBrainUserStore({
 *   storage: new CustomStorage(),
 *   persistUserInfo: true
 * });
 * ```
 *
 * ### With Existing Store Instance
 *
 * ```ts
 * const existingStore = new BrainUserStore({
 *   storage: localStorage,
 *   persistUserInfo: true,
 *   credentialStorageKey: 'token',
 *   featureTags: createFeatureTags(),
 *   userProfile: new UserProfile({})
 * });
 *
 * // Returns the same instance
 * const store = createBrainUserStore(existingStore);
 * ```
 *
 * ## Storage Key Usage
 *
 * The store uses two types of storage keys:
 *
 * 1. **Credential Storage Key** (`credentialStorageKey`)
 *    - Stores authentication token/credentials
 *    - Default: `'brain_token'`
 *    - Used for: Auto-login, token refresh
 *
 * 2. **Profile Storage Key** (from service options)
 *    - Stores user profile information
 *    - Default: `'brain_profile'`
 *    - Used for: User info persistence
 *
 * ```ts
 * // Example of stored data structure:
 * // localStorage['brain_token'] = 'eyJhbGciOiJIUzI1NiIs...'
 * // localStorage['brain_profile'] = '{"userId":"123","email":"user@example.com"}'
 * ```
 *
 * ## Persistence Behavior
 *
 * | `persistUserInfo` | Behavior |
 * |-------------------|----------|
 * | `true` | User info and credentials are saved to storage and restored on page reload |
 * | `false` | Data is kept in memory only, cleared on page reload |
 *
 * @template Tags - Array of feature tag strings for type-safe feature checking
 */
export type CreateBrainStoreOptions<Tags extends readonly string[]> =
  BrainUserStoreOptions<Tags> & {
    /**
     * Storage key for user credentials/authentication token
     *
     * This key is used to store and retrieve the authentication token
     * from the configured storage mechanism.
     *
     * @default `'brain_token'`
     *
     * @example
     * ```ts
     * {
     *   credentialStorageKey: 'my_app_auth_token'
     * }
     * // Stored as: localStorage['my_app_auth_token'] = 'token_value'
     * ```
     */
    credentialStorageKey?: string;
  };

/**
 * Type guard to check if value implements BrainUserStoreInterface
 *
 * @param options - Value to check
 * @returns True if value implements BrainUserStoreInterface
 */
export function isBrainUserStoreInterface<Tags extends readonly string[]>(
  options: unknown
): options is BrainUserStoreInterface<Tags> {
  // Check if it implements BrainUserStoreInterface
  return (
    isUserStoreInterface(options) &&
    'getToken' in options &&
    typeof options.getToken === 'function' &&
    'getFeatureTags' in options &&
    typeof options.getFeatureTags === 'function' &&
    'getUserProfile' in options &&
    typeof options.getUserProfile === 'function'
  );
}

/**
 * Create a BrainUserStore instance from store options
 *
 * Significance: Factory function for user store creation with flexible input types
 * Core idea: Accept either store options or an existing store instance
 * Main function: Initialize or return a user store instance
 * Main purpose: Simplify store creation and ensure consistent store interface
 *
 * @param options - Store configuration options
 * @returns A BrainUserStore instance
 *
 * @example
 * ```ts
 * // Create with options
 * const store1 = createBrainUserStore({
 *   storage: 'localStorage',
 *   persistUserInfo: true
 * });
 * ```
 */
export function createBrainUserStore<Tags extends readonly string[]>(
  options: CreateBrainStoreOptions<Tags>
): BrainUserStoreInterface<Tags>;

/**
 * Return the existing BrainUserStore instance
 *
 * @param options - An existing BrainUserStore instance
 * @returns The same BrainUserStore instance
 *
 * @example
 * ```ts
 * const existingStore = new BrainUserStore({});
 * const store = createBrainUserStore(existingStore); // returns same instance
 * ```
 */
export function createBrainUserStore<Tags extends readonly string[]>(
  options: BrainUserStoreInterface<Tags>
): BrainUserStoreInterface<Tags>;

/**
 * Create a BrainUserStore instance with default options
 *
 * @returns A BrainUserStore instance with default configuration
 *
 * @example
 * ```ts
 * const store = createBrainUserStore(); // creates with defaults
 * ```
 */
export function createBrainUserStore<Tags extends readonly string[]>(
  options?: undefined
): BrainUserStoreInterface<Tags>;

export function createBrainUserStore<Tags extends readonly string[]>(
  options?: CreateBrainStoreOptions<Tags> | BrainUserStoreInterface<Tags>
): BrainUserStoreInterface<Tags> {
  if (!options) {
    return new BrainUserStore(defaultBrainStoreOptions);
  }

  if (isBrainUserStoreInterface(options)) {
    return options;
  }

  if (options instanceof BrainUserStore) {
    return options;
  }

  return new BrainUserStore({
    ...defaultBrainStoreOptions,
    ...(options as CreateBrainStoreOptions<Tags>)
  });
}
