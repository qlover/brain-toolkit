/**
 * BrainUserService test-suite
 *
 * Coverage:
 * 1. Constructor              - Service initialization with options
 * 2. loginWithGoogle          - Google login integration
 * 3. register                 - User registration integration
 * 4. getUserInfo              - Get user info integration
 * 5. refreshUserInfo          - Refresh user info integration
 * 6. Store integration        - Working with BrainUserStore
 * 7. Gateway integration      - Working with BrainUserGateway
 * 8. Type safety              - Generic type parameters
 * 9. Configuration           - Service options handling
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BrainUserService } from '../src/BrainUserService';
import type { BrainUserServiceOptions } from '../src/BrainUserService';
import type { BrainUserStoreInterface } from '../src/interface/BrainUserStoreInterface';

describe('BrainUserService', () => {
  let defaultOptions: BrainUserServiceOptions<readonly string[]>;

  beforeEach(() => {
    defaultOptions = {
      env: 'development'
    };
  });

  describe('constructor', () => {
    it('should create service instance with minimal options', () => {
      const service = new BrainUserService(defaultOptions);

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should create service with custom serviceName', () => {
      const service = new BrainUserService({
        ...defaultOptions,
        serviceName: 'custom-user-service'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should create service with custom store options', () => {
      const service = new BrainUserService({
        ...defaultOptions,
        store: {
          persistUserInfo: true,
          credentialStorageKey: 'custom_token'
        }
      });

      expect(service).toBeInstanceOf(BrainUserService);
      expect(service.getStore()).toBeDefined();
    });

    it('should create service with custom environment', () => {
      const service = new BrainUserService({
        env: 'production'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should initialize store property', () => {
      const service = new BrainUserService(defaultOptions);

      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;
      expect(store).toBeDefined();
      expect(typeof store.getToken).toBe('function');
    });
  });

  describe('loginWithGoogle', () => {
    it('should have loginWithGoogle method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.loginWithGoogle).toBe('function');
    });

    it('should return promise', async () => {
      const service = new BrainUserService(defaultOptions);

      const result = service.loginWithGoogle({
        authorization_code: 'google-token'
      });

      expect(result).toBeInstanceOf(Promise);

      // Catch the rejection to prevent unhandled error
      await result.catch(() => {
        // Expected to fail in test environment
      });
    });
  });

  describe('register', () => {
    it('should have register method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.register).toBe('function');
    });

    it('should return promise', async () => {
      const service = new BrainUserService(defaultOptions);

      const result = service.register({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeInstanceOf(Promise);

      // Catch the rejection to prevent unhandled error
      await result.catch(() => {
        // Expected to fail in test environment
      });
    });
  });

  describe('getUserInfo', () => {
    it('should have getUserInfo method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.getUserInfo).toBe('function');
    });

    it('should return promise', async () => {
      const service = new BrainUserService(defaultOptions);

      const result = service.getUserInfo();

      expect(result).toBeInstanceOf(Promise);

      // Catch the rejection to prevent unhandled error
      await result.catch(() => {
        // Expected to fail in test environment
      });
    });

    it('should accept optional params', async () => {
      const service = new BrainUserService(defaultOptions);

      const result = service.getUserInfo({ token: 'auth-token' });

      expect(result).toBeInstanceOf(Promise);

      // Catch the rejection to prevent unhandled error
      await result.catch(() => {
        // Expected to fail in test environment
      });
    });
  });

  describe('refreshUserInfo', () => {
    it('should have refreshUserInfo method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.refreshUserInfo).toBe('function');
    });

    it('should return promise', async () => {
      const service = new BrainUserService(defaultOptions);

      const result = service.refreshUserInfo();

      expect(result).toBeInstanceOf(Promise);

      // Catch the rejection to prevent unhandled error
      await result.catch(() => {
        // Expected to fail in test environment
      });
    });

    it('should accept optional params', async () => {
      const service = new BrainUserService(defaultOptions);

      const result = service.refreshUserInfo({ token: 'auth-token' });

      expect(result).toBeInstanceOf(Promise);

      // Catch the rejection to prevent unhandled error
      await result.catch(() => {
        // Expected to fail in test environment
      });
    });
  });

  describe('store integration', () => {
    it('should provide access to store', () => {
      const service = new BrainUserService(defaultOptions);

      expect(service.getStore()).toBeDefined();
    });

    it('should allow setting credentials in store', () => {
      const service = new BrainUserService(defaultOptions);
      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;

      store.setCredential({ token: 'test-token' });

      expect(store.getToken()).toBe('test-token');
    });

    it('should allow accessing feature tags', () => {
      const service = new BrainUserService(defaultOptions);
      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;

      const featureTags = store.getFeatureTags();

      expect(featureTags).toBeDefined();
      expect(typeof featureTags.getFeatureTags).toBe('function');
    });

    it('should allow accessing user profile', () => {
      const service = new BrainUserService(defaultOptions);
      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;

      const userProfile = store.getUserProfile();

      expect(userProfile).toBeDefined();
      expect(typeof userProfile.getProfile).toBe('function');
    });

    it('should persist store state across operations', () => {
      const service = new BrainUserService(defaultOptions);
      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;

      store.setCredential({ token: 'persistent-token' });
      const token1 = store.getToken();

      // Simulate some operations
      const token2 = store.getToken();

      expect(token1).toBe(token2);
      expect(token2).toBe('persistent-token');
    });
  });

  describe('type safety', () => {
    it('should support generic type parameter', () => {
      type Tags = ['disable_gen_UI', 'test'];
      const service = new BrainUserService<Tags>({
        env: 'development'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should infer type from options', () => {
      type Tags = readonly ['tag1', 'tag2'];
      const options: BrainUserServiceOptions<Tags> = {
        env: 'production'
      };

      const service = new BrainUserService<Tags>(options);

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should support custom config type', () => {
      interface CustomConfig
        extends BrainUserServiceOptions<readonly string[]> {
        customField?: string;
      }

      const service = new BrainUserService<readonly string[], CustomConfig>({
        env: 'development',
        customField: 'custom-value'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });
  });

  describe('configuration options', () => {
    it('should support minimal configuration', () => {
      const service = new BrainUserService({
        env: 'development'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should support full configuration', () => {
      const service = new BrainUserService({
        env: 'production',
        serviceName: 'Brain-user-service',
        store: {
          persistUserInfo: true,
          credentialStorageKey: 'auth_token',
          storageKey: 'user_profile'
        },
        timeout: 30000,
        headers: {
          'X-Custom-Header': 'value'
        }
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should support custom domains', () => {
      const service = new BrainUserService({
        env: 'staging',
        domains: {
          development: 'https://dev-api.example.com',
          staging: 'https://staging-api.example.com',
          production: 'https://api.example.com'
        }
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should support custom baseURL', () => {
      const service = new BrainUserService({
        baseURL: 'https://custom-api.example.com'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });
  });

  describe('integration scenarios', () => {
    it('should support multiple service instances', () => {
      const service1 = new BrainUserService({
        env: 'development',
        serviceName: 'service1'
      });

      const service2 = new BrainUserService({
        env: 'production',
        serviceName: 'service2'
      });

      expect(service1).not.toBe(service2);
      expect(service1.getStore()).not.toBe(service2.getStore());
    });

    it('should support feature tag checking', () => {
      const service = new BrainUserService(defaultOptions);
      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;

      const featureTags = store.getFeatureTags();
      const tags = featureTags.getFeatureTags();

      expect(Array.isArray(tags)).toBe(true);
    });

    it('should support user profile management', () => {
      const service = new BrainUserService(defaultOptions);
      const store = service.getStore() as unknown as BrainUserStoreInterface<
        readonly string[]
      >;

      const userProfile = store.getUserProfile();
      const profile = userProfile.getProfile();

      expect(typeof profile).toBe('object');
    });
  });

  describe('real-world usage patterns', () => {
    it('should support production environment setup', () => {
      const service = new BrainUserService({
        env: 'production',
        store: {
          persistUserInfo: true,
          credentialStorageKey: 'Brain_token'
        }
      });

      expect(service).toBeInstanceOf(BrainUserService);
      expect(service.getStore()).toBeDefined();
    });

    it('should support development environment setup', () => {
      const service = new BrainUserService({
        env: 'development',
        store: {
          persistUserInfo: false
        }
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should support custom authentication headers', () => {
      const service = new BrainUserService({
        env: 'production',
        authKey: 'X-Auth-Token',
        tokenPrefix: 'Bearer'
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });

    it('should support session-based storage', () => {
      const service = new BrainUserService({
        env: 'production',
        store: {
          persistUserInfo: true
        }
      });

      expect(service).toBeInstanceOf(BrainUserService);
    });
  });

  describe('edge cases', () => {
    it('should handle empty options', () => {
      const service = new BrainUserService({});

      expect(service).toBeInstanceOf(BrainUserService);
    });
  });

  describe('inherited methods', () => {
    it('should have execute method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.execute).toBe('function');
    });

    it('should have getStore method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.getStore).toBe('function');
    });

    it('should have getGateway method', () => {
      const service = new BrainUserService(defaultOptions);

      expect(typeof service.getGateway).toBe('function');
    });
  });
});
