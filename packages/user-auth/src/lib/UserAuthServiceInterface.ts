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

export interface UserAuthServiceInterface {
  /**
   * 登录
   * @param params 登录参数
   * @returns 登录响应数据
   */
  login(params: LoginRequest): Promise<LoginResponseData>;

  /**
   * 使用 Google 登录
   * @param params 登录参数
   * @returns 登录响应数据
   */
  loginWithGoogle(params: LoginWithGoogleRequest): Promise<LoginResponseData>;

  /**
   * 注册
   * @param params 注册参数
   * @returns 注册响应数据
   */
  register(params: RegisterRequest): Promise<LoginResponseData>;

  /**
   * 登出
   */
  logout(): Promise<void>;

  /**
   * 获取用户信息
   * @param params 获取用户信息参数
   * @returns 用户信息
   */
  getUserInfo(params: GetUserInfoRequest): Promise<UserInfoResponseData>;
}
