/**
 * createBrainUserStore test-suite
 *
 * Coverage:
 * 1. isBrainUserStoreInterface  - Type guard for store interfaces
 * 2. createBrainUserStore       - Store factory function
 * 3. Storage types                - Custom storage, null storage
 * 4. Persistence options          - persistUserInfo behavior
 * 5. Feature tags integration     - FeatureTags creation
 * 6. User profile integration     - UserProfile creation
 * 7. Overload signatures          - Multiple function signatures
 * 8. Edge cases                   - Null, undefined, invalid inputs
 * 9. Type safety                 - Generic type parameters
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createBrainUserStore,
  isBrainUserStoreInterface,
  type CreateBrainStoreOptions
} from '../src/utils/createBrainUserStore';
import { defaultBrainStoreOptions } from '../src/config/common';
import { BrainUserStore } from '../src/BrainUserStore';
import type { BrainUserStoreInterface } from '../src/interface/BrainUserStoreInterface';
import type { SyncStorageInterface } from '@qlover/fe-corekit';

describe('createBrainUserStore', () => {
  // Mock storage implementation
  class MockStorage implements SyncStorageInterface<string, unknown> {
    private store: Map<string, string> = new Map();

    /**
     * @override
     */
    public get length(): number {
      return this.store.size;
    }

    /**
     * @override
     */
    public setItem<T>(key: string, value: T, _options?: unknown): void {
      this.store.set(key, String(value));
    }

    /**
     * @override
     */
    public getItem<T>(
      key: string,
      _defaultValue?: T,
      _options?: unknown
    ): T | null {
      const value = this.store.get(key);
      return value !== undefined ? (value as T) : null;
    }

    /**
     * @override
     */
    public removeItem(key: string, _options?: unknown): void {
      this.store.delete(key);
    }

    /**
     * @override
     */
    public clear(): void {
      this.store.clear();
    }

    public key(index: number): string | null {
      const keys = Array.from(this.store.keys());
      return keys[index] ?? null;
    }
  }

  describe('isBrainUserStoreInterface', () => {
    it('should return true for valid BrainUserStore instance', () => {
      const store = createBrainUserStore({});
      expect(isBrainUserStoreInterface(store)).toBe(true);
    });

    it('should return true for BrainUserStore with all required methods', () => {
      const store = new BrainUserStore({ ...defaultBrainStoreOptions });
      expect(isBrainUserStoreInterface(store)).toBe(true);
    });

    it('should return false for objects missing getToken', () => {
      const incomplete = {
        getFeatureTags: vi.fn(),
        getUserProfile: vi.fn(),
        state: {},
        setState: vi.fn(),
        getState: vi.fn(),
        reset: vi.fn()
      };

      expect(isBrainUserStoreInterface(incomplete)).toBe(false);
    });

    it('should return false for objects missing getFeatureTags', () => {
      const incomplete = {
        getToken: vi.fn(),
        getUserProfile: vi.fn(),
        state: {},
        setState: vi.fn(),
        getState: vi.fn(),
        reset: vi.fn()
      };

      expect(isBrainUserStoreInterface(incomplete)).toBe(false);
    });

    it('should return false for objects missing getUserProfile', () => {
      const incomplete = {
        getToken: vi.fn(),
        getFeatureTags: vi.fn(),
        state: {},
        setState: vi.fn(),
        getState: vi.fn(),
        reset: vi.fn()
      };

      expect(isBrainUserStoreInterface(incomplete)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isBrainUserStoreInterface(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isBrainUserStoreInterface(undefined)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isBrainUserStoreInterface(123)).toBe(false);
      expect(isBrainUserStoreInterface('string')).toBe(false);
      expect(isBrainUserStoreInterface(true)).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isBrainUserStoreInterface({})).toBe(false);
    });
  });

  describe('createBrainUserStore', () => {
    describe('with default options', () => {
      it('should create store with no options', () => {
        const store = createBrainUserStore();

        expect(store).toBeInstanceOf(BrainUserStore);
      });

      it('should create store with empty options', () => {
        const store = createBrainUserStore({});

        expect(store).toBeInstanceOf(BrainUserStore);
      });

      it('should have getToken method', () => {
        const store = createBrainUserStore({});

        expect(typeof store.getToken).toBe('function');
        expect(store.getToken()).toBe('');
      });

      it('should have getFeatureTags method', () => {
        const store = createBrainUserStore({});

        expect(typeof store.getFeatureTags).toBe('function');
        expect(store.getFeatureTags()).toBeDefined();
      });

      it('should have getUserProfile method', () => {
        const store = createBrainUserStore({});

        expect(typeof store.getUserProfile).toBe('function');
        expect(store.getUserProfile()).toBeDefined();
      });
    });

    describe('with storage options', () => {
      it('should create store with custom storage', () => {
        const mockStorage = new MockStorage();
        const store = createBrainUserStore({
          storage: mockStorage
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });

      it('should create store with null storage', () => {
        const store = createBrainUserStore({
          storage: null
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });
    });

    describe('with persistence options', () => {
      it('should create store with persistUserInfo true', () => {
        const store = createBrainUserStore({
          persistUserInfo: true
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });

      it('should create store with persistUserInfo false', () => {
        const store = createBrainUserStore({
          persistUserInfo: false
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });
    });

    describe('with storage keys', () => {
      it('should create store with custom storageKey', () => {
        const store = createBrainUserStore({
          storageKey: 'custom_profile'
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });

      it('should create store with custom credentialStorageKey', () => {
        const store = createBrainUserStore({
          credentialStorageKey: 'custom_token'
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });

      it('should create store with both custom keys', () => {
        const store = createBrainUserStore({
          storageKey: 'custom_profile',
          credentialStorageKey: 'custom_token'
        });

        expect(store).toBeInstanceOf(BrainUserStore);
      });
    });

    describe('with existing store instance', () => {
      it('should return same store instance', () => {
        const existingStore = createBrainUserStore({});
        const store = createBrainUserStore(existingStore);

        expect(store).toBe(existingStore);
      });

      it('should return same BrainUserStore instance', () => {
        const existingStore = new BrainUserStore({
          ...defaultBrainStoreOptions
        });
        const store = createBrainUserStore(existingStore);

        expect(store).toBe(existingStore);
      });

      it('should preserve store state', () => {
        const existingStore = createBrainUserStore({});
        // Simulate some state
        const state = existingStore.getState();

        const store = createBrainUserStore(existingStore);

        expect(store.getState()).toBe(state);
      });
    });

    describe('complete configuration', () => {
      it('should create store with all options', () => {
        const mockStorage = new MockStorage();
        const store = createBrainUserStore({
          storage: mockStorage,
          persistUserInfo: true,
          storageKey: 'custom_profile',
          credentialStorageKey: 'custom_token'
        });

        expect(store).toBeInstanceOf(BrainUserStore);
        expect(store.getToken()).toBe('');
        expect(store.getFeatureTags()).toBeDefined();
        expect(store.getUserProfile()).toBeDefined();
      });
    });
  });

  describe('type safety', () => {
    it('should support generic type parameter', () => {
      const _tags = ['disable_gen_UI', 'disable_test'] as const;
      const store = createBrainUserStore<typeof _tags>({});

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should infer type from options', () => {
      const options: CreateBrainStoreOptions<readonly string[]> = {
        persistUserInfo: true
      };

      const store = createBrainUserStore(options);
      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should support different tag types', () => {
      type Tags1 = readonly ['tag1', 'tag2'];
      type Tags2 = readonly ['tag3', 'tag4'];

      const store1 = createBrainUserStore<Tags1>({});
      const store2 = createBrainUserStore<Tags2>({});

      expect(store1).toBeInstanceOf(BrainUserStore);
      expect(store2).toBeInstanceOf(BrainUserStore);
    });

    it('should work with CreateBrainStoreOptions type', () => {
      const options: CreateBrainStoreOptions<readonly string[]> = {};

      const store = createBrainUserStore(options);
      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should work with BrainUserStoreInterface type', () => {
      const existingStore: BrainUserStoreInterface<readonly string[]> =
        createBrainUserStore({});

      const store = createBrainUserStore(existingStore);
      expect(store).toBe(existingStore);
    });
  });

  describe('integration scenarios', () => {
    it('should support store reuse pattern', () => {
      const sharedStore = createBrainUserStore({
        persistUserInfo: true
      });

      const store1 = createBrainUserStore(sharedStore);
      const store2 = createBrainUserStore(sharedStore);

      expect(store1).toBe(sharedStore);
      expect(store2).toBe(sharedStore);
      expect(store1).toBe(store2);
    });

    it('should support store factory pattern', () => {
      function createStore(persistent: boolean) {
        return createBrainUserStore({
          persistUserInfo: persistent
        });
      }

      const persistentStore = createStore(true);
      const sessionStore = createStore(false);

      expect(persistentStore).toBeInstanceOf(BrainUserStore);
      expect(sessionStore).toBeInstanceOf(BrainUserStore);
    });

    it('should support conditional storage creation', () => {
      const useCustomStorage = true;
      const mockStorage = new MockStorage();

      const store = createBrainUserStore({
        storage: useCustomStorage ? mockStorage : null
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should support options merging pattern', () => {
      const baseOptions: CreateBrainStoreOptions<readonly string[]> = {
        persistUserInfo: false
      };

      const customOptions: CreateBrainStoreOptions<readonly string[]> = {
        ...baseOptions,
        persistUserInfo: true,
        credentialStorageKey: 'custom_token'
      };

      const store = createBrainUserStore(customOptions);
      expect(store).toBeInstanceOf(BrainUserStore);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support multi-environment setup', () => {
      const createEnvStore = (env: 'development' | 'production') => {
        return createBrainUserStore({
          persistUserInfo: env === 'production',
          credentialStorageKey: `${env}_token`
        });
      };

      const devStore = createEnvStore('development');
      const prodStore = createEnvStore('production');

      expect(devStore).toBeInstanceOf(BrainUserStore);
      expect(prodStore).toBeInstanceOf(BrainUserStore);
    });

    it('should support storage strategy selection', () => {
      const strategies = {
        persistent: {
          persistUserInfo: true
        },
        session: {
          persistUserInfo: false
        }
      };

      const persistentStore = createBrainUserStore(strategies.persistent);
      const sessionStore = createBrainUserStore(strategies.session);

      expect(persistentStore).toBeInstanceOf(BrainUserStore);
      expect(sessionStore).toBeInstanceOf(BrainUserStore);
    });

    it('should support custom storage with encryption', () => {
      class EncryptedStorage extends MockStorage {
        /**
         * @override
         */
        public setItem<T>(key: string, value: T, options?: unknown): void {
          // Simulate encryption
          const encrypted = `encrypted_${String(value)}`;
          super.setItem(key, encrypted as T, options);
        }

        /**
         * @override
         */
        public getItem<T>(
          key: string,
          defaultValue?: T,
          options?: unknown
        ): T | null {
          const encrypted = super.getItem(key, defaultValue, options);
          if (encrypted === null) return null;
          // Simulate decryption
          return String(encrypted).replace('encrypted_', '') as T;
        }
      }

      const store = createBrainUserStore({
        storage: new EncryptedStorage(),
        persistUserInfo: true
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should support store with feature tags', () => {
      const _tags = ['disable_gen_UI', 'disable_test'] as const;
      const store = createBrainUserStore<typeof _tags>({
        persistUserInfo: true
      });

      const featureTags = store.getFeatureTags();
      expect(featureTags).toBeDefined();
      expect(typeof featureTags.has).toBe('function');
    });

    it('should support store with user profile', () => {
      const store = createBrainUserStore({
        persistUserInfo: true
      });

      const userProfile = store.getUserProfile();
      expect(userProfile).toBeDefined();
      expect(typeof userProfile.getProfile).toBe('function');
    });
  });

  describe('edge cases', () => {
    it('should handle empty options object', () => {
      const store = createBrainUserStore({});

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should handle undefined storage', () => {
      const store = createBrainUserStore({
        storage: undefined
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should handle empty string keys', () => {
      const store = createBrainUserStore({
        storageKey: '',
        credentialStorageKey: ''
      });

      expect(store).toBeInstanceOf(BrainUserStore);
    });

    it('should handle multiple store creations', () => {
      const stores = Array.from({ length: 5 }, () => createBrainUserStore({}));

      stores.forEach((store) => {
        expect(store).toBeInstanceOf(BrainUserStore);
      });

      // Each store should be a different instance
      expect(stores[0]).not.toBe(stores[1]);
    });
  });

  describe('store functionality', () => {
    it('should have working getToken method', () => {
      const store = createBrainUserStore({});

      expect(store.getToken()).toBe('');
    });

    it('should have working getFeatureTags method', () => {
      const store = createBrainUserStore({});
      const featureTags = store.getFeatureTags();

      expect(featureTags).toBeDefined();
      expect(featureTags.getFeatureTags()).toEqual([]);
    });

    it('should have working getUserProfile method', () => {
      const store = createBrainUserStore({});
      const userProfile = store.getUserProfile();

      expect(userProfile).toBeDefined();
      expect(userProfile.getProfile()).toEqual({});
    });

    it('should have state management methods', () => {
      const store = createBrainUserStore({});

      expect(typeof store.getState).toBe('function');
      expect(typeof store.reset).toBe('function');
    });

    it('should have working reset method', () => {
      const store = createBrainUserStore({});

      expect(() => store.reset()).not.toThrow();
    });
  });
});
