/**
 * BrainUserApi test-suite
 *
 * Coverage:
 * 1. Constructor              - API initialization with adapter
 * 2. getAdapter               - Adapter retrieval
 * 3. createConfig             - Request configuration creation
 * 4. loginWithGoogle          - Google login API call
 * 5. register                 - User registration API call
 * 6. login                    - User login API call
 * 7. logout                   - User logout API call
 * 8. getUserInfo              - Get user info API call
 * 9. Type safety              - Generic type parameters
 * 10. Integration             - Working with RequestAdapter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrainUserApi, type BrainUserApiConfig } from '../src/BrainUserApi';
import type { RequestAdapterInterface } from '@qlover/fe-corekit';
import { GATEWAY_BRAIN_USER_ENDPOINTS } from '../src/config/EndPoints';

describe('BrainUserApi', () => {
  let mockAdapter: RequestAdapterInterface<any>;

  beforeEach(() => {
    mockAdapter = {
      config: {},
      request: vi.fn().mockResolvedValue({ data: {} }),
      getConfig: vi.fn(),
      setConfig: vi.fn()
    };
  });

  describe('constructor', () => {
    it('should create API instance with adapter', () => {
      const api = new BrainUserApi(mockAdapter);

      expect(api).toBeInstanceOf(BrainUserApi);
    });

    it('should store adapter reference', () => {
      const api = new BrainUserApi(mockAdapter);

      expect(api.getAdapter()).toBe(mockAdapter);
    });
  });

  describe('getAdapter', () => {
    it('should return the adapter instance', () => {
      const api = new BrainUserApi(mockAdapter);

      expect(api.getAdapter()).toBe(mockAdapter);
    });

    it('should return same instance on multiple calls', () => {
      const api = new BrainUserApi(mockAdapter);

      const adapter1 = api.getAdapter();
      const adapter2 = api.getAdapter();

      expect(adapter1).toBe(adapter2);
    });
  });

  describe('loginWithGoogle', () => {
    it('should call adapter.request with correct config', async () => {
      const api = new BrainUserApi(mockAdapter);
      const params = { authorization_code: 'google-token-123' };

      await api.loginWithGoogle(params);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle,
          data: params
        })
      );
    });

    it('should return response from adapter', async () => {
      const expectedResponse = {
        data: {
          token: 'Brain-token'
        }
      };
      mockAdapter.request = vi.fn().mockResolvedValue(expectedResponse);

      const api = new BrainUserApi(mockAdapter);
      const result = await api.loginWithGoogle({
        authorization_code: 'google-token'
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should handle request failure', async () => {
      const error = new Error('Network error');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const api = new BrainUserApi(mockAdapter);

      await expect(
        api.loginWithGoogle({ authorization_code: 'google-token' })
      ).rejects.toThrow('Network error');
    });
  });

  describe('register', () => {
    it('should call adapter.request with correct config', async () => {
      const api = new BrainUserApi(mockAdapter);
      const params = {
        email: 'user@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      };

      await api.register(params);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.register,
          data: params
        })
      );
    });

    it('should return user data from response', async () => {
      const expectedResponse = {
        data: {
          email: 'user@example.com',
          name: 'Test User',
          id: 1
        }
      };
      mockAdapter.request = vi.fn().mockResolvedValue(expectedResponse);

      const api = new BrainUserApi(mockAdapter);
      const result = await api.register({
        email: 'user@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should handle registration failure', async () => {
      const error = new Error('Email already exists');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const api = new BrainUserApi(mockAdapter);

      await expect(
        api.register({
          email: 'user@example.com',
          password: 'pass',
          first_name: 'Test',
          last_name: 'User'
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should call adapter.request with correct config', async () => {
      const api = new BrainUserApi(mockAdapter);
      const params = {
        email: 'user@example.com',
        password: 'password123'
      };

      await api.login(params);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.login,
          data: params
        })
      );
    });

    it('should return credentials from response', async () => {
      const expectedResponse = {
        data: {
          token: 'auth-token-xyz'
        }
      };
      mockAdapter.request = vi.fn().mockResolvedValue(expectedResponse);

      const api = new BrainUserApi(mockAdapter);
      const result = await api.login({
        email: 'user@example.com',
        password: 'password123'
      });

      expect(result).toEqual(expectedResponse);
    });

    it('should handle login failure', async () => {
      const error = new Error('Invalid credentials');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const api = new BrainUserApi(mockAdapter);

      await expect(
        api.login({ email: 'user@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call adapter.request with correct config', async () => {
      const api = new BrainUserApi(mockAdapter);

      await api.logout();

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.logout,
          method: 'POST',
          url: '/api/users/signout'
        })
      );
    });

    it('should return void', async () => {
      const api = new BrainUserApi(mockAdapter);
      const result = await api.logout();

      expect(result).toBeUndefined();
    });

    it('should handle logout failure', async () => {
      const error = new Error('Logout failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const api = new BrainUserApi(mockAdapter);

      await expect(api.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('getUserInfo', () => {
    it('should call adapter.request with correct config', async () => {
      const api = new BrainUserApi(mockAdapter);
      const params = { token: 'auth-token' };

      await api.getUserInfo(params);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo,
          method: 'GET',
          url: '/api/users/me.json',
          token: 'auth-token'
        })
      );
    });

    it('should return user info from response', async () => {
      const expectedResponse = {
        data: {
          email: 'user@example.com',
          name: 'Test User',
          id: 1
        }
      };
      mockAdapter.request = vi.fn().mockResolvedValue(expectedResponse);

      const api = new BrainUserApi(mockAdapter);
      const result = await api.getUserInfo({ token: 'auth-token' });

      expect(result).toEqual(expectedResponse);
    });

    it('should handle getUserInfo failure', async () => {
      const error = new Error('User not found');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const api = new BrainUserApi(mockAdapter);

      await expect(api.getUserInfo({})).rejects.toThrow('User not found');
    });
  });

  describe('type safety', () => {
    it('should support generic config type', () => {
      interface CustomConfig {
        customField: string;
      }

      const customAdapter = {
        ...mockAdapter,
        config: { customField: 'value' }
      } as RequestAdapterInterface<CustomConfig>;

      const api = new BrainUserApi<CustomConfig>(customAdapter);

      expect(api).toBeInstanceOf(BrainUserApi);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete authentication flow', async () => {
      const api = new BrainUserApi(mockAdapter);

      mockAdapter.request = vi
        .fn()
        .mockResolvedValueOnce({ data: { token: 'google-token' } })
        .mockResolvedValueOnce({ data: { email: 'user@example.com' } })
        .mockResolvedValueOnce({});

      // Login with Google
      await api.loginWithGoogle({ authorization_code: 'google-oauth-token' });

      // Get user info
      await api.getUserInfo({});

      // Logout
      await api.logout();

      expect(mockAdapter.request).toHaveBeenCalledTimes(3);
    });

    it('should support registration flow', async () => {
      const api = new BrainUserApi(mockAdapter);

      mockAdapter.request = vi
        .fn()
        .mockResolvedValueOnce({
          data: { email: 'new@example.com', token: 'new-token' }
        })
        .mockResolvedValueOnce({
          data: { email: 'new@example.com', name: 'New User' }
        });

      // Register
      await api.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      // Get user info
      await api.getUserInfo({});

      expect(mockAdapter.request).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple concurrent requests', async () => {
      const api = new BrainUserApi(mockAdapter);

      mockAdapter.request = vi.fn().mockResolvedValue({ data: {} });

      await Promise.all([
        api.getUserInfo({}),
        api.getUserInfo({}),
        api.getUserInfo({})
      ]);

      expect(mockAdapter.request).toHaveBeenCalledTimes(3);
    });
  });

  describe('real-world usage patterns', () => {
    it('should support Google OAuth flow', async () => {
      const api = new BrainUserApi(mockAdapter);

      const googleToken = 'google-oauth-token-xyz';
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: {
          token: 'Brain-token',
          user: { email: 'user@gmail.com' }
        }
      });

      const result = await api.loginWithGoogle({
        authorization_code: googleToken
      });

      expect(result.data.token).toBe('Brain-token');
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { authorization_code: googleToken }
        })
      );
    });

    it('should support email/password login', async () => {
      const api = new BrainUserApi(mockAdapter);

      mockAdapter.request = vi.fn().mockResolvedValue({
        data: { token: 'auth-token-123' }
      });

      const result = await api.login({
        email: 'user@example.com',
        password: 'securePassword123'
      });

      expect(result.data.token).toBe('auth-token-123');
    });

    it('should support user registration with profile', async () => {
      const api = new BrainUserApi(mockAdapter);

      mockAdapter.request = vi.fn().mockResolvedValue({
        data: {
          email: 'newuser@example.com',
          name: 'New User',
          id: 1
        }
      });

      const result = await api.register({
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result.data.email).toBe('newuser@example.com');
      expect(result.data.name).toBe('New User');
    });
  });

  describe('edge cases', () => {
    it('should handle empty response data', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ data: null });

      const api = new BrainUserApi(mockAdapter);
      const result = await api.getUserInfo({});

      expect(result.data).toBeNull();
    });

    it('should handle network timeout', async () => {
      const error = new Error('Request timeout');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const api = new BrainUserApi(mockAdapter);

      await expect(
        api.login({ email: 'test', password: 'test' })
      ).rejects.toThrow('Request timeout');
    });

    it('should handle malformed response', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ invalid: 'response' });

      const api = new BrainUserApi(mockAdapter);
      const result = await api.getUserInfo({});

      expect(result).toEqual({ invalid: 'response' });
    });

    it('should handle multiple logout calls', async () => {
      const api = new BrainUserApi(mockAdapter);

      await api.logout();
      await api.logout();
      await api.logout();

      expect(mockAdapter.request).toHaveBeenCalledTimes(3);
    });
  });

  describe('request configuration', () => {
    it('should include requestId in config', async () => {
      const api = new BrainUserApi(mockAdapter);

      await api.login({ email: 'test', password: 'test' });

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.login
        })
      );
    });

    it('should include method and url from endpoint', async () => {
      const api = new BrainUserApi(mockAdapter);

      await api.register({
        email: 'test',
        password: 'test',
        first_name: 'Test',
        last_name: 'User'
      });

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: expect.any(String),
          url: expect.any(String)
        })
      );
    });

    it('should pass data parameter correctly', async () => {
      const api = new BrainUserApi(mockAdapter);
      const testData = { email: 'test@example.com', password: 'pass123' };

      await api.login(testData);

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          data: testData
        })
      );
    });
  });

  describe('custom endpoints', () => {
    it('should use custom endpoints when provided', async () => {
      const customEndpoints = {
        login: 'POST /api/v2/auth/token.json',
        getUserInfo: 'GET /api/v2/users/profile.json'
      };

      const adapterWithCustomEndpoints: RequestAdapterInterface<
        BrainUserApiConfig<unknown>
      > = {
        ...mockAdapter,
        config: {
          ...mockAdapter.config,
          endpoints: customEndpoints
        }
      } as RequestAdapterInterface<BrainUserApiConfig<unknown>>;

      const api = new BrainUserApi(adapterWithCustomEndpoints);

      await api.login({ email: 'test', password: 'test' });

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.login,
          method: 'POST',
          url: '/api/v2/auth/token.json'
        })
      );
    });

    it('should merge custom endpoints with default endpoints', async () => {
      const customEndpoints = {
        login: 'POST /api/v2/auth/token.json'
      };

      const adapterWithCustomEndpoints: RequestAdapterInterface<
        BrainUserApiConfig<unknown>
      > = {
        ...mockAdapter,
        config: {
          ...mockAdapter.config,
          endpoints: customEndpoints
        }
      } as RequestAdapterInterface<BrainUserApiConfig<unknown>>;

      const api = new BrainUserApi(adapterWithCustomEndpoints);

      // Custom endpoint should be used
      await api.login({ email: 'test', password: 'test' });
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.login
        })
      );

      // Default endpoint should be used for other methods
      await api.register({
        email: 'test',
        password: 'test',
        first_name: 'Test',
        last_name: 'User'
      });
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.register
        })
      );
    });

    it('should use custom endpoints for all API methods', async () => {
      const customEndpoints = {
        login: 'POST /api/v2/auth/token.json',
        register: 'POST /api/v2/users/signup.json',
        getUserInfo: 'GET /api/v2/users/profile.json',
        loginWithGoogle: 'POST /api/v2/auth/google/token',
        logout: 'POST /api/v2/users/signout'
      };

      const adapterWithCustomEndpoints: RequestAdapterInterface<
        BrainUserApiConfig<unknown>
      > = {
        ...mockAdapter,
        config: {
          ...mockAdapter.config,
          endpoints: customEndpoints
        }
      } as RequestAdapterInterface<BrainUserApiConfig<unknown>>;

      const api = new BrainUserApi(adapterWithCustomEndpoints);

      // Test login
      await api.login({ email: 'test', password: 'test' });
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.login,
          method: 'POST',
          url: '/api/v2/auth/token.json'
        })
      );

      // Test register
      await api.register({
        email: 'test',
        password: 'test',
        first_name: 'Test',
        last_name: 'User'
      });
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.register,
          method: 'POST',
          url: '/api/v2/users/signup.json'
        })
      );

      // Test getUserInfo
      await api.getUserInfo({});
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.getUserInfo,
          method: 'GET',
          url: '/api/v2/users/profile.json'
        })
      );

      // Test loginWithGoogle
      await api.loginWithGoogle({ authorization_code: 'token' });
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.loginWithGoogle,
          method: 'POST',
          url: '/api/v2/auth/google/token'
        })
      );

      // Test logout
      await api.logout();
      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: customEndpoints.logout,
          method: 'POST',
          url: '/api/v2/users/signout'
        })
      );
    });

    it('should use default endpoints when custom endpoints not provided', async () => {
      const api = new BrainUserApi(mockAdapter);

      await api.login({ email: 'test', password: 'test' });

      expect(mockAdapter.request).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.login
        })
      );
    });
  });
});
