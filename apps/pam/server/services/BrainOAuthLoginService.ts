import { createHash, randomBytes } from 'crypto';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { UserRole, userSchema, type UserSchema } from '@qlover/next-kit/common';
import { RequestLogsRepository } from '@qlover/next-kit/server';
import { cookies } from 'next/headers';
import { inject, injectable } from '@shared/container';
import { API_CALLBACK_BRAIN_OAUTH } from '@config/apiRoutes';
import {
  API_OAUTH_INVALID_REQUEST,
  API_USER_NOT_FOUND
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { LoginProviderResult } from '@interfaces/UserServiceInterface';
import type { UserLoginContext } from '@server/interfaces/UserServiceInterface';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import { ResultHandlerContext } from '@server/utils/NextApiHandler';
import type { LoggerInterface } from '@qlover/logger';
import type { OAuthSessionPayload } from '@qlover/oauth-wrapper';

const PKCE_COOKIE = 'pam_brain_oauth_pkce';
const PKCE_COOKIE_MAX_AGE_SEC = 60 * 10;

type PkceCookiePayload = {
  state: string;
  codeVerifier: string;
  returnTo: string;
};

type BrainTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type BrainUserInfo = {
  sub?: string;
  email?: string;
  preferred_username?: string;
};

/** App session JWT payload: includes embedded user (same pattern as Supabase path). */
type PamSessionPayload = OAuthSessionPayload & { user?: UserSchema };

function base64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createPkcePair(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(
    createHash('sha256').update(codeVerifier).digest()
  );
  return { codeVerifier, codeChallenge };
}

function sanitizeReturnTo(raw: string | undefined): string {
  if (!raw?.trim()) {
    return '/';
  }
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/';
  }
  return value;
}

function mapBrainUserToSchema(info: BrainUserInfo): UserSchema {
  const id = info.sub?.trim();
  const email =
    info.email?.trim() ||
    info.preferred_username?.trim() ||
    (id ? `${id}@brain.oauth` : '');

  if (!id || !email) {
    throw new ExecutorError(
      API_USER_NOT_FOUND,
      'Brain userinfo missing sub or email'
    );
  }

  return userSchema.parse({
    id,
    email,
    role: UserRole.USER,
    credential_token: '',
    created_at: new Date().toISOString()
  });
}

/**
 * PAM as OAuth client of brain-oauth (authorize + PKCE + server token exchange).
 * Prefer this over Supabase `custom:brain` when Brain AS is only reachable on localhost.
 */
@injectable()
export class BrainOAuthLoginService {
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  constructor(
    @inject(I.AppConfig)
    protected config: SeedServerConfigInterface,
    @inject(RequestLogsRepository)
    protected requestLogsRepository: RequestLogsRepository
  ) {}

