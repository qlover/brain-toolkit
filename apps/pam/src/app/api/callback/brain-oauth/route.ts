import { ExecutorError } from '@qlover/fe-corekit/executor';
import { NextResponse } from 'next/server';
import { API_CALLBACK_BRAIN_OAUTH } from '@config/apiRoutes';
import { UserController } from '@server/controllers/UserController';
import { NextApiServer } from '@server/NextApiServer';
import { ServerConfig } from '@server/ServerConfig';
import type { BrainOAuthCallbackSuccess } from '@server/services/BrainOAuthLoginService';

const PKCE_COOKIE = 'pam_brain_oauth_pkce';

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
      const loginUrl = new URL('/zh/auth/login', origin);
      loginUrl.searchParams.set('error', message);
      return NextResponse.redirect(loginUrl.toString());
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
    const loginUrl = new URL('/zh/auth/login', origin);
    loginUrl.searchParams.set('error', message);
    return NextResponse.redirect(loginUrl.toString());
  }
}
