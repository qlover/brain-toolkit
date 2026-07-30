import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.pam.general';

/**
 * PAM project general settings i18n interface
 */
export type PAMGeneralI18nInterface = typeof pamGeneralI18n;

export const pamGeneralI18nNamespace = 'page_pam_general';

export const pamGeneralI18n = Object.freeze({
  title: i18nKeys.PAGE_PAM_GENERAL_TITLE,
  description: i18nKeys.PAGE_PAM_GENERAL_DESCRIPTION,
  content: i18nKeys.PAGE_PAM_GENERAL_DESCRIPTION,
  keywords: i18nKeys.PAGE_PAM_GENERAL_KEYWORDS,

  labelName: i18nKeys.PAGE_PAM_GENERAL_LABEL_NAME,
  placeholderName: i18nKeys.PAGE_PAM_GENERAL_PLACEHOLDER_NAME,
  labelSlug: i18nKeys.PAGE_PAM_GENERAL_LABEL_SLUG,
  placeholderSlug: i18nKeys.PAGE_PAM_GENERAL_PLACEHOLDER_SLUG,
  labelStack: i18nKeys.PAGE_PAM_GENERAL_LABEL_STACK,
  placeholderStack: i18nKeys.PAGE_PAM_GENERAL_PLACEHOLDER_STACK,
  labelDesc: i18nKeys.PAGE_PAM_GENERAL_LABEL_DESC,
  placeholderDesc: i18nKeys.PAGE_PAM_GENERAL_PLACEHOLDER_DESC,
  labelRepo: i18nKeys.PAGE_PAM_GENERAL_LABEL_REPO,
  placeholderRepo: i18nKeys.PAGE_PAM_GENERAL_PLACEHOLDER_REPO,
  labelCategory: i18nKeys.PAGE_PAM_GENERAL_LABEL_CATEGORY,
  labelUnCategory: i18nKeys.PAGE_PAM_GENERAL_LABEL_UNCATEGORY,
  public: i18nKeys.PAGE_PAM_GENERAL_PUBLIC,
  private: i18nKeys.PAGE_PAM_GENERAL_PRIVATE,

  settingsSave: i18nKeys.PAGE_PAM_GENERAL_SETTINGS_SAVE,
  formSaveing: i18nKeys.PAGE_PAM_GENERAL_FORM_SAVEING,
  errorText: i18nKeys.PAGE_PAM_GENERAL_ERROR_TEXT,
  projectNotFound: i18nKeys.PAGE_PAM_GENERAL_PROJECT_NOT_FOUND,
  copied: i18nKeys.PAGE_PAM_GENERAL_COPIED,
  copyOwnerId: i18nKeys.PAGE_PAM_GENERAL_COPY_OWNER_ID,

  descProjectId: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_ID,
  descProjectName: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_NAME,
  descProjectSlug: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_SLUG,
  descProjectVisibility: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_VISIBILITY,
  descProjectCategory: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_CATEGORY,
  descProjectDesc: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_DESC,
  descProjectStack: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_STACK,
  descProjectRepo: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_REPO,

  adminTitle: COMMON_ADMIN_TITLE
});
