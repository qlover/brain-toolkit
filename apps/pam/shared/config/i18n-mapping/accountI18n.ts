import * as commonKeys from '../i18n-identifier/common/common';
import * as accountKeys from '../i18n-identifier/pages/page.account';
import { PAGE_HOME_TITLE } from '../i18n-identifier/pages/page.home';

export const accountI18n = Object.freeze({
  appBrandTitle: PAGE_HOME_TITLE,
  title: accountKeys.PAGE_ACCOUNT_TITLE,
  description: accountKeys.PAGE_ACCOUNT_DESCRIPTION,
  content: accountKeys.PAGE_ACCOUNT_DESCRIPTION,
  keywords: accountKeys.PAGE_ACCOUNT_KEYWORDS,

  sectionTitle: accountKeys.PAGE_ACCOUNT_SECTION_TITLE,
  displayNameLabel: accountKeys.PAGE_ACCOUNT_DISPLAY_NAME_LABEL,
  displayNamePlaceholder: accountKeys.PAGE_ACCOUNT_DISPLAY_NAME_PLACEHOLDER,
  displayNameEdit: accountKeys.PAGE_ACCOUNT_DISPLAY_NAME_EDIT,
  displayNameSuccess: accountKeys.PAGE_ACCOUNT_DISPLAY_NAME_SUCCESS,
  displayNameError: accountKeys.PAGE_ACCOUNT_DISPLAY_NAME_ERROR,
  displayNameInvalid: accountKeys.PAGE_ACCOUNT_DISPLAY_NAME_INVALID,
  phoneLabel: accountKeys.PAGE_ACCOUNT_PHONE_LABEL,
  emailLabel: accountKeys.PAGE_ACCOUNT_EMAIL_LABEL,
  userIdLabel: accountKeys.PAGE_ACCOUNT_USER_ID_LABEL,
  valueEmpty: accountKeys.PAGE_ACCOUNT_VALUE_EMPTY,
  bindHint: accountKeys.PAGE_ACCOUNT_BIND_HINT,
  emailBound: accountKeys.PAGE_ACCOUNT_EMAIL_BOUND,
  bindSectionTitle: accountKeys.PAGE_ACCOUNT_BIND_SECTION_TITLE,

  save: commonKeys.COMMON_SAVE,
  cancel: commonKeys.COMMON_CANCEL,

  bindDescription: commonKeys.COMMON_BIND_EMAIL_DESCRIPTION,
  bindMergeHint: commonKeys.COMMON_BIND_EMAIL_MERGE_HINT,
  bindEmailPlaceholder: commonKeys.COMMON_BIND_EMAIL_PLACEHOLDER,
  bindOtpPlaceholder: commonKeys.COMMON_BIND_EMAIL_OTP_PLACEHOLDER,
  bindSendCode: commonKeys.COMMON_BIND_EMAIL_SEND,
  bindResendCode: commonKeys.COMMON_BIND_EMAIL_RESEND,
  bindVerify: commonKeys.COMMON_BIND_EMAIL_VERIFY,
  bindSuccess: commonKeys.COMMON_BIND_EMAIL_SUCCESS,
  bindSuccessMerged: commonKeys.COMMON_BIND_EMAIL_SUCCESS_MERGED,
  bindError: commonKeys.COMMON_BIND_EMAIL_ERROR
});

export type AccountI18nInterface = typeof accountI18n;
