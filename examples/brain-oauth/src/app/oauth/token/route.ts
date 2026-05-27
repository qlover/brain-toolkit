import {
  API_OAUTH_INVALID_REQUEST,
  API_OAUTH_SERVER_ERROR
} from '@config/i18n-identifier/api';
import { BootstrapServer } from '@server/BootstrapServer';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
import {
  OAuthTokenError,
  oauthTokenErrorResponse
} from '@server/oauth-wrapper/utils/oauthTokenError';
import { parseOAuthTokenRequest } from '@server/oauth-wrapper/utils/parseOAuthTokenRequest';
import { logRequestEvent } from '@server/utils/logRequestEvent';
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
          API_OAUTH_INVALID_REQUEST,
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
        new OAuthTokenError(
          API_OAUTH_INVALID_REQUEST,
          400,
          'grant_type is required'
        )
      ),
      false,
      { grant_type: null }
    );
  }

  const grantType = fields.grant_type;

  try {
    const tokens = await server
      .getIOC()(OAuthWrapperController)
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
        new OAuthTokenError(
          API_OAUTH_SERVER_ERROR,
          500,
          'Internal server error'
        )
      ),
      false,
      { grant_type: grantType }
    );
  }
}
