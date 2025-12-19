/**
 * createBrainUserOptions test-suite
 *
 * Coverage:
 * 1. createBrainUserOptions    - Options factory function
 * 2. Default values              - Default configuration merging
 * 3. Store creation              - BrainUserStore initialization
 * 4. Gateway creation            - BrainUserGateway initialization
 * 5. Request adapter             - Adapter configuration and merging
 * 6. Token binding               - Token function binding
 * 7. Options merging             - User options override defaults
 * 8. Type safety                 - Generic type parameters
 * 9. Edge cases                  - Null, undefined, partial options
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBrainUserOptions } from '../src/utils/createBrainUserOptions';
import { BrainUserServiceOptions } from '../src/BrainUserService';
import { BrainUserStore } from '../src/BrainUserStore';
import { BrainUserGateway } from '../src/BrainUserGateway';
import { defaultBrainUserOptions } from '../src/config/common';
import { RequestAdapterInterface } from '@qlover/fe-corekit';
import { SyncStorageInterface } from '@qlover/fe-corekit';

describe('createBrainUserOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should create options with no arguments', () => {
      const config = createBrainUserOptions();

      expect(config).toBeDefined();
      expect(config).toHaveProperty('serviceName');
      expect(config).toHaveProperty('gateway');
      expect(config).toHaveProperty('store');
    });

    it('should create options with empty object', () => {
      const config = createBrainUserOptions({});

      expect(config).toBeDefined();
      expect(config).toHaveProperty('serviceName');
      expect(config).toHaveProperty('gateway');
      expect(config).toHaveProperty('store');
    });

    it('should return UserServiceConfig structure', () => {
      const config = createBrainUserOptions();

      expect(config).toHaveProperty('serviceName');
      expect(config).toHaveProperty('executor');
      expect(config).toHaveProperty('gateway');
      expect(config).toHaveProperty('store');
      expect(config).toHaveProperty('logger');
    });
  });

  describe('default values', () => {
    it('should use default serviceName', () => {
      const config = createBrainUserOptions();

      expect(config.serviceName).toBe(defaultBrainUserOptions.serviceName);
    });

    it('should have executor property', () => {
      const config = createBrainUserOptions();

      // Executor is optional in defaultBrainUserOptions and may be undefined
      expect('executor' in config).toBe(true);
    });

    it('should have logger property', () => {
      const config = createBrainUserOptions();

      // Logger is optional in defaultBrainUserOptions and may be undefined
      expect('logger' in config).toBe(true);
    });

    it('should create default gateway when not provided', () => {
      const config = createBrainUserOptions();

      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
    });

    it('should create default store when not provided', () => {
      const config = createBrainUserOptions();

      expect(config.store).toBeInstanceOf(BrainUserStore);
    });
  });

  describe('custom options', () => {
    it('should use custom serviceName', () => {
      const config = createBrainUserOptions({
        serviceName: 'custom-service'
      });

      expect(config.serviceName).toBe('custom-service');
    });

    it('should use custom executor', () => {
      const customExecutor = vi.fn() as any;
      const config = createBrainUserOptions({
        executor: customExecutor
      });

      expect(config.executor).toBe(customExecutor);
    });

    it('should use custom logger', () => {
      const customLogger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        addAppender: vi.fn(),
        context: {}
      } as any;
      const config = createBrainUserOptions({
        logger: customLogger
      });

      expect(config.logger).toBe(customLogger);
    });

    it('should use custom gateway', () => {
      const customGateway = {} as BrainUserGateway;
      const config = createBrainUserOptions({
        gateway: customGateway
      });

      expect(config.gateway).toBe(customGateway);
    });

    it('should use custom store options', () => {
      const config = createBrainUserOptions({
        store: {
          persistUserInfo: true
        }
      });

      expect(config.store).toBeInstanceOf(BrainUserStore);
    });
  });

  describe('store creation', () => {
    it('should create store with default options', () => {
      const config = createBrainUserOptions();

      expect(config.store).toBeInstanceOf(BrainUserStore);
      expect(config.store.getToken()).toBe('');
    });

    it('should create store with custom storage', () => {
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
        public setItem<T>(key: string, value: T): void {
          this.store.set(key, String(value));
        }
        /**
         * @override
         */
        public getItem<T>(key: string): T | null {
          const value = this.store.get(key);
          return value !== undefined ? (value as T) : null;
        }
        /**
         * @override
         */
        public removeItem(key: string): void {
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

      const config = createBrainUserOptions({
        store: {
          storage: new MockStorage(),
          persistUserInfo: true
        }
      });

      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should create store with custom keys', () => {
      const config = createBrainUserOptions({
        store: {
          storageKey: 'custom_profile',
          credentialStorageKey: 'custom_token'
        }
      });

      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should support store with feature tags', () => {
      const _tags = ['disable_gen_UI', 'test'] as const;
      const config = createBrainUserOptions<typeof _tags>({
        store: {
          persistUserInfo: true
        }
      });

      expect(config.store).toBeInstanceOf(BrainUserStore);
      const featureTags = config.store.getFeatureTags();
      expect(featureTags).toBeDefined();
    });
  });

  describe('gateway creation', () => {
    it('should create gateway when not provided', () => {
      const config = createBrainUserOptions();

      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
    });

    it('should use provided gateway', () => {
      const customGateway = {} as BrainUserGateway;
      const config = createBrainUserOptions({
        gateway: customGateway
      });

      expect(config.gateway).toBe(customGateway);
    });

    it('should create gateway with default API', () => {
      const config = createBrainUserOptions({
        env: 'development'
      });

      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
    });
  });

  describe('request adapter', () => {
    it('should handle undefined requestAdapter', () => {
      const config = createBrainUserOptions({
        requestAdapter: undefined
      });

      expect(config).toBeDefined();
      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
    });

    it('should merge config into requestAdapter', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter,
        env: 'production'
      });

      expect(_config).toBeDefined();
      expect(mockAdapter.config.env).toBe('production');
    });

    it('should bind token getter to store', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter
      });

      expect(mockAdapter.config.token).toBeDefined();
      expect(typeof mockAdapter.config.token).toBe('function');
    });

    it('should preserve custom token if provided', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const customToken = 'custom-token';
      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter,
        token: customToken
      });

      expect(mockAdapter.config.token).toBe(customToken);
    });
  });

  describe('options merging', () => {
    it('should merge user options with defaults', () => {
      const config = createBrainUserOptions({
        serviceName: 'custom-service',
        env: 'production'
      });

      expect(config.serviceName).toBe('custom-service');
      // Other defaults should still be present
      expect(config.store).toBeDefined();
      expect(config.gateway).toBeDefined();
    });

    it('should override default values', () => {
      const customExecutor = vi.fn() as any;
      const config = createBrainUserOptions({
        executor: customExecutor
      });

      expect(config.executor).toBe(customExecutor);
    });

    it('should preserve all custom options', () => {
      const customLogger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        addAppender: vi.fn(),
        context: {}
      } as any;
      const customExecutor = vi.fn() as any;

      const config = createBrainUserOptions({
        serviceName: 'test-service',
        executor: customExecutor,
        logger: customLogger
      });

      expect(config.serviceName).toBe('test-service');
      expect(config.executor).toBe(customExecutor);
      expect(config.logger).toBe(customLogger);
    });
  });

  describe('type safety', () => {
    it('should support generic type parameter', () => {
      const _tags = ['disable_gen_UI', 'test'] as const;
      const config = createBrainUserOptions<typeof _tags>({});

      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should infer type from options', () => {
      const options: BrainUserServiceOptions<readonly string[]> = {
        serviceName: 'test-service'
      };

      const config = createBrainUserOptions(options);
      expect(config).toBeDefined();
    });

    it('should support different tag types', () => {
      type Tags1 = readonly ['tag1', 'tag2'];
      type Tags2 = readonly ['tag3', 'tag4'];

      const config1 = createBrainUserOptions<Tags1>({});
      const config2 = createBrainUserOptions<Tags2>({});

      expect(config1.store).toBeInstanceOf(BrainUserStore);
      expect(config2.store).toBeInstanceOf(BrainUserStore);
    });
  });

  describe('integration scenarios', () => {
    it('should create complete service configuration', () => {
      const config = createBrainUserOptions({
        serviceName: 'Brain-user',
        env: 'production',
        store: {
          persistUserInfo: true,
          credentialStorageKey: 'auth_token'
        }
      });

      expect(config.serviceName).toBe('Brain-user');
      expect(config.store).toBeInstanceOf(BrainUserStore);
      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
    });

    it('should support multi-environment setup', () => {
      const createEnvConfig = (env: 'development' | 'production') => {
        return createBrainUserOptions({
          env,
          serviceName: `Brain-${env}`,
          store: {
            persistUserInfo: env === 'production'
          }
        });
      };

      const devConfig = createEnvConfig('development');
      const prodConfig = createEnvConfig('production');

      expect(devConfig.serviceName).toBe('Brain-development');
      expect(prodConfig.serviceName).toBe('Brain-production');
    });

    it('should support custom gateway with custom store', () => {
      const customGateway = {} as BrainUserGateway;
      const config = createBrainUserOptions({
        gateway: customGateway,
        store: {
          persistUserInfo: true
        }
      });

      expect(config.gateway).toBe(customGateway);
      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should support factory pattern', () => {
      const createConfig = (persistent: boolean) => {
        return createBrainUserOptions({
          store: {
            persistUserInfo: persistent
          }
        });
      };

      const persistentConfig = createConfig(true);
      const sessionConfig = createConfig(false);

      expect(persistentConfig.store).toBeInstanceOf(BrainUserStore);
      expect(sessionConfig.store).toBeInstanceOf(BrainUserStore);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support minimal configuration', () => {
      const config = createBrainUserOptions({
        env: 'production'
      });

      expect(config).toBeDefined();
      expect(config.store).toBeInstanceOf(BrainUserStore);
      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
    });

    it('should support full configuration', () => {
      const customLogger = {
        log: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
        fatal: vi.fn(),
        trace: vi.fn(),
        addAppender: vi.fn(),
        context: {}
      } as any;
      const customExecutor = vi.fn() as any;
      const customGateway = {} as BrainUserGateway;

      const config = createBrainUserOptions({
        serviceName: 'custom-service',
        env: 'production',
        executor: customExecutor,
        logger: customLogger,
        gateway: customGateway,
        store: {
          persistUserInfo: true,
          credentialStorageKey: 'custom_token'
        }
      });

      expect(config.serviceName).toBe('custom-service');
      expect(config.executor).toBe(customExecutor);
      expect(config.logger).toBe(customLogger);
      expect(config.gateway).toBe(customGateway);
      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should support configuration with request adapter', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter,
        env: 'production',
        domains: {
          development: 'http://localhost:3000',
          production: 'https://api.example.com'
        }
      });

      expect(_config).toBeDefined();
      expect(mockAdapter.config.env).toBe('production');
      expect(mockAdapter.config.domains).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle undefined options', () => {
      const config = createBrainUserOptions(undefined);

      expect(config).toBeDefined();
      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should handle empty store options', () => {
      const config = createBrainUserOptions({
        store: {}
      });

      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should handle null gateway with custom store', () => {
      const config = createBrainUserOptions({
        gateway: undefined,
        store: {}
      });

      expect(config.gateway).toBeInstanceOf(BrainUserGateway);
      expect(config.store).toBeInstanceOf(BrainUserStore);
    });

    it('should handle partial options', () => {
      const config = createBrainUserOptions({
        serviceName: 'test'
      });

      expect(config.serviceName).toBe('test');
      expect(config.store).toBeDefined();
      expect(config.gateway).toBeDefined();
    });

    it('should handle multiple calls with different options', () => {
      const config1 = createBrainUserOptions({ serviceName: 'service1' });
      const config2 = createBrainUserOptions({ serviceName: 'service2' });

      expect(config1.serviceName).toBe('service1');
      expect(config2.serviceName).toBe('service2');
      expect(config1.store).not.toBe(config2.store);
    });
  });

  describe('token binding', () => {
    it('should bind token getter to store when no token provided', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter
      });

      expect(mockAdapter.config.token).toBeDefined();
      expect(typeof mockAdapter.config.token).toBe('function');

      // Call the token function
      const token = (mockAdapter.config.token as () => string)();
      expect(typeof token).toBe('string');
    });

    it('should use provided token over store token', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const customToken = 'my-custom-token';
      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter,
        token: customToken
      });

      expect(mockAdapter.config.token).toBe(customToken);
    });

    it('should handle token as function', () => {
      const mockAdapter: RequestAdapterInterface<any> = {
        config: {},
        request: vi.fn(),
        getConfig: vi.fn(),
        setConfig: vi.fn()
      };

      const tokenFn = () => 'dynamic-token';
      const _config = createBrainUserOptions({
        requestAdapter: mockAdapter,
        token: tokenFn
      });

      expect(mockAdapter.config.token).toBe(tokenFn);
    });
  });

  describe('configuration immutability', () => {
    it('should create independent configurations', () => {
      const config1 = createBrainUserOptions({
        serviceName: 'service1'
      });
      const config2 = createBrainUserOptions({
        serviceName: 'service2'
      });

      expect(config1.serviceName).toBe('service1');
      expect(config2.serviceName).toBe('service2');
      expect(config1).not.toBe(config2);
    });

    it('should not share store instances', () => {
      const config1 = createBrainUserOptions({});
      const config2 = createBrainUserOptions({});

      expect(config1.store).not.toBe(config2.store);
    });

    it('should not share gateway instances when not provided', () => {
      const config1 = createBrainUserOptions({});
      const config2 = createBrainUserOptions({});

      expect(config1.gateway).not.toBe(config2.gateway);
    });
  });
});
