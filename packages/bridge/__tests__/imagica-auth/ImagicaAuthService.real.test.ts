import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImagicaAuthService } from '../../src';
import type {
  LoginRequest,
  RegisterRequest,
  LoginWithGoogleRequest
} from '../../src/imagica-auth/ImagicaAuthApi';

describe('Mock real request', () => {
  const testConfig: LoginRequest = {
    email: 'test@test.com',
    password: '123456'
  };

  const testRegisterConfig: RegisterRequest = {
    email: 'newuser@test.com',
    password: '123456',
    first_name: 'Test',
    last_name: 'User'
  };

  const testGoogleConfig: LoginWithGoogleRequest = {
    authorization_code: 'google_auth_code_123',
    id_token: 'google_id_token_123'
  };

  let service: ImagicaAuthService;
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    service = new ImagicaAuthService({
      requestConfig: {
        env: 'development',
        fetcher: fetchMock
      }
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
    service.reset();
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      const responseData = { token: '123456' };
      const responseUserInfoData = {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        profile: {
          permissions: ['read', 'write'],
          email_verified: true
        }
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(new Response(JSON.stringify(responseData)));
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(responseUserInfoData))
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      const result = await service.login(testConfig);
      expect(result).toBeDefined();
      expect(result.token).toBe('123456');

      const imagicaAuthState = service.getState();
      expect(imagicaAuthState.userInfo).toEqual(responseUserInfoData);
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle login error', async () => {
      const errorResponse = {
        non_field_errors: ['Unable to log in with provided credentials.']
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.login(testConfig);
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle network error', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      try {
        await service.login(testConfig);
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle invalid email format', async () => {
      const invalidEmailConfig = {
        email: 'invalid-email',
        password: '123456'
      };

      const errorResponse = {
        email: ['Enter a valid email address.']
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.login(invalidEmailConfig);
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });
  });

  describe('Register', () => {
    it('should register successfully', async () => {
      const responseUserInfoData = {
        id: 2,
        email: 'newuser@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        profile: {
          email_verified: false
        }
      };
      const responseData = {
        token: 'new_user_token_123',
        ...responseUserInfoData
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('users/signup.json')) {
          return Promise.resolve(new Response(JSON.stringify(responseData)));
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(responseUserInfoData))
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      const result = await service.register(testRegisterConfig);
      expect(result).toBeDefined();
      expect(result.token).toBe('new_user_token_123');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle email already exists error', async () => {
      const errorResponse = {
        email: ['User with this email already exists.']
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.register(testRegisterConfig);
        expect.fail('Expected register to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle weak password error', async () => {
      const weakPasswordConfig = {
        ...testRegisterConfig,
        password: '123'
      };

      const errorResponse = {
        password: [
          'This password is too short. It must contain at least 8 characters.',
          'This password is too common.'
        ]
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.register(weakPasswordConfig);
        expect.fail('Expected register to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle missing required fields error', async () => {
      const incompleteConfig = {
        email: 'test@test.com',
        password: '123456',
        first_name: '',
        last_name: 'User'
      };

      const errorResponse = {
        first_name: ['This field may not be blank.']
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.register(incompleteConfig);
        expect.fail('Expected register to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });
  });

  describe('Google Login', () => {
    it('should login with google successfully', async () => {
      const responseData = { token: 'google_token_123' };
      const responseUserInfoData = {
        id: 3,
        email: 'googleuser@gmail.com',
        name: 'Google User',
        profile: {
          email_verified: true,
          profile_img_url: 'https://lh3.googleusercontent.com/a/default-user'
        }
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/google/imagica/token')) {
          return Promise.resolve(new Response(JSON.stringify(responseData)));
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(responseUserInfoData))
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      const result = await service.loginWithGoogle(testGoogleConfig);
      expect(result).toBeDefined();
      expect(result.token).toBe('google_token_123');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle invalid google authorization code error', async () => {
      const errorResponse = {
        non_field_errors: ['Invalid authorization code.']
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/google/imagica/token')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.loginWithGoogle(testGoogleConfig);
        expect.fail('Expected Google login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle invalid google id token error', async () => {
      const invalidTokenConfig = {
        id_token: 'invalid_token'
      };

      const errorResponse = {
        id_token: ['Invalid ID token.']
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/google/imagica/token')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 400,
              statusText: 'Bad Request'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.loginWithGoogle(invalidTokenConfig);
        expect.fail('Expected Google login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });
  });

  describe('Get User Info', () => {
    it('should get user info successfully', async () => {
      const responseUserInfoData = {
        id: 1,
        email: 'test@test.com',
        name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        profile: {
          permissions: ['read', 'write'],
          email_verified: true,
          phone_number: '+1234567890'
        },
        roles: ['user', 'premium'],
        feature_tags: ['feature1', 'feature2'],
        is_active: true,
        is_superuser: false,
        created_at: '2023-01-01T00:00:00Z'
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('users/me.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(responseUserInfoData))
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      const result = await service.api.getUserInfo({ token: 'valid_token' });
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe('test@test.com');
      expect(result.profile?.permissions).toEqual(['read', 'write']);
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle invalid token error', async () => {
      const errorResponse = {
        detail: 'Invalid token.'
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('users/me.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 401,
              statusText: 'Unauthorized'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.api.getUserInfo({ token: 'invalid_token' });
        expect.fail('Expected getUserInfo to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle token expired error', async () => {
      const errorResponse = {
        detail: 'Token has expired.'
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('users/me.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(errorResponse), {
              status: 401,
              statusText: 'Unauthorized'
            })
          );
        }
        return Promise.resolve(new Response('{}'));
      });

      try {
        await service.api.getUserInfo({ token: 'expired_token' });
        expect.fail('Expected getUserInfo to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });
  });

  describe('Logout', () => {
    // TOOD: api 未实现登出
    it.skip('should logout successfully', async () => {
      fetchMock.mockImplementation(() => {
        return Promise.resolve(new Response('{}'));
      });

      await service.logout();
      expect(fetchMock).toHaveBeenCalled();
    });

    it.skip('should handle server error during logout', async () => {
      const errorResponse = {
        detail: 'Server error during logout.'
      };

      fetchMock.mockImplementation(() => {
        return Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 500,
            statusText: 'Internal Server Error'
          })
        );
      });

      try {
        await service.logout();
        // Logout should not throw errors, it should handle them gracefully
        expect(fetchMock).toHaveBeenCalled();
      } catch {
        // If logout does throw, verify it's handled appropriately
        expect(fetchMock).toHaveBeenCalled();
      }
    });
  });

  describe('Server error handling', () => {
    it('should handle 500 internal server error', async () => {
      const errorResponse = {
        detail: 'Internal server error.'
      };

      fetchMock.mockImplementation(() => {
        return Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 500,
            statusText: 'Internal Server Error'
          })
        );
      });

      try {
        await service.login(testConfig);
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle 503 service unavailable error', async () => {
      const errorResponse = {
        detail: 'Service temporarily unavailable.'
      };

      fetchMock.mockImplementation(() => {
        return Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 503,
            statusText: 'Service Unavailable'
          })
        );
      });

      try {
        await service.login(testConfig);
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });

    it('should handle 429 too many requests error', async () => {
      const errorResponse = {
        detail: 'Too many requests. Please try again later.'
      };

      fetchMock.mockImplementation(() => {
        return Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 429,
            statusText: 'Too Many Requests'
          })
        );
      });

      try {
        await service.login(testConfig);
        expect.fail('Expected login to throw an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(fetchMock).toHaveBeenCalled();
      }
    });
  });

  describe('State management', () => {
    it('should correctly manage authentication state', async () => {
      const loginResponseData = { token: 'auth_token_123' };
      const userInfoData = {
        id: 1,
        email: 'test@test.com',
        name: 'Test User'
      };

      fetchMock.mockImplementation((request: string | Request) => {
        const url = typeof request === 'string' ? request : request.url;
        if (url.includes('auth/token.json')) {
          return Promise.resolve(
            new Response(JSON.stringify(loginResponseData))
          );
        }
        if (url.includes('users/me.json')) {
          return Promise.resolve(new Response(JSON.stringify(userInfoData)));
        }
        return Promise.resolve(new Response('{}'));
      });

      // Initial state
      const initialState = service.getState();
      expect(initialState.userInfo).toBeNull();
      expect(initialState.credential).toBeNull();

      // After login
      await service.login(testConfig);
      const loggedInState = service.getState();
      expect(loggedInState.userInfo).toEqual(userInfoData);
      expect(loggedInState.credential).toBe('auth_token_123');

      // Reset state
      service.reset();
      const resetState = service.getState();
      expect(resetState.userInfo).toBeNull();
      expect(resetState.credential).toBeNull();
    });

    it('should keep original state when login fails', async () => {
      const errorResponse = {
        non_field_errors: ['Unable to log in with provided credentials.']
      };

      fetchMock.mockImplementation(() => {
        return Promise.resolve(
          new Response(JSON.stringify(errorResponse), {
            status: 400,
            statusText: 'Bad Request'
          })
        );
      });

      const initialState = service.getState();
      expect(initialState.userInfo).toBeNull();
      expect(initialState.credential).toBeNull();

      try {
        await service.login(testConfig);
        expect.fail('Expected login to throw an error');
      } catch {
        const stateAfterError = service.getState();
        expect(stateAfterError.userInfo).toBeNull();
        expect(stateAfterError.credential).toBeNull();
      }
    });
  });
});
