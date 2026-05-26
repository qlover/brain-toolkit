import { inject, injectable } from '@shared/container';
import { OAuthAuthorizeQueryValidator } from '@shared/validators/OAuthAuthorizeValidator';
import {
  API_OAUTH_INVALID_REQUEST,
  API_OAUTH_INVALID_SCOPE,
  API_OAUTH_UNAUTHORIZED_CLIENT,
  API_OAUTH_UNSUPPORTED_RESPONSE_TYPE
} from '@config/i18n-identifier/api';
import type { OAuthClientRow } from '@schemas/oauth/OAuthAuthorizeSchema';
import { OAuthClientsRepository } from '../repositorys/OAuthClientsRepository';
import { isValidCodeChallenge } from '../utils/pkce';
import { parseScopeList } from '../utils/oauthRedirectUtils';

export type OAuthAuthorizePageData = {
  clientId: string;
  clientName: string;
  clientUri: string | null;
  logoUri: string | null;
  redirectUri: string;
  scopes: string[];
  state?: string;
  responseType: 'code';
  codeChallenge?: string;
  codeChallengeMethod?: 'S256';
  confidential: boolean;
};

export type OAuthAuthorizeValidationError = {
  errorKey: string;
  message: string;
};

/**
 * Validates OAuth authorize query params and loads client metadata for the consent page.
 *
 * Significance: Server-side gate before rendering the authorize UI.
 * Main purpose: Enforce OAuth 2.0 parameter and client registration rules.
 *
 * @example
 * const page = await service.resolveAuthorizePage(searchParams);
 */
@injectable()
export class OAuthAuthorizeService {
  constructor(
    @inject(OAuthClientsRepository)
    protected clientsRepo: OAuthClientsRepository,
    @inject(OAuthAuthorizeQueryValidator)
    protected queryValidator: OAuthAuthorizeQueryValidator
  ) {}

  public async resolveAuthorizePage(
    rawQuery: Record<string, string | string[] | undefined>
  ): Promise<
    | { ok: true; data: OAuthAuthorizePageData }
    | { ok: false; error: OAuthAuthorizeValidationError }
  > {
    const query = this.normalizeQuery(rawQuery);

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

    if (!this.isRedirectUriAllowed(parsed.redirect_uri, client)) {
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

    const pkceError = this.validatePkceParams(parsed, client.confidential);
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

  protected validatePkceParams(
    parsed: {
      code_challenge?: string;
      code_challenge_method?: 'S256';
    },
    confidential: boolean
  ): OAuthAuthorizeValidationError | null {
    const hasChallenge = Boolean(parsed.code_challenge?.trim());
    const hasMethod = Boolean(parsed.code_challenge_method);

    if (!confidential) {
      if (!hasChallenge || parsed.code_challenge_method !== 'S256') {
        return {
          errorKey: API_OAUTH_INVALID_REQUEST,
          message:
            'Public clients must send code_challenge and code_challenge_method=S256.'
        };
      }
      if (!isValidCodeChallenge(parsed.code_challenge!)) {
        return {
          errorKey: API_OAUTH_INVALID_REQUEST,
          message: 'Invalid code_challenge.'
        };
      }
      return null;
    }

    if (hasChallenge !== hasMethod) {
      return {
        errorKey: API_OAUTH_INVALID_REQUEST,
        message:
          'code_challenge and code_challenge_method must be sent together.'
      };
    }

    if (hasChallenge) {
      if (parsed.code_challenge_method !== 'S256') {
        return {
          errorKey: API_OAUTH_INVALID_REQUEST,
          message: 'Only code_challenge_method=S256 is supported.'
        };
      }
      if (!isValidCodeChallenge(parsed.code_challenge!)) {
        return {
          errorKey: API_OAUTH_INVALID_REQUEST,
          message: 'Invalid code_challenge.'
        };
      }
    }

    return null;
  }

  protected normalizeQuery(
    raw: Record<string, string | string[] | undefined>
  ): Record<string, string | undefined> {
    const result: Record<string, string | undefined> = {};

    for (const [key, value] of Object.entries(raw)) {
      if (Array.isArray(value)) {
        result[key] = value[0];
      } else {
        result[key] = value;
      }
    }

    if (!result.response_type) {
      result.response_type = 'code';
    }

    return result;
  }

  protected isRedirectUriAllowed(
    redirectUri: string,
    client: OAuthClientRow
  ): boolean {
    return client.redirect_uris.includes(redirectUri);
  }
}
