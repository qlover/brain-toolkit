import { beforeEach, describe, expect, it, vi } from 'vitest';
import { API_OAUTH_INVALID_REQUEST } from '@config/i18n-identifier/api';
import type { OAuthClientsRepository } from '@server/repositorys/OAuthClientsRepository';
import { OAuthAuthorizeService } from '@server/services/OAuthAuthorizeService';
import { computeS256CodeChallenge } from '@server/utils/pkce';
import type { OAuthAuthorizeQueryValidator } from '@shared/validators/OAuthAuthorizeValidator';
import {
  testOAuthClient,
  testPublicOAuthClient
} from '../helpers/oauthFixtures';

describe('OAuthAuthorizeService PKCE', () => {
  const clientsRepo = {
    findByClientId: vi.fn()
  } as unknown as OAuthClientsRepository;

  const queryValidator = {
    getThrow: vi.fn(async (q: unknown) => q)
  } as unknown as OAuthAuthorizeQueryValidator;

  let service: OAuthAuthorizeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OAuthAuthorizeService(clientsRepo, queryValidator);
  });

  it('requires PKCE for public clients', async () => {
    vi.mocked(clientsRepo.findByClientId).mockResolvedValue(
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
    const verifier =
      'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = computeS256CodeChallenge(verifier);

    vi.mocked(clientsRepo.findByClientId).mockResolvedValue(
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
    vi.mocked(clientsRepo.findByClientId).mockResolvedValue(testOAuthClient);

    const result = await service.resolveAuthorizePage({
      response_type: 'code',
      client_id: testOAuthClient.client_id,
      redirect_uri: testOAuthClient.redirect_uris[0]!
    });

    expect(result.ok).toBe(true);
  });
});
