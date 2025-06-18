import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  type ImagicaAuthServiceConfig,
  type LoginWithGoogleRequest,
  type LoginResponseData,
  ImagicaAuthApi,
  ImagicaAuthService
} from '../../src/imagica-auth';

/**
 * ImagicaAuthService test suite
 *
 * Significance: Test authentication service functionality
 * Core idea: Comprehensive testing of service layer
 * Main function: Validate service initialization and methods
 * Main purpose: Ensure service reliability and storage handling
 *
 * @example
 * ```typescript
 * const service = new ImagicaAuthService({
 *   service: new ImagicaAuthApi({ env: 'development' })
 * });
 * await service.loginWithGoogle({ id_token: 'token' });
 * ```
 */
describe('ImagicaAuthService', () => {
  let mockApi: ImagicaAuthApi;
  let service: ImagicaAuthService<ImagicaAuthServiceConfig>;
  let originalWindow: typeof window;
  let originalLocalStorage: Storage;
  let originalSessionStorage: Storage;

  beforeEach(() => {
    // Save original globals
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;
    originalSessionStorage = global.sessionStorage;

    // Mock API
    mockApi = {
      loginWithGoogle: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      getUserInfo: vi.fn(),
      logout: vi.fn()
    } as unknown as ImagicaAuthApi;

    // Mock window and storage
    global.window = {
      localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      },
      sessionStorage: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    // Restore original globals
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    global.sessionStorage = originalSessionStorage;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      service = new ImagicaAuthService({
        service: mockApi
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
      expect(service.service).toBe(mockApi);
    });

    it('should use default storage key', () => {
      service = new ImagicaAuthService({
        service: mockApi
      });

      // The storageToken should be created with default key
      expect(service.options.storageToken).toBeDefined();
    });

    it('should use custom storage key', () => {
      const customKey = 'custom-auth-token';
      service = new ImagicaAuthService({
        service: mockApi,
        storageKey: customKey
      });

      expect(service.options.storageToken).toBeDefined();
    });

    it('should use custom expires in', () => {
      service = new ImagicaAuthService({
        service: mockApi,
        expiresIn: 'week'
      });

      expect(service.options.storageToken).toBeDefined();
    });

    it('should use provided storageToken', () => {
      const customStorageToken = {
        getToken: vi.fn(),
        setToken: vi.fn(),
        removeToken: vi.fn(),
        hasToken: vi.fn()
      };

      service = new ImagicaAuthService({
        service: mockApi,
        storageToken: customStorageToken
      });

      expect(service.options.storageToken).toBe(customStorageToken);
    });

    it('should use custom storage interface', () => {
      const customStorage = {
        getToken: vi.fn(),
        setToken: vi.fn(),
        removeToken: vi.fn(),
        hasToken: vi.fn()
      };

      service = new ImagicaAuthService({
        service: mockApi,
        storage: customStorage
      });

      expect(service.options.storageToken).toBeDefined();
    });
  });

  describe('storage configuration', () => {
    it('should handle cookie storage', () => {
      service = new ImagicaAuthService({
        service: mockApi,
        storage: 'cookie'
      });

      expect(service.options.storageToken).toBeDefined();
    });

    it('should handle localStorage', () => {
      service = new ImagicaAuthService({
        service: mockApi,
        storage: 'localStorage'
      });

      expect(service.options.storageToken).toBeDefined();
    });

    it('should handle sessionStorage', () => {
      service = new ImagicaAuthService({
        service: mockApi,
        storage: 'sessionStorage'
      });

      expect(service.options.storageToken).toBeDefined();
    });

    it('should handle memory storage (undefined)', () => {
      service = new ImagicaAuthService({
        service: mockApi,
        storage: 'memory'
      });

      expect(service.options.storageToken).toBeDefined();
    });

    it('should throw error for localStorage when window is undefined', () => {
      delete (global as { window?: unknown }).window;

      expect(() => {
        service = new ImagicaAuthService({
          service: mockApi,
          storage: 'localStorage'
        });
      }).toThrow('localStorage is not supported');
    });

    it('should throw error for sessionStorage when window is undefined', () => {
      delete (global as { window?: unknown }).window;

      expect(() => {
        service = new ImagicaAuthService({
          service: mockApi,
          storage: 'sessionStorage'
        });
      }).toThrow('sessionStorage is not supported');
    });

    it('should use custom storage maps', () => {
      const customStorageMaps = {
        custom: () => ({
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          length: 0,
          clear: vi.fn()
        })
      };

      service = new ImagicaAuthService({
        service: mockApi,
        storage: 'custom',
        storageMaps: customStorageMaps
      });

      expect(service).toBeInstanceOf(ImagicaAuthService);
    });

    it('should handle unknown storage type gracefully', () => {
      service = new ImagicaAuthService({
        service: mockApi,
        storage: 'unknown'
      });

      expect(service.options.storageToken).toBeDefined();
    });
  });

  describe('loginWithGoogle', () => {
    beforeEach(() => {
      service = new ImagicaAuthService({
        service: mockApi
      });
    });

    it('should call API loginWithGoogle method', async () => {
      const mockResponse: LoginResponseData = { token: 'google-token' };
      const requestData: LoginWithGoogleRequest = {
        authorization_code: 'auth-code',
        id_token: 'id-token'
      };

      (mockApi.loginWithGoogle as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse
      );

      const result = await service.loginWithGoogle(requestData);

      expect(mockApi.loginWithGoogle).toHaveBeenCalledWith(requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle Google login with authorization_code only', async () => {
      const mockResponse: LoginResponseData = { token: 'google-token' };
      const requestData: LoginWithGoogleRequest = {
        authorization_code: 'auth-code'
      };

      (mockApi.loginWithGoogle as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse
      );

      const result = await service.loginWithGoogle(requestData);

      expect(mockApi.loginWithGoogle).toHaveBeenCalledWith(requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle Google login with id_token only', async () => {
      const mockResponse: LoginResponseData = { token: 'google-token' };
      const requestData: LoginWithGoogleRequest = {
        id_token: 'id-token'
      };

      (mockApi.loginWithGoogle as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockResponse
      );

      const result = await service.loginWithGoogle(requestData);

      expect(mockApi.loginWithGoogle).toHaveBeenCalledWith(requestData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const error = new Error('Google login failed');
      (mockApi.loginWithGoogle as ReturnType<typeof vi.fn>).mockRejectedValue(
        error
      );

      const requestData: LoginWithGoogleRequest = {
        id_token: 'invalid-token'
      };

      await expect(service.loginWithGoogle(requestData)).rejects.toThrow(
        'Google login failed'
      );
    });
  });

  describe('service getter', () => {
    beforeEach(() => {
      service = new ImagicaAuthService({
        service: mockApi
      });
    });

    it('should return the API service instance', () => {
      expect(service.service).toBe(mockApi);
    });

    it('should maintain service reference after configuration', () => {
      const anotherApi = {
        loginWithGoogle: vi.fn()
      } as unknown as ImagicaAuthApi;

      const anotherService = new ImagicaAuthService({
        service: anotherApi
      });

      expect(service.service).toBe(mockApi);
      expect(anotherService.service).toBe(anotherApi);
    });
  });

  describe('inheritance from UserAuthService', () => {
    beforeEach(() => {
      service = new ImagicaAuthService({
        service: mockApi
      });
    });

    it('should inherit UserAuthService properties', () => {
      expect(service.options).toBeDefined();
      expect(service.options.service).toBe(mockApi);
    });

    it('should pass configuration to parent class', () => {
      const config: ImagicaAuthServiceConfig = {
        service: mockApi,
        storageKey: 'test-key',
        expiresIn: 'day'
      };

      const testService = new ImagicaAuthService(config);
      expect(testService.options.storageToken).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle configuration errors gracefully', () => {
      expect(() => {
        service = new ImagicaAuthService({
          service: mockApi,
          storage: 'invalid' as 'cookie'
        });
      }).not.toThrow();
    });

    it('should handle missing service', () => {
      expect(() => {
        service = new ImagicaAuthService({
          service: undefined as unknown as ImagicaAuthApi
        });
      }).not.toThrow();
    });
  });

  describe('complex configurations', () => {
    it('should handle full configuration', () => {
      const fullConfig: ImagicaAuthServiceConfig = {
        service: mockApi,
        storageKey: 'full-test-token',
        expiresIn: 'month',
        storageToken: 'localStorage',
        storageMaps: {
          localStorage: () => ({
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            length: 0,
            clear: vi.fn()
          })
        }
      };

      service = new ImagicaAuthService(fullConfig);

      expect(service.service).toBe(mockApi);
      expect(service).toBeInstanceOf(ImagicaAuthService);
    });

    it('should prioritize storageToken over storage configuration', () => {
      const customStorageToken = {
        getToken: vi.fn(),
        setToken: vi.fn(),
        removeToken: vi.fn(),
        hasToken: vi.fn()
      };

      service = new ImagicaAuthService({
        service: mockApi,
        storageToken: customStorageToken,
        storage: 'localStorage'
      });

      expect(service.options.storageToken).toBe(customStorageToken);
    });

    it('should handle API configuration inheritance', () => {
      const apiConfig = {
        env: 'development',
        baseURL: 'https://test-api.example.com'
      };

      const serviceConfig: ImagicaAuthServiceConfig = {
        service: mockApi,
        ...apiConfig
      };

      service = new ImagicaAuthService(serviceConfig);

      expect(service.options.service).toBe(mockApi);
    });
  });
});
