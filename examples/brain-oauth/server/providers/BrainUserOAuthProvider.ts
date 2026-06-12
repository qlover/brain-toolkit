import {
  BrainUserGateway,
  createBrainUserOptions
} from '@brain-toolkit/brain-user';
import { LoginParams } from '@qlover/corekit-bridge';
import { OAuthWrapperService } from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import { UserRole, UserSchema } from '@schemas/UserSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { OAuthWrapperProviderInterface } from '@server/interfaces/OAuthWrapperProviderInterface';
import { OAuthWrapperRepository } from '@server/repositorys/OAuthWrapperRepository';
import { OAuthSessionService } from '@server/services/OAuthSessionService';
import { TokenEncryption } from '@server/utils/TokenEncryption';
import type { LoggerInterface } from '@qlover/logger';
import type {
  OAuthSessionPayload,
  OAuthSessionInterface,
  OAuthUserAccessToken,
  OAuthUserCredentials,
  OAuthUserProfile,
  OAuthWrapperRepositoryInterface,
  SignWithOtpParams,
  VerifyOtpParams,
  SignOtpResult
} from '@qlover/oauth-wrapper';

type BrainLoginLike = Record<string, unknown>;

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
 * Demo reference provider: Brain User API (`@brain-toolkit/brain-user`).
 */
@injectable()
export class BrainUserOAuthProvider
  extends OAuthWrapperService
  implements OAuthWrapperProviderInterface
{
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  protected gateway: BrainUserGateway;
  protected tokenEncryption: TokenEncryption;

  constructor(
    @inject(I.AppConfig) config: SeedServerConfigInterface,
    @inject(OAuthSessionService)
    oauthSession: OAuthSessionInterface<OAuthSessionPayload>,
    @inject(OAuthWrapperRepository) oauthRepo: OAuthWrapperRepositoryInterface
  ) {
    const tokenEncryption = new TokenEncryption(config.encryptionKey);
    super(oauthSession, tokenEncryption, oauthRepo);
    this.gateway = new BrainUserGateway(
      createBrainUserOptions().requestAdapter
    );
    this.tokenEncryption = tokenEncryption;
  }

  /**
   * @override
   */
  protected async providerLogin(
    params: LoginParams
  ): Promise<OAuthUserCredentials> {
    const result = await this.gateway.login({
      email: params.email!,
      password: params.password!
    });
    const token = extractBrainSessionToken(result);
    if (!token) {
      throw new Error(formatBrainLoginError(result));
    }
    return { ...result, token };
  }

  /**
   * @override
   */
  protected async providerExchangeAccessToken(params: {
    token: string;
    lang?: string;
  }): Promise<OAuthUserAccessToken> {
    const access = await this.gateway.getAccessToken({
      token: params.token,
      lang: params.lang ?? 'en'
    });
    if (access.error) {
      throw access.error;
    }

    return {
      ...access.data
    };
  }

  /**
   * @override
   */
  protected async providerGetUserInfo(
    token: string
  ): Promise<OAuthUserProfile> {
    const profile = await this.gateway.getUserInfo({ token });
    if (profile.error) {
      throw profile.error;
    }

    return {
      ...profile.data
    };
  }

  /**
   * @override
   */
  protected async providerGetUserInfoByAccessToken(
    accessToken: string
  ): Promise<OAuthUserProfile> {
    const profile = await this.gateway.getUserInfo(
      { token: accessToken },
      { tokenPrefix: 'Bearer' }
    );

    if (profile.error) {
      throw profile.error;
    }

    return {
      ...profile.data
    };
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

    // TODO: 补上真实的用户角色信息，重置role
    return Promise.resolve({
      id: String(session2.userId),
      email: session2.email,
      role: UserRole.USER,
      password: '',
      credential_token: session2.providerSessionToken,
      created_at: new Date().toISOString(),
      updated_at: null
    } as UserSchema);
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

    // TODO:
    // const credentials = await this.gateway.verifySignOtp(params);
    const credentials = {
      message: 'Waiting on OTP.',
      OTP_EXP: 60,
      required: 'otp',
      expired: 1781059615940
    };

    return {
      ...credentials,
      expired: credentials.OTP_EXP ? Date.now() + credentials.OTP_EXP * 1000 : 0
    };
  }

  /**
   * @override
   */
  public async verifyOtp(params: VerifyOtpParams): Promise<SignOtpResult> {
    if ('email' in params) {
      throw new Error('Email is not supported');
    }

    if (!params.token) {
      throw new Error('Token is required for OTP verification');
    }

    // TODO:
    // const credentials = await this.gateway.verifySignOtp({
    //   otp: params.token,
    //   phone: params.phone
    // });
    const credentials = {
      existing: true,
      required_fields: {
        first_name: 'qrj',
        last_name: 'q',
        email: '',
        phone_number: '+8613990101204',
        google_email: 'renjie.qin@brain.im'
      },
      token: '8d0dcca414d2986fd2b678990e372772da9124fe'
    };

    const sessionToken = credentials.token;
    if (!sessionToken) {
      throw new Error('User provider login did not return a session token');
    }

    const userResult = await this.gateway.getUserInfo({
      token: credentials.token
    });
    this.logger.debug('BrainUserProvider getUserInfo', userResult);

    if (userResult.error) {
      throw userResult.error;
    }

    const userInfo = userResult.data;
    const userId = String(userInfo.id);

    // Brain user 使用手机号登陆可能没有邮箱
    const profileEmail = userInfo.email || userInfo.profile?.google_email;

    if (!profileEmail) {
      throw new Error(
        'User email is required but not provided by Brain User API'
      );
    }

    const accessResult = await this.gateway.getAccessToken({
      token: sessionToken
    });
    if (accessResult.error) {
      throw accessResult.error;
    }

    await this.oauthSession.setSession({
      userId,
      email: profileEmail,
      name: userInfo.name,
      providerSessionToken: sessionToken
    });

    await this.oauthRepo.upsertUserCredentials(userId, {
      provider_session_token: sessionToken,
      provider_refresh_token: accessResult.data.refresh_token
        ? this.tokenEncryption.encrypt(accessResult.data.refresh_token)
        : null
    });

    this.logger.info('OAuth login with phone success', credentials);

    return {
      ...credentials,
      expired: -1
    };
  }
}
