import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ImagicaAuthService } from '../../src';
import type { LoginRequest } from '../../src/imagica-auth/ImagicaAuthApi';
import { ImagicaAuthPlugin } from '../../src/imagica-auth/ImagicaAuthPlugin';

describe('ImagicaAuthPlugin', () => {
  const testConfig: LoginRequest = {
    email: 'test@test.com',
    password: '123456'
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

  describe('onSuccess', () => {
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

      // use plugin
      service.use(new ImagicaAuthPlugin());

      const result = await service.login(testConfig);
      expect(result).toBeDefined();
      expect(result.token).toBe('123456');

      const imagicaAuthState = service.getState();
      expect(imagicaAuthState.userInfo).toEqual(responseUserInfoData);
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
