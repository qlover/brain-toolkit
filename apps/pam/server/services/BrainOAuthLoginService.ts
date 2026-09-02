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
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { LoginProviderResult } from '@interfaces/UserServiceInterface';
import type { UserLoginContext } from '@server/interfaces/UserServiceInterface';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import { PamUserService } from '@server/services/PamUserService';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import type { LoggerInterface } from '@qlover/logger';
import type { OAuthSessionPayload } from '@qlover/oauth-wrapper';

const PKCE_COOKIE = 'pam_brain_oauth_pkce';
const PKCE_COOKIE_MAX_AGE_SEC = 60 * 10;

export type BrainOAuthCallbackSuccess = {
  redirectUrl: string;
  sessionCookie: {
    name: string;
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  };
};

type PkceCookiePayload = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  /** UI locale when login started (for error redirects). */
  locale?: string;
};

type BrainTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

type BrainUserInfo = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
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

  // Keep pam_session JWT tiny: browsers drop cookies ≳4KB. Do NOT embed the
  // Brain access_token (itself a large JWT) into credential_token.
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
    protected requestLogsRepository: RequestLogsRepository,
    @inject(SiteSettingsService)
    protected siteSettings: SiteSettingsService,
    @inject(PamUserService)
    protected pamUserService: PamUserService
  ) {}

  protected async getOAuthSettings(): Promise<{
    siteUrl: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string;
    locale: string;
  }> {
    const [siteUrl, clientId, clientSecret, redirectUri, scopes, locale] =
      await Promise.all([
        this.siteSettings.getString(PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_SITE_URL),
        this.siteSettings.getString(
          PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_CLIENT_ID
        ),
        this.siteSettings.getSecretString(
          PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_CLIENT_SECRET
        ),
        this.siteSettings.getString(
          PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_REDIRECT_URI
        ),
        this.siteSettings.getString(PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_SCOPES),
        this.siteSettings.getString(PAM_SITE_SETTING_KEYS.BRAIN_OAUTH_LOCALE)
      ]);

    return {
      siteUrl,
      clientId,
      clientSecret,
      redirectUri,
      scopes: scopes || 'openid profile email',
      locale
    };
  }

  /** Default callback: `{PAM SITE_URL}api/callback/brain-oauth`. */
  public async resolveRedirectUri(): Promise<string> {
    const oauth = await this.getOAuthSettings();
    if (oauth.redirectUri) {
      return oauth.redirectUri;
    }
    const base = this.config.siteUrl.endsWith('/')
      ? this.config.siteUrl
      : `${this.config.siteUrl}/`;
    return new URL(
      API_CALLBACK_BRAIN_OAUTH.replace(/^\//, ''),
      base
    ).toString();
  }

  public async isConfigured(): Promise<boolean> {
    const oauth = await this.getOAuthSettings();
    return Boolean(oauth.siteUrl && oauth.clientId);
  }

  protected async assertConfigured(): Promise<void> {
    if (!(await this.isConfigured())) {
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
        returnTo: sanitizeReturnTo(parsed.returnTo),
        locale:
          typeof parsed.locale === 'string' ? parsed.locale.trim() : undefined
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
    const brainPkceEnabled = await this.siteSettings.getBoolean(
      PAM_SITE_SETTING_KEYS.AUTH_BRAIN_PKCE_ENABLED
    );
    if (!brainPkceEnabled) {
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        'Brain PKCE login is disabled'
      );
    }

    await this.assertConfigured();

    const oauth = await this.getOAuthSettings();
    const { codeVerifier, codeChallenge } = createPkcePair();
    const state = base64Url(randomBytes(16));
    const returnTo = sanitizeReturnTo(input.returnTo);
    const locale = input.locale?.trim() || oauth.locale || 'zh';
    const redirectUri = await this.resolveRedirectUri();

    await this.writePkceCookie({ state, codeVerifier, returnTo, locale });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: oauth.clientId,
      redirect_uri: redirectUri,
      scope: oauth.scopes,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const providerUrl = `${oauth.siteUrl}/${locale}/oauth/authorize?${params.toString()}`;

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
  ): Promise<BrainOAuthCallbackSuccess> {
    await this.assertConfigured();

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
    const accessToken = token.access_token!;
    const userInfo = await this.fetchUserInfo(accessToken);
    const user = mapBrainUserToSchema(userInfo);

    await this.pamUserService.ensurePamUser({
      id: user.id,
      email: user.email
    });

    const sessionPayload: PamSessionPayload = {
      userId: user.id,
      // Empty on purpose: SupabaseOAuthProvider.refreshUser treats missing
      // refresh token + embedded `user` as a Brain PKCE / non-Supabase session.
      providerRefreshToken: '',
      user
    };

    const sessionService = this.createSessionService();
    const sessionCookie = sessionService.buildSessionCookie(sessionPayload);
    // Dual-write: cookie jar (JSON handlers) + explicit Set-Cookie on redirect.
    await sessionService.setSession(sessionPayload);
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
      ).toString(),
      sessionCookie
    };
  }

  protected async exchangeCode(
    code: string,
    codeVerifier: string
  ): Promise<BrainTokenResponse> {
    const oauth = await this.getOAuthSettings();
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: await this.resolveRedirectUri(),
      client_id: oauth.clientId,
      code_verifier: codeVerifier
    });

    if (oauth.clientSecret) {
      body.set('client_secret', oauth.clientSecret);
    }

    const response = await fetch(`${oauth.siteUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body
    });

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
    const oauth = await this.getOAuthSettings();
    const response = await fetch(`${oauth.siteUrl}/oauth/userinfo`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      }
    });

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
