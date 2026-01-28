import type { UserServiceGateway } from '@qlover/corekit-bridge/gateway-service';
import type { BrainUser } from '../types/BrainUserTypes';
import type { BrainResponse } from './BrainResponse';
import type { EndpointsType } from '../config/EndPoints';
import type {
  RequestAdapterConfig,
  RequestPluginConfig
} from '@qlover/fe-corekit';

export interface BrainUserGatewayConfig<T>
  extends RequestAdapterConfig<T>,
    RequestPluginConfig {
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

export interface BrainUserGoogleRequest {
  /**
   * 一般用来直接使用 code 登录
   *
   * 比如浏览器地址栏传入 google_auth_code 参数时
   */
  authorization_code?: string;
  /**
   * 一般用来直接使用 id_token 登录
   *
   * 比如浏览器地址栏传入 google_id_token 参数时
   */
  id_token?: string;

  /**
   * 额外的一些参数
   *
   * 目前已知的有:
   *
   * - mode: 用于 brain web 版时区分不同的场景
   */
  metadata?: Record<string, unknown>;
}

export type BrainUserGoogleResponse = BrainResponse<BrainCredentials>;

export interface BrainGatewayRequestMetadata {
  /**
   * 该 mode 用于 brain web 版时区分不同的场景
   *
   * 它的值来自 `/api/studios` 接口的 response 中的 mode 字段
   *
   * 可能的值:
   *
   * - creator
   * - sharer
   * - editor
   */
  mode?: string;

  [key: string]: unknown;
}

export interface BrainUserRegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  // profile?: UserInfoResponseDataProfile;
  otp?: string;
  metadata?: Record<string, unknown>;
  roles?: string[];
}

export type BrainUserRegisterResponse = BrainResponse<
  BrainUserRegisterOtpResult | BrainUser
>;

export interface BrainUserRegisterOtpResult {
  OTP_EXP: string;
  detail: string;
  required: string;
}

export type BrainGetUserInfoResponse = BrainResponse<BrainUser>;
export interface BrainLoginRequest {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface BrainBaseCredentials {
  token?: string;
}

export interface BrainCredentials extends BrainBaseCredentials {
  existing?: boolean;
  required_fields?: {
    first_name?: string;
    last_name?: string;
  };
}

export interface BrainUserRequestConfig
  extends BrainUserGatewayConfig<unknown> {}

/**
 * 该接口主要用来描述 BrainGateway(brain web) 的用户接口
 *
 * - 应该实现一样的返回内容, 包含正确的情况，错误的情况
 * - 应该实现一样的请求参数
 */
export interface BrainUserGatewayInterface
  extends UserServiceGateway<
    BrainUser,
    BrainBaseCredentials,
    BrainUserGatewayConfig<unknown>
  > {
  register(
    params: BrainUserRegisterRequest,
    config?: BrainUserGatewayConfig<BrainUserRegisterRequest>
  ): Promise<BrainUser | null>;

  login(
    params: BrainLoginRequest,
    config?: BrainUserGatewayConfig<BrainLoginRequest>
  ): Promise<BrainCredentials | null>;

  logout<Params = unknown, Result = void>(
    params?: Params,
    config?: BrainUserGatewayConfig<Params>
  ): Promise<Result>;

  getUserInfo(
    params?: BrainCredentials,
    config?: BrainUserGatewayConfig<BrainCredentials>
  ): Promise<BrainUser | null>;

  refreshUserInfo<Params extends BrainCredentials>(
    params?: Params | undefined,
    config?: BrainUserGatewayConfig<Params>
  ): Promise<BrainUser | null>;

  loginWithGoogle(
    params: BrainUserGoogleRequest,
    config?: BrainUserGatewayConfig<BrainUserGoogleRequest>
  ): Promise<BrainCredentials | null>;
}
