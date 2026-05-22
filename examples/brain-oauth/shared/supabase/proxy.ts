import { NextResponse, type NextRequest } from 'next/server';
import { ROUTE_LOGIN, isPublicPath } from '@config/route';
import {
  BRAIN_SESSION_COOKIE,
  parseBrainSessionCookie
} from '@server/utils/brainSessionUtils';

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const raw = request.cookies.get(BRAIN_SESSION_COOKIE)?.value;
  const session = parseBrainSessionCookie(raw, process.env.SESSION_SECRET);

  if (!session && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTE_LOGIN;
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
