/**
 * @description Validator for login params
 * @localZh 不是一个有效的登录参数
 * @localEn Not a valid login parameter
 */
export const V_LOGIN_PARAMS_REQUIRED = 'common:v:login_params_required';

/**
 * @description Username required validation message
 * @localZh 用户名为必填
 * @localEn Username is required
 */
export const V_USERNAME_REQUIRED = 'common:v:username_required';

/**
 * @description Invalid email format validation message
 * @localZh 邮箱格式无效的验证消息
 * @localEn Invalid email format validation message
 */
export const V_EMAIL_INVALID = 'common:v:email_invalid';

/**
 * @description Password minimum length validation message
 * @localZh 密码最小长度验证消息(6)
 * @localEn Password minimum length validation message(6)
 */
export const V_PASSWORD_MIN_LENGTH = 'common:v:password_min_length';

/**
 * @description Password maximum length validation message
 * @localZh 密码最大长度验证消息(50)
 * @localEn Password maximum length validation message(50)
 */
export const V_PASSWORD_MAX_LENGTH = 'common:v:password_max_length';

/**
 * @description Password whitespace validation message
 * @localZh 密码不能包含空格的验证消息
 * @localEn Password cannot contain whitespace characters validation message
 */
export const V_PASSWORD_SPECIAL_CHARS = 'common:v:password_special_chars';

/**
 * @description Data validation error
 * @localZh 数据验证错误
 * @localEn Data validation error
 */
export const V_ZOD_FAILED = 'common:v:zod_failed';

/**
 * @description Request logs list query must be URLSearchParams
 * @localZh 请求日志查询参数格式无效
 * @localEn Request logs query must be URL search parameters
 */
export const V_REQUEST_LOGS_QUERY_INVALID =
  'common:v:request_logs_query_invalid';

/**
 * @description 无效 id
 * @localZh 无效 id
 * @localEn Ivalid id
 */
export const V_INVALID_ID = 'common:v:invalid_id';

/**
 * @description 环境的名字不能重复
 * @localZh 环境的名字不能重复
 * @localEn Environment name cannot repeat
 */
export const V_PAM_ENV_NAME_REPEAT = 'common:v:pam_env_name_repeat';

/**
 * @description 通用的不能为空
 * @localZh 不能为空
 * @localEn Is required
 */
export const V_REQUIRED = 'common:v:required';

/**
 * @description 环境变量的 key 不能为空
 * @localZh 环境变量的 key 不能为空
 * @localEn Environment variable key cannot be empty
 */
export const V_PAM_ENV_VAR_KEY_REQUIRED = 'common:v:pam_env_var_key_required';

/**
 * @description 环境变量的 value 不能为空
 * @localZh 环境变量的 value 不能为空
 * @localEn Environment variable value cannot be empty
 */
export const V_PAM_ENV_VAR_VALUE_REQUIRED =
  'common:v:pam_env_var_value_required';
