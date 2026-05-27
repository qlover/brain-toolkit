import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath, ROUTE_LOGIN } from '@config/route';
import {
  BRAIN_SESSION_COOKIE,
  parseBrainSessionCookie
} from '@server/brain-oauth/brainProxySession';

/**
 * Brain OAuth session gate: validates signed session cookie and redirects unauthenticated users.
 *
 * Mirrors `updateSession` in `@shared/supabase/proxy` — early env skip, auth check, and
 * returning `NextResponse.next({ request })` so any future cookie updates stay in sync.
 */
export async function updateBrainSession(request: NextRequest) {
  const brainResponse = NextResponse.next({
    request
  });

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    return brainResponse;
  }

  const pathname = request.nextUrl.pathname;
  const raw = request.cookies.get(BRAIN_SESSION_COOKIE)?.value;
  const session = parseBrainSessionCookie(raw, sessionSecret);

  console.log('Proxy(brain) logged?', !!session, session?.email);

  if (!session && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    const returnPath = `${pathname}${request.nextUrl.search}`;
    url.pathname = ROUTE_LOGIN;
    url.search = `redirect=${encodeURIComponent(returnPath)}`;
    return NextResponse.redirect(url);
  }

  // IMPORTANT: Return brainResponse as-is (same contract as Supabase updateSession).
  // If you create a new NextResponse, pass { request } and copy cookies from brainResponse.

  return brainResponse;
}

/** @deprecated Use {@link updateBrainSession} */
export const brainProxy = updateBrainSession;
