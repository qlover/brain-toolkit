/**
 * @description 服务器错误
 * @localZh 服务器错误
 * @localEn Server error
 */
export const API_SERVER_ERROR = 'api:server__error';

/**
 * @description 用户未找到
 * @localZh 用户未找到
 * @localEn User not found
 */
export const API_USER_NOT_FOUND = 'api:user__not_found';

/**
 * @description 用户未验证
 * @localZh 用户未验证
 * @localEn User not verified
 */
export const API_USER_NOT_VERIFIED = 'api:user__not_verfified';

/**
 * @description 用户已存在
 * @localZh 用户已存在
 * @localEn User already exists
 */
export const API_USER_ALREADY_EXISTS = 'api:user__already_exists';

/**
 * @description 响应不正确
 * @localZh 响应不正确
 * @localEn Response not correct
 */
export const API_RESPONSE_NOT_OK = 'api:RESPONSE_NOT_OK';

/**
 * @description 未授权
 * @localZh 未授权
 * @localEn Not authorized
 */
export const API_NOT_AUTHORIZED = 'api:not_authorized';

/**
 * @description 页码不正确
 * @localZh 页码不正确
 * @localEn Page number is incorrect
 */
export const API_PAGE_INVALID = 'api:page__invalid';

/**
 * @description 刷新用户信息失败
 * @localZh 刷新用户信息失败
 * @localEn Refresh user information failed
 */
export const API_REFRESH_USER_INFO_FAILED = 'api:refresh_user_info_failed';

// --- OAuth (RFC 6749 / OIDC) — use as App API `id` and map to RFC `error` on token/userinfo endpoints ---

/**
 * @description OAuth invalid request
 * @localZh 请求无效或参数不完整
 * @localEn Invalid OAuth request
 */
export const API_OAUTH_INVALID_REQUEST = 'api:oauth_invalid_request';

/**
 * @description OAuth invalid client credentials
 * @localZh 客户端认证失败
 * @localEn Invalid OAuth client
 */
export const API_OAUTH_INVALID_CLIENT = 'api:oauth_invalid_client';

/**
 * @description OAuth invalid or expired grant
 * @localZh 授权无效或已过期
 * @localEn Invalid OAuth grant
 */
export const API_OAUTH_INVALID_GRANT = 'api:oauth_invalid_grant';

/**
 * @description OAuth invalid or missing access token
 * @localZh 访问令牌无效
 * @localEn Invalid OAuth access token
 */
export const API_OAUTH_INVALID_TOKEN = 'api:oauth_invalid_token';

/**
 * @description OAuth client not authorized for this request
 * @localZh 客户端无权执行此操作
 * @localEn Unauthorized OAuth client
 */
export const API_OAUTH_UNAUTHORIZED_CLIENT = 'api:oauth_unauthorized_client';

/**
 * @description OAuth client not authorized for this request
 * @localZh 重定向错误
 * @localEn Redirect error
 */
export const API_REDIRECT_URL = 'api:redirect_url';

/**
 * @description OAuth scope not allowed
 * @localZh 请求的权限范围无效
 * @localEn Invalid OAuth scope
 */
export const API_OAUTH_INVALID_SCOPE = 'api:oauth_invalid_scope';

/**
 * @description OAuth resource owner denied consent
 * @localZh 用户拒绝授权
 * @localEn OAuth access denied
 */
export const API_OAUTH_ACCESS_DENIED = 'api:oauth_access_denied';

/**
 * @description OAuth unsupported response type
 * @localZh 不支持的 response_type
 * @localEn Unsupported OAuth response type
 */
export const API_OAUTH_UNSUPPORTED_RESPONSE_TYPE =
  'api:oauth_unsupported_response_type';

/**
 * @description OAuth unsupported grant type
 * @localZh 不支持的 grant_type
 * @localEn Unsupported OAuth grant type
 */
export const API_OAUTH_UNSUPPORTED_GRANT_TYPE =
  'api:oauth_unsupported_grant_type';

