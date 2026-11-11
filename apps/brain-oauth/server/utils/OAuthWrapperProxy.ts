import { createPamenv } from '@pamenv/next';
import jwt from 'jsonwebtoken';
import { NextResponse, type NextRequest } from 'next/server';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { useLocaleRoutes } from '@config/common';
import { i18nConfig } from '@config/i18n';
import {
  hasSessionPath,
  isAdminOnlyPath,
  ROUTE_ADMIN,
  ROUTE_LOGIN
} from '@config/route';
import { ServerConfig } from '@server/ServerConfig';
import type { UserSchema } from '@qlover/next-kit/common';
import type {
  OAuthSessionPayload,
  WithUserSession
} from '@qlover/oauth-wrapper';

function localizedPathForRequest(pathname: string, route: string): string {
  if (!useLocaleRoutes) {
    return route;
  }

  const first = pathname.split('/').filter(Boolean)[0];
  if (
    first &&
    (i18nConfig.supportedLngs as readonly string[]).includes(first)
  ) {
    return `/${first}${route}`;
  }

  return `/${i18nConfig.fallbackLng}${route}`;
}

export function parseOAuthAppSessionCookie(
  raw: string | undefined,
  secret: string | undefined
): OAuthSessionPayload | null {
  if (!raw || !secret) {
    return null;
  }
  try {
    return jwt.verify(raw, secret) as OAuthSessionPayload;
  } catch {
    return null;
  }
}

/**
 * Next OAuth Wrapper session gate for LOGINED_PAGES。
 * Proxy 为 Node：先解封袋再验 cookie；无密钥则放行（本地未注入时不挡）。
 */
export async function oauthWrapperProxySession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const bag = await createPamenv({
    only: ['SESSION_SECRET', 'OAUTH_SESSION_KEY']
  });
  const serverConfig = new ServerConfig();
  serverConfig.bindPamenvBag(bag);

  const sessionSecret = serverConfig.sessionSecret;
  if (!sessionSecret) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  if (!hasSessionPath(pathname)) {
    return response;
  }

  const raw = request.cookies.get(serverConfig.oauthSessionKey)?.value;
  const session = parseOAuthAppSessionCookie(raw, sessionSecret);

  if (!session) {
    const url = request.nextUrl.clone();
    const returnPath = `${pathname}${request.nextUrl.search}`;
    url.pathname = localizedPathForRequest(pathname, ROUTE_LOGIN);
    url.search = `redirect=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(url);
  }

  if (
    isAdminOnlyPath(pathname) &&
    !isBrainAdminUser(
      (session as WithUserSession<OAuthSessionPayload, UserSchema>).user
    )
  ) {
    const url = request.nextUrl.clone();
    url.pathname = localizedPathForRequest(pathname, ROUTE_ADMIN);
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
