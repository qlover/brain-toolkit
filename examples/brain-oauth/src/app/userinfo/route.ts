import {
  OAuthUserInfoError,
  oauthUserInfoErrorResponse
} from '@shared/oauth-wrapper/utils/oauthUserInfoError';
import { BootstrapServer } from '@server/BootstrapServer';
import { OAuthWrapperController } from '@server/controllers/OAuthWrapperController';
import type { NextRequest } from 'next/server';

function parseBearerAuthorization(header: string | null): string | undefined {
  if (!header) {
    return undefined;
  }

  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token || undefined;
}

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
    const profile = await IOC(OAuthWrapperController).getUserInfo(accessToken);

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
