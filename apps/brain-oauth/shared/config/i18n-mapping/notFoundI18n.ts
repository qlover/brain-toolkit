import {
  COMMON_ADMIN_TITLE,
  COMMON_APP_NAME,
  COMMON_NOT_FOUND_DESC,
  COMMON_NOT_FOUND_DOCS,
  COMMON_NOT_FOUND_HOME,
  COMMON_NOT_FOUND_TITLE
} from '../i18n-identifier/common/common';

export const notFoundI18n = Object.freeze({
  appName: COMMON_APP_NAME,
  adminTitle: COMMON_ADMIN_TITLE,
  title: COMMON_NOT_FOUND_TITLE,
  desc: COMMON_NOT_FOUND_DESC,
  home: COMMON_NOT_FOUND_HOME,
  docs: COMMON_NOT_FOUND_DOCS
});

export type NotFoundI18nInterface = typeof notFoundI18n;
