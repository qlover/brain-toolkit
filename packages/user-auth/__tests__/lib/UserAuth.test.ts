/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, Mock } from 'vitest';
import { UserAuth } from '../../src/lib/UserAuth';
import type {
  UserInfoResponseData,
  LoginResponseData
} from '../../src/lib/UserAuthServiceInterface';

describe('UserAuth', () => {
  let userAuth: UserAuth;
  let mockStore: {
    getToken: Mock;
    setToken: Mock;
    setUserInfo: Mock;
    getUserInfo: Mock;
    changeLoginStatus: Mock;
  };
  let mockService: {
    login: Mock;
    getUserInfo: Mock;
  };

  beforeEach(() => {
    mockStore = {
      getToken: vi.fn(),
      setToken: vi.fn(),
      setUserInfo: vi.fn(),
      getUserInfo: vi.fn(),
      changeLoginStatus: vi.fn()
    };

    mockService = {
      login: vi.fn(),
      getUserInfo: vi.fn()
    };

    userAuth = new UserAuth({
      store: mockStore,
      service: mockService as any
    });
  });

  describe('login', () => {
    it('should store token and fetch user info after successful login', async () => {
      const mockToken = 'test-token';
      const mockUserInfo: UserInfoResponseData = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      };

      const loginResponse: LoginResponseData = { token: mockToken };
      mockService.login.mockResolvedValue(loginResponse);
      mockService.getUserInfo.mockResolvedValue(mockUserInfo);

      const credentials = {
        email: 'test@example.com',
        password: 'password'
      };

      await userAuth.login(credentials);

      expect(mockService.login).toHaveBeenCalledWith(credentials);
      expect(mockService.getUserInfo).toHaveBeenCalledWith({
        token: mockToken
      });
      expect(mockStore.setToken).toHaveBeenCalledWith(mockToken);
      expect(mockStore.setUserInfo).toHaveBeenCalledWith(mockUserInfo);
    });

    it('should throw error when login response has no token', async () => {
      mockService.login.mockResolvedValue({});

      const credentials = {
        email: 'test@example.com',
        password: 'wrong'
      };

      await expect(userAuth.login(credentials)).rejects.toThrow('login failed');
    });
  });

  describe('fetchUserInfo', () => {
    it('should fetch and store user info with provided token', async () => {
      const mockToken = 'test-token';
      const mockUserInfo: UserInfoResponseData = {
        id: 1,
        email: 'test@example.com'
      };

      mockService.getUserInfo.mockResolvedValue(mockUserInfo);

      await userAuth.fetchUserInfo(mockToken);

      expect(mockService.getUserInfo).toHaveBeenCalledWith({
        token: mockToken
      });
      expect(mockStore.setToken).toHaveBeenCalledWith(mockToken);
      expect(mockStore.setUserInfo).toHaveBeenCalledWith(mockUserInfo);
    });

    it('should throw error when token is not available', async () => {
      mockStore.getToken.mockReturnValue('');
      await expect(userAuth.fetchUserInfo()).rejects.toThrow(
        'token is not set'
      );
    });
  });

  describe('getTokenFromHref', () => {
    it('should extract token from URL when tokenKey is set', () => {
      const tokenKey = 'auth_token';
      userAuth = new UserAuth({
        store: mockStore,
        service: mockService as any,
        tokenKey,
        href: 'https://example.com?auth_token=test-token'
      });

      expect(
        userAuth.getTokenFromHref('https://example.com?auth_token=test-token')
      ).toBe('test-token');
    });

    it('should return empty string when tokenKey is not set', () => {
      userAuth = new UserAuth({
        store: mockStore,
        service: mockService as any,
        href: 'https://example.com?auth_token=test-token'
      });

      expect(
        userAuth.getTokenFromHref('https://example.com?auth_token=test-token')
      ).toBe('');
    });
  });
});
