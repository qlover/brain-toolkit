import {
  BrainCredentials,
  BrainUser,
  BrainUserGateway,
  createBrainUserOptions
} from '@brain-toolkit/brain-user';
import { LoginParams } from '@qlover/corekit-bridge';
import { UserRole, type UserSchema } from '@qlover/next-kit/common';
import { TokenEncryption } from '@qlover/next-kit/server';
import {
  OAuthWrapperService,
  type OAuthIdentityStore,
  type OAuthLocalUserDraft,
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
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import { SupabaseOAuthIdentityStore } from '@server/services/SupabaseOAuthIdentityStore';
import type { LoggerInterface } from '@qlover/logger';

type BrainLoginLike = Record<string, unknown>;

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

function resolveBrainEmail(user: BrainUser): string {
  if (typeof user.email === 'string' && user.email.trim()) {
    return user.email.trim();
  }
  const nested = user.profile as { google_email?: string } | undefined;
  if (typeof nested?.google_email === 'string' && nested.google_email.trim()) {
    return nested.google_email.trim();
  }
  return '';
}

function brainUserToUserSchema(
  user: BrainUser & Partial<BrainCredentials>
): UserSchema {
  return {
    id: String(user.id),
    email: resolveBrainEmail(user),
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
 * Brain User API as OAuth AS backend. Local identity is auth.users UUID via
 * IdentityStore hooks on OAuthWrapperService.
 */
@injectable()
export class BrainUserOAuthProvider
  extends OAuthWrapperService<UserSchema, BrainUserSession>
  implements OAuthWrapperProviderInterface
{
  protected gateway: BrainUserGateway;
  protected tokenEncryption: TokenEncryption;

  constructor(
    @inject(I.Logger)
    protected logger: LoggerInterface,
    @inject(I.AppConfig) config: SeedServerConfigInterface,
    @inject(OAuthSessionService)
    oauthSession: OAuthSessionService,
    @inject(OAuthWrapperRepository) oauthRepo: OAuthWrapperRepositoryInterface,
    @inject(SupabaseOAuthIdentityStore)
    protected readonly identityStore: SupabaseOAuthIdentityStore
  ) {
    const tokenEncryption = new TokenEncryption(config.encryptionKey);
    super(oauthSession, tokenEncryption, oauthRepo);
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
    const extra: Record<string, unknown> = {};
    if (upstream.role) {
      extra.role = upstream.role;
    }
    return {
      provider: oauthLocalUserConfig.provider,
      externalUserId: String(upstream.id ?? '').trim(),
      email: upstream.email || null,
      name: upstream.email || String(upstream.id),
      extra: Object.keys(extra).length > 0 ? extra : null
    };
  }

  /**
   * @override
   */
  protected async providerLogin(
    params: LoginParams
  ): Promise<WithUserSession<BrainUserSession, UserSchema>> {
    const result = await this.gateway.login({
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

    if (profile.error) {
      throw profile.error;
    }
    return brainUserToUserSchema(profile.data);
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

    if (profile.error) {
      throw profile.error;
    }

    return brainUserToUserSchema(profile.data);
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
    this.logger.debug('BrainUser send phone otp', params);
    throw new Error('Phone OTP is not implemented');
  }

  /**
   * @override
   */
  public async verifyOtp(_params: VerifyOtpParams): Promise<SignOtpResult> {
    throw new Error('Phone OTP is not implemented');
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
