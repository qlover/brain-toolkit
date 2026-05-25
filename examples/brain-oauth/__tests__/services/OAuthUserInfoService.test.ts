import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OAuthUserInfoService } from '@server/services/OAuthUserInfoService';
import { OAuthUserInfoError } from '@server/utils/oauthUserInfoError';
import type { BrainUserAdapter } from '@server/adapters/BrainUserAdapter';

describe('OAuthUserInfoService', () => {
  const brainAdapter = {
    getUserInfoByAccessToken: vi.fn()
  } as unknown as BrainUserAdapter;

  let service: OAuthUserInfoService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OAuthUserInfoService(brainAdapter);
  });

  it('maps Brain profile to OIDC userinfo claims', async () => {
    vi.mocked(brainAdapter.getUserInfoByAccessToken).mockResolvedValue({
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
    expect(brainAdapter.getUserInfoByAccessToken).toHaveBeenCalledWith(
      'access_jwt'
    );
  });

  it('falls back name from first/last when name is empty', async () => {
    vi.mocked(brainAdapter.getUserInfoByAccessToken).mockResolvedValue({
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
    vi.mocked(brainAdapter.getUserInfoByAccessToken).mockRejectedValue(
      new Error('401')
    );

    await expect(service.getUserInfo('bad')).rejects.toBeInstanceOf(
      OAuthUserInfoError
    );
    await expect(service.getUserInfo('bad')).rejects.toMatchObject({
      error: 'invalid_token',
      status: 401
    });
  });

  it('throws invalid_token when email is missing', async () => {
    vi.mocked(brainAdapter.getUserInfoByAccessToken).mockResolvedValue({
      id: 1,
      email: '   ',
      name: 'X',
      auth_token: { key: 'k' }
    });

    await expect(service.getUserInfo('token')).rejects.toMatchObject({
      error: 'invalid_token'
    });
  });
});
