import {
  LoginRequest,
  LoginResponseData,
  UserAuthServiceInterface,
  UserInfoResponseData
} from './UserAuthServiceInterface';
import { UserAuthStoreInterface } from './UserAuthStoreInterface';
import { UserAuthApi, UserAuthApiConfig } from './impl/UserAuthApi';

export interface UserAuthOptions extends UserAuthApiConfig {
  /**
   * user auth service
   *
   * implement api request
   *
   * @default `UserAuthApi`
   */
  service?: UserAuthServiceInterface;

  /**
   * user auth store
   */
  store?: UserAuthStoreInterface;

  href?: string;

  /**
   * token key
   */
  tokenKey?: string;
}

/**
 *
 * @example
 *
 *
 * const userAuth = new UserAuth({
 *   baseURL: ''
 * });
 *
 * userAuth.login({
 *   email: 'test@test.com',
 *   password: 'test'
 * });
 *
 * userAuth.getUserInfo();
 *
 * userAuth.logout();
 */
export class UserAuth {
  constructor(protected options: UserAuthOptions) {
    const { service, store, href, ...config } = options;

    options.service = service || new UserAuthApi(config);

    if (href && store) {
      store.setToken(this.getTokenFromHref(href));
    }
  }

  get store(): UserAuthStoreInterface {
    return this.options.store!;
  }

  get service(): UserAuthServiceInterface {
    return this.options.service!;
  }

  getTokenFromHref(href: string): string {
    if (!this.options.tokenKey) {
      return '';
    }

    const url = new URL(href);
    return url.searchParams.get(this.options.tokenKey) || '';
  }

  async login(params: LoginRequest): Promise<LoginResponseData> {
    const response = await this.service.login(params);

    if (!response.token) {
      throw new Error('login failed');
    }

    await this.fetchUserInfo(response.token);

    return response;
  }

  async fetchUserInfo(token?: string): Promise<UserInfoResponseData> {
    if (!token) {
      token = this.store.getToken();
    }

    if (!token) {
      throw new Error('token is not set');
    }

    const response = await this.service.getUserInfo({ token });

    this.store.setToken(token);
    this.store.setUserInfo(response);

    return response;
  }
}
