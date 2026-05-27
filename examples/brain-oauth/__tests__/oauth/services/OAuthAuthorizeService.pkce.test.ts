import { OAuthWrapperService } from '@shared/oauth-wrapper/services/OAuthWrapperService';
import { computeS256CodeChallenge } from '@shared/oauth-wrapper/utils/pkce';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_OAUTH_INVALID_REQUEST } from '@config/i18n-identifier/api';
import type { OAuthTokenServiceInterface } from '@shared/oauth-wrapper/interfaces/OAuthServiceInterface';
import type { OAuthSessionInterface } from '@shared/oauth-wrapper/interfaces/OAuthSessionInterface';
import type { OAuthUserAdapterInterface } from '@shared/oauth-wrapper/interfaces/OAuthUserAdapterInterface';
import type { OAuthWrapperRepositoryInterface } from '@shared/oauth-wrapper/interfaces/OAuthWrapperRepositoryInterface';
import {
  testOAuthClient,
  testPublicOAuthClient
} from '../helpers/oauthFixtures';

describe('OAuthWrapperService PKCE', () => {
  const oauthRepo = {
    findClientById: vi.fn()
  } as unknown as OAuthWrapperRepositoryInterface;

  const oauthSession = {} as OAuthSessionInterface;
  const userAdapter = {} as OAuthUserAdapterInterface;
  const tokenService = {} as OAuthTokenServiceInterface;

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

  it('requires PKCE for public clients', async () => {
    vi.mocked(oauthRepo.findClientById).mockResolvedValue(
      testPublicOAuthClient
    );

    const result = await service.resolveAuthorizePage({
      response_type: 'code',
      client_id: testPublicOAuthClient.client_id,
      redirect_uri: testPublicOAuthClient.redirect_uris[0]!
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.errorKey).toBe(API_OAUTH_INVALID_REQUEST);
    }
  });

  it('accepts valid PKCE for public clients', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = computeS256CodeChallenge(verifier);

    vi.mocked(oauthRepo.findClientById).mockResolvedValue(
      testPublicOAuthClient
    );

    const result = await service.resolveAuthorizePage({
      response_type: 'code',
      client_id: testPublicOAuthClient.client_id,
      redirect_uri: testPublicOAuthClient.redirect_uris[0]!,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.codeChallenge).toBe(challenge);
      expect(result.data.confidential).toBe(false);
    }
  });

  it('allows confidential clients without PKCE', async () => {
    vi.mocked(oauthRepo.findClientById).mockResolvedValue(testOAuthClient);

    const result = await service.resolveAuthorizePage({
      response_type: 'code',
      client_id: testOAuthClient.client_id,
      redirect_uri: testOAuthClient.redirect_uris[0]!
    });

    expect(result.ok).toBe(true);
  });
});
