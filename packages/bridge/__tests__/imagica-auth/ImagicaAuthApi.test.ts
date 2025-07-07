/**
 * ImagicaAuthApi test suite
 *
 * Significance: Comprehensive testing for Imagica authentication API
 * Core idea: Test all authentication methods and configurations
 * Main function: Ensure ImagicaAuthApi works correctly with different scenarios
 * Main purpose: Validate API interactions and error handling
 *
 * @example
 * ```ts
 * import { describe, it, expect } from 'vitest';
 * import { ImagicaAuthApi } from '../../src/imagica-auth/ImagicaAuthApi';
 * ```
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import after mocking
import { ImagicaAuthApi } from '../../src/imagica-auth/ImagicaAuthApi';

describe('ImagicaAuthApi', () => {
  let api: ImagicaAuthApi;

  beforeEach(() => {
    vi.clearAllMocks();
    api = new ImagicaAuthApi({
      env: 'development',
      domains: { development: 'https://api-dev.example.com' }
    });
  });

  describe('Constructor and Configuration', () => {
    it('should create an instance successfully', () => {
      expect(api).toBeInstanceOf(ImagicaAuthApi);
    });

    it('should initialize with default configuration', () => {
      const defaultApi = new ImagicaAuthApi({});
      expect(defaultApi).toBeInstanceOf(ImagicaAuthApi);
    });
  });

  describe('Store Management', () => {
    it('should return null store initially', () => {
      expect(api.getStore()).toBeNull();
    });

    it('should handle store operations', () => {
      expect(typeof api.setStore).toBe('function');
      expect(typeof api.getStore).toBe('function');
    });
  });

  describe('Plugin Management', () => {
    it('should have usePlugin method', () => {
      expect(typeof api.usePlugin).toBe('function');
    });
  });

  describe('Request Methods', () => {
    it('should have request method', () => {
      expect(typeof api.request).toBe('function');
    });
  });

  describe('Authentication Methods', () => {
    it('should have login method', () => {
      expect(typeof api.login).toBe('function');
    });

    it('should have loginWithGoogle method', () => {
      expect(typeof api.loginWithGoogle).toBe('function');
    });

    it('should have register method', () => {
      expect(typeof api.register).toBe('function');
    });

    it('should have getUserInfo method', () => {
      expect(typeof api.getUserInfo).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof api.logout).toBe('function');
    });

    // For actual API calls, we need to mock the network requests
    it('should handle login request', async () => {
      // Mock the request method to avoid actual network calls
      const mockRequest = vi.spyOn(api, 'request').mockResolvedValue({
        data: { token: 'mock-token', id: 1, email: 'test@example.com' },
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        config: { url: '/api/auth/token.json', method: 'POST' },
        response: new Response()
      });

      const loginData = { email: 'test@example.com', password: 'password' };
      const result = await api.login(loginData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/token.json',
        method: 'POST',
        data: loginData,
        authKey: false
      });

      expect(result).toEqual({
        token: 'mock-token',
        id: 1,
        email: 'test@example.com'
      });
    });

    it('should handle Google login request', async () => {
      const mockRequest = vi.spyOn(api, 'request').mockResolvedValue({
        data: { token: 'mock-token', id: 1, email: 'test@example.com' },
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        config: { url: '/api/auth/google/imagica/token', method: 'POST' },
        response: new Response()
      });

      const googleData = { id_token: 'google-token' };
      const result = await api.loginWithGoogle(googleData);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/auth/google/imagica/token',
        method: 'POST',
        data: googleData
      });

      expect(result).toEqual({
        token: 'mock-token',
        id: 1,
        email: 'test@example.com'
      });
    });

    it('should handle getUserInfo request', async () => {
      const mockRequest = vi.spyOn(api, 'request').mockResolvedValue({
        data: { token: 'mock-token', id: 1, email: 'test@example.com' },
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
        config: { url: '/api/users/me.json', method: 'GET' },
        response: new Response()
      });

      const result = await api.getUserInfo({ token: 'test-token' });

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/users/me.json',
        method: 'GET',
        token: 'test-token'
      });

      expect(result).toEqual({
        token: 'mock-token',
        id: 1,
        email: 'test@example.com'
      });
    });

    it('should handle logout', async () => {
      await expect(api.logout()).resolves.toBeUndefined();
    });
  });
});
