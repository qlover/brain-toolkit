import jwt from 'jsonwebtoken';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSessionPath, ROUTE_LOGIN } from '@config/route';
import { ServerConfig } from '@server/ServerConfig';
import type { OAuthSessionPayload } from '@qlover/oauth-wrapper';

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
    url.pathname = ROUTE_LOGIN;
    url.search = `redirect=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(url);
  }

  return response;
}
