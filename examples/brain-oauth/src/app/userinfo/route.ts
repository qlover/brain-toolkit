import { BootstrapServer } from '@server/BootstrapServer';
import { OAuthUserInfoController } from '@server/controllers/OAuthUserInfoController';
import {
  OAuthUserInfoError,
  oauthUserInfoErrorResponse
} from '@server/utils/oauthUserInfoError';
import { parseBearerAuthorization } from '@server/utils/parseBearerAuthorization';
import type { NextRequest } from 'next/server';

/**
 * OAuth 2.0 / OIDC userinfo endpoint.
 *
 * Requires `Authorization: Bearer <access_token>` from `POST /oauth/token`.
 */
export async function GET(req: NextRequest) {
  const accessToken = parseBearerAuthorization(
    req.headers.get('authorization')
  );

  if (!accessToken) {
    return oauthUserInfoErrorResponse(new OAuthUserInfoError());
  }

  const IOC = new BootstrapServer('/userinfo').getIOC();

  try {
    const profile = await IOC(OAuthUserInfoController).getUserInfo(accessToken);

    return Response.json(profile, {
      status: 200,
      headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache' }
    });
  } catch (err) {
    if (err instanceof OAuthUserInfoError) {
      return oauthUserInfoErrorResponse(err);
    }

    return oauthUserInfoErrorResponse(new OAuthUserInfoError());
  }
}
