import type {
  RequestAdapterConfig,
  RequestAdapterFetchConfig,
  RequestAdapterInterface,
  RequestAdapterResponse
} from '@qlover/fe-corekit';
import type {
  BrainUserGoogleRequest,
  BrainUserRegisterRequest,
  BrainLoginRequest,
  BrainGetUserInfoRequest,
  BrainGetUserInfoResponse,
  BrainCredentials,
  BrainGoogleCredentials
} from './interface/BrainUserGatewayInterface';
import type {
  EndpointsType} from './config/EndPoints';
import {
  GATEWAY_BRAIN_USER_ENDPOINTS,
  parseEndpoint
} from './config/EndPoints';
import type { BrainUser } from './types/BrainUserTypes';
import type { RequestCommonPluginConfig } from '@qlover/corekit-bridge/request-plugins';

export interface BrainUserApiConfig<T>
  extends RequestAdapterFetchConfig<T>,
    RequestCommonPluginConfig {
  /**
   * env
   *
   * You can override the env, to use different domains
   *
   * @default `development`
   */
  env?: string;

  /**
   * domains
   *
   * You can override the domains, to use different domains
   *
   * @default `{ development: 'https://brus-dev.api.brain.ai/v1.0/invoke/brain-user-system/method', production: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'}`
   */
  domains?: Record<string, string>;

  /**
   * Custom API endpoints configuration
   *
   * Allows you to override default API endpoints for different operations.
   * Custom endpoints will be merged with default endpoints, with custom values taking precedence.
   *
   * Endpoint format: `'METHOD /path/to/endpoint'` (e.g., `'POST /api/auth/token.json'`)
   * Supported methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
   *
   * @default `GATEWAY_BRAIN_USER_ENDPOINTS`
   *
   * @example
   * ```ts
   * // Override specific endpoints
   * const api = new BrainUserApi({
   *   endpoints: {
   *     login: 'POST /api/v2/auth/token.json',
   *     getUserInfo: 'GET /api/v2/users/profile.json'
   *   }
   * });
   *
   * // Override all endpoints
   * const api = new BrainUserApi({
   *   endpoints: {
   *     login: 'POST /api/auth/token.json',
   *     register: 'POST /api/users/signup.json',
   *     getUserInfo: 'GET /api/users/me.json',
   *     loginWithGoogle: 'POST /api/auth/google/brain/token',
   *     logout: 'POST /api/users/signout'
   *   }
   * });
   * ```
   */
  endpoints?: Record<string, EndpointsType>;
}

/**
 * Brain User API - Low-level API client for Brain user endpoints
 *
 * Significance: Direct HTTP communication layer for Brain user operations
 * Core idea: Encapsulate all Brain user API endpoints with type-safe request/response
 * Main function: Send HTTP requests to Brain user system endpoints
 * Main purpose: Provide type-safe, low-level API access with proper request configuration
 *
 * @example
 * ```ts
 * const adapter = new RequestAdapterFetch({
 *   baseURL: 'https://brus.api.brain.ai/v1.0/invoke/brain-user-system/method'
 * });
 * const api = new BrainUserApi(adapter);
 *
 * // Login with Google
 * const response = await api.loginWithGoogle({ authorization_code: 'google-auth-code' });
 *
 * // Register user
 * const registerResponse = await api.register({
 *   email: 'user@example.com',
 *   password: 'password123'
 * });
 * ```
 */
export class BrainUserApi<Config extends BrainUserApiConfig<unknown>> {
  constructor(protected adapter: RequestAdapterInterface<Config>) {}

  public getAdapter(): RequestAdapterInterface<Config> {
    return this.adapter;
  }

  protected createConfig<T>(
    endpoint: EndpointsType,
    data?: T
  ): RequestAdapterConfig<T> {
    const { method, url } = parseEndpoint(endpoint);
    const result: RequestAdapterConfig<T> = {
      requestId: endpoint,
      method,
      url
    };

    if (data !== undefined) {
      // For GET requests, use params; for other methods, use data
      if (method === 'GET') {
        Object.assign(result, { params: data });
      } else {
        Object.assign(result, { data });
      }
    }

    return result;
  }

  /**
   * Get merged endpoints configuration
   *
   * Merges default endpoints with custom endpoints from adapter config.
   * Custom endpoints take precedence over default endpoints.
   *
   * @returns Merged endpoints configuration object
   */
  protected getEndpoints(): Record<string, EndpointsType> {
    return {
      ...GATEWAY_BRAIN_USER_ENDPOINTS,
      ...(this.adapter.config.endpoints || {})
    };
  }

  /**
   * Login with Google
   *
   * This api is used to login with Google.
   *
   * @param params Login with Google parameters
   * @returns Login with Google response data
   */
  public loginWithGoogle(
    params: BrainUserGoogleRequest
  ): Promise<
    RequestAdapterResponse<BrainUserGoogleRequest, BrainGoogleCredentials>
  > {
    return this.adapter.request<
      BrainUserGoogleRequest,
      BrainGoogleCredentials
    >(this.createConfig(this.getEndpoints().loginWithGoogle, params));
  }

  /**
   * Register
   *
   * This api is used to register a new user.
   *
   * @param params Register parameters
   * @returns Register response data
   */
  public register(
    params: BrainUserRegisterRequest
  ): Promise<RequestAdapterResponse<BrainUserRegisterRequest, BrainUser>> {
    return this.adapter.request<BrainUserRegisterRequest, BrainUser>(
      this.createConfig(this.getEndpoints().register, params)
    );
  }

  /**
   * Login
   *
   * This api is used to login the user.
   *
   * @param params Login parameters
   * @returns Login response data
   */
  public login(
    params: BrainLoginRequest
  ): Promise<RequestAdapterResponse<BrainLoginRequest, BrainCredentials>> {
    return this.adapter.request<BrainLoginRequest, BrainCredentials>(
      this.createConfig(this.getEndpoints().login, params)
    );
  }

  /**
   * Logout
   *
   * This api is used to logout the user.
   *
   * @returns Logout response data
   */
  public async logout(): Promise<void> {
    await this.adapter.request(this.createConfig(this.getEndpoints().logout));
  }

  /**
   * Get user info
   *
   * This api is used to get the user info.
   *
   * @param params Get user info parameters
   * @returns Get user info response data
   */
  public getUserInfo(
    params?: BrainGetUserInfoRequest
  ): Promise<
    RequestAdapterResponse<
      BrainGetUserInfoRequest,
      BrainGetUserInfoResponse
    >
  > {
    const _config = this.createConfig(
      this.getEndpoints().getUserInfo
    ) as Config;

    // 可能会传递一个带有 token 的请求
    if (params?.token) {
      Object.assign(_config, { token: params.token });
    }

    return this.adapter.request(
      _config as RequestAdapterConfig<BrainGetUserInfoRequest>
    );
  }
}

