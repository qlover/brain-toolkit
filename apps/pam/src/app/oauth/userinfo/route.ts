import { OAuthWrapperError } from '@qlover/oauth-wrapper';
import { isEmpty } from 'lodash-es';
import {
  resolveUserDisplayLabel,
  toBusinessEmail
} from '@shared/utils/pamUserIdentity';
import { ROUTE_OAUTH_USERINFO } from '@config/route';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
import { NextApiServer } from '@server/NextApiServer';
import { ApiCorsPlugin } from '@server/plugins/ApiCorsPlugin';
import { PamUserService } from '@server/services/PamUserService';
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
 * Returns flat OIDC claims (`sub`, `email`, `name`, …) without the app API envelope.
 *
 * Phone-only accounts: `auth.users` may still hold `@phone.pam.local` for session
 * minting, but outbound claims use `pam_users` (business email + display_name).
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
      const pam = await IOC(PamUserService).ensurePamUser({
        id: String(user.id),
        email: user.email ?? null
      });

      const businessEmail = toBusinessEmail(pam.email ?? user.email);
      const phone = pam.phone?.trim() || null;
      const name = resolveUserDisplayLabel({
        displayName: pam.display_name,
        phone,
        email: businessEmail,
        userId: pam.id
      });

      return {
        sub: String(user.id),
        email: businessEmail ?? '',
        email_verified: Boolean(businessEmail),
        name,
        ...(phone ? { phone_number: phone } : {})
      };
    });
}
