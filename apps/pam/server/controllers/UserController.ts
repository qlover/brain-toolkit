import { ExecutorError } from '@qlover/fe-corekit/executor';
import { Base64Serializer } from '@qlover/fe-corekit/serializer';
import {
  LoginValidator,
  SearchParamsValidator,
  StringEncryptor,
  loginWithProviderCallbackSchema,
  type LoginSchema,
  type RequestLogRow,
  type UserSchema,
  type ValidatorInterface
} from '@qlover/next-kit/common';
import { RequestLogsRepository } from '@qlover/next-kit/server';
import {
  SignOtpResult,
  signWithPhoneOtpSchema,
  signWithEmailOtpSchema
} from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import { loginWithProviderSchema } from '@schemas/LoginSchema';
import type { SeedServerConfigInterface } from '@interfaces/SeedConfigInterface';
import { LoginProviderResult } from '@interfaces/UserServiceInterface';
import { ServerConfig } from '@server/ServerConfig';
import { BrainOAuthLoginService } from '@server/services/BrainOAuthLoginService';
import type { BrainOAuthCallbackSuccess } from '@server/services/BrainOAuthLoginService';
import { OAuthUserService } from '@server/services/OAuthUserService';
import { ResultHandlerContext } from '@server/utils/NextApiHandler';
import type {
  UserLoginContext,
  UserServiceInterface
} from '../interfaces/UserServiceInterface';
import type {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';

@injectable()
export class UserController {
  protected stringEncryptor: StringEncryptor;
  constructor(
    @inject(LoginValidator)
    protected loginValidator: ValidatorInterface<LoginSchema>,
    @inject(SearchParamsValidator)
    protected searchParamsValidator: ValidatorInterface<ResourceSearchParams>,
    @inject(OAuthUserService) protected userService: UserServiceInterface,
    @inject(BrainOAuthLoginService)
    protected brainOAuthLoginService: BrainOAuthLoginService,
    @inject(RequestLogsRepository)
    protected requestLogsRepository: RequestLogsRepository,
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

  public async register(requestBody: LoginSchema): Promise<UserSchema> {
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

    const user = await this.userService.register({
      email: body.email,
      password: body.password
    });

    return user;
  }

  public async logout(serverContext?: UserLoginContext): Promise<void> {
    return await this.userService.logout(serverContext);
  }

  public async refresh(): Promise<UserSchema> {
    return await this.userService.refresh();
  }

  public async getUser(): Promise<UserSchema | null> {
    return await this.userService.refresh();
  }

  /**
   * Paged `request_logs` for the current  session user.
   * Response shape matches {@link ResourceSearchResult}.
   */
  public async searchRequestLogsForCurrentUser(
    query: unknown
  ): Promise<ResourceSearchResult<RequestLogRow>> {
    const criteria = await this.searchParamsValidator.getThrow(query);

    return await this.requestLogsRepository.search(criteria);
  }

  public signWithOtp(body: unknown): Promise<SignOtpResult> {
    const phoneResult = signWithPhoneOtpSchema.safeParse(body);
    if (phoneResult.success) {
      return this.userService.signWithOtp(phoneResult.data);
    }

    const emailResult = signWithEmailOtpSchema.safeParse(body);
    if (emailResult.success) {
      return this.userService.signWithOtp(emailResult.data);
    }

    throw new Error('OTP sign requires a valid phone or email!');
  }

  public verifyOtp(body: unknown): Promise<SignOtpResult> {
    const phoneResult = signWithPhoneOtpSchema.safeParse(body);
    if (phoneResult.success && phoneResult.data.token) {
      return this.userService.signWithOtp(phoneResult.data);
    }

    const emailResult = signWithEmailOtpSchema.safeParse(body);
    if (emailResult.success && emailResult.data.token) {
      return this.userService.signWithOtp(emailResult.data);
    }

    throw new Error('OTP verification requires a valid phone/email and token!');
  }

  public loginWithProvider(_query: unknown): Promise<LoginProviderResult> {
    const params = loginWithProviderSchema.parse(_query);

    return this.userService.loginWithProvider({
      provider: params.provider
    });
  }

  public loginWithProviderCallback(
    _query: unknown
  ): Promise<ResultHandlerContext> {
    const params = loginWithProviderCallbackSchema.parse(_query);

    return this.userService.loginWithProviderCallback(params);
  }

  /** Start Brain OAuth authorize (PKCE). */
  public loginWithBrainPkce(query: {
    locale?: string;
    returnTo?: string;
  }): Promise<LoginProviderResult> {
    return this.brainOAuthLoginService.startLogin({
      locale: typeof query.locale === 'string' ? query.locale : undefined,
      returnTo: typeof query.returnTo === 'string' ? query.returnTo : undefined
    });
  }

  /** Brain OAuth authorization-code callback. */
  public loginWithBrainPkceCallback(
    query: Record<string, string>
  ): Promise<BrainOAuthCallbackSuccess> {
    return this.brainOAuthLoginService.handleCallback({
      code: query.code,
      state: query.state,
      error: query.error,
      error_description: query.error_description,
      origin: query.origin
    });
  }
}
