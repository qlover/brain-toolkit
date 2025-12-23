import type { BrainGoogleCredentials } from '../interface/BrainUserGatewayInterface';

export interface BrainCredentials extends BrainGoogleCredentials {}

export interface BrainUserPermissions {
  key?: string;
  value?: string[];
}

export interface BrainUserProfileInterface {
  phone_number?: string;
  da_email?: string;
  da_email_password?: string;
  certificate?: string;
  /**
   * 权限列表与 feature_tags 无关
   *
   * @example 可能的值，但是其中的key目前没有类型定义
   *
   * ```ts
   * [
   *   {
   *     "key": "restricted_resources",
   *     "value": [ "exec-poll", "lambda" ]
   *   },
   *   {
   *     "key": "ably_api_key",
   *     "value": [
   *       "9DARAA.YTQa9g:slBfNNHkwGHkLchf-Ih1XMvvHVmcQ2iR3Az-mMUdtTg"
   *     ]
   *   }
   * ]
   * ```
   */
  permissions?: BrainUserPermissions[];

  /**
   * 头像的 url
   *
   * 该地址可能是一个 s3 地址需要下载
   *
   * @example "https://s3.amazonaws.com/brain-user-profile-images/1234567890.jpg"
   */
  profile_img_url?: string;
  amplitude_device_id?: unknown;
  email_verified?: boolean;
}

/**
 * 用户 feature tag 类型
 *
 * **也有可能是 "gen_UI" 这样没有前缀的 tag**
 *
 * @example "disabled_gen_UI" | "enabled_gen_UI" | "gen_UI" | "test_tag"
 */
export type BrainUserFeatureTagType = string;

export interface BrainUser extends BrainCredentials {
  id: number;
  email: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  profile?: BrainUserProfileInterface;

  /**
   * 认证 token
   *
   * 用于表示当前用户认证 token
   *
   * @example { key: "1234567890" }
   */
  auth_token: {
    key: string;
  };
  /**
   * 是否为游客
   */
  is_guest?: boolean;
  /**
   * 是否为超级用户
   */
  is_superuser?: boolean;
  /**
   * 是否为活跃用户
   */
  is_active?: boolean;
  /**
   * 角色
   *
   * 用于表示当前用户属于哪些角色
   *
   * @example ["user", "premium"] 表示当前用户属于 user 和 premium 角色
   */
  roles?: string[];
  /**
   * 创建时间
   *
   * @example "2023-05-31T07:28:50.075697Z"
   */
  created_at?: string;
  referral_enabled?: boolean;
  referred_by?: unknown;
  is_live?: unknown;
  promocode?: string;
  /**
   * TODO: 这个Tags可能已经被弃用了?
   */
  tags?: string[];
  /**
   * 关于账号权限的标签
   *
   * brain web 默认允许用户拥有所有权限，仅当 feature_tags 中存在 disable_xxx 开头时，才会禁用该权限
   *
   * @example 表示为禁用 gen ui 权限, 则用户无法使用 gen ui 功能
   *
   * ```ts
   * {
   *  feature_tags: [
   *    'disable_gen_UI',
   *  ]
   * }
   *
   * ```
   */
  feature_tags?: readonly BrainUserFeatureTagType[];
  is_supernatural?: boolean;
  is_decentralized?: boolean;

  /**
   * TODO: 账户信息? 是什么?
   */
  account?: unknown;
}
