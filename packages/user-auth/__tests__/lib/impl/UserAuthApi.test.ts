import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAuthApi } from '../../../src/lib/impl/UserAuthApi';

describe('UserAuthApi', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let userAuthApi: UserAuthApi;

  beforeEach(() => {
    mockFetch = vi.fn();
    userAuthApi = new UserAuthApi({
      env: 'development',
      fetcher: mockFetch as unknown as typeof fetch
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        token: 'test-token',
        user: {
          id: 1,
          email: 'test@brain.im'
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const loginParams = {
        email: 'test@brain.im',
        password: 'password123'
      };

      const response = await userAuthApi.login(loginParams);

      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/token.json',
        {
          method: 'POST',
          body: JSON.stringify(loginParams),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(response).toEqual(mockResponse);
    });

    it('should handle login failure', async () => {
      const mockErrorResponse = {
        error: 'Invalid credentials'
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockErrorResponse)
      });

      const response = await userAuthApi.login({
        email: 'wrong@brain.im',
        password: 'wrongpassword'
      });

      expect(response).toEqual(mockErrorResponse);
    });
  });

  describe('getUserInfo', () => {
    it('should successfully fetch user info', async () => {
      const mockUserInfo = {
        id: 1,
        email: 'test@brain.im',
        name: 'Test User',
        profile: {
          phone_number: '1234567890'
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockUserInfo)
      });

      const response = await userAuthApi.getUserInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/user.json',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(response).toEqual(mockUserInfo);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockResponse = {
        token: 'new-user-token',
        user: {
          id: 2,
          email: 'newuser@brain.im'
        }
      };

      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const registerParams = {
        email: 'newuser@brain.im',
        password: 'password123',
        first_name: 'New',
        last_name: 'User'
      };

      const response = await userAuthApi.register(registerParams);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api-dev.braininc.net/api/auth/token.json',
        {
          method: 'POST',
          body: JSON.stringify(registerParams),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle error response', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            non_field_errors: ['Unable to login with provided credentials.']
          })
      });

      const userAuthApi = new UserAuthApi({
        env: 'development',
        fetcher: mockFetch as unknown as typeof fetch
      });

      const response = await userAuthApi.login({
        email: 'test@brain.im',
        password: 'password'
      });

      expect(response).toEqual({
        non_field_errors: ['Unable to login with provided credentials.']
      });
    });
  });
});
