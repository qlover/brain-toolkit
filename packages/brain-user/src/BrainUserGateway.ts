import type { EndpointsType } from './config/EndPoints';
import {
  GATEWAY_BRAIN_USER_ENDPOINTS,
  parseEndpoint
} from './config/EndPoints';
import { BRAIN_DOMAINS, defaultEnv } from './config/common';
import { resolveBaseURL } from './utils/createAdapter';
import type * as types from './interface/BrainUserGatewayInterface';
import type { BrainUser } from './types/BrainUserTypes';
import {
  ExecutorError,
  RequestPlugin,
  ResponsePlugin,
  type RequestAdapterInterface,
  type RequestAdapterResponse
} from '@qlover/fe-corekit';
import type { GatewayResult } from '@qlover/corekit-bridge';
import { BrainUserIdentifier } from './config/identifier';

/**
 * Brain User Gateway - Business logic layer for user operations
 *
 * Significance: Bridge between service layer and API layer with business logic
 * Core idea: Transform API responses into domain models and handle business rules
 * Main function: Orchestrate API calls and process responses for service consumption
 * Main purpose: Provide clean interface for user operations with proper error handling and data transformation
 *
 * @example
 * ```ts
 * const api = new BrainUserApi(adapter);
 * const gateway = new BrainUserGateway(api);
 *
 * // Login with Google - returns clean credentials
 * const credentials = await gateway.loginWithGoogle({ authorization_code: 'google-auth-code' });
 *
 * // Register user - returns user data with credentials
 * const user = await gateway.register({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 *
 * // Get user info
 * const userInfo = await gateway.getUserInfo({ token: 'auth-token' });
 * ```
 */
export class BrainUserGateway implements types.BrainUserGatewayInterface {
  protected readonly requestPlugin: RequestPlugin;
  protected readonly responsePlugin: ResponsePlugin;
  constructor(
    protected adapter: RequestAdapterInterface<
      types.BrainUserGatewayConfig<unknown>
    >
  ) {
    this.requestPlugin = new RequestPlugin();
    this.responsePlugin = new ResponsePlugin();
  }

  public getAdapter(): RequestAdapterInterface<
    types.BrainUserGatewayConfig<unknown>
  > {
    return this.adapter;
  }

  public setAdapter(
    adapter: RequestAdapterInterface<types.BrainUserGatewayConfig<unknown>>
  ): void {
    this.adapter = adapter;
  }

  protected getEndpotint(
    action: string,
    endpoints?: Record<string, EndpointsType>
  ): EndpointsType | undefined {
    const merged = {
      ...GATEWAY_BRAIN_USER_ENDPOINTS,
      ...endpoints
    };
    return merged[action as keyof typeof merged];
  }

