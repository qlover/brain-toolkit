/**
 * ImagicaAuthService test-suite
 *
 * Coverage:
 * 1. constructor       – Constructor parameter validation and initialization
 * 2. store             – Store getter functionality
 * 3. use               – Plugin usage functionality
 * 4. reset             – State reset functionality
 * 5. getState          – State retrieval functionality
 * 6. loginWithGoogle   – Google authentication functionality
 * 7. login             – Email/password authentication functionality
 * 8. edge cases        – Boundary conditions and error scenarios
 * 9. integration       – Cross-module collaboration tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ImagicaAuthService,
  type ImagicaAuthServiceConfig
} from '../../src/imagica-auth/ImagicaAuthService';
import {
  ImagicaAuthApi,
  UserInfoResponseData
} from '../../src/imagica-auth/ImagicaAuthApi';
import { ImagicaAuthState } from '../../src/imagica-auth/ImagicaAuthState';
import type { ExecutorPlugin } from '@qlover/fe-corekit';
import {
  defaultDomains,
  defaultRequestConfig
} from '../../src/imagica-auth/consts';
import {
  LoginResponseData,
  UserAuthApiInterface,
  UserAuthStoreInterface
} from '@qlover/corekit-bridge';

class CustomApi<User> implements UserAuthApiInterface<User> {
  /**
   * @override
   */
  public getStore(): UserAuthStoreInterface<User> | null {
    return {} as UserAuthStoreInterface<User>;
  }
  /**
   * @override
   */
  public setStore(_store: UserAuthStoreInterface<User>): void {}
  /**
   * @override
   */
  public login(_params: unknown): Promise<LoginResponseData> {
    return Promise.resolve({} as LoginResponseData);
  }
  /**
   * @override
   */
  public register(_params: unknown): Promise<LoginResponseData> {
    return Promise.resolve({} as LoginResponseData);
  }
  /**
   * @override
   */
  public logout(): Promise<void> {
    return Promise.resolve();
  }
  /**
   * @override
   */
  public getUserInfo(_params?: unknown): Promise<User> {
    return Promise.resolve({} as User);
  }
}

