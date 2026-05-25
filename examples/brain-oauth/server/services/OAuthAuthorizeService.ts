import { inject, injectable } from '@shared/container';
import { OAuthAuthorizeQueryValidator } from '@shared/validators/OAuthAuthorizeValidator';
import type { OAuthClientRow } from '@schemas/oauth/OAuthAuthorizeSchema';
import { OAuthClientsRepository } from '../repositorys/OAuthClientsRepository';
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
          errorKey: 'invalid_request',
          message: 'Missing or invalid authorization request parameters.'
        }
      };
    }

    if (parsed.response_type !== 'code') {
      return {
        ok: false,
        error: {
          errorKey: 'unsupported_response_type',
          message: 'Only response_type=code is supported.'
        }
      };
    }

    const client = await this.clientsRepo.findByClientId(parsed.client_id);
    if (!client) {
      return {
        ok: false,
        error: {
          errorKey: 'unauthorized_client',
          message: 'Unknown client_id.'
        }
      };
    }

    if (!this.isRedirectUriAllowed(parsed.redirect_uri, client)) {
      return {
        ok: false,
        error: {
          errorKey: 'unauthorized_client',
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
          errorKey: 'invalid_scope',
          message: `Scope "${invalidScope}" is not allowed for this client.`
        }
      };
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
        responseType: 'code'
      }
    };
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
