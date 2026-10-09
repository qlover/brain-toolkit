import {
  BrainCredentials,
  BrainUser,
  BrainUserGateway,
  createBrainUserOptions
} from '@brain-toolkit/brain-user';
import {
  OAuthConsentGrantRepository,
  OAuthConsentTrustService
} from '@brain-toolkit/next-app-kit/server';
import { LoginParams } from '@qlover/corekit-bridge';
import { UserRole, type UserSchema } from '@qlover/next-kit/common';
import { SupabaseRepo, TokenEncryption } from '@qlover/next-kit/server';
import {
  OAuthWrapperService,
  buildOAuthSyntheticEmail,
  resolveOAuthRealEmail,
  type OAuthAuthorizePageData,
  type OAuthConsentResult,
  type OAuthIdentityStore,
  type OAuthLocalUserDraft,
  type OAuthLocalUserRecord,
  type OAuthSessionPayload,
  type OAuthWrapperRepositoryInterface,
  type SignWithOtpParams,
  type VerifyOtpParams,
  type SignOtpResult,
  type WithUserSession,
  type OAuthWrapperAccessToken
} from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import { oauthLocalUserConfig } from '@config/oauthLocalUser';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { OAuthWrapperProviderInterface } from '@server/interfaces/OAuthWrapperProviderInterface';
import { OAuthWrapperRepository } from '@server/repositorys/OAuthWrapperRepository';
import { BrainOAuthUserStore } from '@server/services/BrainOAuthUserStore';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import type { OAuthConsentDeviceContext } from '@server/utils/oauthConsentDevice';
import type { LoggerInterface } from '@qlover/logger';

type BrainLoginLike = Record<string, unknown>;

/** Seconds; used when Brain omits `OTP_EXP`. */
const DEFAULT_OTP_EXPIRES = 60;

/**
 * Next.js patches global `fetch` and can drop the body when given a `Request`
 * object (empty POST → Brain API "email/password required"). Unwrap to
 * `fetch(url, init)` like backend-benchmark does.
 */
async function nextSafeFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  if (input instanceof Request) {
    const method = input.method.toUpperCase();
    const hasBody = method !== 'GET' && method !== 'HEAD';
    const body = hasBody ? await input.clone().arrayBuffer() : undefined;
    return fetch(input.url, {
      method: input.method,
      headers: input.headers,
      body,
      redirect: input.redirect,
      integrity: input.integrity,
      keepalive: input.keepalive,
      signal: input.signal,
      referrer: input.referrer,
      referrerPolicy: input.referrerPolicy,
      credentials: input.credentials,
      mode: input.mode,
      cache: input.cache
    });
  }

  return fetch(input, init);
}

function extractBrainSessionToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as BrainLoginLike;

  if (typeof obj.token === 'string' && obj.token.trim()) {
    return obj.token.trim();
  }

  if (typeof obj.session_token === 'string' && obj.session_token.trim()) {
    return obj.session_token.trim();
  }

  const authToken = obj.auth_token;
  if (authToken && typeof authToken === 'object') {
    const key = (authToken as BrainLoginLike).key;
    if (typeof key === 'string' && key.trim()) {
      return key.trim();
    }
  }

  return null;
}

function formatBrainLoginError(data: unknown): string {
  if (!data || typeof data !== 'object') {
    return 'Brain login did not return a session token';
  }

  const obj = data as BrainLoginLike;

  if (Array.isArray(obj.non_field_errors) && obj.non_field_errors.length > 0) {
    return String(obj.non_field_errors[0]);
  }

  for (const [field, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.length > 0) {
      return `${field}: ${String(value[0])}`;
    }
    if (typeof value === 'string' && value.trim()) {
      return `${field}: ${value}`;
    }
  }

  return 'Brain login did not return a session token';
}

/**
 * Account email only. `profile.google_email` is deliberately ignored: Brain
 * keeps separate user ids for Google/phone signups and email signups, and
 * using it here would make both claim the same local row by email.
 */
function resolveBrainEmail(user: BrainUser): string {
  return typeof user.email === 'string' ? user.email.trim() : '';
}

