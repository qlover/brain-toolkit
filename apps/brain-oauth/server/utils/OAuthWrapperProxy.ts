import jwt from 'jsonwebtoken';
import { NextResponse, type NextRequest } from 'next/server';
import { useLocaleRoutes } from '@config/common';
import { i18nConfig } from '@config/i18n';
import { hasSessionPath, ROUTE_LOGIN } from '@config/route';
import { ServerConfig } from '@server/ServerConfig';
import type { OAuthSessionPayload } from '@qlover/oauth-wrapper';

function loginPathnameForRequest(pathname: string): string {
  if (!useLocaleRoutes) {
    return ROUTE_LOGIN;
  }

  const first = pathname.split('/').filter(Boolean)[0];
  if (
    first &&
    (i18nConfig.supportedLngs as readonly string[]).includes(first)
  ) {
    return `/${first}${ROUTE_LOGIN}`;
  }

  return `/${i18nConfig.fallbackLng}${ROUTE_LOGIN}`;
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
 * Next OAuth Wrapper session gate for LOGINED_PAGES.
 * Validates signed session cookie and redirects unauthenticated users to login.
 * Client `useUserAuth` is local UI only — not a page-entry gate.
 */
export async function oauthWrapperProxySession(request: NextRequest) {
  const response = NextResponse.next({
    request
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return response;
  }

  const serverConfig = new ServerConfig();
  const pathname = request.nextUrl.pathname;
  if (!hasSessionPath(pathname)) {
    return response;
  }

  const raw = request.cookies.get(serverConfig.oauthSessionKey)?.value;
  const session = parseOAuthAppSessionCookie(raw, sessionSecret);

  if (!session) {
    const url = request.nextUrl.clone();
    const returnPath = `${pathname}${request.nextUrl.search}`;
    url.pathname = loginPathnameForRequest(pathname);
    url.search = `redirect=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
