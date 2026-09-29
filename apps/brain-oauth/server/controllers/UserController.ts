import { UserScopedRequestLogsRepository } from '@brain-toolkit/next-app-kit/server';
import { ExecutorError } from '@qlover/fe-corekit';
import { Base64Serializer } from '@qlover/fe-corekit/serializer';
import {
  LoginValidator,
  SearchParamsValidator,
  StringEncryptor,
  type LoginSchema,
  type UserSchema,
  type ValidatorInterface
} from '@qlover/next-kit/common';
import {
  SignOtpResult,
  signWithPhoneOtpSchema,
  signWithEmailOtpSchema
} from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import {
  API_OTP_SEND_FAILED,
  API_OTP_VERIFY_FAILED
} from '@config/i18n-identifier/api';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { ServerConfig } from '@server/ServerConfig';
import { OAuthUserService } from '@server/services/OAuthUserService';
import type {
  UserLoginContext,
  UserServiceInterface
} from '../interfaces/UserServiceInterface';
import type {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import type { RequestLogRow } from '@qlover/next-kit/common';

@injectable()
export class UserController {
  protected stringEncryptor: StringEncryptor;
  constructor(
    @inject(LoginValidator)
    protected loginValidator: ValidatorInterface<LoginSchema>,
    @inject(SearchParamsValidator)
    protected searchParamsValidator: ValidatorInterface<ResourceSearchParams>,
    @inject(OAuthUserService) protected userService: UserServiceInterface,
    @inject(UserScopedRequestLogsRepository)
    protected requestLogsRepository: UserScopedRequestLogsRepository,
    @inject(ServerConfig) serverConfig: SeedServerConfigInterface,
    @inject(Base64Serializer) base64Serializer: Base64Serializer
  ) {
    this.stringEncryptor = new StringEncryptor(
      serverConfig.stringEncryptorKey,
      base64Serializer
    );
  }

  public async login(
    requestBody: LoginSchema,
    serverLoginContext?: UserLoginContext
  ): Promise<UserSchema> {
    try {
      if (requestBody.password) {
        requestBody.password = this.stringEncryptor.decrypt(
          requestBody.password
        );
      }
    } catch {
      throw new ExecutorError(
        'encrypt_password_failed',
        'Encrypt password failed'
      );
    }
    const body = await this.loginValidator.getThrow(requestBody);

    return await this.userService.login({
      email: body.email,
      password: body.password,
      loginContext: serverLoginContext
    });
  }

  public async logout(serverContext?: UserLoginContext): Promise<void> {
    return await this.userService.logout(serverContext);
  }

  public async refresh(): Promise<UserSchema> {
    return await this.userService.refresh();
  }

  public async getUser(): Promise<UserSchema> {
    return await this.userService.getUser();
  }

  /**
   * Paged `request_logs` for the current  session user.
   * Response shape matches {@link ResourceSearchResult}.
   */
  public async searchRequestLogsForCurrentUser(
    query: unknown
  ): Promise<ResourceSearchResult<RequestLogRow>> {
    const criteria = await this.searchParamsValidator.getThrow(query);
    const user = await this.userService.getUser();

    return await this.requestLogsRepository.searchForUser(
      String(user.id),
      criteria
    );
  }

  public async signWithOtp(body: unknown): Promise<SignOtpResult> {
    const phoneResult = signWithPhoneOtpSchema.safeParse(body);
    if (phoneResult.success) {
      try {
        return await this.userService.signWithOtp({
          phone: phoneResult.data.phone
        });
      } catch (error) {
        throw new ExecutorError(API_OTP_SEND_FAILED, error as Error);
      }
    }

    const emailResult = signWithEmailOtpSchema.safeParse(body);
    if (emailResult.success) {
      return this.userService.signWithOtp(emailResult.data);
    }

    throw new Error('OTP sign requires a valid phone or email!');
  }

  /**
   * Phone + code login; creates the session like {@link login}.
   */
  public async verifyOtp(
    body: unknown,
    serverLoginContext?: UserLoginContext
  ): Promise<UserSchema> {
    const phoneResult = signWithPhoneOtpSchema.safeParse(body);
    if (!phoneResult.success || !phoneResult.data.token) {
      throw new Error('OTP verification requires a valid phone and token!');
    }

    try {
      return await this.userService.login({
        phone: phoneResult.data.phone,
        code: phoneResult.data.token,
        loginContext: serverLoginContext
      });
    } catch (error) {
      if (error instanceof ExecutorError) {
        throw error;
      }
      throw new ExecutorError(API_OTP_VERIFY_FAILED, error as Error);
    }
  }
}
