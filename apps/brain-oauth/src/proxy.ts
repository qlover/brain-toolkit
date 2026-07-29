// Import your routing configuration which contains all locales, defaultLocale, and pathnames
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { isOAuthMachinePath } from '@config/route';
import { oauthWrapperProxySession } from '@server/utils/OAuthWrapperProxy';
import { routing } from './i18n/routing';

/**
 * Middleware main logic
 *
 * Auth layering:
 * 1. Skip OAuth machine endpoints (token/revoke/userinfo)
 * 2. Page-entry gate for LOGINED_PAGES via oauthWrapperProxySession
 *
 * Client `useUserAuth` is not an entry gate — only local UI / user store.
 * App Router ≈ public/SSG; Pages Router ≈ logged-in CSR consoles.
 */
export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isOAuthMachinePath(pathname)) {
    return NextResponse.next({ request });
  }

  // OAuth wrapper auth (LOGINED_PAGES session gate):
  const sessionResponse = await oauthWrapperProxySession(request);
  if (sessionResponse.headers.get('Location')) {
    return sessionResponse;
  }

  return createMiddleware(routing)(request);
}

// Next.js middleware configuration object
export const config = {
  matcher: [
    '/', // Match the root path explicitly

    // Match all paths except for:
    // - API routes
    // - Next.js internals (_next/*)
    // - Static files (*.svg, *.png, *.jpg, *.jpeg, *.gif, *.ico)
    // - Other static assets and special files
    // - Manifest file (manifest.webmanifest)
    '/((?!api|_next|.*\\.(?:svg|png|jpg|jpeg|gif|ico)|favicon.ico|sitemap.xml|sitemap-0.xml|manifest.webmanifest).*)'
  ]
};
