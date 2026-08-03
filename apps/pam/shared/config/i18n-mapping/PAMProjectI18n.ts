import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.pam.project';

/**
 * PAM project detail shell i18n interface
 */
export type PAMProjectI18nInterface = typeof pamProjectI18n;

export const pamProjectI18nNamespace = 'page_pam_project';

export const pamProjectI18n = Object.freeze({
  title: i18nKeys.PAGE_PAM_PROJECT_TITLE,
  description: i18nKeys.PAGE_PAM_PROJECT_DESCRIPTION,
  content: i18nKeys.PAGE_PAM_PROJECT_DESCRIPTION,
  keywords: i18nKeys.PAGE_PAM_PROJECT_KEYWORDS,

  tabGeneral: i18nKeys.PAGE_PAM_PROJECT_TAB_GENERAL,
  tabEnvironments: i18nKeys.PAGE_PAM_PROJECT_TAB_ENVIRONMENTS,
  backToProjects: i18nKeys.PAGE_PAM_PROJECT_BACK_TO_PROJECTS,
  loadingText: i18nKeys.PAGE_PAM_PROJECT_LOADING_TEXT,
  projectNotFound: i18nKeys.PAGE_PAM_PROJECT_NOT_FOUND,
  readonly: i18nKeys.PAGE_PAM_PROJECT_READONLY,
  fork: i18nKeys.PAGE_PAM_PROJECT_FORK,
  forking: i18nKeys.PAGE_PAM_PROJECT_FORKING,
  forkSuccess: i18nKeys.PAGE_PAM_PROJECT_FORK_SUCCESS,
  forkFailed: i18nKeys.PAGE_PAM_PROJECT_FORK_FAILED,

  adminTitle: COMMON_ADMIN_TITLE
});
