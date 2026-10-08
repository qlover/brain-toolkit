import {
  COMMON_ADMIN_TITLE,
  COMMON_HEADER_CONSOLE,
  COMMON_HEADER_LOGIN,
  COMMON_HEADER_NAV_ABOUT,
  COMMON_HEADER_NAV_DEVELOPER,
  COMMON_HEADER_NAV_DOCS,
  COMMON_HEADER_NAV_PLAYGROUND
} from '../i18n-identifier/common/common';

export const headerNavI18n = Object.freeze({
  navDocs: COMMON_HEADER_NAV_DOCS,
  navAbout: COMMON_HEADER_NAV_ABOUT,
  navDeveloper: COMMON_HEADER_NAV_DEVELOPER,
  navPlayground: COMMON_HEADER_NAV_PLAYGROUND,
  login: COMMON_HEADER_LOGIN,
  console: COMMON_HEADER_CONSOLE,
  admin: COMMON_ADMIN_TITLE
});

export type HeaderNavI18nInterface = typeof headerNavI18n;
