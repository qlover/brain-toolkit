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
import { apiIdentifier } from './consts';

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
  permissions?: string[];
  profile_img_url?: string;
  amplitude_device_id?: unknown;
  email_verified?: boolean;
}

export interface UserInfoResponseData extends LoginResponseData {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  profile?: UserInfoResponseDataProfile;
  auth_token: {
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

export interface LogoutResponseData {
  /**
   * logout success is : "logged out"
   */
  message?: string;
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
export class ImagicaAuthApi
  implements UserAuthApiInterface<UserInfoResponseData>
{
  protected adapter: RequestAdapterFetch;
  protected userAuthStore: UserAuthStoreInterface<UserInfoResponseData> | null =
    null;

  constructor(config: Partial<ImagicaAuthApiConfig>) {
    this.adapter = parseAdapter(config, this.userAuthStore);
  }

  /**
   * @override
   */
  public getStore(): UserAuthStoreInterface<UserInfoResponseData> | null {
    return this.userAuthStore ?? null;
  }

  /**
   * @override
   */
  public setStore(store: UserAuthStoreInterface<UserInfoResponseData>): void {
    this.userAuthStore = store;
  }

  public getConfig(): ImagicaAuthApiConfig {
    return this.adapter.getConfig();
  }

  public usePlugin(plugin: ExecutorPlugin): void {
    this.adapter.usePlugin(plugin);
  }

  public request<T, R>(
    params: Partial<ImagicaAuthApiConfig> & { data?: T }
  ): Promise<RequestAdapterResponse<T, R>> {
    return this.adapter.request<T, R>(params as RequestAdapterFetchConfig<T>);
  }

  public async loginWithGoogle(
    params: LoginWithGoogleRequest
  ): Promise<LoginResponseData> {
    const response = await this.request<
      LoginWithGoogleRequest,
      LoginResponseData
    >({
      requestId: apiIdentifier.loginWithGoogle,
      url: apiIdentifier.loginWithGoogle,
      method: 'POST',
      data: params
    });

    return response.data;
  }

  /**
   * 注册
   * @override
   * @param params 注册参数
   * @returns 注册响应数据
   */
  public async register(
    params: RegisterRequest
  ): Promise<UserInfoResponseData> {
    const response = await this.request<RegisterRequest, UserInfoResponseData>({
      requestId: apiIdentifier.register,
      url: apiIdentifier.register,
      method: 'POST',
      data: params
    });

    return response.data;
  }

  /**
   * 登出
   * @override
   * @returns 登出响应数据
   */
  public async logout(): Promise<void> {
    const response = await this.request<undefined, LogoutResponseData>({
      requestId: apiIdentifier.logout,
      url: apiIdentifier.logout,
      method: 'GET'
    });

    // FIXME: corekit-bridge logout only return void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data as any;
  }

  /**
   * @override
   */
  public async getUserInfo(
    params: GetUserInfoRequest
  ): Promise<UserInfoResponseData> {
    const response = await this.request<{}, UserInfoResponseData>({
      requestId: apiIdentifier.getUserInfo,
      url: apiIdentifier.getUserInfo,
      method: 'GET',
      token: params.token
    });

    return response.data;
  }

  /**
   * 登录
   * @override
   * @param params 登录参数
   * @returns 登录响应数据
   */
  public async login(params: LoginRequest): Promise<LoginResponseData> {
    const response = await this.request<LoginRequest, LoginResponseData>({
      requestId: apiIdentifier.login,
      url: apiIdentifier.login,
      method: 'POST',
      data: params,
      authKey: false
    });

    return response.data;
  }
}
