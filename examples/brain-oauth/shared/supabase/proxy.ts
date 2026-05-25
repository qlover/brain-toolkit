import { NextResponse, type NextRequest } from 'next/server';
import { ROUTE_LOGIN, isOAuthMachinePath, isPublicPath } from '@config/route';
import {
  BRAIN_SESSION_COOKIE,
  parseBrainSessionCookie
} from '@server/utils/brainSessionUtils';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isOAuthMachinePath(pathname)) {
    return NextResponse.next({ request });
  }

  const raw = request.cookies.get(BRAIN_SESSION_COOKIE)?.value;
  const session = parseBrainSessionCookie(raw, process.env.SESSION_SECRET);

  if (!session && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    const returnPath = `${pathname}${request.nextUrl.search}`;
    url.pathname = ROUTE_LOGIN;
    url.search = `redirect=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
