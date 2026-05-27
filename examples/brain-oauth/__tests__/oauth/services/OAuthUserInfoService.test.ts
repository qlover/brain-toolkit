import { OAuthWrapperService } from '@shared/oauth-wrapper/services/OAuthWrapperService';
import { OAuthUserInfoError } from '@shared/oauth-wrapper/utils/oauthUserInfoError';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_OAUTH_INVALID_TOKEN } from '@config/i18n-identifier/api';
import type { OAuthTokenServiceInterface } from '@shared/oauth-wrapper/interfaces/OAuthServiceInterface';
import type { OAuthSessionInterface } from '@shared/oauth-wrapper/interfaces/OAuthSessionInterface';
import type { OAuthUserAdapterInterface } from '@shared/oauth-wrapper/interfaces/OAuthUserAdapterInterface';
import type { OAuthWrapperRepositoryInterface } from '@shared/oauth-wrapper/interfaces/OAuthWrapperRepositoryInterface';

type OAuthUserInfoErrorExpect = {
  errorId: string;
  error: 'invalid_token';
  status?: number;
};

describe('OAuthWrapperService.getUserInfo', () => {
  const userAdapter = {
    getUserInfoByAccessToken: vi.fn()
  } as unknown as OAuthUserAdapterInterface;

  const oauthSession = {} as OAuthSessionInterface;
  const tokenService = {} as OAuthTokenServiceInterface;
  const oauthRepo = {} as OAuthWrapperRepositoryInterface;

  let service: OAuthWrapperService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OAuthWrapperService(
      oauthSession,
      userAdapter,
      tokenService,
      oauthRepo
    );
  });

  it('maps Brain profile to OIDC userinfo claims', async () => {
    vi.mocked(userAdapter.getUserInfoByAccessToken).mockResolvedValue({
      id: 99,
      email: 'user@example.com',
      name: 'Full Name',
      first_name: 'Full',
      last_name: 'Name',
      roles: ['user', 'premium'],
      auth_token: { key: 'k' }
    });

    const profile = await service.getUserInfo('access_jwt');

    expect(profile).toEqual({
      sub: '99',
      email: 'user@example.com',
      name: 'Full Name',
      roles: ['user', 'premium']
    });
    expect(userAdapter.getUserInfoByAccessToken).toHaveBeenCalledWith(
      'access_jwt'
    );
  });

  it('falls back name from first/last when name is empty', async () => {
    vi.mocked(userAdapter.getUserInfoByAccessToken).mockResolvedValue({
      id: 1,
      email: 'a@b.co',
      name: '',
      first_name: 'Ada',
      last_name: 'Lovelace',
      auth_token: { key: 'k' }
    });

    const profile = await service.getUserInfo('token');

    expect(profile.name).toBe('Ada Lovelace');
  });

  it('throws invalid_token when Brain adapter fails', async () => {
    vi.mocked(userAdapter.getUserInfoByAccessToken).mockRejectedValue(
      new Error('401')
    );

    await expect(service.getUserInfo('bad')).rejects.toBeInstanceOf(
      OAuthUserInfoError
    );
    await expect(service.getUserInfo('bad')).rejects.toMatchObject({
      errorId: API_OAUTH_INVALID_TOKEN,
      error: 'invalid_token',
      status: 401
    } satisfies OAuthUserInfoErrorExpect);
  });

  it('throws invalid_token when email is missing', async () => {
    vi.mocked(userAdapter.getUserInfoByAccessToken).mockResolvedValue({
      id: 1,
      email: '   ',
      name: 'X',
      auth_token: { key: 'k' }
    });

    await expect(service.getUserInfo('token')).rejects.toMatchObject({
      errorId: API_OAUTH_INVALID_TOKEN,
      error: 'invalid_token'
    } satisfies Partial<OAuthUserInfoErrorExpect>);
  });
});