describe('ImagicaAuthService', () => {
  // Test data and Mock objects
  let service: ImagicaAuthService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  // Test data constants
  const VALID_CONFIG: ImagicaAuthServiceConfig = {
    requestConfig: {
      env: 'development',
      domains: {
        development: 'https://api-dev.braininc.net',
        production: 'https://api.braininc.net'
      }
    }
  };

  const VALID_LOGIN_REQUEST = {
    email: 'test@example.com',
    password: 'password123'
  };

  const DEFAULT_REQUEST_CONFIG = defaultRequestConfig();

  const VALID_GOOGLE_LOGIN_REQUEST = {
    authorization_code: 'auth_code_123',
    id_token: 'id_token_123'
  };

  const MOCK_LOGIN_RESPONSE = {
    token: 'mock_token_123'
  };

  const MOCK_USER_INFO: UserInfoResponseData = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    profile: {
      permissions: ['read', 'write'],
      email_verified: true
    },
    feature_tags: ['feature1', 'feature2'],
    roles: ['user'],
    auth_token: {
      key: 'mock_token_123'
    }
  };

  // Setup and cleanup
  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();

    // Clean up service state if it exists
    if (service) {
      service.reset();
    }
  });

  // Constructor tests
  describe('constructor', () => {
    it('should create instance with empty config', () => {
      service = new ImagicaAuthService();

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
      expect(service.store).toBeDefined();
      expect(service.getState()).toBeInstanceOf(ImagicaAuthState);
    });

    it('should replace request api', () => {
      service = new ImagicaAuthService({
        api: new CustomApi()
      });

      const customApi: UserAuthApiInterface<UserInfoResponseData> = {
        getStore: () => null,
        setStore: () => {},
        login: () => Promise.resolve({}),
        register: () => Promise.resolve({}),
        logout: () => Promise.resolve(),
        getUserInfo: () => Promise.resolve({} as UserInfoResponseData)
      };
      const service2 = new ImagicaAuthService({
        api: customApi
      });

      expect(service.api).toBeInstanceOf(CustomApi);
      expect(service2.api).toBe(customApi);
    });

    it('should use correct environment, default is production', () => {
      const serviceDefault = new ImagicaAuthService();
      const env = 'development';
      service = new ImagicaAuthService({ requestConfig: { env } });

      const defaultSerficeConfig = serviceDefault.api.getConfig();
      expect(defaultSerficeConfig.baseURL).toBe(defaultDomains.production);
      expect(defaultSerficeConfig.tokenPrefix).toBe(
        DEFAULT_REQUEST_CONFIG.tokenPrefix
      );
      expect(defaultSerficeConfig.authKey).toBe(DEFAULT_REQUEST_CONFIG.authKey);
      expect(defaultSerficeConfig.responseType).toBe(
        DEFAULT_REQUEST_CONFIG.responseType
      );

      const serviceConfig = service.api.getConfig();
      expect(serviceConfig.baseURL).toBe(defaultDomains[env]);
      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should use custom domains', () => {
      const domains = {
        development: 'https://dev.example.com',
        production: 'https://prod.example.com',
        staging: 'https://staging.example.com'
      };
      const service = new ImagicaAuthService({ requestConfig: { domains } });
      const service2 = new ImagicaAuthService({
        requestConfig: { domains, env: 'staging' }
      });

      expect(service.api.getConfig().baseURL).toBe(domains.production);
      expect(service2.api.getConfig().baseURL).toBe(domains.staging);
    });

    it('should create instance with full requestConfig', () => {
      const fullRequestConfig = {
        env: 'production',
        domains: {
          development: 'https://dev.example.com',
          production: 'https://prod.example.com'
        },
        tokenPrefix: 'Bearer',
        authKey: 'X-Auth-Token',
        responseType: 'json' as const,
        timeout: 10000,
        baseURL: 'https://api.example.com',
        defaultHeaders: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test'
        },
        requestDataSerializer: (data: any) => JSON.stringify(data)
      };

      service = new ImagicaAuthService({
        requestConfig: fullRequestConfig
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should create instance with custom api', () => {
      const customApi = new ImagicaAuthApi({
        env: 'development',
        domains: { development: 'https://custom.example.com' }
      });

      service = new ImagicaAuthService({
        api: customApi
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBe(customApi);
    });

    it('should create instance with userStorage disabled', () => {
      service = new ImagicaAuthService({
        userStorage: false
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.store).toBeDefined();
    });

    it('should create instance with userStorage enabled', () => {
      const mockStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      service = new ImagicaAuthService({
        userStorage: {
          key: 'test-user',
          storage: mockStorage as any
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.store).toBeDefined();
    });

    it('should create instance with credentialStorage configuration', () => {
      const mockStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      service = new ImagicaAuthService({
        credentialStorage: {
          key: 'custom-token',
          expires: ['day', 7],
          storage: mockStorage as any
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.store).toBeDefined();
    });

    it('should create instance with custom href', () => {
      service = new ImagicaAuthService({
        href: 'https://custom.example.com/auth'
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.store).toBeDefined();
    });

    it('should create instance with custom tokenKey', () => {
      service = new ImagicaAuthService({
        tokenKey: 'custom-token-key'
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.store).toBeDefined();
    });

    it('should create instance with custom store configuration', () => {
      const customState = new ImagicaAuthState();
      customState.userInfo = MOCK_USER_INFO;

      service = new ImagicaAuthService({
        store: {
          defaultState: () => customState
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.getState().userInfo).toEqual(MOCK_USER_INFO);
    });

    it('should create instance with all configuration options', () => {
      const mockStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      const customApi = new ImagicaAuthApi({
        env: 'development'
      });

      const fullConfig: ImagicaAuthServiceConfig = {
        // Custom API
        api: customApi,

        // Request configuration
        requestConfig: {
          env: 'development',
          domains: {
            development: 'https://dev.example.com',
            production: 'https://prod.example.com'
          },
          tokenPrefix: 'Bearer',
          authKey: 'X-Auth-Token',
          responseType: 'json',
          timeout: 15000,
          baseURL: 'https://api.example.com',
          defaultHeaders: {
            'Content-Type': 'application/json',
            'X-Custom-Header': 'full-config'
          }
        },

        // User storage configuration
        userStorage: {
          key: 'full-config-user',
          storage: mockStorage as any
        },

        // Credential storage configuration
        credentialStorage: {
          key: 'full-config-token',
          expires: ['hour', 24],
          storage: mockStorage as any
        },

        // URL configuration
        href: 'https://full-config.example.com',
        tokenKey: 'full-config-token-key',

        // Store configuration
        store: {
          defaultState: () => new ImagicaAuthState()
        }
      };

      service = new ImagicaAuthService(fullConfig);

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBe(customApi);
      expect(service.store).toBeDefined();
      expect(service.getState()).toBeInstanceOf(ImagicaAuthState);
    });

    it('should handle partial requestConfig merging', () => {
      service = new ImagicaAuthService({
        requestConfig: {
          env: 'development',
          timeout: 5000
          // Other properties should use defaults
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should handle requestConfig with custom fetcher', () => {
      const customFetcher = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ success: true })));

      service = new ImagicaAuthService({
        requestConfig: {
          env: 'development',
          fetcher: customFetcher
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should handle requestConfig with custom domains only', () => {
      service = new ImagicaAuthService({
        requestConfig: {
          domains: {
            development: 'https://custom-dev.example.com',
            production: 'https://custom-prod.example.com',
            staging: 'https://staging.example.com'
          }
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should handle requestConfig with custom serializer', () => {
      const customSerializer = vi.fn(
        (data: any) => `custom:${JSON.stringify(data)}`
      );

      service = new ImagicaAuthService({
        requestConfig: {
          env: 'development',
          requestDataSerializer: customSerializer
        }
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should handle storage configuration with different expires formats', () => {
      const mockStorage = {
        setItem: vi.fn(),
        getItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      // Test with different time units
      const configs = [
        { expires: ['second', 30] },
        { expires: ['minute', 15] },
        { expires: ['hour', 2] },
        { expires: ['day', 1] },
        { expires: ['week', 1] },
        { expires: ['month', 1] },
        { expires: ['year', 1] }
      ];

      configs.forEach((config, index) => {
        service = new ImagicaAuthService({
          credentialStorage: {
            key: `test-token-${index}`,
            expires: config.expires as any,
            storage: mockStorage as any
          }
        });

        expect(service).toBeInstanceOf(ImagicaAuthService);
      });
    });

    it('should create instance with valid parameters', () => {
      service = new ImagicaAuthService(VALID_CONFIG);

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.api).toBeInstanceOf(ImagicaAuthApi);
      expect(service.store).toBeDefined();
    });

    it('should merge request config correctly', () => {
      const customConfig = {
        requestConfig: {
          env: 'production',
          timeout: 5000
        }
      };

      service = new ImagicaAuthService(customConfig);

      expect(service).toBeInstanceOf(ImagicaAuthService);
    });
  });

  // Store getter tests
  describe('store', () => {
    beforeEach(() => {
      service = new ImagicaAuthService(VALID_CONFIG);
    });

    it('should return store instance', () => {
      const store = service.store;
      expect(store).toBeDefined();
      expect(store.state).toBeInstanceOf(ImagicaAuthState);
      expect(store.state.getUserMe).toBeDefined();
    });

    it('should return same store instance on multiple calls', () => {
      const store1 = service.store;
      const store2 = service.store;

      expect(store1).toBe(store2);
    });
  });

  // Plugin usage tests
  describe('use', () => {
    let mockPlugin: ExecutorPlugin;

    beforeEach(() => {
      service = new ImagicaAuthService(VALID_CONFIG);
      mockPlugin = {
        pluginName: 'test-plugin',
        onBefore: vi.fn()
      } as ExecutorPlugin;

      // Mock the api.usePlugin method
      vi.spyOn(service.api, 'usePlugin').mockImplementation(vi.fn());
    });

    it('should call api.usePlugin with provided plugin', () => {
      const result = service.use(mockPlugin);

      expect(service.api.usePlugin).toHaveBeenCalledWith(mockPlugin);
      expect(result).toBe(service); // Should return this for chaining
    });

    it('should support method chaining', () => {
      const result = service.use(mockPlugin).use(mockPlugin);

      expect(result).toBe(service);
      expect(service.api.usePlugin).toHaveBeenCalledTimes(2);
    });
  });

  // Reset functionality tests
  describe('reset', () => {
    beforeEach(() => {
      service = new ImagicaAuthService(VALID_CONFIG);
    });

    it('should reset store state', () => {
      // Mock store reset method
      const resetSpy = vi
        .spyOn(service.store, 'reset')
        .mockImplementation(vi.fn());

      service.reset();

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should clear user state after reset', () => {
      // Set some state first
      service.store.state.userInfo = MOCK_USER_INFO;

      service.reset();

      expect(service.store.state.userInfo).toBeNull();
    });
  });

  // State retrieval tests
  describe('getState', () => {
    beforeEach(() => {
      service = new ImagicaAuthService(VALID_CONFIG);
    });

    it('should return current state', () => {
      const state = service.getState();

      expect(state).toBeInstanceOf(ImagicaAuthState);
      expect(state).toBe(service.store.state);
    });

    it('should return updated state after changes', () => {
      service.store.state.userInfo = MOCK_USER_INFO;

      const state = service.getState();

      expect(state.userInfo).toEqual(MOCK_USER_INFO);
    });
  });

  // Google login tests
  describe('loginWithGoogle', () => {
    beforeEach(() => {
      service = new ImagicaAuthService({
        requestConfig: {
          env: 'development',
          fetcher: fetchMock
        }
      });
    });

    it('should handle successful Google login', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
      );

      const result = await service.loginWithGoogle(VALID_GOOGLE_LOGIN_REQUEST);

      expect(result).toEqual(MOCK_LOGIN_RESPONSE);
      expect(fetchMock).toHaveBeenCalledWith(expect.any(Request));

      // Verify the request details
      const call = fetchMock.mock.calls[0];
      const request = call[0] as Request;
      expect(request.url).toContain('/api/auth/google/imagica/token');
      expect(request.method).toBe('POST');
    });

    it('should handle Google login with authorization_code', async () => {
      const requestWithAuthCode = {
        authorization_code: 'auth_code_123'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
      );

      const result = await service.loginWithGoogle(requestWithAuthCode);

      expect(result).toEqual(MOCK_LOGIN_RESPONSE);
    });

    it('should handle Google login with id_token', async () => {
      const requestWithIdToken = {
        id_token: 'id_token_123'
      };

      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
      );

      const result = await service.loginWithGoogle(requestWithIdToken);

      expect(result).toEqual(MOCK_LOGIN_RESPONSE);
    });

    it('should handle Google login API failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.loginWithGoogle(VALID_GOOGLE_LOGIN_REQUEST)
      ).rejects.toThrow('Network error');
    });
  });

  // Email/password login tests (inherited from parent class)
  describe('login', () => {
    beforeEach(() => {
      service = new ImagicaAuthService({
        requestConfig: {
          env: 'development',
          fetcher: fetchMock
        }
      });
    });

    it('should handle successful email/password login', async () => {
      // Mock login response
      fetchMock.mockImplementation((request: Request | string) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
          );
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(new Response(JSON.stringify(MOCK_USER_INFO)));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const result = await service.login(VALID_LOGIN_REQUEST);

      expect(result).toBeDefined();
      expect(fetchMock).toHaveBeenCalledWith(expect.any(Request));
    });

    it('should update state after successful login', async () => {
      fetchMock.mockImplementation((request: Request | string) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
          );
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(new Response(JSON.stringify(MOCK_USER_INFO)));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      await service.login(VALID_LOGIN_REQUEST);
      const state = service.getState();

      expect(state.userInfo).toEqual(MOCK_USER_INFO);
    });

    it('should handle login API failure', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Authentication failed'));

      await expect(service.login(VALID_LOGIN_REQUEST)).rejects.toThrow(
        'Authentication failed'
      );
    });
  });

  // Edge cases and error handling
  describe('edge cases', () => {
    it('should handle null/undefined config gracefully', () => {
      expect(() => new ImagicaAuthService(null as any)).toThrow();
    });

    it('should handle empty login request', async () => {
      service = new ImagicaAuthService({
        requestConfig: { fetcher: fetchMock }
      });

      fetchMock.mockRejectedValueOnce(new Error('Invalid request'));

      await expect(
        service.login({} as Parameters<typeof service.login>[0])
      ).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      service = new ImagicaAuthService({
        requestConfig: { fetcher: fetchMock }
      });

      fetchMock.mockResolvedValueOnce(new Response('invalid json'));

      await expect(
        service.loginWithGoogle(VALID_GOOGLE_LOGIN_REQUEST)
      ).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      service = new ImagicaAuthService({
        requestConfig: {
          fetcher: fetchMock,
          timeout: 100
        }
      });

      fetchMock.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      );

      await expect(
        service.loginWithGoogle(VALID_GOOGLE_LOGIN_REQUEST)
      ).rejects.toThrow();
    });
  });

  // Integration tests
  describe('integration tests', () => {
    beforeEach(() => {
      service = new ImagicaAuthService({
        requestConfig: {
          env: 'development',
          fetcher: fetchMock
        }
      });
    });

    it('should maintain state consistency across operations', async () => {
      // Mock successful login
      fetchMock.mockImplementation((request: Request | string) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
          );
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(new Response(JSON.stringify(MOCK_USER_INFO)));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      // Login and check state
      await service.login(VALID_LOGIN_REQUEST);
      expect(service.getState().userInfo).toEqual(MOCK_USER_INFO);

      // Reset and verify state is cleared
      service.reset();
      expect(service.getState().userInfo).toBeNull();
    });

    it('should work with plugin ecosystem', () => {
      const mockPlugin: ExecutorPlugin = {
        pluginName: 'test-plugin',
        onBefore: vi.fn()
      };

      vi.spyOn(service.api, 'usePlugin').mockImplementation(vi.fn());

      service.use(mockPlugin);

      expect(service.api.usePlugin).toHaveBeenCalledWith(mockPlugin);
    });

    it('should handle multiple concurrent login attempts', async () => {
      fetchMock.mockImplementation((request: Request | string) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/google/imagica/token')) {
          return Promise.resolve(
            new Response(JSON.stringify(MOCK_LOGIN_RESPONSE))
          );
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const promises = [
        service.loginWithGoogle(VALID_GOOGLE_LOGIN_REQUEST),
        service.loginWithGoogle({
          ...VALID_GOOGLE_LOGIN_REQUEST,
          id_token: 'different_token'
        })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(MOCK_LOGIN_RESPONSE);
      expect(results[1]).toEqual(MOCK_LOGIN_RESPONSE);
    });
  });

  // State-specific functionality tests
  describe('ImagicaAuthState integration', () => {
    beforeEach(() => {
      service = new ImagicaAuthService(VALID_CONFIG);
      service.store.state.userInfo = MOCK_USER_INFO;
    });

    it('should support feature checking through state', () => {
      const state = service.getState();

      expect(state.hasFeature('feature1')).toBe(true);
      expect(state.hasFeature('nonexistent')).toBe(false);
    });

    it('should support permission checking through state', () => {
      const state = service.getState();

      expect(state.hasPermission('read')).toBe(true);
      expect(state.hasPermission('admin')).toBe(false);
    });

    it('should return user info through getUserMe', () => {
      const state = service.getState();

      expect(state.getUserMe()).toEqual(MOCK_USER_INFO);
    });
  });
});
