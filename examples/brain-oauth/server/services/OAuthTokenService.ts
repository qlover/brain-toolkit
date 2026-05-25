import { randomBytes } from 'crypto';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import {
  OAuthTokenRequestSchema,
  type OAuthTokenRequest
} from '@schemas/oauth/OAuthTokenSchema';
import type { OAuthTokenResponse } from '@schemas/oauth/OAuthClientSchema';
import { BrainUserAdapter } from '../adapters/BrainUserAdapter';
import { OAuthAuthorizationCodesRepository } from '../repositorys/OAuthAuthorizationCodesRepository';
import { OAuthClientsRepository } from '../repositorys/OAuthClientsRepository';
import {
  OAuthCredentialsRepository,
  hashOpaqueToken
} from '../repositorys/OAuthCredentialsRepository';
import { OAuthRefreshTokensRepository } from '../repositorys/OAuthRefreshTokensRepository';
import { OAuthTokenError } from '../utils/oauthTokenError';
import { TokenEncryption } from '../utils/TokenEncryption';

/**
 * OAuth 2.0 token endpoint (`POST /oauth/token`).
 *
 * Significance: Exchanges authorization codes and refresh tokens for Brain access tokens.
 * Core idea: Validate client + grant, consume codes, proxy Brain token APIs.
 * Main purpose: Standard token endpoint for third-party OAuth clients.
 *
 * @example
 * const tokens = await service.exchangeToken(formFields);
 */
@injectable()
export class OAuthTokenService {
  protected static REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

  protected tokenEncryption: TokenEncryption;

  constructor(
    @inject(OAuthClientsRepository)
    protected clientsRepo: OAuthClientsRepository,
    @inject(OAuthAuthorizationCodesRepository)
    protected authCodesRepo: OAuthAuthorizationCodesRepository,
    @inject(OAuthRefreshTokensRepository)
    protected refreshTokensRepo: OAuthRefreshTokensRepository,
    @inject(OAuthCredentialsRepository)
    protected credentialsRepo: OAuthCredentialsRepository,
    @inject(BrainUserAdapter)
    protected brainAdapter: BrainUserAdapter,
    @inject(I.AppConfig) config: SeedServerConfigInterface
  ) {
    this.tokenEncryption = new TokenEncryption(config.encryptionKey);
  }

  public async exchangeToken(
    rawFields: Record<string, string>
  ): Promise<OAuthTokenResponse> {
    let request: OAuthTokenRequest;
    try {
      request = OAuthTokenRequestSchema.parse(rawFields);
    } catch {
      throw new OAuthTokenError(
        'invalid_request',
        400,
        'Malformed token request'
      );
    }

    let client;
    try {
      client = await this.clientsRepo.verifyClientCredentials(
        request.client_id,
        request.client_secret
      );
    } catch {
      throw new OAuthTokenError('invalid_client', 401);
    }

    if (!client.grant_types.includes(request.grant_type)) {
      throw new OAuthTokenError('unsupported_grant_type', 400);
    }

    if (request.grant_type === 'authorization_code') {
      return await this.exchangeAuthorizationCode(request, client.client_id);
    }

    return await this.exchangeRefreshToken(request, client.client_id);
  }

  protected async exchangeAuthorizationCode(
    request: Extract<OAuthTokenRequest, { grant_type: 'authorization_code' }>,
    verifiedClientId: string
  ): Promise<OAuthTokenResponse> {
    const authCode = await this.authCodesRepo.consumeCode(request.code);
    if (!authCode) {
      throw new OAuthTokenError(
        'invalid_grant',
        400,
        'Authorization code is invalid, expired, or already used'
      );
    }

    if (authCode.client_id !== verifiedClientId) {
      throw new OAuthTokenError('invalid_grant', 400, 'client_id mismatch');
    }

    if (authCode.redirect_uri !== request.redirect_uri) {
      throw new OAuthTokenError('invalid_grant', 400, 'redirect_uri mismatch');
    }

    const brainTokens = await this.fetchBrainAccessToken(authCode.user_id);
    const middlewareRefresh = await this.issueMiddlewareRefreshToken(
      authCode.client_id,
      authCode.user_id
    );

    return {
      access_token: brainTokens.access_token,
      token_type: 'Bearer',
      expires_in: brainTokens.expires_in,
      refresh_token: middlewareRefresh,
      scope: authCode.scope ?? undefined
    };
  }

  protected async exchangeRefreshToken(
    request: Extract<OAuthTokenRequest, { grant_type: 'refresh_token' }>,
    verifiedClientId: string
  ): Promise<OAuthTokenResponse> {
    const tokenHash = hashOpaqueToken(request.refresh_token);
    const stored = await this.refreshTokensRepo.findByTokenHash(tokenHash);

    if (
      !stored ||
      stored.revoked ||
      stored.client_id !== verifiedClientId ||
      new Date(stored.expires_at) <= new Date()
    ) {
      throw new OAuthTokenError('invalid_grant', 400, 'Refresh token is invalid');
    }

    const brainTokens = await this.fetchBrainAccessToken(stored.user_id);

    await this.refreshTokensRepo.revokeByTokenHash(tokenHash);
    const middlewareRefresh = await this.issueMiddlewareRefreshToken(
      stored.client_id,
      stored.user_id
    );

    return {
      access_token: brainTokens.access_token,
      token_type: 'Bearer',
      expires_in: brainTokens.expires_in,
      refresh_token: middlewareRefresh
    };
  }

  protected async fetchBrainAccessToken(userId: number): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const credentials = await this.credentialsRepo.getUserCredentials(userId);
    const sessionToken = credentials?.brain_session_token?.trim();

    if (!sessionToken) {
      throw new OAuthTokenError(
        'invalid_grant',
        400,
        'User credentials expired. Re-authorization required.'
      );
    }

    try {
      const access = await this.brainAdapter.exchangeAccessToken({
        token: sessionToken
      });

      if (access.refresh_token) {
        await this.credentialsRepo.upsertUserCredentials(userId, {
          brain_refresh_token: this.tokenEncryption.encrypt(access.refresh_token)
        });
      }

      return {
        access_token: access.access_token,
        expires_in: access.expires_in
      };
    } catch {
      throw new OAuthTokenError(
        'invalid_grant',
        400,
        'Failed to obtain access token from Brain'
      );
    }
  }

  protected async issueMiddlewareRefreshToken(
    clientId: string,
    userId: number
  ): Promise<string> {
    const plain = randomBytes(32).toString('base64url');
    const expiresAt = new Date(
      Date.now() + OAuthTokenService.REFRESH_TOKEN_TTL_MS
    ).toISOString();

    await this.refreshTokensRepo.create({
      refresh_token: hashOpaqueToken(plain),
      client_id: clientId,
      user_id: userId,
      expires_at: expiresAt
    });

    return plain;
  }
}
