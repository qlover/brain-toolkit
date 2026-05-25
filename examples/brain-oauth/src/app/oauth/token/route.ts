import { BootstrapServer } from '@server/BootstrapServer';
import { OAuthTokenController } from '@server/controllers/OAuthTokenController';
import { logRequestEvent } from '@server/utils/logRequestEvent';
import {
  OAuthTokenError,
  oauthTokenErrorResponse
} from '@server/utils/oauthTokenError';
import { parseOAuthTokenRequest } from '@server/utils/parseOAuthTokenRequest';
import type { NextRequest } from 'next/server';

function logOAuthTokenRequest(
  server: BootstrapServer,
  req: NextRequest,
  started: number,
  response: Response,
  success: boolean,
  payload?: Record<string, unknown>
): Response {
  logRequestEvent(server, req, {
    event_category: 'oauth',
    event_type: 'oauth.token',
    success,
    http_method: req.method,
    http_path: req.nextUrl.pathname,
    http_status: response.status,
    duration_ms: Math.round(performance.now() - started),
    request_id: server.requestId,
    payload
  });
  return response;
}

/**
 * OAuth 2.0 token endpoint (RFC 6749).
 *
 * Supports `grant_type=authorization_code` and `grant_type=refresh_token`.
 * Client authentication via HTTP Basic or form body parameters.
 */
export async function POST(req: NextRequest) {
  const server = new BootstrapServer('/oauth/token');
  const started = performance.now();

  let fields: Record<string, string>;
  try {
    fields = await parseOAuthTokenRequest(req);
  } catch {
    return logOAuthTokenRequest(
      server,
      req,
      started,
      oauthTokenErrorResponse(
        new OAuthTokenError(
          'invalid_request',
          400,
          'Unable to parse request body'
        )
      ),
      false
    );
  }

  if (!fields.grant_type) {
    return logOAuthTokenRequest(
      server,
      req,
      started,
      oauthTokenErrorResponse(
        new OAuthTokenError('invalid_request', 400, 'grant_type is required')
      ),
      false,
      { grant_type: null }
    );
  }

  const grantType = fields.grant_type;

  try {
    const tokens = await server
      .getIOC()(OAuthTokenController)
      .exchangeToken(fields);

    return logOAuthTokenRequest(
      server,
      req,
      started,
      Response.json(tokens, {
        status: 200,
        headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
      }),
      true,
      { grant_type: grantType }
    );
  } catch (err) {
    if (err instanceof OAuthTokenError) {
      return logOAuthTokenRequest(
        server,
        req,
        started,
        oauthTokenErrorResponse(err),
        false,
        { grant_type: grantType, oauth_error: err.error }
      );
    }

    return logOAuthTokenRequest(
      server,
      req,
      started,
      oauthTokenErrorResponse(
        new OAuthTokenError('server_error', 500, 'Internal server error')
      ),
      false,
      { grant_type: grantType }
    );
  }
}
