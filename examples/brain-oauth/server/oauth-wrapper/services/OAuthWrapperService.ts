import { randomBytes } from 'crypto';
import { ExecutorError } from '@qlover/fe-corekit';
import { inject } from '@shared/container';
import {
  OAuthAuthorizeQueryValidator,
  OAuthConsentBodyValidator
} from '@shared/validators/OAuthAuthorizeValidator';
import {
  API_OAUTH_ACCESS_DENIED,
  API_OAUTH_INVALID_REQUEST,
  API_OAUTH_INVALID_SCOPE,
  API_OAUTH_UNAUTHORIZED_CLIENT,
  API_OAUTH_UNSUPPORTED_RESPONSE_TYPE
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { oauthI18nIdToRedirectError } from '@config/oauthErrors';
import { OAuthConsentBody } from '@schemas/oauth/OAuthAuthorizeSchema';
import type { OAuthTokenResponse } from '@schemas/oauth/OAuthClientSchema';

import type { OAuthUserInfoResponse } from '@schemas/oauth/OAuthUserInfoSchema';
import type { OAuthAuthorizePageData } from '@interfaces/oauth/OAuthAuthorizePageData';
import { BrainSessionService } from '@server/services/BrainSessionService';
import { OAuthTokenService } from './OAuthTokenService';
import {
  type OAuthUserAdapterInterface,
  OAuthUserProfile
} from '../interfaces/OAuthUserAdapterInterface';
import { OAuthClientsRepository } from '../repositorys/OAuthClientsRepository';
import { OAuthWrapperRepository } from '../repositorys/OAuthWrapperRepository';
import {
  isRedirectUriAllowed,
  normalizeQuery,
  validatePkceParams
} from '../utils/authorizeUtil';
import {
  buildOAuthRedirectUrl,
  parseScopeList
} from '../utils/oauthRedirectUtils';
import { OAuthUserInfoError } from '../utils/oauthUserInfoError';
import type {
  OAuthAuthorizeValidationError,
  OAuthConsentResult,
  OAuthServiceInterface
} from '../interfaces/OAuthServiceInterface';
import type { OAuthWrapperRepositoryInterface } from '../interfaces/OAuthWrapperRepositoryInterface';

const AUTH_CODE_TTL_MS = 5 * 60 * 1000;

export class OAuthWrapperService implements OAuthServiceInterface {
  constructor(
    @inject(I.OAuthUserAdapterInterface)
    protected userAdapter: OAuthUserAdapterInterface,
    @inject(OAuthClientsRepository)
    protected clientsRepo: OAuthClientsRepository,
    @inject(OAuthAuthorizeQueryValidator)
    protected queryValidator: OAuthAuthorizeQueryValidator,
    @inject(OAuthConsentBodyValidator)
    protected consentValidator: OAuthConsentBodyValidator,
    @inject(OAuthWrapperRepository)
    protected oauthRepo: OAuthWrapperRepositoryInterface,
    @inject(BrainSessionService)
    protected brainSession: BrainSessionService,
    @inject(OAuthTokenService)
    protected tokenService: OAuthTokenService
  ) {}

  /**
   * @override
   */
  public async resolveAuthorizePage(
    rawQuery: Record<string, string | string[] | undefined>
  ): Promise<
    | { ok: true; data: OAuthAuthorizePageData }
    | { ok: false; error: OAuthAuthorizeValidationError }
  > {
    const query = normalizeQuery(rawQuery);

    let parsed;
    try {
      parsed = await this.queryValidator.getThrow(query);
    } catch {
      return {
        ok: false,
        error: {
          errorKey: API_OAUTH_INVALID_REQUEST,
          message: 'Missing or invalid authorization request parameters.'
        }
      };
    }

    if (parsed.response_type !== 'code') {
      return {
        ok: false,
        error: {
          errorKey: API_OAUTH_UNSUPPORTED_RESPONSE_TYPE,
          message: 'Only response_type=code is supported.'
        }
      };
    }

    const client = await this.clientsRepo.findByClientId(parsed.client_id);
    if (!client) {
      return {
        ok: false,
        error: {
          errorKey: API_OAUTH_UNAUTHORIZED_CLIENT,
          message: 'Unknown client_id.'
        }
      };
    }

    if (!isRedirectUriAllowed(parsed.redirect_uri, client)) {
      return {
        ok: false,
        error: {
          errorKey: API_OAUTH_UNAUTHORIZED_CLIENT,
          message: 'redirect_uri is not registered for this client.'
        }
      };
    }

    const requestedScopes = parseScopeList(parsed.scope);
    const invalidScope = requestedScopes.find(
      (scope) => !client.scopes.includes(scope)
    );
    if (invalidScope) {
      return {
        ok: false,
        error: {
          errorKey: API_OAUTH_INVALID_SCOPE,
          message: `Scope "${invalidScope}" is not allowed for this client.`
        }
      };
    }

    const pkceError = validatePkceParams(parsed, client.confidential);
    if (pkceError) {
      return { ok: false, error: pkceError };
    }

    return {
      ok: true,
      data: {
        clientId: client.client_id,
        clientName: client.client_name,
        clientUri: client.client_uri ?? null,
        logoUri: client.logo_uri ?? null,
        redirectUri: parsed.redirect_uri,
        scopes: requestedScopes,
        state: parsed.state,
        responseType: 'code',
        codeChallenge: parsed.code_challenge,
        codeChallengeMethod: parsed.code_challenge_method,
        confidential: client.confidential
      }
    };
  }
  /**
   * @override
   */
  public async processConsent(
    requestBody: unknown
  ): Promise<OAuthConsentResult> {
    let body: OAuthConsentBody;
    try {
      body = await this.consentValidator.getThrow(requestBody);
    } catch {
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        'Invalid consent request body'
      );
    }

    const session = await this.brainSession.getSession();
    if (!session) {
      throw new ExecutorError(
        API_OAUTH_ACCESS_DENIED,
        'User session expired. Please sign in again.'
      );
    }

    const pageResult = await this.resolveAuthorizePage({
      response_type: 'code',
      client_id: body.client_id,
      redirect_uri: body.redirect_uri,
      scope: body.scope,
      state: body.state,
      code_challenge: body.code_challenge,
      code_challenge_method: body.code_challenge_method
    });

    if (!pageResult.ok) {
      throw new ExecutorError(
        pageResult.error.errorKey,
        pageResult.error.message
      );
    }

    const { data } = pageResult;

    if (body.action === 'deny') {
      return {
        redirectUrl: buildOAuthRedirectUrl(data.redirectUri, {
          error: oauthI18nIdToRedirectError(API_OAUTH_ACCESS_DENIED),
          error_description: 'The resource owner denied the request',
          state: data.state
        })
      };
    }

    const code = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_MS).toISOString();

    await this.oauthRepo.create({
      code,
      client_id: data.clientId,
      user_id: session.userId,
      redirect_uri: data.redirectUri,
      scope: data.scopes.join(' ') || null,
      code_challenge: data.codeChallenge ?? null,
      code_challenge_method: data.codeChallengeMethod ?? null,
      expires_at: expiresAt
    });

    // trust flag reserved for future auto-consent storage
    void body.trust;

    return {
      redirectUrl: buildOAuthRedirectUrl(data.redirectUri, {
        code,
        state: data.state
      })
    };
  }
  /**
   * @override
   */
  public async exchangeToken(
    rawFields: Record<string, string>
  ): Promise<OAuthTokenResponse> {
    return await this.tokenService.exchangeToken(rawFields);
  }

  /**
   * @override
   */
  public async getUserInfo(
    accessToken: string
  ): Promise<OAuthUserInfoResponse> {
    try {
      const profile =
        await this.userAdapter.getUserInfoByAccessToken(accessToken);
      return this.toUserInfoResponse(profile);
    } catch {
      throw new OAuthUserInfoError();
    }
  }

  protected toUserInfoResponse(
    profile: OAuthUserProfile
  ): OAuthUserInfoResponse {
    const sub = String(profile.id);
    if (!sub || sub === 'NaN') {
      throw new OAuthUserInfoError();
    }

    const email = profile.email?.trim();
    if (!email) {
      throw new OAuthUserInfoError();
    }

    const nameFromParts = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ');
    const name = profile.name?.trim() || nameFromParts || email;

    return {
      sub,
      email,
      name,
      ...(profile.roles?.length ? { roles: profile.roles } : {})
    };
  }
}
