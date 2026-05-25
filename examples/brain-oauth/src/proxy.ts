// Import your routing configuration which contains all locales, defaultLocale, and pathnames
import { isOAuthMachinePath } from '@config/route';
import { updateSession } from '@shared/supabase/proxy';
import { routing } from './i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isOAuthMachinePath(pathname)) {
    return NextResponse.next({ request });
  }

  const sessionResponse = await updateSession(request);
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
