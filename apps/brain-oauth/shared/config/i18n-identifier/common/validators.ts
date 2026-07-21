/**
 * Brain OAuth — form validation messages (`common:v` namespace).
 * Validates Brain user sign-in, registration, and OAuth admin query params.
 */

/**
 * @description Brain OAuth sign-in — login request body validation failed
 * @localZh 不是一个有效的登录参数
 * @localEn Not a valid login parameter
 */
export const V_LOGIN_PARAMS_REQUIRED = 'common:v:login_params_required';

/**
 * @description Brain OAuth sign-in/register — username required
 * @localZh 用户名为必填
 * @localEn Username is required
 */
export const V_USERNAME_REQUIRED = 'common:v:username_required';

/**
 * @description Brain OAuth user registration — invalid email format
 * @localZh 邮箱格式无效的验证消息
 * @localEn Invalid email format validation message
 */
export const V_EMAIL_INVALID = 'common:v:email_invalid';

/**
 * @description Brain OAuth user registration — password minimum length (6)
 * @localZh 密码最小长度验证消息(6)
 * @localEn Password minimum length validation message(6)
 */
export const V_PASSWORD_MIN_LENGTH = 'common:v:password_min_length';

/**
 * @description Brain OAuth user registration — password maximum length (50)
 * @localZh 密码最大长度验证消息(50)
 * @localEn Password maximum length validation message(50)
 */
export const V_PASSWORD_MAX_LENGTH = 'common:v:password_max_length';

/**
 * @description Brain OAuth user registration — password must not contain whitespace
 * @localZh 密码不能包含空格的验证消息
 * @localEn Password cannot contain whitespace characters validation message
 */
export const V_PASSWORD_SPECIAL_CHARS = 'common:v:password_special_chars';

/**
 * @description Brain OAuth API/forms — generic Zod schema validation failure
 * @localZh 数据验证错误
 * @localEn Data validation error
 */
export const V_ZOD_FAILED = 'common:v:zod_failed';

/**
 * @description Brain OAuth admin — request logs list query must be URLSearchParams
 * @localZh 请求日志查询参数格式无效
 * @localEn Request logs query must be URL search parameters
 */
export const V_REQUEST_LOGS_QUERY_INVALID =
  'common:v:request_logs_query_invalid';

/**
 * @description 手机号无效
 * @localZh 无效的手机号
 * @localEn Invalid Phone number
 */
export const V_PHONE_INVALID = 'common:v:phone_invalid';
