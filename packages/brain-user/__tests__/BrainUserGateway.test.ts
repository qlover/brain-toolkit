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
import { BrainUserApi } from '../src/BrainUserApi';
import type { RequestAdapterInterface } from '@qlover/fe-corekit';

describe('BrainUserGateway', () => {
  let mockAdapter: RequestAdapterInterface<any>;
  let mockApi: BrainUserApi<any>;

  beforeEach(() => {
    mockAdapter = {
      config: {},
      request: vi.fn().mockResolvedValue({ data: {} }),
      getConfig: vi.fn(),
      setConfig: vi.fn()
    };
    mockApi = new BrainUserApi(mockAdapter);
  });

  describe('constructor', () => {
    it('should create gateway instance with API', () => {
      const gateway = new BrainUserGateway(mockApi);

      expect(gateway).toBeInstanceOf(BrainUserGateway);
    });
  });

  describe('loginWithGoogle', () => {
    it('should call API loginWithGoogle method', async () => {
      const spy = vi.spyOn(mockApi, 'loginWithGoogle');
      const gateway = new BrainUserGateway(mockApi);

      const params = { authorization_code: 'google-token' };
      await gateway.loginWithGoogle(params);

      expect(spy).toHaveBeenCalledWith(params);
    });

    it('should return credentials from API response', async () => {
      const expectedCredentials = {
        token: 'Brain-token'
      };
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: expectedCredentials
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.loginWithGoogle({
        authorization_code: 'google-token'
      });

      expect(result).toEqual(expectedCredentials);
    });

    it('should handle API errors', async () => {
      const error = new Error('Google login failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockApi);

      await expect(
        gateway.loginWithGoogle({ authorization_code: 'invalid-token' })
      ).rejects.toThrow('Google login failed');
    });
  });

  describe('login', () => {
    it('should call API login method', async () => {
      const spy = vi.spyOn(mockApi, 'login');
      const gateway = new BrainUserGateway(mockApi);

      const params = { email: 'test@example.com', password: 'password123' };
      await gateway.login(params);

      expect(spy).toHaveBeenCalledWith(params);
    });

    it('should return credentials from API response', async () => {
      const expectedCredentials = { token: 'auth-token-xyz' };
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: expectedCredentials
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toEqual(expectedCredentials);
    });

    it('should return null when API response data is null', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ data: null });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeNull();
    });

    it('should return null when API response data is undefined', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ data: undefined });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('Invalid credentials');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockApi);

      await expect(
        gateway.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should call API logout method', async () => {
      const spy = vi.spyOn(mockApi, 'logout');
      const gateway = new BrainUserGateway(mockApi);

      await gateway.logout();

      expect(spy).toHaveBeenCalled();
    });

    it('should return undefined', async () => {
      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.logout();

      expect(result).toBeUndefined();
    });

    it('should handle API errors', async () => {
      const error = new Error('Logout failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockApi);

      await expect(gateway.logout()).rejects.toThrow('Logout failed');
    });

    it('should accept optional params', async () => {
      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.logout({ reason: 'user_initiated' });

      expect(result).toBeUndefined();
    });
  });

  describe('register', () => {
    it('should call API register method', async () => {
      const spy = vi.spyOn(mockApi, 'register');
      const gateway = new BrainUserGateway(mockApi);

      const params = {
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      };
      await gateway.register(params);

      expect(spy).toHaveBeenCalledWith(params);
    });

    it('should return user data with credentials from API response', async () => {
      const expectedData = {
        token: 'new-token',
        email: 'new@example.com',
        name: 'New User',
        id: 1
      };
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: expectedData
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result).toEqual(expectedData);
    });

    it('should return null when API response data is null', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ data: null });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('Email already exists');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockApi);

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
      const spy = vi.spyOn(mockApi, 'getUserInfo');
      const gateway = new BrainUserGateway(mockApi);

      const params = { token: 'auth-token' };
      await gateway.getUserInfo(params);

      expect(spy).toHaveBeenCalledWith(params);
    });

    it('should return user data with credentials from API response', async () => {
      const expectedData = {
        token: 'auth-token',
        email: 'user@example.com',
        name: 'Test User',
        id: 1
      };
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: expectedData
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.getUserInfo({ token: 'auth-token' });

      expect(result).toEqual(expectedData);
    });

    it('should return null when API response data is null', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ data: null });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.getUserInfo({});

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('User not found');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockApi);

      await expect(gateway.getUserInfo({})).rejects.toThrow('User not found');
    });
  });

  describe('refreshUserInfo', () => {
    it('should call API getUserInfo method', async () => {
      const spy = vi.spyOn(mockApi, 'getUserInfo');
      const gateway = new BrainUserGateway(mockApi);

      const params = {};
      await gateway.refreshUserInfo(params);

      expect(spy).toHaveBeenCalledWith(params);
    });

    it('should return updated user data from API response', async () => {
      const expectedData = {
        token: 'refreshed-token',
        email: 'user@example.com',
        name: 'Updated Name',
        id: 1
      };
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: expectedData
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.refreshUserInfo({});

      expect(result).toEqual(expectedData);
    });

    it('should work without params', async () => {
      const expectedData = {
        token: 'token',
        email: 'user@example.com',
        id: 1
      };
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: expectedData
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.refreshUserInfo();

      expect(result).toEqual(expectedData);
    });

    it('should return null when API response data is null', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({ data: null });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.refreshUserInfo({});

      expect(result).toBeNull();
    });

    it('should handle API errors', async () => {
      const error = new Error('Refresh failed');
      mockAdapter.request = vi.fn().mockRejectedValue(error);

      const gateway = new BrainUserGateway(mockApi);

      await expect(gateway.refreshUserInfo({})).rejects.toThrow(
        'Refresh failed'
      );
    });
  });

  describe('integration scenarios', () => {
    it('should support complete authentication flow', async () => {
      const gateway = new BrainUserGateway(mockApi);

      // Login with Google
      mockAdapter.request = vi.fn().mockResolvedValueOnce({
        data: { token: 'google-token' }
      });
      const loginResult = await gateway.loginWithGoogle({
        authorization_code: 'google-oauth-token'
      });
      expect(loginResult.token).toBe('google-token');

      // Get user info
      mockAdapter.request = vi.fn().mockResolvedValueOnce({
        data: {
          token: 'google-token',
          email: 'user@gmail.com',
          id: 1
        }
      });
      const userInfo = await gateway.getUserInfo({});
      expect(userInfo.email).toBe('user@gmail.com');

      // Logout
      await gateway.logout();
    });

    it('should support registration and immediate login flow', async () => {
      const gateway = new BrainUserGateway(mockApi);

      // Register
      mockAdapter.request = vi.fn().mockResolvedValueOnce({
        data: {
          token: 'new-token',
          email: 'new@example.com',
          name: 'New User',
          id: 1
        }
      });
      const registerResult = await gateway.register({
        email: 'new@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(registerResult.token).toBe('new-token');
      expect(registerResult.email).toBe('new@example.com');
    });

    it('should support user info refresh after update', async () => {
      const gateway = new BrainUserGateway(mockApi);

      // Initial user info
      mockAdapter.request = vi.fn().mockResolvedValueOnce({
        data: {
          token: 'token',
          email: 'user@example.com',
          name: 'Old Name',
          id: 1
        }
      });
      const initialInfo = await gateway.getUserInfo({});
      expect(initialInfo.name).toBe('Old Name');

      // Refresh after profile update
      mockAdapter.request = vi.fn().mockResolvedValueOnce({
        data: {
          token: 'token',
          email: 'user@example.com',
          name: 'New Name',
          id: 1
        }
      });
      const refreshedInfo = await gateway.refreshUserInfo({});
      expect(refreshedInfo.name).toBe('New Name');
    });
  });

  describe('real-world usage patterns', () => {
    it('should handle Google OAuth flow', async () => {
      const gateway = new BrainUserGateway(mockApi);

      mockAdapter.request = vi.fn().mockResolvedValue({
        data: {
          token: 'Brain-token-xyz'
        }
      });

      const result = await gateway.loginWithGoogle({
        authorization_code: 'google-oauth-token'
      });

      expect(result.token).toBe('Brain-token-xyz');
    });

    it('should handle email/password login flow', async () => {
      const gateway = new BrainUserGateway(mockApi);

      mockAdapter.request = vi.fn().mockResolvedValue({
        data: { token: 'auth-token-123' }
      });

      const result = await gateway.login({
        email: 'user@example.com',
        password: 'securePassword123'
      });

      expect(result?.token).toBe('auth-token-123');
    });

    it('should handle user registration with profile data', async () => {
      const gateway = new BrainUserGateway(mockApi);

      mockAdapter.request = vi.fn().mockResolvedValue({
        data: {
          token: 'new-user-token',
          email: 'newuser@example.com',
          name: 'New User',
          id: 1,
          profile: {
            phone_number: '1234567890'
          }
        }
      });

      const result = await gateway.register({
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      });

      expect(result.email).toBe('newuser@example.com');
      expect(result.name).toBe('New User');
      expect(result.profile?.phone_number).toBe('1234567890');
    });
  });

  describe('edge cases', () => {
    it('should handle empty API response', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({});

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.login({
        email: 'test',
        password: 'test'
      });

      expect(result).toBeNull();
    });

    it('should handle malformed API response', async () => {
      mockAdapter.request = vi.fn().mockResolvedValue({
        data: { unexpected: 'format' }
      });

      const gateway = new BrainUserGateway(mockApi);
      const result = await gateway.getUserInfo({});

      expect(result).toEqual({ unexpected: 'format' });
    });

    it('should handle multiple concurrent requests', async () => {
      const gateway = new BrainUserGateway(mockApi);

      mockAdapter.request = vi.fn().mockResolvedValue({
        data: { token: 'token', email: 'user@example.com', id: 1 }
      });

      const results = await Promise.all([
        gateway.getUserInfo({}),
        gateway.getUserInfo({}),
        gateway.getUserInfo({})
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.email).toBe('user@example.com');
      });
    });

    it('should handle logout without errors', async () => {
      const gateway = new BrainUserGateway(mockApi);

      await expect(gateway.logout()).resolves.toBeUndefined();
      await expect(gateway.logout()).resolves.toBeUndefined();
    });
  });
});