  protected buildAccessTokenHeaders(
    params?: types.BrainAccessTokenRequest,
    config?: types.BrainUserGatewayConfig<types.BrainAccessTokenRequest>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...(config?.headers as Record<string, string> | undefined)
    };
    const lang = params?.lang ?? 'en';
    headers['X-Brain-User-Lang'] = lang;
    if (params?.location) {
      headers['X-Brain-User-Location'] = params.location;
    }
    if (params?.appVersion) {
      headers['X-APP-VERSION'] = params.appVersion;
    }
    if (params?.deviceUid) {
      headers['X-Brain-Device-Uid'] = params.deviceUid;
    }
    return headers;
  }

  protected handleConfig<T>(
    action: string,
    params: T,
    config?: types.BrainUserGatewayConfig<T>
  ): types.BrainUserGatewayConfig<T> {
    let newConfig = this.requestPlugin.mergeConfig({
      ...this.adapter.config,
      ...config,
      data: params ?? config?.data
    }) as types.BrainUserGatewayConfig<T>;

    // parse endpoint
    const endpoint = this.getEndpotint(action, newConfig?.endpoints);

    if (endpoint) {
      newConfig.requestId = endpoint;
    }

    if (endpoint && !(newConfig.url && newConfig.method)) {
      newConfig = Object.assign(newConfig, parseEndpoint(endpoint));
    }

    return newConfig;
  }

  protected async handleGatewayResult<R>(
    response: RequestAdapterResponse<unknown, unknown>,
    config?: types.BrainUserGatewayConfig<unknown>
  ): Promise<GatewayResult<R>> {
    const result = await this.responsePlugin.handleResponse(
      response,
      config ?? response.config
    );

    if (result == null) {
      console.warn(
        'BrainUserGateway result is null or undefined, You need to check if the responsivePluginhandleResponse method returns correctly'
      );
      return {
        data: null,
        error: new ExecutorError(BrainUserIdentifier.NO_RESPONSE_DATA, {
          cause: result
        })
      };
    }

    const gatewayData = result.data as R;

    return {
      data: gatewayData,
      error: null
    };
  }

  /**
   * Login with Google
   *
   * Significance: Authenticate user using Google OAuth flow
   * Core idea: Exchange Google authorization code or ID token for Brain credentials
   * Main function: Process Google OAuth response and return Brain authentication token
   * Main purpose: Enable seamless Google-based authentication integration
   *
   * This api is used to login with Google.
   *
   * @override
   * @param params - Google login request parameters
   * @param params.authorization_code - Google OAuth authorization code (from redirect)
   * @param params.id_token - Google ID token (alternative to authorization_code)
   * @param params.metadata - Optional metadata (e.g., mode for brain web)
   * @returns Promise resolving to Google credentials with token and optional required_fields
   *
   * @example
   * ```ts
   * // Login with authorization code
   * const credentials = await gateway.loginWithGoogle({
   *   authorization_code: 'google-oauth-code'
   * });
   *
   * // Login with ID token
   * const credentials = await gateway.loginWithGoogle({
   *   id_token: 'google-id-token'
   * });
   * ```
   */
  public loginWithGoogle(
    params: types.BrainUserGoogleRequest,
    config?: types.BrainUserGatewayConfig<types.BrainUserGoogleRequest>
  ): Promise<GatewayResult<types.BrainCredentials>> {
    return this.adapter
      .request(this.handleConfig('loginWithGoogle', params, config))
      .then((response) => {
        return this.handleGatewayResult(response, response.config);
      });
  }

  /**
   * Login with email and password
   *
   * Significance: Authenticate user with traditional credentials
   * Core idea: Validate email/password and return authentication token
   * Main function: Process login request and return credentials
   * Main purpose: Provide standard email/password authentication
   *
   * This api is used to login the user.
   *
   * @override
   * @param params - Login request parameters
   * @param params.email - User email address
   * @param params.password - User password
   * @param params.metadata - Optional metadata for additional context
   * @returns Promise resolving to credentials with token, or null if login fails
   *
   * @example
   * ```ts
   * const credentials = await gateway.login({
   *   email: 'user@example.com',
   *   password: 'password123'
   * });
   *
   * if (credentials?.token) {
   *   console.log('Login successful');
   * }
   * ```
   */
  public async login(
    params: types.BrainLoginRequest,
    config?: types.BrainUserGatewayConfig<types.BrainLoginRequest>
  ): Promise<GatewayResult<types.BrainCredentials>> {
    const response = await this.adapter.request(
      this.handleConfig('login', params, config)
    );
    const result = await this.handleGatewayResult<
      types.BrainCredentials & { name: string }
    >(response, response.config);

    // FIXME: 如果频繁触发登录服务器会提醒邮箱必填
    if (
      result.data &&
      'name' in result.data &&
      result.data.name === 'email is required'
    ) {
      return {
        data: null,
        error: new ExecutorError(BrainUserIdentifier.TOO_FREQUENTLY, {
          cause: result.data
        })
      };
    }

    return result;
  }

  /**
   * Logout current user
   *
   * Significance: End user session and clear server-side authentication
   * Core idea: Invalidate authentication token on server
   * Main function: Send logout request to server
   * Main purpose: Securely terminate user session
   *
   * This api is used to logout the user.
   *
   * @override
   * @param _params - Optional logout parameters (not used, kept for interface compatibility)
   * @returns Promise resolving to void
   *
   * @example
   * ```ts
   * await gateway.logout();
   * // User session is now terminated
   * ```
   */
  public async logout<Parmas = unknown, Result = GatewayResult<null>>(
    params?: Parmas,
    config?: types.BrainUserGatewayConfig<Parmas>
  ): Promise<Result> {
    return this.adapter
      .request(this.handleConfig('logout', params, config))
      .then((response) => {
        return this.handleGatewayResult<null>(response) as Result;
      });
  }

  /**
   * Register a new user account
   *
   * Significance: Create new user account in the system
   * Core idea: Validate registration data and create user profile
   * Main function: Process registration request and return user data with credentials
   * Main purpose: Enable new user onboarding with automatic login
   *
   * This api is used to register a new user.
   *
   * @override
   * @param params - Registration request parameters
   * @param params.email - User email address
   * @param params.password - User password
   * @param params.first_name - User first name
   * @param params.last_name - User last name
   * @param params.otp - Optional OTP code for verification
   * @param params.metadata - Optional metadata for additional information
   * @param params.roles - Optional array of user roles
   * @returns Promise resolving to user data with credentials, or null if registration fails
   *
   * @example
   * ```ts
   * const user = await gateway.register({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   first_name: 'John',
   *   last_name: 'Doe'
   * });
   *
   * // User is automatically logged in after registration
   * console.log('Registered user:', user.email);
   * ```
   */
  public async register(
    params: types.BrainUserRegisterRequest,
    config?: types.BrainUserGatewayConfig<types.BrainUserRegisterRequest>
  ): Promise<GatewayResult<types.BrainCredentials & BrainUser>> {
    return this.adapter
      .request(this.handleConfig('register', params, config))
      .then((response) => {
        return this.handleGatewayResult<types.BrainCredentials & BrainUser>(
          response
        );
      });
  }

  /**
   * Get user info
   *
   * Significance: Retrieve current user information from the server
   * Core idea: Fetch user profile data using authentication token
   * Main function: Call API to get user information and return formatted response
   * Main purpose: Provide user data for application consumption
   *
   * This api is used to get the user info.
   *
   * @override
   * @param data - Get user info parameters (optional, defaults to empty object)
   * @param params.token - Optional authentication token (if not provided, uses token from store)
   * @returns Promise resolving to user data with credentials, or null if not found
   *
   * @example
   * ```ts
   * // Get user info with stored token
   * const user = await gateway.getUserInfo();
   *
   * // Get user info with explicit token
   * const user = await gateway.getUserInfo({ token: 'auth-token' });
   * ```
   */
  public async getUserInfo(
    data?: types.BrainCredentials,
    config?: types.BrainUserGatewayConfig<types.BrainCredentials>
  ): Promise<GatewayResult<types.BrainCredentials & BrainUser>> {
    const response = await this.adapter.request(
      this.handleConfig('getUserInfo', null, {
        ...config,
        token: data?.token ?? config?.token
      })
    );
    const result = await this.handleGatewayResult<
      types.BrainCredentials & BrainUser & { detail?: string }
    >(response);

    if (result.data && result.data.detail === 'Invalid token.') {
      return {
        data: null,
        error: new ExecutorError(
          BrainUserIdentifier.GETUSERINFO_INVALID_TOKEN,
          {
            cause: result.data
          }
        )
      };
    }

    return result;
  }

  /**
   * Refresh user info from server
   *
   * Significance: Update user information with latest data from server
   * Core idea: Fetch current user profile data to ensure data freshness
   * Main function: Call getUserInfo API and return updated user data
   * Main purpose: Synchronize local user data with server state
   *
   * This api is used to refresh the user info.
   *
   * @override
   * @param params - Optional refresh parameters (defaults to empty object)
   * @param params.token - Optional authentication token (if not provided, uses token from store)
   * @returns Promise resolving to updated user data with credentials, or null if not found
   *
   * @example
   * ```ts
   * // Refresh user info with stored token
   * const updatedUser = await gateway.refreshUserInfo();
   *
   * // Refresh user info with explicit token
   * const updatedUser = await gateway.refreshUserInfo({ token: 'auth-token' });
   * ```
   */
  public async refreshUserInfo<Params extends types.BrainCredentials>(
    params?: Params,
    config?: types.BrainUserGatewayConfig<Params>
  ): Promise<GatewayResult<types.BrainCredentials & BrainUser>> {
    return this.getUserInfo(params, config);
  }

  /**
   * Exchange brain-user token for userly access_token (HS256 JWT).
   *
   * Significance: Bridge brain-user login token to matrix-runtime / benchmark JWT
   * Core idea: POST to userly `auth/access_token` with `Authorization: token <token>`
   * Main function: Call userly access_token API with optional device/locale headers
   * Main purpose: Obtain `access_token` after brain-user authentication
   *
   * @override
   * @param params - Optional token override and `X-Brain-*` / `X-APP-VERSION` headers
   * @param config - Gateway config; uses `userlyDomains` or `domains` / `env` for base URL
   * @returns userly access token payload
   *
   * @example
   * ```ts
   * const brainToken = credentials.token!;
   * const { access_token, expires_in } = await gateway.getAccessToken({
   *   token: brainToken,
   *   lang: 'en',
   *   location: '35.1814,136.9064',
   *   appVersion: '1.0.0',
   *   deviceUid: 'stable-device-id'
   * });
   * ```
   */
  public getAccessToken(
    params?: types.BrainAccessTokenRequest,
    config?: types.BrainUserGatewayConfig<types.BrainAccessTokenRequest>
  ): Promise<GatewayResult<types.BrainAccessToken>> {
    const mergedConfig = this.adapter.config;
    const env = config?.env ?? mergedConfig.env ?? defaultEnv;
    const domains =
      config?.userlyDomains ??
      config?.domains ??
      mergedConfig.domains ??
      BRAIN_DOMAINS;
    const baseURL = resolveBaseURL({
      baseURL: config?.baseURL,
      env,
      domains
    });
    const token = params?.token ?? config?.token;

    return this.adapter
      .request(
        this.handleConfig('accessToken', null, {
          ...config,
          baseURL,
          token,
          data: undefined,
          headers: this.buildAccessTokenHeaders(params, config),
          requiredToken: true
        })
      )
      .then((response) => {
        return this.handleGatewayResult<types.BrainAccessToken>(response);
      });
  }

  /**
   * @override
   */
  public verifySignOtp(
    params: types.BrainOtpSignRequest,
    config?: types.BrainUserGatewayConfig<types.BrainOtpSignRequest>
  ): Promise<GatewayResult<types.BrainOtpSignResponse>> {
    return this.adapter
      .request(this.handleConfig('otpSign', params, config))
      .then((response) => {
        return this.handleGatewayResult<types.BrainOtpSignResponse>(response);
      });
  }
}
