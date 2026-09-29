import * as i18nKeys from '../i18n-identifier/pages/page.password-reset';

/**
 * Forgot / reset password pages namespace
 *
 * - /auth/forgot-password/page.tsx
 * - /auth/reset-password/page.tsx
 */
export const NS_PAGE_PASSWORD_RESET = 'page_password_reset';

export const passwordResetI18n = Object.freeze({
  title: i18nKeys.PAGE_PASSWORD_RESET_TITLE,
  description: i18nKeys.PAGE_PASSWORD_RESET_DESCRIPTION,
  content: i18nKeys.PAGE_PASSWORD_RESET_DESCRIPTION,
  keywords: i18nKeys.PAGE_PASSWORD_RESET_KEYWORDS,
  resetTitle: i18nKeys.PAGE_PASSWORD_RESET_RESET_TITLE,

  forgotHeading: i18nKeys.PAGE_PASSWORD_RESET_FORGOT_HEADING,
  forgotSubtitle: i18nKeys.PAGE_PASSWORD_RESET_FORGOT_SUBTITLE,
  emailPlaceholder: i18nKeys.PAGE_PASSWORD_RESET_EMAIL_PLACEHOLDER,
  emailInvalid: i18nKeys.PAGE_PASSWORD_RESET_EMAIL_INVALID,
  submit: i18nKeys.PAGE_PASSWORD_RESET_SUBMIT,
  sentTitle: i18nKeys.PAGE_PASSWORD_RESET_SENT_TITLE,
  sentHint: i18nKeys.PAGE_PASSWORD_RESET_SENT_HINT,
  sentSpam: i18nKeys.PAGE_PASSWORD_RESET_SENT_SPAM,
  resend: i18nKeys.PAGE_PASSWORD_RESET_RESEND,
  backToLogin: i18nKeys.PAGE_PASSWORD_RESET_BACK_TO_LOGIN,
  disabled: i18nKeys.PAGE_PASSWORD_RESET_DISABLED,

  resetHeading: i18nKeys.PAGE_PASSWORD_RESET_RESET_HEADING,
  resetSubtitle: i18nKeys.PAGE_PASSWORD_RESET_RESET_SUBTITLE,
  newPlaceholder: i18nKeys.PAGE_PASSWORD_RESET_NEW_PLACEHOLDER,
  confirmPlaceholder: i18nKeys.PAGE_PASSWORD_RESET_CONFIRM_PLACEHOLDER,
  invalid: i18nKeys.PAGE_PASSWORD_RESET_INVALID,
  mismatch: i18nKeys.PAGE_PASSWORD_RESET_MISMATCH,
  resetSubmit: i18nKeys.PAGE_PASSWORD_RESET_RESET_SUBMIT,
  checking: i18nKeys.PAGE_PASSWORD_RESET_CHECKING,
  tokenInvalid: i18nKeys.PAGE_PASSWORD_RESET_TOKEN_INVALID,
  requestNew: i18nKeys.PAGE_PASSWORD_RESET_REQUEST_NEW,
  successTitle: i18nKeys.PAGE_PASSWORD_RESET_SUCCESS_TITLE,
  successHint: i18nKeys.PAGE_PASSWORD_RESET_SUCCESS_HINT,
  goLogin: i18nKeys.PAGE_PASSWORD_RESET_GO_LOGIN,
  errorFallback: i18nKeys.PAGE_PASSWORD_RESET_ERROR_FALLBACK
});

export type PasswordResetI18nInterface = typeof passwordResetI18n;
