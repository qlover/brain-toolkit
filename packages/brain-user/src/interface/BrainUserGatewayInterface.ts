import { UserServiceGateway } from '@qlover/corekit-bridge';
import { BrainUser } from '../types/BrainUserTypes';
import { BrainResponse } from './BrainResponse';

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

export type BrainUserGoogleResponse =
  BrainResponse<BrainGoogleCredentials>;

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

export interface BrainGetUserInfoRequest {
  token?: string;
}

export type BrainGetUserInfoResponse = BrainResponse<BrainUser>;
export interface BrainLoginRequest {
  email: string;
  password: string;
  metadata?: Record<string, unknown>;
}

export interface BrainCredentials {
  token?: string;
}

export interface BrainGoogleCredentials extends BrainCredentials {
  existing?: boolean;
  required_fields?: {
    first_name?: string;
    last_name?: string;
  };
}

/**
 * 该接口主要用来描述 BrainGateway(brain web) 的用户接口
 *
 * - 应该实现一样的返回内容, 包含正确的情况，错误的情况
 * - 应该实现一样的请求参数
 */
export interface BrainUserGatewayInterface
  extends UserServiceGateway<BrainUser, BrainCredentials> {
  loginWithGoogle(
    params: BrainUserGoogleRequest
  ): Promise<BrainGoogleCredentials>;

  register(params: BrainUserRegisterRequest): Promise<BrainUser | null>;

  login(params: BrainLoginRequest): Promise<BrainCredentials | null>;

  logout<Params = unknown, Result = void>(params?: Params): Promise<Result>;

  getUserInfo(params: BrainGetUserInfoRequest): Promise<BrainUser | null>;

  refreshUserInfo<Params = BrainGetUserInfoRequest>(
    params?: Params | undefined
  ): Promise<BrainUser | null>;
}

