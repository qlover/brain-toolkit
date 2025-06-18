import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ImagicaAuthApi,
  type LoginRequest,
  type LoginResponseData,
  type RegisterRequest,
  type LoginWithGoogleRequest,
  type UserInfoResponseData
} from '../../src/imagica-auth';

/**
 * ImagicaAuthApi test suite
 *
 * Significance: Test authentication API functionality
 * Core idea: Comprehensive testing of all API methods
 * Main function: Validate API requests and responses
 * Main purpose: Ensure API reliability and correctness
 *
 * @example
 * ```typescript
 * const api = new ImagicaAuthApi({ env: 'development' });
 * await api.login({ email: 'test@example.com', password: 'password' });
 * ```
 */
describe('ImagicaAuthApi', () => {
  let api: ImagicaAuthApi;
  let mockFetch: ReturnType<typeof vi.fn>;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original NODE_ENV
    originalEnv = process.env.NODE_ENV;

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;

    // Create API instance with test config
    api = new ImagicaAuthApi({
      env: 'development',
      fetcher: mockFetch
    });
  });

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalEnv !== undefined) {
      process.env.NODE_ENV = originalEnv;
    } else {
      delete process.env.NODE_ENV;
    }

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const testApi = new ImagicaAuthApi({});
      expect(testApi).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should use development domain for development env', () => {
      process.env.NODE_ENV = 'development';
      const testApi = new ImagicaAuthApi({});
      expect(testApi['config'].baseURL).toBe('https://api-dev.braininc.net');
    });

    it('should use production domain for production env', () => {
      process.env.NODE_ENV = 'production';
      const testApi = new ImagicaAuthApi({});
      expect(testApi['config'].baseURL).toBe('https://api.braininc.net');
    });

    it('should use custom baseURL when provided', () => {
      const customBaseURL = 'https://custom-api.example.com';
      const testApi = new ImagicaAuthApi({ baseURL: customBaseURL });
      expect(testApi['config'].baseURL).toBe(customBaseURL);
    });

    it('should use custom fetcher when provided', () => {
      const customFetcher = vi.fn();
      const testApi = new ImagicaAuthApi({ fetcher: customFetcher });
      expect(testApi['config'].fetcher).toBe(customFetcher);
    });

    it('should use window.fetch when available', () => {
      const windowFetch = vi.fn();
      const originalWindow = global.window;
      global.window = { fetch: windowFetch } as unknown as Window &
        typeof globalThis;

      const testApi = new ImagicaAuthApi({});
      expect(testApi['config'].fetcher).toBe(windowFetch);

      if (originalWindow) {
        global.window = originalWindow;
      } else {
        delete (global as { window?: unknown }).window;
      }
    });

    it('should set default headers', () => {
      const testApi = new ImagicaAuthApi({});
      expect(testApi['config'].headers).toEqual({
        'Content-Type': 'application/json'
      });
    });
  });

  describe('request', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.request({
        url: '/test',
        method: 'GET'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/test',
        expect.objectContaining({
          method: 'GET',
          body: undefined,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request with data', async () => {
      const mockResponse = { success: true };
      const requestData = { test: 'data' };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.request({
        url: '/test',
        method: 'POST',
        data: requestData
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when fetcher is not set', () => {
      // Mock environment without fetch
      const originalWindow = global.window;
      const originalGlobalFetch = global.fetch;
      const originalGlobalThisFetch = globalThis.fetch;

      // Remove all fetch references
      delete (global as { window?: unknown }).window;
      delete (global as { fetch?: unknown }).fetch;
      delete (globalThis as { fetch?: unknown }).fetch;

      try {
        const testApi = new ImagicaAuthApi({
          fetcher: undefined as unknown as typeof globalThis.fetch
        });

        expect(() => testApi.request({ url: '/test' })).toThrow(
          'fetcher is not set'
        );
      } finally {
        // Restore original values
        if (originalWindow) {
          global.window = originalWindow;
        }
        if (originalGlobalFetch) {
          global.fetch = originalGlobalFetch;
        }
        if (originalGlobalThisFetch) {
          globalThis.fetch = originalGlobalThisFetch;
        }
      }
    });

    it('should handle request with custom baseURL', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      await api.request({
        url: '/test',
        baseURL: 'https://custom.example.com'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.example.com/test',
        expect.any(Object)
      );
    });
  });

  describe('loginWithGoogle', () => {
    it('should call login with Google API endpoint', async () => {
      const mockResponse: LoginResponseData = { token: 'google-token' };
      const requestData: LoginWithGoogleRequest = {
        authorization_code: 'auth-code',
        id_token: 'id-token'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.loginWithGoogle(requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/google/imagica/token',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle Google login with authorization_code only', async () => {
      const mockResponse: LoginResponseData = { token: 'google-token' };
      const requestData: LoginWithGoogleRequest = {
        authorization_code: 'auth-code'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.loginWithGoogle(requestData);

      expect(result).toEqual(mockResponse);
    });

    it('should handle Google login with id_token only', async () => {
      const mockResponse: LoginResponseData = { token: 'google-token' };
      const requestData: LoginWithGoogleRequest = {
        id_token: 'id-token'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.loginWithGoogle(requestData);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('register', () => {
    it('should call register API endpoint', async () => {
      const mockResponse: LoginResponseData = { token: 'register-token' };
      const requestData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.register(requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/token.json',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle register with optional fields', async () => {
      const mockResponse: LoginResponseData = { token: 'register-token' };
      const requestData: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        profile: {
          phone_number: '+1234567890',
          da_email: 'da@example.com'
        },
        otp: '123456',
        metadata: { source: 'web' },
        roles: ['user']
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.register(requestData);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should call login API endpoint', async () => {
      const mockResponse: LoginResponseData = { token: 'login-token' };
      const requestData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.login(requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/token.json',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle login with metadata', async () => {
      const mockResponse: LoginResponseData = { token: 'login-token' };
      const requestData: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
        metadata: { device: 'mobile' }
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.login(requestData);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserInfo', () => {
    it('should call getUserInfo API endpoint', async () => {
      const mockResponse: UserInfoResponseData = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        roles: ['user']
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.getUserInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/me.json',
        expect.objectContaining({
          method: 'GET',
          body: undefined
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle getUserInfo with complete user data', async () => {
      const mockResponse: UserInfoResponseData = {
        id: 1,
        email: 'test@example.com',
        name: 'John Doe',
        first_name: 'John',
        middle_name: 'M',
        last_name: 'Doe',
        profile: {
          phone_number: '+1234567890',
          da_email: 'da@example.com',
          profile_img_url: 'https://example.com/avatar.jpg',
          email_verified: true,
          permissions: []
        },
        auth_token: {
          key: 'auth-key'
        },
        is_guest: false,
        is_superuser: false,
        is_active: true,
        roles: ['user', 'admin'],
        created_at: '2023-01-01T00:00:00Z',
        referral_enabled: true,
        tags: ['tag1', 'tag2'],
        feature_tags: ['feature1'],
        is_supernatural: false,
        is_decentralized: false
      };

      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await api.getUserInfo();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should throw not implemented error', () => {
      expect(() => api.logout()).toThrow('Method not implemented.');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(
        api.login({
          email: 'test@example.com',
          password: 'password'
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(
        api.login({
          email: 'test@example.com',
          password: 'password'
        })
      ).rejects.toThrow('Invalid JSON');
    });

    it('should handle HTTP error responses', async () => {
      const errorResponse = { error: 'Unauthorized' };
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve(errorResponse)
      });

      const result = await api.login({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });

      expect(result).toEqual(errorResponse);
    });
  });

  describe('configuration edge cases', () => {
    it('should handle empty baseURL', () => {
      const testApi = new ImagicaAuthApi({ baseURL: '' });
      expect(testApi['config'].baseURL).toBe('');
    });

    it('should handle undefined env', () => {
      delete process.env.NODE_ENV;
      const testApi = new ImagicaAuthApi({});
      expect(testApi['config'].baseURL).toBe('');
    });

    it('should handle unknown env', () => {
      const testApi = new ImagicaAuthApi({ env: 'unknown' });
      expect(testApi['config'].baseURL).toBeUndefined();
    });

    it('should merge custom headers with defaults', () => {
      const testApi = new ImagicaAuthApi({
        headers: {
          Authorization: 'Bearer token',
          'Custom-Header': 'value'
        }
      });

      expect(testApi['config'].headers).toEqual({
        Authorization: 'Bearer token',
        'Custom-Header': 'value'
      });
    });
  });
});
