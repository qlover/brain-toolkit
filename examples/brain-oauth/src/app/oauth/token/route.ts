import { BootstrapServer } from '@server/BootstrapServer';
import { OAuthTokenController } from '@server/controllers/OAuthTokenController';
import {
  OAuthTokenError,
  oauthTokenErrorResponse
} from '@server/utils/oauthTokenError';
import { parseOAuthTokenRequest } from '@server/utils/parseOAuthTokenRequest';
import type { NextRequest } from 'next/server';

/**
 * OAuth 2.0 token endpoint (RFC 6749).
 *
 * Supports `grant_type=authorization_code` and `grant_type=refresh_token`.
 * Client authentication via HTTP Basic or form body parameters.
 */
export async function POST(req: NextRequest) {
  let fields: Record<string, string>;
  try {
    fields = await parseOAuthTokenRequest(req);
  } catch {
    return oauthTokenErrorResponse(
      new OAuthTokenError('invalid_request', 400, 'Unable to parse request body')
    );
  }

  if (!fields.grant_type) {
    return oauthTokenErrorResponse(
      new OAuthTokenError('invalid_request', 400, 'grant_type is required')
    );
  }

  const IOC = new BootstrapServer('/oauth/token').getIOC();

  try {
    const tokens = await IOC(OAuthTokenController).exchangeToken(fields);

    return Response.json(tokens, {
      status: 200,
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
    });
  } catch (err) {
    if (err instanceof OAuthTokenError) {
      return oauthTokenErrorResponse(err);
    }

    return oauthTokenErrorResponse(
      new OAuthTokenError('server_error', 500, 'Internal server error')
    );
  }
}
