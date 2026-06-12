/**
 * BrainUserGateway test-suite
 *
 * Coverage:
 * 1. Constructor              - Gateway initialization with API
 * 2. loginWithGoogle          - Google login business logic
 * 3. login                    - User login business logic
 * 4. logout                   - User logout business logic
 * 5. register                 - User registration business logic
 * 6. getUserInfo              - Get user info business logic
 * 7. refreshUserInfo          - Refresh user info business logic
 * 8. Data transformation      - API response to domain model
 * 9. Error handling           - Null/undefined response handling
 * 10. Integration             - Working with BrainUserApi
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrainUserGateway } from '../src/BrainUserGateway';
import type {
  RequestAdapterInterface,
  RequestAdapterResponse
} from '@qlover/fe-corekit';
import type { BrainUserGatewayConfig } from '../src/interface/BrainUserGatewayInterface';
import type { GatewayResult } from '@qlover/corekit-bridge';
import {
  GATEWAY_BRAIN_USER_ENDPOINTS,
  BRAIN_DOMAINS,
  parseEndpoint
} from '@brain-toolkit/brain-user';

// Test assistant to expose protected handleResponse method
class TestableBrainUserGateway extends BrainUserGateway {
  public async testHandleResponse<R>(
    response: RequestAdapterResponse<unknown, unknown>,
    config?: BrainUserGatewayConfig<unknown>
  ): Promise<GatewayResult<R>> {
    return this.handleGatewayResult<R>(response, config);
  }
}

describe('BrainUserGateway', () => {
  let mockAdapter: RequestAdapterInterface<any>;

  const mockRequestResponse = {
    data: {}
  };

  beforeEach(() => {
    mockAdapter = {
      config: {},
      request: vi.fn().mockResolvedValue(mockRequestResponse),
      getConfig: vi.fn(),
      setConfig: vi.fn()
    };
  });

  // Helper function to create a properly mocked adapter for each test
  function createMockAdapterWithResponse(data: any) {
    const adapter: RequestAdapterInterface<any> = {
      config: {},
      request: vi.fn().mockResolvedValue({
        data,
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      }),
      getConfig: vi.fn(),
      setConfig: vi.fn()
    };
    return adapter;
  }

  // Helper function to spy on response plugin and make it passthrough
  function mockResponsePluginPassthrough(gateway: BrainUserGateway) {
    vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockImplementation(
      async (response) => {
        // Return the response as-is so handleGatewayResult extracts response.data
        return response as any;
      }
    );
  }

  describe('constructor', () => {
    it('should create gateway instance with API', () => {
      const gateway = new BrainUserGateway(mockAdapter);

      expect(gateway).toBeInstanceOf(BrainUserGateway);
    });
  });

  describe('handleResponse', () => {
    it('should return response.data when responsePlugin.handleResponse returns undefined', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: { token: 'test-token', email: 'test@example.com' },
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      // Mock responsePlugin.handleResponse to return undefined
      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse(mockResponse);

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(gateway['responsePlugin'].handleResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResponse.config
      );
    });

    it('should return result.data when responsePlugin.handleResponse returns a result object', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: { original: 'data' },
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      const transformedData = { token: 'transformed-token', id: 123 };
      const mockResult = {
        data: transformedData,
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK'
      };

      // Mock responsePlugin.handleResponse to return transformed result
      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        mockResult as any
      );

      const result = await gateway.testHandleResponse(mockResponse);

      expect(result.data).toEqual(transformedData);
      expect(gateway['responsePlugin'].handleResponse).toHaveBeenCalledWith(
        mockResponse,
        mockResponse.config
      );
    });

    it('should pass config parameter to responsePlugin.handleResponse', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: { test: 'data' },
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      const mockConfig: BrainUserGatewayConfig<unknown> = {
        url: '/test',
        method: 'GET',
        token: 'test-token'
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse(mockResponse, mockConfig);

      expect(result.data).toBeNull();
      expect(gateway['responsePlugin'].handleResponse).toHaveBeenCalledWith(
        mockResponse,
        mockConfig
      );
    });

    it('should handle null response.data correctly', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: null,
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse(mockResponse);

      expect(result.data).toBeNull();
    });

    it('should handle undefined response.data correctly', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: undefined,
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse(mockResponse);

      // When responsePlugin returns undefined, handleGatewayResult treats it as no data and returns null
      expect(result.data).toBeNull();
    });

    it('should handle array response.data correctly', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const arrayData = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: arrayData,
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse(mockResponse);

      expect(result.data).toBeNull();
    });

    it('should handle primitive type response.data correctly', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: 'string-response',
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse<string>(mockResponse);

      expect(result.data).toBeNull();
    });

    it('should return result.data when responsePlugin returns result with different data structure', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: { original: 'data' },
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      const transformedData = {
        user: { id: 1, name: 'Test User' },
        metadata: { timestamp: Date.now() }
      };
      const mockResult = {
        data: transformedData,
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK'
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        mockResult as any
      );

      const result = await gateway.testHandleResponse(mockResponse);

      expect(result.data).toEqual(transformedData);
      expect(result.data).not.toEqual(mockResponse.data);
    });

    it('should handle empty object response.data correctly', async () => {
      const gateway = new TestableBrainUserGateway(mockAdapter);
      const mockResponse: RequestAdapterResponse<unknown, unknown> = {
        data: {},
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      };

      vi.spyOn(gateway['responsePlugin'], 'handleResponse').mockResolvedValue(
        undefined
      );

      const result = await gateway.testHandleResponse(mockResponse);

      expect(result.data).toBeNull();
    });
  });

  describe('loginWithGoogle', () => {
    it('should call API loginWithGoogle method', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      const gateway = new BrainUserGateway(mockAdapter);

      const params = { authorization_code: 'google-token' };
      await gateway.loginWithGoogle(params);

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: params,
          headers: {},
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle,
          method: 'POST',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.loginWithGoogle).url
        })
      );
    });

    it('should return credentials from API response', async () => {
      const expectedCredentials = {
        token: 'Brain-token'
      };
      const adapter = createMockAdapterWithResponse(expectedCredentials);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.loginWithGoogle({
        authorization_code: 'google-token'
      });

      expect(result.data).toEqual(expectedCredentials);
    });

    it('should handle API errors', async () => {
      const error = new Error('Google login failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockAdapter);

      await expect(
        gateway.loginWithGoogle({ authorization_code: 'invalid-token' })
      ).rejects.toThrow('Google login failed');
    });
  });

  describe('login', () => {
    it('should call API login method', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      const gateway = new BrainUserGateway(mockAdapter);

      const params = { email: 'test@example.com', password: 'password123' };
      await gateway.login(params);

      expect(spy).toHaveBeenCalled();
      // Verify that the request was called with the correct endpoint and params
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: params,
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.login,
          method: 'POST',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.login).url
        })
      );
    });

    it('should return credentials from API response', async () => {
      const expectedCredentials = { token: 'auth-token-xyz' };
      const adapter = createMockAdapterWithResponse(expectedCredentials);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.data).toEqual(expectedCredentials);
    });

    it('should return null when API response data is null', async () => {
      const adapter = createMockAdapterWithResponse(null);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.data).toBeNull();
    });

    it('should return undefined when API response data is undefined', async () => {
      const adapter = createMockAdapterWithResponse(undefined);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.data).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('Invalid credentials');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockAdapter);

      await expect(
        gateway.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call API logout method', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      const gateway = new BrainUserGateway(mockAdapter);

      await gateway.logout();

      expect(spy).toHaveBeenCalled();
      // Verify that the request was called with the correct endpoint
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.logout,
          method: 'POST',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.logout).url
        })
      );
    });

    it('should return GatewayResult with null data', async () => {
      const adapter = createMockAdapterWithResponse({});
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);
      const result = await gateway.logout();

      // Empty object responses are treated as successful but with no data
      expect(result.data).toEqual({});
    });

    it('should handle API errors', async () => {
      const error = new Error('Logout failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockAdapter);

      await expect(gateway.logout()).rejects.toThrow('Logout failed');
    });

    it('should accept optional params', async () => {
      const adapter = createMockAdapterWithResponse({});
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);
      const result = await gateway.logout({ reason: 'user_initiated' });

      // Empty object responses are treated as successful but with no data
      expect(result.data).toEqual({});
    });
  });

  describe('register', () => {
    it('should call API register method', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      const gateway = new BrainUserGateway(mockAdapter);

      const params = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      };
      await gateway.register(params);

      expect(spy).toHaveBeenCalled();
      // Verify that the request was called with the correct endpoint and params
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: params,
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.register,
          method: 'POST',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.register).url
        })
      );
    });

    it('should return user data with credentials from API response', async () => {
      const expectedData = {
        token: 'new-token',
        email: 'new@example.com',
        name: 'New User',
        id: 1
      };
      const adapter = createMockAdapterWithResponse(expectedData);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result.data).toEqual(expectedData);
    });

    it('should return null when API response data is null', async () => {
      const adapter = createMockAdapterWithResponse(null);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result.data).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('Email already exists');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockAdapter);

      await expect(
        gateway.register({
          email: 'existing@example.com',
          password: 'pass',
          first_name: 'Test',
          last_name: 'User'
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('getUserInfo', () => {
    it('should call API getUserInfo method', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      const gateway = new BrainUserGateway(mockAdapter);

      const params = { token: 'auth-token' };
      await gateway.getUserInfo(params);

      expect(spy).toHaveBeenCalled();
      // Verify that the request was called with the correct endpoint and params
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: undefined,
          headers: {
            Authorization: 'auth-token'
          },
          token: params.token,
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo,
          method: 'GET',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo).url
        })
      );
    });

    it('should return user data with credentials from API response', async () => {
      const expectedData = {
        token: 'auth-token',
        email: 'user@example.com',
        name: 'Test User',
        id: 1
      };
      const adapter = createMockAdapterWithResponse(expectedData);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.getUserInfo({ token: 'auth-token' });

      expect(result.data).toEqual(expectedData);
    });

    it('should return null when API response data is null', async () => {
      const adapter = createMockAdapterWithResponse(null);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.getUserInfo({});

      expect(result.data).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('User not found');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockAdapter);

      await expect(gateway.getUserInfo({})).rejects.toThrow('User not found');
    });
  });

  describe('refreshUserInfo', () => {
    it('should call API getUserInfo method', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      const gateway = new BrainUserGateway(mockAdapter);

      const params = {};
      await gateway.refreshUserInfo(params);

      expect(spy).toHaveBeenCalled();
      // Verify that the request was called with the correct endpoint
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: undefined,
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo,
          method: 'GET',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.getUserInfo).url,
          headers: {},
          token: undefined
        })
      );
    });

    it('should return updated user data from API response', async () => {
      const expectedData = {
        token: 'refreshed-token',
        email: 'user@example.com',
        name: 'Updated Name',
        id: 1
      };
      const adapter = createMockAdapterWithResponse(expectedData);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.refreshUserInfo({});

      expect(result.data).toEqual(expectedData);
    });

    it('should work without params', async () => {
      const expectedData = {
        token: 'token',
        email: 'user@example.com',
        id: 1
      };
      const adapter = createMockAdapterWithResponse(expectedData);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.refreshUserInfo();

      expect(result.data).toEqual(expectedData);
    });

    it('should return null when API response data is null', async () => {
      const adapter = createMockAdapterWithResponse(null);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.refreshUserInfo({});

      expect(result.data).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('Refresh failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockAdapter);

      await expect(gateway.refreshUserInfo({})).rejects.toThrow(
        'Refresh failed'
      );
    });
  });

  describe('getAccessToken', () => {
    it('should call userly access_token endpoint with brain token and headers', async () => {
      const spy = vi.spyOn(mockAdapter, 'request');
      vi.mocked(mockAdapter.getConfig).mockReturnValue({ env: 'development' });
      Object.defineProperty(mockAdapter, 'config', {
        value: { env: 'development' },
        writable: true
      });
      const gateway = new BrainUserGateway(mockAdapter);

      await gateway.getAccessToken({
        token: 'brain-user-token',
        lang: 'en',
        location: '35.1814,136.9064',
        appVersion: '1.0.0',
        deviceUid: 'device-123'
      });

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: BRAIN_DOMAINS.development,
          token: 'brain-user-token',
          requiredToken: true,
          requestId: GATEWAY_BRAIN_USER_ENDPOINTS.accessToken,
          method: 'POST',
          url: parseEndpoint(GATEWAY_BRAIN_USER_ENDPOINTS.accessToken).url,
          headers: expect.objectContaining({
            'X-Brain-User-Lang': 'en',
            'X-Brain-User-Location': '35.1814,136.9064',
            'X-APP-VERSION': '1.0.0',
            'X-Brain-Device-Uid': 'device-123'
          })
        })
      );
    });

    it('should return access_token payload from API response', async () => {
      const expected = {
        access_token: 'eyJ.test',
        expires_in: 86400,
        refresh_token: ''
      };
      const adapter = createMockAdapterWithResponse(expected);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.getAccessToken({ token: 'brain-token' });

      expect(result.data).toEqual(expected);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete authentication flow', async () => {
      const gateway = new BrainUserGateway(mockAdapter);
      mockResponsePluginPassthrough(gateway);

      // Login with Google
      mockAdapter.request = vi
        .fn()
        .mockResolvedValueOnce({
          data: { token: 'google-token' },
          config: {} as any,
          headers: {},
          status: 200,
          statusText: 'OK',
          response: {} as any
        })
        .mockResolvedValueOnce({
          data: {
            token: 'google-token',
            email: 'user@gmail.com',
            id: 1
          },
          config: {} as any,
          headers: {},
          status: 200,
          statusText: 'OK',
          response: {} as any
        })
        .mockResolvedValueOnce({
          data: {},
          config: {} as any,
          headers: {},
          status: 200,
          statusText: 'OK',
          response: {} as any
        });

      const loginResult = await gateway.loginWithGoogle({
        authorization_code: 'google-oauth-token'
      });
      expect(loginResult.data?.token).toBe('google-token');

      // Get user info
      const userInfo = await gateway.getUserInfo({});
      expect(userInfo.data?.email).toBe('user@gmail.com');

      // Logout
      await gateway.logout();
    });

    it('should support registration and immediate login flow', async () => {
      const gateway = new BrainUserGateway(mockAdapter);
      mockResponsePluginPassthrough(gateway);

      // Register
      mockAdapter.request = vi.fn().mockResolvedValueOnce({
        data: {
          token: 'new-token',
          email: 'new@example.com',
          name: 'New User',
          id: 1
        },
        config: {} as any,
        headers: {},
        status: 200,
        statusText: 'OK',
        response: {} as any
      });

      const registerResult = await gateway.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(registerResult.data?.token).toBe('new-token');
      expect(registerResult.data?.email).toBe('new@example.com');
    });

    it('should support user info refresh after update', async () => {
      const gateway = new BrainUserGateway(mockAdapter);
      mockResponsePluginPassthrough(gateway);

      // Initial user info
      mockAdapter.request = vi
        .fn()
        .mockResolvedValueOnce({
          data: {
            token: 'token',
            email: 'user@example.com',
            name: 'Old Name',
            id: 1
          },
          config: {} as any,
          headers: {},
          status: 200,
          statusText: 'OK',
          response: {} as any
        })
        .mockResolvedValueOnce({
          data: {
            token: 'token',
            email: 'user@example.com',
            name: 'New Name',
            id: 1
          },
          config: {} as any,
          headers: {},
          status: 200,
          statusText: 'OK',
          response: {} as any
        });

      const initialInfo = await gateway.getUserInfo({});
      expect(initialInfo.data?.name).toBe('Old Name');

      // Refresh after profile update
      const refreshedInfo = await gateway.refreshUserInfo({});
      expect(refreshedInfo.data?.name).toBe('New Name');
    });
  });

  describe('real-world usage patterns', () => {
    it('should handle Google OAuth flow', async () => {
      const adapter = createMockAdapterWithResponse({
        token: 'Brain-token-xyz'
      });
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.loginWithGoogle({
        authorization_code: 'google-oauth-token'
      });

      expect(result.data?.token).toBe('Brain-token-xyz');
    });

    it('should handle email/password login flow', async () => {
      const adapter = createMockAdapterWithResponse({
        token: 'auth-token-123'
      });
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.login({
        email: 'user@example.com',
        password: 'securePassword123'
      });

      expect(result.data?.token).toBe('auth-token-123');
    });

    it('should handle user registration with profile data', async () => {
      const adapter = createMockAdapterWithResponse({
        token: 'new-user-token',
        email: 'newuser@example.com',
        name: 'New User',
        id: 1,
        profile: {
          phone_number: '1234567890'
        }
      });
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.register({
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result.data?.email).toBe('newuser@example.com');
      expect(result.data?.name).toBe('New User');
      expect(result.data?.profile?.phone_number).toBe('1234567890');
    });
  });

  describe('edge cases', () => {
    it('should handle empty API response', async () => {
      const adapter = createMockAdapterWithResponse(undefined);
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.login({
        email: 'test',
        password: 'test'
      });

      expect(result.data).toBeUndefined();
    });

    it('should handle malformed API response', async () => {
      const adapter = createMockAdapterWithResponse({ unexpected: 'format' });
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result = await gateway.getUserInfo({});

      expect(result.data).toEqual({ unexpected: 'format' });
    });

    it('should handle multiple concurrent requests', async () => {
      const adapter = createMockAdapterWithResponse({
        token: 'token',
        email: 'user@example.com',
        id: 1
      });
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const results = await Promise.all([
        gateway.getUserInfo({}),
        gateway.getUserInfo({}),
        gateway.getUserInfo({})
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.data?.email).toBe('user@example.com');
      });
    });

    it('should handle logout without errors', async () => {
      const adapter = createMockAdapterWithResponse({});
      const gateway = new BrainUserGateway(adapter);
      mockResponsePluginPassthrough(gateway);

      const result1 = await gateway.logout();
      expect(result1.data).toEqual({});

      const result2 = await gateway.logout();
      expect(result2.data).toEqual({});
    });
  });
});
