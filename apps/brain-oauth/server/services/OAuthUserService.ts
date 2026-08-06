import { ExecutorError, type EncryptorInterface } from '@qlover/fe-corekit';
import {
  PasswordEncrypt,
  RequestLogsRepository
} from '@qlover/next-kit/server';
import { isEmpty } from 'lodash';
import { cookies } from 'next/headers';
import {
  SignOtpResult,
  SignWithOtpSchema,
  VerifyOtpParams
} from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import {
  API_NOT_AUTHORIZED,
  API_USER_NOT_FOUND
} from '@config/i18n-identifier/api';
import { I } from '@config/ioc-identifiter';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import type { OAuthWrapperProviderInterface } from '@server/interfaces/OAuthWrapperProviderInterface';
import type {
  UserLoginContext,
  UserLoginParams,
  UserServiceInterface,
  UserServiceRegisterParams
} from '../interfaces/UserServiceInterface';
import type { LoggerInterface } from '@qlover/logger';
import type { UserSchema } from '@qlover/next-kit/common';
import type { ServerAuthInterface } from '@qlover/next-kit/server';

@injectable()
export class OAuthUserService
  implements UserServiceInterface, ServerAuthInterface
{
  @inject(I.Logger)
  protected logger!: LoggerInterface;

  @inject(I.AppConfig)
  protected config!: SeedServerConfigInterface;

  constructor(
    @inject(PasswordEncrypt)
    protected encryptor: EncryptorInterface<string, string>,
    @inject(RequestLogsRepository)
    protected requestLogsRepository: RequestLogsRepository,
    @inject(I.OAuthWrapperProviderInterface)
    protected oauthProvider: OAuthWrapperProviderInterface
  ) {}

  /**
   * @override
   */
  public async register(
    _params: UserServiceRegisterParams
  ): Promise<UserSchema> {
    throw new ExecutorError(
      'registration_not_supported',
      'Registration is handled by the upstream user provider'
    );
  }

  /**
   * @override
   */
  public async login(params: UserLoginParams): Promise<UserSchema> {
    await this.oauthProvider.login(params);

    this.logger.info('OAuth wrapper login success', { email: params.email });

    await this.requestLogsRepository.insertWithAuth({
      event_type: 'login',
      auth_provider: 'oauth-wrapper',
      userAgent: params.loginContext?.userAgent ?? null,
      ipAddress: params.loginContext?.ipAddress ?? null,
      login_method: 'password'
    });

    const user = await this.oauthProvider.getUserSchema();
    if (!user) {
      throw new ExecutorError(
        API_USER_NOT_FOUND,
        'OAuth app user missing after login'
      );
    }

    return user;
  }

  /**
   * @override
   */
  public async logout(context?: UserLoginContext): Promise<void> {
    const user = await this.oauthProvider.getUserSchema();

    await this.requestLogsRepository.insertWithAuth({
      event_type: 'logout',
      auth_provider: 'brain-oauth',
      userAgent: context?.userAgent ?? null,
      ipAddress: context?.ipAddress ?? null,
      user_id: user?.id
    });

    if (user?.id) {
      await this.oauthProvider.logout(String(user.id));
    } else {
      await this.oauthProvider.clearSession();
    }

    const legacyKey = this.config.userTokenKey;
    if (legacyKey) {
      const cookieStore = await cookies();
      cookieStore.delete(legacyKey);
    }
  }

  /**
   * @override
   */
  public async refresh(): Promise<UserSchema> {
    throw new Error('Method not implemented.');
  }

  /**
   * @override
   */
  public async getUser(): Promise<UserSchema> {
    const user = await this.oauthProvider.getUserSchema();

    if (!user) {
      throw new ExecutorError(API_USER_NOT_FOUND);
    }

    return user;
  }

  /**
   * @override
   */
  public setAuth(_credential_token: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  /**
   * @override
   */
  public async getCredential(): Promise<string> {
    const user = await this.oauthProvider.getUserSchema();
    return user?.credential_token ?? '';
  }
  /**
   * @override
   */
  public async clear(): Promise<void> {
    await this.oauthProvider.clearSession();

    const legacyKey = this.config.userTokenKey;
    if (legacyKey) {
      const cookieStore = await cookies();
      cookieStore.delete(legacyKey);
    }
  }
  /**
   * @override
   */
  public async hasAuth(): Promise<boolean> {
    const user = await this.oauthProvider.getUserSchema();
    return !isEmpty(user);
  }
  /**
   * @override
   */
  public async throwIfNotAuth(): Promise<void> {
    if (!(await this.hasAuth())) {
      throw new ExecutorError(API_NOT_AUTHORIZED, 'Not authorized');
    }
  }

  /**
   * @override
   */
  public async signWithOtp(body: SignWithOtpSchema): Promise<SignOtpResult> {
    if (body.token) {
      return this.oauthProvider.verifyOtp(body as VerifyOtpParams);
    }

    return this.oauthProvider.signWithOtp(body);
  }
}
