import * as i18nKeys from '../i18n-identifier/pages/page.login';

/**
 * Login page i18n interface
 */
export type LoginI18nInterface = typeof loginI18n;

/**
 * Login page i18n namespace
 *
 * - /login/page.tsx
 *
 */
export const NS_PAGE_LOGIN = 'page_login';

export const loginI18n = Object.freeze({
  // basic meta properties
  title: i18nKeys.PAGE_LOGIN_TITLE,
  description: i18nKeys.PAGE_LOGIN_DESCRIPTION,
  content: i18nKeys.PAGE_LOGIN_CONTENT,
  keywords: i18nKeys.PAGE_LOGIN_KEYWORDS,

  // card
  heading: i18nKeys.PAGE_LOGIN_HEADING,
  subtitle: i18nKeys.PAGE_LOGIN_SUBTITLE,
  button: i18nKeys.PAGE_LOGIN_BUTTON,
  method: i18nKeys.PAGE_LOGIN_METHOD,
  tabPhone: i18nKeys.PAGE_LOGIN_TAB_PHONE,
  tabEmail: i18nKeys.PAGE_LOGIN_TAB_EMAIL,
  linkDocs: i18nKeys.PAGE_LOGIN_LINK_DOCS,

  // email + password
  email: i18nKeys.PAGE_LOGIN_EMAIL,
  password: i18nKeys.PAGE_LOGIN_PASSWORD,
  emailError: i18nKeys.PAGE_LOGIN_EMAIL_ERROR,

  // phone + SMS code
  phoneLabel: i18nKeys.PAGE_LOGIN_PHONE_LABEL,
  phoneInvalid: i18nKeys.PAGE_LOGIN_PHONE_INVALID,
  phoneOtpLabel: i18nKeys.PAGE_LOGIN_PHONE_OTP_LABEL,
  phoneOtpPlaceholder: i18nKeys.PAGE_LOGIN_PHONE_OTP_PLACEHOLDER,
  phoneOtpInvalid: i18nKeys.PAGE_LOGIN_PHONE_OTP_INVALID,
  phoneSend: i18nKeys.PAGE_LOGIN_PHONE_SEND,
  phoneResend: i18nKeys.PAGE_LOGIN_PHONE_RESEND,
  phoneCountdownSuffix: i18nKeys.PAGE_LOGIN_PHONE_COUNTDOWN_SUFFIX,
  phoneSendError: i18nKeys.PAGE_LOGIN_PHONE_SEND_ERROR,
  phoneError: i18nKeys.PAGE_LOGIN_PHONE_ERROR
});
