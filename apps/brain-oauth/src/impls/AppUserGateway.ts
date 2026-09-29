import { HttpMethods, RequestExecutor } from '@qlover/fe-corekit';
import { SignOtpResult, SignWithOtpParams } from '@qlover/oauth-wrapper';
import { inject, injectable } from '@shared/container';
import {
  API_OAUTH_CONSENT,
  API_OAUTH_VERIFY,
  API_USER_LOGIN,
  API_USER_LOGOUT,
  API_USER_OTP_LOGIN,
  API_USER_OTP_VERIFY,
  API_USER_SESSION
} from '@config/route';
import type {
  UserApiLoginTransaction,
  UserApiLogoutTransaction,
  UserSubmitOAuthConsentTransaction
} from '@interfaces/AppUserApiInterface';
import { UserServiceGatewayInterface } from '@interfaces/UserServiceInterface';
import {
  AppApiConfig,
  AppApiRequester,
  AppApiRequesterContext
} from './appApi/AppApiRequester';
import type { GatewayResult, LoginParams } from '@qlover/corekit-bridge';
import type { NextKitApiResult } from '@qlover/next-kit/common';
import type { UserCredential, UserSchema } from '@qlover/next-kit/common';

/**
 * UserApi
 *
 * @description
 * UserApi is a client for the user API.
 *
 */
@injectable()
export class AppUserGateway implements UserServiceGatewayInterface {
  constructor(
    @inject(AppApiRequester)
    protected client: RequestExecutor<AppApiConfig, AppApiRequesterContext>
  ) {}

  /**
   * @override
   */
  public getUserInfo(
    _params?: unknown,
    _config?: unknown
  ): Promise<GatewayResult<UserSchema>> {
    throw new Error('Method not implemented.');
  }
  /**
   * @override
   */
  public async refreshUserInfo(
    _params?: unknown,
    _config?: {} | undefined
  ): Promise<GatewayResult<UserSchema>> {
    const response = await this.client.request<
      UserApiLoginTransaction['response'],
      UserApiLoginTransaction['request']
    >({
      ..._config,
      url: API_USER_SESSION,
      method: HttpMethods.GET
    });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return {
      data: response.data.data as UserSchema,
      error: null
    };
  }

  /**
   * @override
   */
  public async login(
    params: UserApiLoginTransaction['data'] & LoginParams,
    url?: string
  ): Promise<GatewayResult<UserCredential>> {
    const response = await this.client.request<
      UserApiLoginTransaction['response'],
      UserApiLoginTransaction['request']
    >({
      url: url ?? API_USER_LOGIN,
      method: HttpMethods.POST,
      data: params,
      encryptProps: 'password'
    });

    if (!response.data.success) {
      throw new Error(response.data.message);
    }

    return {
      data: response.data.data as UserCredential,
      error: null
    };
  }

  /**
   * Brain accounts are created upstream; brain-oauth has no sign-up.
   *
   * @override
   */
  public async register(): Promise<GatewayResult<UserSchema>> {
    throw new Error('Registration is not supported');
  }

  /**
   * @override
   */
  public async logout<R = void>(_params?: unknown): Promise<R> {
    await this.client.request<
      UserApiLogoutTransaction['response'],
      UserApiLogoutTransaction['request']
    >({
      url: API_USER_LOGOUT,
      method: HttpMethods.POST
    });

    return undefined as R;
  }

  /**
   * @override
   */
  public async verify(
    params: UserApiLoginTransaction['data'] & LoginParams
  ): Promise<GatewayResult<UserCredential>> {
    return this.login(params, API_OAUTH_VERIFY);
  }

  /**
   * @override
   */
  public async submitOAuthConsent(
    payload: UserSubmitOAuthConsentTransaction['request']
  ): Promise<string> {
    const response = await this.client.request<
      UserSubmitOAuthConsentTransaction['response'],
      UserSubmitOAuthConsentTransaction['request']
    >({
      url: API_OAUTH_CONSENT,
      method: HttpMethods.POST,
      data: payload
    });

    if (!response.data.success) {
      throw new Error(response.data.message ?? 'Consent submission failed');
    }

    return response.data.data!.redirectUrl;
  }

  /**
   * Send OTP (step 1) — supports both phone and email
   * @override
   */
  public async sendOtp(params: SignWithOtpParams): Promise<SignOtpResult> {
    const response = await this.client.request<
      NextKitApiResult<SignOtpResult>,
      SignWithOtpParams
    >({
      url: API_USER_OTP_LOGIN,
      method: HttpMethods.POST,
      data: params
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(
        (response.data as { message?: string }).message ?? 'Send OTP failed'
      );
    }

    return response.data.data;
  }

  /**
   * Phone + code login (step 2); the server creates the session.
   * @override
   */
  public async verifyOtp(params: {
    phone: string;
    token: string;
  }): Promise<UserSchema> {
    const response = await this.client.request<
      NextKitApiResult<UserSchema>,
      typeof params
    >({
      url: API_USER_OTP_VERIFY,
      method: HttpMethods.POST,
      data: params
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(
        (response.data as { message?: string }).message ??
          'OTP verification failed'
      );
    }

    return response.data.data;
  }
}
