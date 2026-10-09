import { createHash, randomBytes } from 'crypto';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { UserRole, userSchema, type UserSchema } from '@qlover/next-kit/common';
import { RequestLogsRepository } from '@qlover/next-kit/server';
import { cookies } from 'next/headers';
import { inject, injectable } from '@shared/container';
import {
  defaultDisplayNameFromPhone,
  toBusinessEmail
} from '@shared/utils/pamUserIdentity';
import { API_CALLBACK_BRAIN_OAUTH } from '@config/apiRoutes';
import { API_OAUTH_INVALID_REQUEST } from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import { PAM_SITE_SETTING_KEYS } from '@config/pamSiteSettings';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { LoginProviderResult } from '@interfaces/UserServiceInterface';
import type { UserLoginContext } from '@server/interfaces/UserServiceInterface';
import {
  BRAIN_PLACEHOLDER_EMAIL_SUFFIX,
  BrainIdentityLinkService,
  type BrainIdentityResult
} from '@server/services/BrainIdentityLinkService';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import {
  PamUserService,
  type PamUserEnsureInput
} from '@server/services/PamUserService';
import { SiteSettingsService } from '@server/services/SiteSettingsService';
import {
  toBrainIdentityData,
  toBrainProfile,
  type BrainProfile,
  type BrainUserInfo
} from '@server/utils/brainOAuthProfile';
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
    protected pamUserService: PamUserService,
    @inject(BrainIdentityLinkService)
    protected identityLink: BrainIdentityLinkService
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
      siteUrl: siteUrl.trim().replace(/\/+$/, ''),
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
    let profile: BrainProfile;
    try {
      profile = toBrainProfile(await this.fetchUserInfo(accessToken));
    } finally {
      // PAM keeps its own session; an unused 90-day Brain refresh token
      // would otherwise stay valid on brain-oauth.
      await this.revokeRefreshToken(token.refresh_token);
    }

    const identity = await this.identityLink.resolveUser({
      sub: profile.sub,
      // auth.users needs an email; placeholder never reaches pam_users.
      email: profile.email || `${profile.sub}${BRAIN_PLACEHOLDER_EMAIL_SUFFIX}`,
      emailVerified: profile.emailVerified,
      identityData: toBrainIdentityData(profile)
    });

    const pamUser = await this.pamUserService.ensurePamUser({
      id: identity.userId,
      ...(await this.resolveProfileSeed(identity, profile))
    });
    const name = pamUser.display_name?.trim() || profile.name;
    const phone = pamUser.phone?.trim();
    // Keep pam_session JWT tiny: browsers drop cookies ≳4KB. Do NOT embed the
    // Brain access_token (itself a large JWT) into credential_token.
    const user: UserSchema = userSchema.parse({
      id: pamUser.id,
      email: toBusinessEmail(pamUser.email) ?? profile.email,
      role: UserRole.USER,
      credential_token: '',
      created_at: new Date().toISOString(),
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {})
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

  /**
   * Brain profile fields for pam_users. Email only seeds new accounts; name and
   * phone only fill blanks, and a phone owned by another PAM user is skipped
   * (pam_users.phone is unique).
   */
  protected async resolveProfileSeed(
    identity: BrainIdentityResult,
    profile: BrainProfile
  ): Promise<Omit<PamUserEnsureInput, 'id'>> {
    const existing = identity.created
      ? null
      : await this.pamUserService.findById(identity.userId);

    let phone: string | undefined;
    if (profile.phone && !existing?.phone) {
      const owner = await this.pamUserService.findByPhone(profile.phone);
      if (!owner || owner.id === identity.userId) {
        phone = profile.phone;
      }
    }

    let displayName: string | undefined;
    if (!existing?.display_name?.trim()) {
      displayName =
        profile.name ??
        (phone && identity.created
          ? defaultDisplayNameFromPhone(phone)
          : undefined);
    }

    return {
      email: identity.created ? profile.email || null : null,
      ...(displayName ? { displayName } : {}),
      ...(phone ? { phone } : {})
    };
  }

  /** Best effort: login must not fail because revocation did. */
  protected async revokeRefreshToken(refreshToken?: string): Promise<void> {
    if (!refreshToken) {
      return;
    }
    try {
      const oauth = await this.getOAuthSettings();
      const body = new URLSearchParams({
        token: refreshToken,
        token_type_hint: 'refresh_token',
        client_id: oauth.clientId
      });
      if (oauth.clientSecret) {
        body.set('client_secret', oauth.clientSecret);
      }
      const response = await fetch(`${oauth.siteUrl}/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body
      });
      if (!response.ok) {
        this.logger.warn('Brain OAuth refresh token revoke failed', {
          status: response.status
        });
      }
    } catch (error) {
      this.logger.warn('Brain OAuth refresh token revoke failed', { error });
    }
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
      const json = (await response.json().catch(() => ({}))) as {
        error?: string;
        error_description?: string;
      };
      this.logger.warn('Brain OAuth userinfo failed', {
        status: response.status,
        error: json.error,
        error_description: json.error_description
      });
      throw new ExecutorError(
        API_OAUTH_INVALID_REQUEST,
        json.error_description || json.error || 'Failed to fetch Brain userinfo'
      );
    }

    return (await response.json()) as BrainUserInfo;
  }
}
