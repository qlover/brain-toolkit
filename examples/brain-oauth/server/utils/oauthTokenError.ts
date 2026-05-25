import { oauthI18nIdToRfc } from '@config/oauthErrors';

/**
 * OAuth 2.0 token endpoint error (RFC 6749).
 * `errorId` is an i18n key (`api:oauth_*`); `error` is the RFC wire value.
 */
export class OAuthTokenError extends Error {
  constructor(
    public readonly errorId: string,
    public readonly status: number,
    public readonly errorDescription?: string
  ) {
    super(errorDescription ?? errorId);
    this.name = 'OAuthTokenError';
  }

  /** RFC 6749 `error` field for token endpoint JSON responses. */
  public get error(): string {
    return oauthI18nIdToRfc(this.errorId);
  }
}

export function oauthTokenErrorResponse(err: OAuthTokenError): Response {
  return Response.json(
    {
      error: err.error,
      error_id: err.errorId,
      ...(err.errorDescription
        ? { error_description: err.errorDescription }
        : {})
    },
    { status: err.status }
  );
}
