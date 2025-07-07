import { describe, it, expect } from 'vitest';
import { ImagicaAuthService } from '../../src/imagica-auth/ImagicaAuthService';

describe('ImagicaAuthService', () => {
  describe('模拟真实请求', () => {
    const testConfig = {
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

    it('应该正常登陆', async () => {
      const responseData = { token: '123456' };
      const responseUserInfoData = {
        id: 1,
        email: 'test@test.com'
      };
      fetchMock.mockImplementation((request) => {
        if (request.url?.includes('auth/token.json')) {
          return new Response(JSON.stringify(responseData));
        }

        return new Response(JSON.stringify(responseUserInfoData));
      });

      const result = await service.login(testConfig);
      expect(result).toBeDefined();
      const imagicaAuthState = service.getState();
      expect(imagicaAuthState.userInfo).toEqual(responseUserInfoData);
      expect(fetchMock).toHaveBeenCalled();
    });
  });
});
