import {
  type UserAuthApiInterface,
  type RequestCommonPluginConfig,
  type UserAuthStoreInterface,
  RequestCommonPlugin
} from '@qlover/corekit-bridge';
import {
  type ExecutorPlugin,
  type RequestAdapterFetchConfig,
  type RequestAdapterResponse,
  FetchURLPlugin,
  RequestAdapterFetch
} from '@qlover/fe-corekit';

export interface LoginRequest {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface LoginResponseData {
  token?: string;
  [key: string]: unknown;
}

export interface UserInfoResponseDataProfile {
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
}

function parseAdapter(
  config: Partial<ImagicaAuthApiConfig>,
  userAuthStore: UserAuthStoreInterface<UserInfoResponseData> | null
) {
  const { env, domains, ...restConfig } = config;

  const fetchAdapter = new RequestAdapterFetch({
    baseURL: env && domains ? domains[env] : undefined,
    ...restConfig
  });

  fetchAdapter.usePlugin(new FetchURLPlugin());

  fetchAdapter.usePlugin(
    new RequestCommonPlugin({
      token: () => userAuthStore?.getCredential() ?? null,
      ...restConfig
    })
  );

  return fetchAdapter;
}

/**
 * User authentication API implementation
 * @since 0.0.1
 */
export class ImagicaAuthApi<
  User extends UserInfoResponseData = UserInfoResponseData
> implements UserAuthApiInterface<User>
{
  protected adapter: RequestAdapterFetch;
  protected userAuthStore: UserAuthStoreInterface<User> | null = null;

  constructor(config: Partial<ImagicaAuthApiConfig>) {
    this.adapter = parseAdapter(config, this.userAuthStore);
  }

  getStore(): UserAuthStoreInterface<User> | null {
    return this.userAuthStore ?? null;
  }

  setStore(store: UserAuthStoreInterface<User>): void {
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

  async getUserInfo(params: GetUserInfoRequest): Promise<User> {
    const response = await this.request<{}, User>({
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
