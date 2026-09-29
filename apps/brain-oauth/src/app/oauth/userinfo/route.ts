import { OAuthWrapperError } from '@qlover/oauth-wrapper';
import { isEmpty } from 'lodash';
import { ROUTE_OAUTH_USERINFO } from '@config/route';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
import { NextApiServer } from '@server/NextApiServer';
import { ApiCorsPlugin } from '@server/plugins/ApiCorsPlugin';
import type { NextRequest } from 'next/server';

export function parseBearerAuthorization(
  header: string | null
): string | undefined {
  if (!header) {
    return undefined;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token || undefined;
}

/**
 * CORS preflight for cross-origin userinfo requests.
 */
export async function OPTIONS(req: NextRequest) {
  return new ApiCorsPlugin({ path: ROUTE_OAUTH_USERINFO }).preflight(req);
}

/**
 * OAuth 2.0 / OIDC userinfo endpoint.
 *
 * Requires `Authorization: Bearer <access_token>` from `POST /oauth/token`.
 * Returns flat OIDC claims (`sub`, `email`, …) without the app API envelope.
 */
export async function GET(req: NextRequest) {
  return await new NextApiServer({
    name: ROUTE_OAUTH_USERINFO,
    nextRequest: req,
    event_type: 'oauth-wrapper'
  })
    .use(new ApiCorsPlugin({ path: ROUTE_OAUTH_USERINFO, request: req }))
    .runWithOAuthJson(async ({ parameters: { IOC } }) => {
      const accessToken = parseBearerAuthorization(
        req.headers.get('authorization')
      );

      if (isEmpty(accessToken)) {
        throw new OAuthWrapperError(
          'invalid_token',
          401,
          'Invalid authorization header'
        );
      }

      const user = await IOC(OAuthWrapperController).getUserInfo(accessToken!);

      const phone = user.phone?.trim() || null;
      return {
        sub: String(user.id),
        email: user.email,
        // Brain verifies email at registration.
        email_verified: Boolean(user.email),
        name: user.name?.trim() || user.email || String(user.id),
        ...(phone ? { phone_number: phone } : {})
      };
    });
}
