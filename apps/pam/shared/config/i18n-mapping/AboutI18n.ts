import { COMMON_ADMIN_TITLE } from '../i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.about';

/**
 * About page i18n interface
 */
export type AboutI18nInterface = typeof aboutI18n;

export const aboutI18nNamespace = 'page_about';

export const aboutI18n = Object.freeze({
  // basic meta properties
  title: i18nKeys.PAGE_ABOUT_TITLE,
  description: i18nKeys.PAGE_ABOUT_DESCRIPTION,
  content: i18nKeys.PAGE_ABOUT_DESCRIPTION,
  keywords: i18nKeys.PAGE_ABOUT_KEYWORDS,
  adminTitle: COMMON_ADMIN_TITLE,

  badge: i18nKeys.PAGE_ABOUT_BADGE,
  introTitle: i18nKeys.PAGE_ABOUT_INTRO_TITLE,
  introP1: i18nKeys.PAGE_ABOUT_INTRO_P1,
  introP2: i18nKeys.PAGE_ABOUT_INTRO_P2,
  introP3: i18nKeys.PAGE_ABOUT_INTRO_P3,
  introGithub: i18nKeys.PAGE_ABOUT_INTRO_GITHUB,
  featuresTitle: i18nKeys.PAGE_ABOUT_FEATURES_TITLE,
  feature1Title: i18nKeys.PAGE_ABOUT_FEATURE1_TITLE,
  feature1Desc: i18nKeys.PAGE_ABOUT_FEATURE1_DESC,
  feature2Title: i18nKeys.PAGE_ABOUT_FEATURE2_TITLE,
  feature2Desc: i18nKeys.PAGE_ABOUT_FEATURE2_DESC,
  feature3Title: i18nKeys.PAGE_ABOUT_FEATURE3_TITLE,
  feature3Desc: i18nKeys.PAGE_ABOUT_FEATURE3_DESC,
  feature4Title: i18nKeys.PAGE_ABOUT_FEATURE4_TITLE,
  feature4Desc: i18nKeys.PAGE_ABOUT_FEATURE4_DESC,
  feature5Title: i18nKeys.PAGE_ABOUT_FEATURE5_TITLE,
  feature5Desc: i18nKeys.PAGE_ABOUT_FEATURE5_DESC,
  feature6Title: i18nKeys.PAGE_ABOUT_FEATURE6_TITLE,
  feature6Desc: i18nKeys.PAGE_ABOUT_FEATURE6_DESC,
  versionLabel: i18nKeys.PAGE_ABOUT_VERSION_LABEL,
  updatesTitle: i18nKeys.PAGE_ABOUT_UPDATES_TITLE,
  updatesViewAll: i18nKeys.PAGE_ABOUT_UPDATES_VIEW_ALL,
  updatesFeature: i18nKeys.PAGE_ABOUT_UPDATES_FEATURE,
  updatesFix: i18nKeys.PAGE_ABOUT_UPDATES_FIX
});
