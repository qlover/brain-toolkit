import {
  COMMON_HEADER_NAV_ABOUT,
  COMMON_HEADER_NAV_CLI,
  COMMON_HEADER_NAV_DEVELOPER,
  COMMON_HEADER_NAV_DOCS,
  COMMON_HEADER_NAV_PROJECTS
} from '../i18n-identifier/common/common';

export const headerNavI18n = Object.freeze({
  navProjects: COMMON_HEADER_NAV_PROJECTS,
  navDocs: COMMON_HEADER_NAV_DOCS,
  navCli: COMMON_HEADER_NAV_CLI,
  navAbout: COMMON_HEADER_NAV_ABOUT,
  navDeveloper: COMMON_HEADER_NAV_DEVELOPER
});

export type HeaderNavI18nInterface = typeof headerNavI18n;
