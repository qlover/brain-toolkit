import type {
  RequestAdapterConfig,
  RequestAdapterInterface
} from '@qlover/fe-corekit';
import type {
  LoginRequest,
  LoginResponseData,
  LoginWithGoogleRequest,
  RegisterRequest,
  UserAuthServiceInterface,
  UserInfoResponseData
} from './typed/UserAuthServiceInterface';

/**
 * @since 0.0.1
 */
export class UserAuthApi<Cfg extends RequestAdapterConfig>
  implements UserAuthServiceInterface
{
  constructor(protected adapter: RequestAdapterInterface<Cfg>) {}

  async loginWithGoogle(
    params: LoginWithGoogleRequest
  ): Promise<LoginResponseData> {
    const response = await this.adapter.request<
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
  async register(params: RegisterRequest): Promise<LoginResponseData> {
    const response = await this.adapter.request<
      RegisterRequest,
      LoginResponseData
    >({
      url: '/api/auth/token.json',
      method: 'POST',
      data: params
    });

    return response.data;
  }

  async logout(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getUserInfo(): Promise<UserInfoResponseData> {
    const response = await this.adapter.request<{}, UserInfoResponseData>({
      url: '/api/auth/user.json',
      method: 'GET'
    });

    return response.data;
  }

  /**
   * 登录
   * @param params 登录参数
   * @returns 登录响应数据
   */
  async login(params: LoginRequest): Promise<LoginResponseData> {
    const response = await this.adapter.request<
      LoginRequest,
      LoginResponseData
    >({
      url: '/api/auth/token.json',
      method: 'POST',
      data: params
    });

    return response.data;
  }
}
