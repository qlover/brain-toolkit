/**
 * OAuth 2.0 token endpoint error (RFC 6749).
 */
export class OAuthTokenError extends Error {
  constructor(
    public readonly error: string,
    public readonly status: number,
    public readonly errorDescription?: string
  ) {
    super(errorDescription ?? error);
    this.name = 'OAuthTokenError';
  }
}

export function oauthTokenErrorResponse(err: OAuthTokenError): Response {
  return Response.json(
    {
      error: err.error,
      ...(err.errorDescription
        ? { error_description: err.errorDescription }
        : {})
    },
    { status: err.status }
  );
}
