/**
 * Brain OAuth — sign-in page identifiers (`page_login` namespace).
 * Brain users authenticate here before OAuth authorization or portal access.
 */

/**
 * @description Brain OAuth sign-in page — document title
 * @localZh Brain OAuth 用户登录
 * @localEn Brain OAuth User Sign In
 */
export const PAGE_LOGIN_TITLE = 'page_login:title';
/**
 * @description Brain OAuth sign-in page — meta description
 * @localZh 使用 Brain 账号登录 Brain OAuth，完成身份认证与第三方应用授权
 * @localEn Sign in with your Brain account on Brain OAuth for identity verification and third-party authorization
 */
export const PAGE_LOGIN_DESCRIPTION = 'page_login:description';
/**
 * @description Brain OAuth sign-in page — meta content label
 * @localZh Brain OAuth 用户登录
 * @localEn Brain OAuth user sign-in
 */
export const PAGE_LOGIN_CONTENT = 'page_login:content';
/**
 * @description Brain OAuth sign-in page — SEO keywords
 * @localZh Brain OAuth, 用户登录, OAuth 2.0, 身份认证
 * @localEn Brain OAuth, user sign in, OAuth 2.0, identity
 */
export const PAGE_LOGIN_KEYWORDS = 'page_login:keywords';

/**
 * @description Brain OAuth sign-in card — heading
 * @localZh 登录
 * @localEn Sign in
 */
export const PAGE_LOGIN_HEADING = 'page_login:heading';
/**
 * @description Brain OAuth sign-in card — subtitle under the heading
 * @localZh 使用你的 Brain 账号继续
 * @localEn Continue with your Brain account
 */
export const PAGE_LOGIN_SUBTITLE = 'page_login:subtitle';
/**
 * @description Brain OAuth sign-in card — submit button label
 * @localZh 登录
 * @localEn Sign in
 */
export const PAGE_LOGIN_BUTTON = 'page_login:login';
/**
 * @description Brain OAuth sign-in card — login method tabs label (a11y)
 * @localZh 登录方式
 * @localEn Sign-in method
 */
export const PAGE_LOGIN_METHOD = 'page_login:method';
/**
 * @description Brain OAuth sign-in card — phone tab
 * @localZh 手机号
 * @localEn Phone
 */
export const PAGE_LOGIN_TAB_PHONE = 'page_login:tab__phone';
/**
 * @description Brain OAuth sign-in card — email tab
 * @localZh 邮箱
 * @localEn Email
 */
export const PAGE_LOGIN_TAB_EMAIL = 'page_login:tab__email';

/**
 * @description Brain OAuth sign-in card — Brain environment select label
 * @localZh 登录环境
 * @localEn Sign-in environment
 */
export const PAGE_LOGIN_ENV = 'page_login:env';

/**
 * @description Brain OAuth sign-in form — email field label
 * @localZh 邮箱
 * @localEn Email
 */
export const PAGE_LOGIN_EMAIL = 'page_login:email';
/**
 * @description Brain OAuth sign-in form — password field label
 * @localZh 密码
 * @localEn Password
 */
export const PAGE_LOGIN_PASSWORD = 'page_login:password';
/**
 * @description Brain OAuth sign-in form — email/password rejected
 * @localZh 邮箱或密码不正确，请重试。
 * @localEn Incorrect email or password. Please try again.
 */
export const PAGE_LOGIN_EMAIL_ERROR = 'page_login:email__error';

/**
 * @description Brain OAuth sign-in form — phone number field label
 * @localZh 手机号
 * @localEn Phone number
 */
export const PAGE_LOGIN_PHONE_LABEL = 'page_login:phone__label';
/**
 * @description Brain OAuth sign-in form — phone number validation error
 * @localZh 请输入正确的手机号
 * @localEn Please enter a valid phone number
 */
export const PAGE_LOGIN_PHONE_INVALID = 'page_login:phone__invalid';
/**
 * @description Brain OAuth sign-in form — OTP code field label
 * @localZh 验证码
 * @localEn Verification code
 */
export const PAGE_LOGIN_PHONE_OTP_LABEL = 'page_login:phone__otp_label';
/**
 * @description Brain OAuth sign-in form — OTP code field placeholder
 * @localZh 6 位数字
 * @localEn 6 digits
 */
export const PAGE_LOGIN_PHONE_OTP_PLACEHOLDER =
  'page_login:phone__otp_placeholder';
/**
 * @description Brain OAuth sign-in form — OTP code validation error
 * @localZh 请输入 6 位数字验证码
 * @localEn Please enter a 6-digit verification code
 */
export const PAGE_LOGIN_PHONE_OTP_INVALID = 'page_login:phone__otp_invalid';
/**
 * @description Brain OAuth sign-in form — send OTP button
 * @localZh 获取验证码
 * @localEn Get code
 */
export const PAGE_LOGIN_PHONE_SEND = 'page_login:phone__send';
/**
 * @description Brain OAuth sign-in form — resend OTP button after countdown
 * @localZh 重新获取
 * @localEn Resend
 */
export const PAGE_LOGIN_PHONE_RESEND = 'page_login:phone__resend';
/**
 * @description Brain OAuth sign-in form — text after the resend countdown seconds
 * @localZh 后重发
 * @localEn to resend
 */
export const PAGE_LOGIN_PHONE_COUNTDOWN_SUFFIX =
  'page_login:phone__countdown_suffix';
/**
 * @description Brain OAuth sign-in form — sending the OTP failed
 * @localZh 验证码发送失败，请检查手机号或稍后再试。
 * @localEn Failed to send the code. Check the number or try again later.
 */
export const PAGE_LOGIN_PHONE_SEND_ERROR = 'page_login:phone__send_error';
/**
 * @description Brain OAuth sign-in form — OTP rejected
 * @localZh 验证码不正确或已过期，请重新获取。
 * @localEn The code is incorrect or expired. Please get a new one.
 */
export const PAGE_LOGIN_PHONE_ERROR = 'page_login:phone__error';

/**
 * @description Brain OAuth sign-in card — app card subtitle when coming from an authorize request
 * @localZh 请求使用你的 Brain 账号登录
 * @localEn wants you to sign in with Brain
 */
export const PAGE_LOGIN_CTX_SUB = 'page_login:ctx__sub';
/**
 * @description Brain OAuth sign-in card — app card pill when coming from an authorize request
 * @localZh 授权
 * @localEn OAuth
 */
export const PAGE_LOGIN_CTX_PILL = 'page_login:ctx__pill';
