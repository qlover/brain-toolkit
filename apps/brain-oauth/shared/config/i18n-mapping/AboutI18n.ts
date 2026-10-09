import * as i18nKeys from '../i18n-identifier/pages/page.about';

/**
 * About page i18n interface
 */
export type AboutI18nInterface = typeof aboutI18n;

export const aboutI18n = Object.freeze({
  // basic meta properties
  title: i18nKeys.PAGE_ABOUT_TITLE,
  description: i18nKeys.PAGE_ABOUT_DESCRIPTION,
  content: i18nKeys.PAGE_ABOUT_DESCRIPTION,
  keywords: i18nKeys.PAGE_ABOUT_KEYWORDS,

  heroTitle: i18nKeys.PAGE_ABOUT_HERO_TITLE,
  heroLead: i18nKeys.PAGE_ABOUT_HERO_LEAD,
  valuesTitle: i18nKeys.PAGE_ABOUT_VALUES_TITLE,
  value1Title: i18nKeys.PAGE_ABOUT_VALUE1_TITLE,
  value1Desc: i18nKeys.PAGE_ABOUT_VALUE1_DESC,
  value2Title: i18nKeys.PAGE_ABOUT_VALUE2_TITLE,
  value2Desc: i18nKeys.PAGE_ABOUT_VALUE2_DESC,
  value3Title: i18nKeys.PAGE_ABOUT_VALUE3_TITLE,
  value3Desc: i18nKeys.PAGE_ABOUT_VALUE3_DESC,
  standardsTitle: i18nKeys.PAGE_ABOUT_STANDARDS_TITLE,
  versionLabel: i18nKeys.PAGE_ABOUT_VERSION_LABEL,
  linksLabel: i18nKeys.PAGE_ABOUT_LINKS_LABEL,
  linkChangelog: i18nKeys.PAGE_ABOUT_LINK_CHANGELOG,
  linkSource: i18nKeys.PAGE_ABOUT_LINK_SOURCE,
  linkFeedback: i18nKeys.PAGE_ABOUT_LINK_FEEDBACK
});