function resolveBrainName(user: BrainUser): string | undefined {
  const name = typeof user.name === 'string' ? user.name.trim() : '';
  if (name) {
    return name;
  }
  const parts = [user.first_name, user.middle_name, user.last_name]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

function resolveBrainPhone(user: BrainUser): string | undefined {
  const phone = user.profile?.phone_number?.trim();
  return phone || undefined;
}

/**
 * `BrainUserGateway` ignores the HTTP status and only flags
 * `detail: 'Invalid token.'`; a Bearer 401 (`detail: 'Authentication
 * Failed.'`) comes back as `data` with `error: null`. Treat any profile
 * without an id as a rejected token so it never becomes a local user.
 */
function requireBrainUser(profile: {
  data: (BrainUser & Partial<BrainCredentials>) | null;
  error: unknown;
}): BrainUser & Partial<BrainCredentials> {
  if (profile.error) {
    throw profile.error;
  }
  const id = profile.data?.id;
  if (id === undefined || id === null || String(id).trim() === '') {
    throw new Error('Brain user info rejected or missing id');
  }
  return profile.data!;
}

function brainUserToUserSchema(
  user: BrainUser & Partial<BrainCredentials>
): UserSchema {
  const name = resolveBrainName(user);
  const phone = resolveBrainPhone(user);
  return {
    id: String(user.id),
    email: resolveBrainEmail(user),
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    role: user.roles?.includes('admin') ? UserRole.ADMIN : UserRole.USER,
    credential_token:
      user.token ??
      (user.auth_token && typeof user.auth_token === 'object'
        ? String((user.auth_token as { key?: string }).key ?? '')
        : ''),
    created_at: user.created_at ?? new Date().toISOString()
  };
}

export interface BrainUserSession
  extends OAuthSessionPayload,
    Partial<BrainCredentials> {}

/**
 * Brain User API as OAuth AS backend. Local identity is brain_oauth_users UUID via
 * IdentityStore hooks on OAuthWrapperService.
 */
@injectable()
export class BrainUserOAuthProvider
  extends OAuthWrapperService<UserSchema, BrainUserSession>
  implements OAuthWrapperProviderInterface
{
  protected gateway: BrainUserGateway;
  protected tokenEncryption: TokenEncryption;
  protected consentTrust: OAuthConsentTrustService;
  /** Per-request (IOC is per request): true only inside userinfo. */
  protected passiveSync = false;

  constructor(
    @inject(I.Logger)
    protected logger: LoggerInterface,
    @inject(I.AppConfig) config: SeedServerConfigInterface,
    @inject(OAuthSessionService)
    oauthSession: OAuthSessionService,
    @inject(OAuthWrapperRepository) oauthRepo: OAuthWrapperRepositoryInterface,
    @inject(BrainOAuthUserStore)
    protected readonly identityStore: BrainOAuthUserStore,
    @inject(SupabaseRepo) supabaseRepo: SupabaseRepo<unknown>
  ) {
    const tokenEncryption = new TokenEncryption(config.encryptionKey);
    super(oauthSession, tokenEncryption, oauthRepo);
    this.consentTrust = new OAuthConsentTrustService(
      new OAuthConsentGrantRepository(
        supabaseRepo,
        oauthLocalUserConfig.consentGrantsTable
      ),
      logger
    );
    const options = createBrainUserOptions({
      logger,
      fetcher: nextSafeFetch
    });
    this.gateway = new BrainUserGateway(options.requestAdapter, logger);
    this.tokenEncryption = tokenEncryption;
  }

  /**
   * @override
   */
  protected override getIdentityStore(): OAuthIdentityStore | null {
    return this.identityStore;
  }

  /**
   * @override
   */
  protected override getSyntheticEmailDomain(): string {
    return oauthLocalUserConfig.syntheticEmailDomain;
  }

  /**
   * @override
   */
  protected override toLocalUserDraft(
    upstream: UserSchema
  ): OAuthLocalUserDraft {
    return {
      provider: oauthLocalUserConfig.provider,
      externalUserId: String(upstream.id ?? '').trim(),
      email: upstream.email || null,
      phone: upstream.phone?.trim() || null,
      name: upstream.name?.trim() || upstream.email || String(upstream.id),
      // UserRole.ADMIN is 0, so compare explicitly instead of truthiness.
      extra: { brainAdmin: upstream.role === UserRole.ADMIN }
    };
  }

  /**
   * @override
   */
  protected override async ensureLocalUser(
    draft: OAuthLocalUserDraft
  ): Promise<OAuthLocalUserRecord> {
    const email = resolveOAuthRealEmail(
      draft.email,
      oauthLocalUserConfig.syntheticEmailDomain
    );
    const externalUserId = String(draft.externalUserId ?? '').trim();

    if (this.passiveSync && externalUserId) {
      const unchanged = await this.resolveUnchangedLinkedUser(
        draft,
        externalUserId,
        email
      );
      if (unchanged) {
        return unchanged;
      }
    }

    if (email && externalUserId) {
      await this.identityStore.releaseStaleEmail(email, externalUserId);
    }
    return super.ensureLocalUser(draft);
  }

  /**
   * Read-only fast path for `/oauth/userinfo`: when the linked local row
   * already matches what {@link BrainOAuthUserStore.refreshMetadata} would
   * write, skip every write. Mirrors that method's field rules; any difference
   * (or no link yet) returns `null` and the full sync runs.
   */
  protected async resolveUnchangedLinkedUser(
    draft: OAuthLocalUserDraft,
    externalUserId: string,
    email: string | null
  ): Promise<OAuthLocalUserRecord | null> {
    const provider = String(draft.provider ?? '').trim();
    const linked = await this.identityStore.findLinkedUser(
      provider,
      externalUserId
    );
    if (!linked) {
      return null;
    }

    const name = (draft.name ?? '').trim() || externalUserId;
    const phone = draft.phone?.trim();
    const storedExtra = linked.extra ?? {};
    const extraChanged = Object.entries(draft.extra ?? {}).some(
      ([key, value]) => storedExtra[key] !== value
    );
    if (
      (linked.email ?? null) !== email ||
      linked.name !== name ||
      (phone && linked.phone !== phone) ||
      extraChanged
    ) {
      return null;
    }

    return {
      authUserId: linked.id,
      provider,
      externalUserId,
      email:
        email ??
        buildOAuthSyntheticEmail(
          provider,
          externalUserId,
          oauthLocalUserConfig.syntheticEmailDomain
        ),
      name
    };
  }

  /**
   * Third-party userinfo polls should not rewrite the user row on every call;
   * enable the unchanged fast path in {@link ensureLocalUser} for this flow
   * only. Login keeps the full sync (it also bumps `last_login_at`).
   *
   * @override
   */
  public override async getUserInfoWithAccessToken(
    accessToken: string
  ): Promise<UserSchema> {
    this.passiveSync = true;
    try {
      return await super.getUserInfoWithAccessToken(accessToken);
    } finally {
      this.passiveSync = false;
    }
  }

  /**
   * Keep the synthetic address out of the session user so UIs fall back to
   * `phone` for phone-only accounts.
   *
   * @override
   */
  protected override applyLocalUser(
    upstream: UserSchema,
    local: OAuthLocalUserRecord
  ): UserSchema {
    const user = super.applyLocalUser(upstream, local);
    return {
      ...user,
      email:
        resolveOAuthRealEmail(
          user.email,
          oauthLocalUserConfig.syntheticEmailDomain
        ) ?? ''
    };
  }

  /**
   * @override
   */
  protected async providerLogin(
    params: LoginParams
  ): Promise<WithUserSession<BrainUserSession, UserSchema>> {
    const result =
      params.phone && params.code
        ? await this.gateway.verifySignOtp({
            phone: params.phone,
            otp: params.code
          })
        : await this.gateway.login({
            email: params.email!,
            password: params.password!
          });

    this.logger.debug('BrainUser login', result);

    if (result.error) {
      throw result.error;
    }

    const token = extractBrainSessionToken(result.data);
    if (!token) {
      throw new Error(formatBrainLoginError(result.data));
    }

    return {
      ...(typeof result.data === 'object' && result.data ? result.data : {}),
      userId: '',
      providerRefreshToken: token
    };
  }

  /**
   * @override
   */
  protected async providerExchangeAccessToken(
    session: BrainUserSession
  ): Promise<OAuthWrapperAccessToken> {
    const accessResult = await this.gateway.getAccessToken({
      token: session.providerRefreshToken,
      lang: 'en'
    });

    if (accessResult.error) {
      throw accessResult.error;
    }

    this.logger.debug('BrainUserOAuthProvider.providerExchangeAccessToken', {
      access: accessResult
    });

    return {
      ...accessResult,
      provider_token: session.providerRefreshToken ?? '',
      provider_refresh_token: '',
      token_type: 'Bearer',
      access_token: accessResult.data!.access_token,
      expires_in: accessResult.data!.expires_in ?? 3600,
      refresh_token: accessResult.data!.refresh_token
    };
  }

  /**
   * @override
   */
  protected async providerGetUserInfo(
    sessionToken: string
  ): Promise<UserSchema> {
    const profile = await this.gateway.getUserInfo({ token: sessionToken });
    return brainUserToUserSchema(requireBrainUser(profile));
  }

  /**
   * @override
   */
  protected async providerGetUserInfoByAccessToken(
    accessToken: string
  ): Promise<UserSchema> {
    const profile = await this.gateway.getUserInfo(
      { token: accessToken },
      { tokenPrefix: 'Bearer' }
    );
    return brainUserToUserSchema(requireBrainUser(profile));
  }

  /**
   * @override
   */
  public async getUserSchema(
    session?: OAuthSessionPayload
  ): Promise<UserSchema | null> {
    const session2 = session ?? (await this.oauthSession.getSession());

    if (!session2) {
      return null;
    }

    const withUser = session2 as WithUserSession<BrainUserSession, UserSchema>;
    if (withUser.user) {
      return {
        ...withUser.user,
        id: String(session2.userId),
        credential_token: session2.providerRefreshToken
      };
    }

    return {
      id: String(session2.userId),
      email: '',
      role: UserRole.USER,
      credential_token: session2.providerRefreshToken,
      created_at: new Date().toISOString()
    };
  }

  /**
   * @override
   */
  public async getEmbeddedUser(): Promise<UserSchema | null> {
    const payload = (await this.oauthSession.getSession()) as
      | WithUserSession<BrainUserSession, UserSchema>
      | null
      | undefined;
    return payload?.user?.id ? payload.user : null;
  }

  /**
   * Persists "trust this app" for this device so later authorize requests
   * skip consent until the grant expires.
   *
   * @override
   */
  public async processConsent(
    requestBody: unknown,
    device?: OAuthConsentDeviceContext
  ): Promise<OAuthConsentResult> {
    const result = await super.processConsent(requestBody);
    const session = await this.getSession();
    await this.consentTrust.remember(
      String(session?.userId ?? '').trim(),
      requestBody,
      device
    );
    return result;
  }

  /**
   * @override
   */
  public async tryAutoConsent(
    data: OAuthAuthorizePageData,
    device?: OAuthConsentDeviceContext
  ): Promise<OAuthConsentResult | null> {
    const session = await this.getSession();
    return this.consentTrust.tryAuto(
      String(session?.userId ?? '').trim(),
      data,
      device,
      (body) => super.processConsent(body)
    );
  }

  /**
   * @override
   */
  public hasNeedLogged(): boolean {
    return true;
  }

  /**
   * @override
   */
  public async signWithOtp(params: SignWithOtpParams): Promise<SignOtpResult> {
    if ('email' in params) {
      throw new Error('Email is not supported');
    }
    const result = await this.gateway.verifySignOtp({ phone: params.phone });
    this.logger.debug('BrainUser send phone otp', result);

    if (result.error) {
      throw result.error;
    }

    return { expired: Number(result.data?.OTP_EXP) || DEFAULT_OTP_EXPIRES };
  }

  /**
   * Logs in with phone + code and creates the session.
   *
   * @override
   */
  public async verifyOtp(params: VerifyOtpParams): Promise<SignOtpResult> {
    if (!('phone' in params)) {
      throw new Error('Email is not supported');
    }
    if (!params.token) {
      throw new Error('OTP code is required');
    }
    await this.login({ phone: params.phone, code: params.token });
    return { expired: 0 };
  }

  /**
   * @override
   */
  public async refreshUser(_params?: {
    refresh_token: string;
  }): Promise<WithUserSession<BrainUserSession, UserSchema>> {
    const session = await this.getSession();

    if (!session) {
      throw new Error('No session found');
    }

    const user = await this.getUserSchema(session);

    return {
      user: user!,
      userId: user!.id,
      providerRefreshToken: session.providerRefreshToken
    };
  }

  /**
   * @override
   */
  public clearSession(): Promise<void> {
    return super.clearSession();
  }
}
