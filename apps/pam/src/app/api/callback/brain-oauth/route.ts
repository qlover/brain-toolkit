import { ExecutorError } from '@qlover/fe-corekit/executor';
import { NextResponse } from 'next/server';
import { API_CALLBACK_BRAIN_OAUTH } from '@config/apiRoutes';
import { i18nConfig, type LocaleType } from '@config/i18n';
import {
  localeFromPathname,
  ROUTE_LOGIN,
  withLocalePrefix
} from '@config/route';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerConfig } from '@server/ServerConfig';
import type { BrainOAuthCallbackSuccess } from '@server/services/BrainOAuthLoginService';

const PKCE_COOKIE = 'pam_brain_oauth_pkce';

/**
 * Prefer PKCE locale / returnTo path, then NEXT_LOCALE cookie, then Accept-Language.
 */
function resolveLoginLocale(request: Request): LocaleType {
  const cookieHeader = request.headers.get('cookie') || '';

  const pkceRaw = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${PKCE_COOKIE}=([^;]+)`)
  )?.[1];
  if (pkceRaw) {
    try {
      const parsed = JSON.parse(decodeURIComponent(pkceRaw)) as {
        locale?: string;
        returnTo?: string;
      };
      if (
        typeof parsed.locale === 'string' &&
        (i18nConfig.supportedLngs as readonly string[]).includes(parsed.locale)
      ) {
        return parsed.locale as LocaleType;
      }
      if (typeof parsed.returnTo === 'string') {
        return localeFromPathname(parsed.returnTo);
      }
    } catch {
      // ignore malformed PKCE cookie
    }
  }

  const fromCookie = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${i18nConfig.storageKey}=([^;]+)`)
  )?.[1];
  if (fromCookie) {
    const value = decodeURIComponent(fromCookie);
    if ((i18nConfig.supportedLngs as readonly string[]).includes(value)) {
      return value as LocaleType;
    }
  }

  const accept = request.headers.get('accept-language')?.toLowerCase() || '';
  if (accept.includes('zh')) {
    return 'zh';
  }

  return i18nConfig.fallbackLng;
}

function loginErrorRedirect(request: Request, message: string): NextResponse {
  const { origin } = new URL(request.url);
  const locale = resolveLoginLocale(request);
  const loginUrl = new URL(withLocalePrefix(ROUTE_LOGIN, locale), origin);
  loginUrl.searchParams.set('error', message);
  return NextResponse.redirect(loginUrl.toString());
}

/**
 * Brain OAuth authorization-code callback (PKCE).
 *
 * Must set the session cookie on the redirect {@link NextResponse} itself.
 * `cookies().set()` alone is often dropped when returning `NextResponse.redirect()`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const rawQuery = Object.fromEntries(searchParams.entries());
  rawQuery.origin = origin;

  const server = new NextApiServer(API_CALLBACK_BRAIN_OAUTH);
  const config = new ServerConfig();

  try {
    const result = (await server.run(async ({ parameters: { IOC } }) =>
      IOC(UserController).loginWithBrainPkceCallback(rawQuery)
    )) as {
      success: boolean;
      data?: BrainOAuthCallbackSuccess;
      message?: string;
    };

    if (
      !result.success ||
      !result.data?.redirectUrl ||
      !result.data.sessionCookie
    ) {
      const message = result.message?.trim() || 'Brain OAuth callback failed';
      return loginErrorRedirect(request, message);
    }

    const { redirectUrl, sessionCookie } = result.data;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(sessionCookie.name, sessionCookie.value, {
      httpOnly: sessionCookie.httpOnly,
      secure: sessionCookie.secure,
      sameSite: sessionCookie.sameSite,
      path: sessionCookie.path,
      maxAge: sessionCookie.maxAge
    });
    // Ensure PKCE cookie is cleared on the redirect response too.
    response.cookies.set(PKCE_COOKIE, '', {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
    return response;
  } catch (error) {
    const message =
      error instanceof ExecutorError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Brain OAuth callback failed';
    return loginErrorRedirect(request, message);
  }
}