/**
 * @description OAuth authorization server error
 * @localZh 授权服务暂时不可用
 * @localEn OAuth server error
 */
export const API_OAUTH_SERVER_ERROR = 'api:oauth_server_error';

/**
 * @description OAuth wrapper upstream login failed during middleware sign-in
 * @localZh 登录失败，请检查账号或密码
 * @localEn OAuth wrapper sign-in failed
 */
export const API_OAUTH_WRAPPER_AUTH_FAILED = 'api:oauth_wrapper_auth_failed';

/**
 * @description 请求体为空
 * @localZh 请求参数为空空
 * @localEn Request Params is required
 */
export const API_REQUEST_BODY_EMPTY = 'api:request_body_empty';

/**
 * @description 没有pam 项目
 * @localZh 项目未找到
 * @localEn Project Not Found
 */
export const API_PAM_PROJECT_NOT_FOUND = 'api:pam_project_not_found';

/**
 * @description Transfer target user was not found
 * @localZh 未找到目标用户，请确认邮箱或用户 ID
 * @localEn Transfer target user was not found
 */
export const API_PAM_TRANSFER_USER_NOT_FOUND =
  'api:pam_transfer_user_not_found';

/**
 * @description Cannot transfer a project to yourself
 * @localZh 不能将项目转让给自己
 * @localEn Cannot transfer a project to yourself
 */
export const API_PAM_TRANSFER_TO_SELF = 'api:pam_transfer_to_self';

/**
 * @description 没有pam 环境
 * @localZh 环境无效
 * @localEn PAM Environment Invalid
 */
export const API_PAM_ENV_NOT_FOUND = 'api:pam_env_not_found';

/**
 * @description 项目 slug 不能重复
 * @localZh 项目 slug 已存在
 * @localEn PAM slug already exists
 */
export const API_PAM_SLUG_EXISTS = 'api:pam_slug_exists';

/**
 * @description 环境名不能重复
 * @localZh 环境名已存在
 * @localEn Env name already exists
 */
export const API_PAM_ENV_NAME_EXISTS = 'api:pam_env_name_exists';

/**
 * @description 环境id不存在
 * @localZh 环境id不存在
 * @localEn Env id not exists
 */
export const API_PAM_ENV_ID_NOT_EXISTS = 'api:pam_env_id_not_exists';

/**
 * @description 环境id不存在
 * @localZh 环境变量 key 重复
 * @localEn Env var key duplicate
 */
export const API_PAM_VARIABLE_KEY_DUPLICATE = 'api:pam_variable_key_duplicate';

/**
 * @description Sensitive variable value is required when creating or replacing
 * @localZh 敏感变量必须填写值
 * @localEn Sensitive variable value is required
 */
export const API_PAM_VARIABLE_VALUE_REQUIRED =
  'api:pam_variable_value_required';

/**
 * @description Password hashing / encrypt failed during register or reset
 * @localZh 密码加密失败
 * @localEn Failed to encrypt password
 */
export const API_ENCRYPT_PASSWORD_FAILED = 'api:encrypt_password_failed';

/**
 * @description OTP sign-in requires phone or email
 * @localZh OTP 登录需要有效的手机号或邮箱
 * @localEn OTP sign requires a valid phone or email
 */
export const API_OTP_SIGN_INVALID = 'api:otp_sign_invalid';

/**
 * @description OTP verify requires phone/email and token
 * @localZh OTP 校验需要手机号/邮箱以及验证码
 * @localEn OTP verification requires a valid phone/email and token
 */
export const API_OTP_VERIFY_INVALID = 'api:otp_verify_invalid';

/**
 * @description OTP / magic-link send rate limited (per IP cooldown)
 * @localZh 发送过于频繁，请稍后再试
 * @localEn Too many send attempts. Please try again later.
 */
export const API_OTP_SEND_RATE_LIMITED = 'api:otp_send_rate_limited';
