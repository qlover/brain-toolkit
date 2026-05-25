import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_OAUTH_INVALID_CLIENT,
  API_OAUTH_INVALID_GRANT,
  API_OAUTH_UNSUPPORTED_GRANT_TYPE
} from '@config/i18n-identifier/api';
import type { BrainUserAdapter } from '@server/adapters/BrainUserAdapter';
import type { OAuthAuthorizationCodesRepository } from '@server/repositorys/OAuthAuthorizationCodesRepository';
import type { OAuthClientsRepository } from '@server/repositorys/OAuthClientsRepository';
import { hashOpaqueToken } from '@server/repositorys/OAuthCredentialsRepository';
import type { OAuthCredentialsRepository } from '@server/repositorys/OAuthCredentialsRepository';
import type { OAuthRefreshTokensRepository } from '@server/repositorys/OAuthRefreshTokensRepository';
import { OAuthTokenService } from '@server/services/OAuthTokenService';
import {
  testAuthCode,
  testOAuthClient,
  testRefreshTokenRow,
  testServerConfig
} from '../helpers/oauthFixtures';

/** Shape asserted on {@link OAuthTokenError} rejects (RFC `error` + i18n `errorId`). */
type OAuthTokenErrorExpect = {
  errorId: string;
  error: string;
  status: number;
};