  /** Default callback: `{PAM SITE_URL}api/callback/brain-oauth`. */
  public resolveRedirectUri(): string {
    if (this.config.brainOAuthRedirectUri) {
      return this.config.brainOAuthRedirectUri;
    }
    const base = this.config.siteUrl.endsWith('/')
      ? this.config.siteUrl
      : `${this.config.siteUrl}/`;
    return new URL(API_CALLBACK_BRAIN_OAUTH.replace(/^\//, ''), base).toString();
  }

  public isConfigured(): boolean {
    return Boolean(
      this.config.brainOAuthSiteUrl && this.config.brainOAuthClientId
    );
  }

  protected assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        'Brain OAuth is not configured (BRAIN_OAUTH_SITE_URL / BRAIN_OAUTH_CLIENT_ID)'
      );
    }
  }

  protected createSessionService(): OAuthSessionService {
    return new OAuthSessionService(this.config);
  }

  protected async writePkceCookie(payload: PkceCookiePayload): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(PKCE_COOKIE, JSON.stringify(payload), {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: PKCE_COOKIE_MAX_AGE_SEC
    });
  }

  protected async readPkceCookie(): Promise<PkceCookiePayload | null> {
    const cookieStore = await cookies();
    const raw = cookieStore.get(PKCE_COOKIE)?.value;
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as PkceCookiePayload;
      if (
        typeof parsed.state !== 'string' ||
        typeof parsed.codeVerifier !== 'string'
      ) {
        return null;
      }
      return {
        state: parsed.state,
        codeVerifier: parsed.codeVerifier,
        returnTo: sanitizeReturnTo(parsed.returnTo)
      };
    } catch {
      return null;
    }
  }

  protected async clearPkceCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(PKCE_COOKIE);
  }

  public async startLogin(input: {
    locale?: string;
    returnTo?: string;
  }): Promise<LoginProviderResult> {
    this.assertConfigured();

    const { codeVerifier, codeChallenge } = createPkcePair();
    const state = base64Url(randomBytes(16));
    const returnTo = sanitizeReturnTo(input.returnTo);
    const locale =
      input.locale?.trim() || this.config.brainOAuthLocale || 'zh';
    const redirectUri = this.resolveRedirectUri();

    await this.writePkceCookie({ state, codeVerifier, returnTo });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.brainOAuthClientId,
      redirect_uri: redirectUri,
      scope: this.config.brainOAuthScopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const providerUrl = `${this.config.brainOAuthSiteUrl}/${locale}/oauth/authorize?${params.toString()}`;

    this.logger.info('Brain OAuth authorize redirect prepared', {
      locale,
      redirectUri
    });

    return {
      providerUrl,
      provider: 'BrainPKCE'
    };
  }

  public async handleCallback(
    query: {
      code?: string;
      state?: string;
      error?: string;
      error_description?: string;
      origin?: string;
    },
    loginContext?: UserLoginContext
  ): Promise<ResultHandlerContext> {
    this.assertConfigured();

    if (query.error) {
      await this.clearPkceCookie();
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        query.error_description || query.error
      );
    }

    if (!query.code?.trim() || !query.state?.trim()) {
      await this.clearPkceCookie();
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        'Missing code or state'
      );
    }

    const pkce = await this.readPkceCookie();
    if (!pkce || pkce.state !== query.state) {
      await this.clearPkceCookie();
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        'Invalid or expired Brain OAuth state'
      );
    }

    const token = await this.exchangeCode(query.code.trim(), pkce.codeVerifier);
    const userInfo = await this.fetchUserInfo(token.access_token!);
    const user = mapBrainUserToSchema(userInfo);

    const sessionService = this.createSessionService();
    const payload: PamSessionPayload = {
      userId: user.id,
      // Brain PKCE has no Supabase refresh token; getUserSchema uses embedded `user`.
      providerRefreshToken: '',
      user
    };
    await sessionService.setSession(payload);

    await this.clearPkceCookie();

    await this.requestLogsRepository.insertWithAuth({
      event_type: 'login',
      auth_provider: 'brain-oauth',
      userAgent: loginContext?.userAgent ?? null,
      ipAddress: loginContext?.ipAddress ?? null,
      login_method: 'brain-oauth-pkce',
      user_id: user.id
    });

    this.logger.info('Brain OAuth login success', { userId: user.id });

    const siteUrl = query.origin ?? this.config.siteUrl;
    return {
      redirectUrl: new URL(
        pkce.returnTo,
        siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`
      ).toString()
    };
  }

  protected async exchangeCode(
    code: string,
    codeVerifier: string
  ): Promise<BrainTokenResponse> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.resolveRedirectUri(),
      client_id: this.config.brainOAuthClientId,
      code_verifier: codeVerifier
    });

    if (this.config.brainOAuthClientSecret) {
      body.set('client_secret', this.config.brainOAuthClientSecret);
    }

    const response = await fetch(
      `${this.config.brainOAuthSiteUrl}/oauth/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body
      }
    );

    const json = (await response.json()) as BrainTokenResponse;
    if (!response.ok || !json.access_token) {
      this.logger.warn('Brain OAuth token exchange failed', {
        status: response.status,
        error: json.error,
        error_description: json.error_description
      });
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        json.error_description || json.error || 'Token exchange failed'
      );
    }

    return json;
  }

  protected async fetchUserInfo(accessToken: string): Promise<BrainUserInfo> {
    const response = await fetch(
      `${this.config.brainOAuthSiteUrl}/oauth/userinfo`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      this.logger.warn('Brain OAuth userinfo failed', {
        status: response.status
      });
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        'Failed to fetch Brain userinfo'
      );
    }

    return (await response.json()) as BrainUserInfo;
  }
}
