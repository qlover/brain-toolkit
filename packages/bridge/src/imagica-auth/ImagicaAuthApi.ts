import {
  type UserAuthApiInterface,
  type RequestCommonPluginConfig,
  RequestCommonPlugin,
  UserAuthStore
} from '@qlover/corekit-bridge';
import {
  ExecutorPlugin,
  FetchURLPlugin,
  RequestAdapterFetch,
  RequestAdapterFetchConfig,
  RequestAdapterResponse
} from '@qlover/fe-corekit';
import { defaultDomains, defaultEnv } from './consts';

export interface LoginRequest {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface LoginResponseData {
  token?: string;
  [key: string]: unknown;
}

export class UserInfoResponseDataProfile {
  phone_number?: string;
  da_email?: string;
  da_email_password?: string;
  certificate?: string;
  permissions?: Permissions[];
  profile_img_url?: string;
  amplitude_device_id?: unknown;
  email_verified?: boolean;
}

export interface UserInfoResponseData {
  id?: number;
  email?: string;
  name?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  profile?: UserInfoResponseDataProfile;
  auth_token?: {
    key: string;
  };
  is_guest?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  roles?: string[];
  created_at?: string;
  referral_enabled?: boolean;
  referred_by?: unknown;
  is_live?: unknown;
  promocode?: string;
  tags?: string[];
  feature_tags?: string[];
  is_supernatural?: boolean;
  is_decentralized?: boolean;
  account?: unknown;
}

export interface LoginWithGoogleRequest {
  authorization_code?: string;
  id_token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  profile?: UserInfoResponseDataProfile;
  otp?: string;
  metadata?: Record<string, unknown>;
  roles?: string[];
}

export interface GetUserInfoRequest {
  token?: string;
}

export interface ImagicaAuthApiConfig
  extends RequestAdapterFetchConfig,
    RequestCommonPluginConfig {
  /**
   * env
   *
   * You can override the env, to use different domains
   *
   * @default `production`
   */
  env?: string;

  /**
   * domains
   *
   * You can override the domains, to use different domains
   *
   * @default `{ development: 'https://api-dev.braininc.net', production: 'https://api.braininc.net'}`
   */
  domains?: Record<string, string>;

  /**
   * tokenPrefix
   *
   * @default `token`
   */
  tokenPrefix?: string;
}

/**
 * User authentication API implementation
 * @since 0.0.1
 */
export class ImagicaAuthApi
  implements UserAuthApiInterface<UserInfoResponseData>
{
  protected adapter: RequestAdapterFetch;
  protected userAuthStore?: UserAuthStore<UserInfoResponseData>;

  constructor(config: Partial<ImagicaAuthApiConfig>) {
    const {
      env = defaultEnv,
      domains = defaultDomains,
      ...restConfig
    } = config;

    this.adapter = new RequestAdapterFetch({
      baseURL: env && domains ? domains[env] : undefined,
      ...restConfig
    });

    this.adapter.usePlugin(new FetchURLPlugin());
    this.adapter.usePlugin(
      new RequestCommonPlugin({
        token: () => this.userAuthStore?.getToken() ?? null,
        ...restConfig
      })
    );
  }

  setUserAuthStore(store: UserAuthStore<UserInfoResponseData>): void {
    this.userAuthStore = store;
  }

  usePlugin(plugin: ExecutorPlugin): void {
    this.adapter.usePlugin(plugin);
  }

  request<T, R>(
    params: Partial<ImagicaAuthApiConfig> & { data?: T }
  ): Promise<RequestAdapterResponse<T, R>> {
    return this.adapter.request<T, R>(params as RequestAdapterFetchConfig<T>);
  }

  async loginWithGoogle(
    params: LoginWithGoogleRequest
  ): Promise<LoginResponseData> {
    const response = await this.request<
      LoginWithGoogleRequest,
      LoginResponseData
    >({
      url: '/api/auth/google/imagica/token',
      method: 'POST',
      data: params
    });

    return response.data;
  }

  /**
   * 注册
   * @param params 注册参数
   * @returns 注册响应数据
   */
  register(params: RegisterRequest): Promise<LoginResponseData> {
    return this.request<RegisterRequest, LoginResponseData>({
      url: '/api/auth/token.json',
      method: 'POST',
      data: params
    });
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }

  async getUserInfo(params: GetUserInfoRequest): Promise<UserInfoResponseData> {
    const response = await this.request<{}, UserInfoResponseData>({
      url: '/api/users/me.json',
      method: 'GET',
      token: params.token
    });

    return response.data;
  }

  /**
   * 登录
   * @param params 登录参数
   * @returns 登录响应数据
   */
  async login(params: LoginRequest): Promise<LoginResponseData> {
    const response = await this.request<LoginRequest, LoginResponseData>({
      url: '/api/auth/token.json',
      method: 'POST',
      data: params,
      authKey: false
    });

    return response.data;
  }
}
