import { UserInfoResponseData } from './UserAuthServiceInterface';

export enum LOGIN_STATUS {
  LOADING = 'loading',
  SUCCESS = 'success',
  FAILED = 'failed'
}

export interface UserAuthStoreInterface {
  setToken(token: string): void;
  getToken(): string;

  /**
   * 设置用户信息
   */
  setUserInfo(params: UserInfoResponseData): void;
  /**
   * 获取用户信息
   */
  getUserInfo(): UserInfoResponseData;

  /**
   * 切换登录状态
   */
  changeLoginStatus(status: LOGIN_STATUS): void;
}
