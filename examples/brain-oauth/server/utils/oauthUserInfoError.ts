/**
 * OAuth 2.0 / OpenID Connect userinfo error response.
 */
export class OAuthUserInfoError extends Error {
  constructor(
    public readonly error: 'invalid_token',
    public readonly status: number
  ) {
    super(error);
    this.name = 'OAuthUserInfoError';
  }
}

export function oauthUserInfoErrorResponse(err: OAuthUserInfoError): Response {
  return Response.json({ error: err.error }, { status: err.status });
}
