import { COMMON_ADMIN_TITLE } from '../i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.home';

export type HomeI18nInterface = typeof homeI18n;

export const homeI18nNamespace = 'page_home';

export const homeI18n = Object.freeze({
  title: i18nKeys.PAGE_HOME_TITLE,
  description: i18nKeys.PAGE_HOME_DESCRIPTION,
  content: i18nKeys.PAGE_HOME_DESCRIPTION,
  keywords: i18nKeys.PAGE_HOME_KEYWORDS,
  heroBadge: i18nKeys.PAGE_HOME_HERO_BADGE,
  heroTitle1: i18nKeys.PAGE_HOME_HERO_TITLE1,
  heroTitle2: i18nKeys.PAGE_HOME_HERO_TITLE2,
  heroDesc: i18nKeys.PAGE_HOME_HERO_DESC,
  heroProjects: i18nKeys.PAGE_HOME_HERO_START,
  heroDocs: i18nKeys.PAGE_HOME_HERO_DOCS,
  heroLogin: i18nKeys.PAGE_HOME_HERO_LOGIN,
  linkCli: i18nKeys.PAGE_HOME_LINK_CLI,
  linkOauth: i18nKeys.PAGE_HOME_LINK_OAUTH,
  previewCaption: i18nKeys.PAGE_HOME_PREVIEW_CAPTION,
  previewProject: i18nKeys.PAGE_HOME_PREVIEW_PROJECT,
  previewEnvs: i18nKeys.PAGE_HOME_PREVIEW_ENVS,
  previewVar: i18nKeys.PAGE_HOME_PREVIEW_VAR,
  stepsTitle: i18nKeys.PAGE_HOME_STEPS_TITLE,
  step1Title: i18nKeys.PAGE_HOME_STEP1_TITLE,
  step1Body: i18nKeys.PAGE_HOME_STEP1_BODY,
  step2Title: i18nKeys.PAGE_HOME_STEP2_TITLE,
  step2Body: i18nKeys.PAGE_HOME_STEP2_BODY,
  step3Title: i18nKeys.PAGE_HOME_STEP3_TITLE,
  step3Body: i18nKeys.PAGE_HOME_STEP3_BODY,
  cliTitle: i18nKeys.PAGE_HOME_CLI_TITLE,
  cliBody: i18nKeys.PAGE_HOME_CLI_BODY,
  featuredTitle: i18nKeys.PAGE_HOME_FEATURED_TITLE,
  featuredViewAll: i18nKeys.PAGE_HOME_FEATURED_VIEW_ALL,
  footerTagline: i18nKeys.PAGE_HOME_FOOTER_TAGLINE,
  adminTitle: COMMON_ADMIN_TITLE
});
