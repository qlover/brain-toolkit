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
import { Operators } from '@qlover/next-kit/server';
import {
  SignOtpResult,
  signWithPhoneOtpSchema,
  signWithEmailOtpSchema
} from '@qlover/oauth-wrapper';
import {
  isUuid,
  sanitizeSearchKeyword,
  type RequestLogFilters
} from '@shared/admin/adminDashboard';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
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

type RequestLogsSearch = Parameters<
  UserScopedRequestLogsRepository['search']
>[0];

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
   * Paged `request_logs`: own rows for normal users, every row for Brain
   * admins. `keyword` matches the request ID (UUID) or path / IP; `filters`
   * accepts `{ category?: string; success?: boolean }`.
   * Response shape matches {@link ResourceSearchResult}.
   */
  public async searchRequestLogsForCurrentUser(
    query: unknown
  ): Promise<ResourceSearchResult<RequestLogRow>> {
    const criteria = await this.searchParamsValidator.getThrow(query);
    const user = await this.userService.getUser();

    const where: [string, string, unknown][] = [];
    if (!isBrainAdminUser(user)) {
      where.push(['user_id', Operators.eq, String(user.id)]);
    }
    const filters = parseRequestLogFilters(criteria.filters);
    if (filters.category) {
      where.push(['event_category', Operators.eq, filters.category]);
    }
    if (filters.success !== undefined) {
      where.push(['success', Operators.eq, filters.success]);
    }

    const keyword = sanitizeSearchKeyword(criteria.keyword);
    const whereOr: [string, string, unknown][] = [];
    if (keyword && isUuid(keyword)) {
      where.push(['request_id', Operators.eq, keyword]);
    } else if (keyword) {
      whereOr.push(
        ['payload->>http_path', Operators.ilike, `*${keyword}*`],
        ['payload->>ip_address', Operators.ilike, `*${keyword}*`]
      );
    }

    return await this.requestLogsRepository.search({
      ...criteria,
      keyword: undefined,
      filters: undefined,
      where: where as unknown as RequestLogsSearch['where'],
      ...(whereOr.length
        ? { whereOr: whereOr as unknown as RequestLogsSearch['whereOr'] }
        : {})
    });
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

function parseRequestLogFilters(raw: unknown): RequestLogFilters {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const { category, success } = value as Record<string, unknown>;
  return {
    category:
      typeof category === 'string' && /^[a-z0-9_.-]{1,32}$/i.test(category)
        ? category
        : undefined,
    success: typeof success === 'boolean' ? success : undefined
  };
}
