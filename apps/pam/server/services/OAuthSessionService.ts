import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  hasSessionPath,
  isPlatformAdminPath,
  redirectToPath,
  redirectToProjects
} from '@config/route';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type { OAuthSessionServiceInterface } from '@server/interfaces/OAuthSessionServiceInterface';
import { checkPlatformAdmin } from '@server/utils/checkPlatformAdmin';
import { isSessionPayloadRevoked } from '@server/utils/sessionRevocation';
import type { UserSchema } from '@qlover/next-kit/common';
import type {
  OAuthSessionInterface,
  OAuthSessionPayload
} from '@qlover/oauth-wrapper';
import type { NextRequest } from 'next/server';

export type PamCliBearerVerifierType = (
  token: string
) => Promise<OAuthSessionPayload | null>;

/**
 * 页面访问权限与 cookie session。
 *
 * `SESSION_SECRET` / `OAUTH_SESSION_KEY` **用时再读** `config` getter，
 * 避免 IOC 急切构造时密封快照尚未 `createPamenv`。
 */
export class OAuthSessionService
  implements
    OAuthSessionServiceInterface,
    OAuthSessionInterface<OAuthSessionPayload, UserSchema>
{
  constructor(
    protected readonly config: SeedServerConfigInterface,
    protected readonly verifyCliBearer?: PamCliBearerVerifierType
  ) {}

  /**
   * 惰性读 session 签名密钥（构造期不 snapshot）。
   */
  protected get sessionSecret(): string {
    const secret = this.config.sessionSecret;
    if (!secret) {
      throw new Error(
        'Session secret is not set, You can set process.env.SESSION_SECRET to fix this error'
      );
    }
    return secret;
  }

  /**
   * 惰性读 cookie 名。
   */
  protected get sessionKey(): string {
    const key = this.config.oauthSessionKey;
    if (!key) {
      throw new Error(
        'Session key is not set, You can set process.env.OAUTH_SESSION_KEY to fix this error'
      );
    }
    return key;
  }

  protected get secure(): boolean {
    return this.config.isProduction;
  }

  protected parseJWT(raw: string, secret: string): OAuthSessionPayload | null {
    if (!raw || !secret) {
      return null;
    }
    try {
      return jwt.verify(raw, secret) as OAuthSessionPayload;
    } catch {
      return null;
    }
  }

  protected generateJWT(payload: OAuthSessionPayload): string {
    const token = jwt.sign(payload, this.sessionSecret, { expiresIn: '7d' });
    return token;
  }

  /**
   * @override
   */
  public hasNeedProxy(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname;
    return hasSessionPath(pathname);
  }
  /**
   * @override
   */
  public async sessionProxy(
    request: NextRequest,
    nextResponse?: NextResponse<unknown>
  ): Promise<NextResponse<unknown>> {
    // 如果环境没有准备则直接重定向
    if (!this.sessionSecret || !this.sessionKey) {
      return NextResponse.redirect(redirectToPath(request));
    }

    // 1. 从 Cookie 中读取 session 值
    const sessionToken = request.cookies.get(this.sessionKey)?.value;

    if (!sessionToken) {
      return NextResponse.redirect(redirectToPath(request));
    }

    // 2. 验证 session
    const payload = this.parseJWT(sessionToken, this.sessionSecret);

    // 3. 如果无效，重定向到登录页（并携带当前路径）
    if (!payload) {
      return NextResponse.redirect(redirectToPath(request));
    }

    // 已被「撤销所有会话」（如重置密码）作废的 session：清 cookie 后去登录
    if (await isSessionPayloadRevoked(payload)) {
      const response = NextResponse.redirect(redirectToPath(request));
      response.cookies.delete(this.sessionKey);
      return response;
    }

    const pathname = request.nextUrl.pathname;
    if (isPlatformAdminPath(pathname)) {
      const userId = String(
        payload.userId ??
          (payload as { user?: Pick<UserSchema, 'id'> }).user?.id ??
          ''
      );
      if (!userId || !(await checkPlatformAdmin(userId))) {
        return NextResponse.redirect(redirectToProjects(request));
      }
    }

    // 4. 验证通过，返回正常响应
    return nextResponse ?? NextResponse.next({ request });
  }

  /**
   * Build session cookie fields for attaching to a {@link NextResponse}
   * (e.g. OAuth redirects). Prefer this over `cookies().set` + redirect —
   * Next may drop the cookie jar on a freshly constructed redirect response.
   */
  public buildSessionCookie(payload: OAuthSessionPayload): {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  } {
    return {
      name: this.sessionKey,
      value: this.generateJWT(payload),
      httpOnly: true,
      secure: this.secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    };
  }

  /**
   * @override
   */
  public async setSession(payload: OAuthSessionPayload): Promise<void> {
    const cookie = this.buildSessionCookie(payload);
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge
    });
  }

  /**
   * @override
   */
  public async hasSession(): Promise<boolean> {
    return (await this.getSession()) != null;
  }

  /**
   * @override
   */
  public async getSession(): Promise<OAuthSessionPayload | null> {
    const cookieStore = await cookies();
    const raw = cookieStore.get(this.sessionKey)?.value;

    if (raw) {
      const fromCookie = this.parseJWT(raw, this.sessionSecret);
      if (fromCookie) {
        return (await isSessionPayloadRevoked(fromCookie)) ? null : fromCookie;
      }
    }

    return this.getSessionFromAuthorizationHeader();
  }

  /**
   * Resolves a PAM CLI bearer token from `Authorization: Bearer ...`.
   *
   * @returns Session-compatible payload or null
   */
  protected async getSessionFromAuthorizationHeader(): Promise<OAuthSessionPayload | null> {
    const headerStore = await headers();
    const authorization = headerStore.get('authorization');
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      return null;
    }

    const token = authorization.slice('bearer '.length).trim();
    if (!token) {
      return null;
    }

    if (!this.verifyCliBearer) {
      return null;
    }

    return this.verifyCliBearer(token);
  }

  /**
   * @override
   */
  public async clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.sessionKey);
  }

  public hasSessionFromRequest(request: NextRequest): boolean {
    const raw = request.cookies.get(this.sessionKey)?.value;
    if (!raw) {
      return false;
    }
    return this.parseJWT(raw, this.sessionSecret) != null;
  }
}
