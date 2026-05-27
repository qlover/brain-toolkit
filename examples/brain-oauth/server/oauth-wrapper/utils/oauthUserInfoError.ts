import { API_OAUTH_INVALID_TOKEN } from '@config/i18n-identifier/api';
import { oauthI18nIdToRfc } from '@config/oauthErrors';

/**
 * OAuth 2.0 / OpenID Connect userinfo error response.
 * `errorId` is an i18n key (`api:oauth_*`); `error` is the RFC wire value.
 */
export class OAuthUserInfoError extends Error {
  constructor(
    public readonly errorId: string = API_OAUTH_INVALID_TOKEN,
    public readonly status: number = 401
  ) {
    super(errorId);
    this.name = 'OAuthUserInfoError';
  }

  /** RFC / OIDC `error` field (always `invalid_token` for this endpoint today). */
  public get error(): string {
    return oauthI18nIdToRfc(this.errorId);
  }
}

export function oauthUserInfoErrorResponse(err: OAuthUserInfoError): Response {
  return Response.json(
    { error: err.error, error_id: err.errorId },
    { status: err.status }
  );
}
