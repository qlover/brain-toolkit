import {
  apiCorsPreflightResponse,
  buildApiCorsHeaders
} from '@qlover/next-kit/server';
import { ROUTE_OAUTH_REVOKE } from '@config/route';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
import { NextApiServer } from '@server/NextApiServer';
import { loadRuntimeCorsConfig } from '@server/utils/loadRuntimeCorsConfig';
import { parseOAuthTokenRequest } from '../token/route';
import type { NextRequest } from 'next/server';

/**
 * CORS preflight for cross-origin OAuth revocation requests.
 */
export async function OPTIONS(req: NextRequest) {
  const corsConfig = await loadRuntimeCorsConfig(req);
  return apiCorsPreflightResponse(req, corsConfig);
}

/**
 * OAuth 2.0 token revocation endpoint (RFC 7009).
 */
export async function POST(req: NextRequest) {
  const corsConfig = await loadRuntimeCorsConfig(req);
  const corsHeaders = buildApiCorsHeaders(req, corsConfig);

  return await new NextApiServer({
    name: ROUTE_OAUTH_REVOKE,
    nextRequest: req,
    event_type: 'oauth-wrapper'
  }).runWithOAuthJson(
    async ({ parameters: { IOC } }) =>
      IOC(OAuthWrapperController).revokeToken(
        await parseOAuthTokenRequest(req)
      ),
    corsHeaders
      ? { successHeaders: corsHeaders, errorHeaders: corsHeaders }
      : undefined
  );
}