describe('OAuthTokenService', () => {
  const clientsRepo = {
    verifyClientCredentials: vi.fn()
  } as unknown as OAuthClientsRepository;

  const authCodesRepo = {
    consumeCode: vi.fn()
  } as unknown as OAuthAuthorizationCodesRepository;

  const refreshTokensRepo = {
    findByTokenHash: vi.fn(),
    revokeByTokenHash: vi.fn(),
    create: vi.fn()
  } as unknown as OAuthRefreshTokensRepository;

  const credentialsRepo = {
    getUserCredentials: vi.fn(),
    upsertUserCredentials: vi.fn()
  } as unknown as OAuthCredentialsRepository;

  const brainAdapter = {
    exchangeAccessToken: vi.fn()
  } as unknown as BrainUserAdapter;

  let service: OAuthTokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientsRepo.verifyClientCredentials).mockResolvedValue(
      testOAuthClient
    );
    service = new OAuthTokenService(
      clientsRepo,
      authCodesRepo,
      refreshTokensRepo,
      credentialsRepo,
      brainAdapter,
      testServerConfig
    );
  });

  it('exchanges authorization_code for tokens', async () => {
    vi.mocked(authCodesRepo.consumeCode).mockResolvedValue(testAuthCode);
    vi.mocked(credentialsRepo.getUserCredentials).mockResolvedValue({
      user_id: 42,
      brain_session_token: 'brain_session',
      updated_at: '2026-01-01T00:00:00.000Z'
    });
    vi.mocked(brainAdapter.exchangeAccessToken).mockResolvedValue({
      access_token: 'brain_access',
      expires_in: 3600,
      refresh_token: 'brain_refresh'
    });
    vi.mocked(refreshTokensRepo.create).mockResolvedValue(undefined);

    const result = await service.exchangeToken({
      grant_type: 'authorization_code',
      code: 'auth_code_1',
      redirect_uri: 'https://app.example/callback',
      client_id: 'client_test',
      client_secret: 'secret'
    });

    expect(result).toMatchObject({
      access_token: 'brain_access',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'openid profile'
    });
    expect(result.refresh_token).toBeTruthy();
    expect(refreshTokensRepo.create).toHaveBeenCalledOnce();
  });

  it('throws invalid_grant when authorization code is missing', async () => {
    vi.mocked(authCodesRepo.consumeCode).mockResolvedValue(null);

    await expect(
      service.exchangeToken({
        grant_type: 'authorization_code',
        code: 'bad',
        redirect_uri: 'https://app.example/callback',
        client_id: 'client_test',
        client_secret: 'secret'
      })
    ).rejects.toMatchObject({
      errorId: API_OAUTH_INVALID_GRANT,
      error: 'invalid_grant',
      status: 400
    } satisfies OAuthTokenErrorExpect);
  });

  it('throws invalid_grant on redirect_uri mismatch', async () => {
    vi.mocked(authCodesRepo.consumeCode).mockResolvedValue(testAuthCode);

    await expect(
      service.exchangeToken({
        grant_type: 'authorization_code',
        code: 'auth_code_1',
        redirect_uri: 'https://evil.example/callback',
        client_id: 'client_test',
        client_secret: 'secret'
      })
    ).rejects.toMatchObject({
      errorId: API_OAUTH_INVALID_GRANT,
      error: 'invalid_grant'
    } satisfies Partial<OAuthTokenErrorExpect>);
  });

  it('throws unsupported_grant_type when client disallows grant', async () => {
    vi.mocked(clientsRepo.verifyClientCredentials).mockResolvedValue({
      ...testOAuthClient,
      grant_types: ['refresh_token']
    });

    await expect(
      service.exchangeToken({
        grant_type: 'authorization_code',
        code: 'c',
        redirect_uri: 'https://app.example/callback',
        client_id: 'client_test',
        client_secret: 'secret'
      })
    ).rejects.toMatchObject({
      errorId: API_OAUTH_UNSUPPORTED_GRANT_TYPE,
      error: 'unsupported_grant_type'
    } satisfies Partial<OAuthTokenErrorExpect>);
  });

  it('exchanges refresh_token and rotates middleware refresh token', async () => {
    const plainRefresh = 'middleware_refresh_plain';
    vi.mocked(refreshTokensRepo.findByTokenHash).mockResolvedValue(
      testRefreshTokenRow({ refresh_token: hashOpaqueToken(plainRefresh) })
    );
    vi.mocked(credentialsRepo.getUserCredentials).mockResolvedValue({
      user_id: 42,
      brain_session_token: 'brain_session',
      updated_at: '2026-01-01T00:00:00.000Z'
    });
    vi.mocked(brainAdapter.exchangeAccessToken).mockResolvedValue({
      access_token: 'new_access',
      expires_in: 7200,
      refresh_token: 'new_brain_refresh'
    });
    vi.mocked(refreshTokensRepo.revokeByTokenHash).mockResolvedValue(undefined);
    vi.mocked(refreshTokensRepo.create).mockResolvedValue(undefined);

    const result = await service.exchangeToken({
      grant_type: 'refresh_token',
      refresh_token: plainRefresh,
      client_id: 'client_test',
      client_secret: 'secret'
    });

    expect(result.access_token).toBe('new_access');
    expect(refreshTokensRepo.revokeByTokenHash).toHaveBeenCalledWith(
      hashOpaqueToken(plainRefresh)
    );
    expect(result.refresh_token).not.toBe(plainRefresh);
  });

  it('throws invalid_grant when refresh token is expired', async () => {
    vi.mocked(refreshTokensRepo.findByTokenHash).mockResolvedValue(
      testRefreshTokenRow({
        refresh_token: hashOpaqueToken('expired'),
        expires_at: '2000-01-01T00:00:00.000Z'
      })
    );

    await expect(
      service.exchangeToken({
        grant_type: 'refresh_token',
        refresh_token: 'expired',
        client_id: 'client_test',
        client_secret: 'secret'
      })
    ).rejects.toMatchObject({
      errorId: API_OAUTH_INVALID_GRANT,
      error: 'invalid_grant'
    } satisfies Partial<OAuthTokenErrorExpect>);
  });

  it('throws invalid_client when client verification fails', async () => {
    vi.mocked(clientsRepo.verifyClientCredentials).mockRejectedValue(
      new Error('invalid_client')
    );

    await expect(
      service.exchangeToken({
        grant_type: 'refresh_token',
        refresh_token: 'rt',
        client_id: 'bad',
        client_secret: 'wrong'
      })
    ).rejects.toMatchObject({
      errorId: API_OAUTH_INVALID_CLIENT,
      error: 'invalid_client',
      status: 401
    } satisfies OAuthTokenErrorExpect);
  });
});
