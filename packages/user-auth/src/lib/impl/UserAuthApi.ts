import type {
  LoginRequest,
  LoginResponseData,
  LoginWithGoogleRequest,
  RegisterRequest,
  UserAuthServiceInterface,
  UserInfoResponseData
} from '../UserAuthServiceInterface';

const defaultDomains: Record<string, string> = {
  development: 'https://api-dev.braininc.net',
  production: 'https://api.braininc.net'
};

export interface UserAuthApiConfig extends globalThis.RequestInit {
  /**
   * env
   *
   * You can override the env, to use different domains
   *
   * @default `process.env.NODE_ENV`
   */
  env?: string;

  /**
   * baseURL
   *
   * @default `env ? defaultDomains[env] : ''`
   */
  baseURL?: string;

  /**
   * url
   *
   * @default `''`
   */
  url?: string;

  /**
   * fetch
   *
   * @default `globalThis.fetch`
   */
  fetcher?: typeof globalThis.fetch;
}

/**
 * User authentication API implementation
 * @since 0.0.1
 */
export class UserAuthApi implements UserAuthServiceInterface {
  constructor(protected config: UserAuthApiConfig) {
    const { env = process.env.NODE_ENV, fetcher, ...restConfig } = config;
    const _fetcher =
      fetcher ||
      (typeof window !== 'undefined' ? window.fetch : globalThis.fetch);

    this.config = {
      baseURL: env ? defaultDomains[env] : '',
      headers: {
        'Content-Type': 'application/json'
      },
      ...restConfig,
      fetcher: _fetcher
    };
  }

  request<T, R>(
    params: Partial<Omit<UserAuthApiConfig, 'data'> & { data?: T }>
  ): Promise<R> {
    const {
      baseURL = '',
      fetcher,
      data,
      url,
      method = 'GET',
      ...restParams
    } = { ...this.config, ...params };

    if (!fetcher) {
      throw new Error('fetcher is not set');
    }

    const requestUrl = baseURL + url;

    return fetcher(requestUrl, {
      method,
      body:
        method === 'GET' ? undefined : data ? JSON.stringify(data) : undefined,
      ...restParams
    }).then((res) => res.json());
  }

  loginWithGoogle(params: LoginWithGoogleRequest): Promise<LoginResponseData> {
    return this.request<LoginWithGoogleRequest, LoginResponseData>({
      url: '/api/auth/google/imagica/token',
      method: 'POST',
      data: params
    });
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
    throw new Error('Method not implemented.');
  }

  getUserInfo(): Promise<UserInfoResponseData> {
    return this.request<{}, UserInfoResponseData>({
      url: '/api/auth/user.json',
      method: 'GET'
    });
  }

  /**
   * 登录
   * @param params 登录参数
   * @returns 登录响应数据
   */
  login(params: LoginRequest): Promise<LoginResponseData> {
    return this.request<LoginRequest, LoginResponseData>({
      url: '/api/auth/token.json',
      method: 'POST',
      data: params
    });
  }
}
