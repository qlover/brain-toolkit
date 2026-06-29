import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.pam';

/**
 * PAM page i18n interface
 */
export type PAMI18nInterface = typeof pamI18n;

export const pamI18nNamespace = 'page_pam';

export const pamI18n = Object.freeze({
  // Meta
  title: i18nKeys.PAGE_PAM_TITLE,
  subtitle: i18nKeys.PAGE_PAM_SUBTITLE,
  description: i18nKeys.PAGE_PAM_DESCRIPTION,
  content: i18nKeys.PAGE_PAM_DESCRIPTION,
  keywords: i18nKeys.PAGE_PAM_KEYWORDS,

  // Common
  placeholderSearch: i18nKeys.PAGE_PAM_PLACEHOLDER_SEARCH,
  allCategory: i18nKeys.PAGE_PAM_ALL_CATEGORY,
  addPam: i18nKeys.PAGE_PAM_ADD_PAM,
  addPamsm: i18nKeys.PAGE_PAM_ADD_PAMSM,
  pamViewModeCard: i18nKeys.PAGE_PAM_VIEW_MODE_CARD,
  pamViewModeList: i18nKeys.PAGE_PAM_VIEW_MODE_LIST,
  editProjectTitle: i18nKeys.PAGE_PAM_EDIT_PROJECT_TITLE,
  createProjectTitle: i18nKeys.PAGE_PAM_CREATE_PROJECT_TITLE,
  deleteProjectTitle: i18nKeys.PAGE_PAM_DELETE_PROJECT_TITLE,
  deleteProjectContent: i18nKeys.PAGE_PAM_DELETE_PROJECT_CONTENT,
  loadingText: i18nKeys.PAGE_PAM_LOADING_TEXT,
  noMoreText: i18nKeys.PAGE_PAM_NO_MORE_TEXT,
  errorText: i18nKeys.PAGE_PAM_ERROR_TEXT,
  loadMoreText: i18nKeys.PAGE_PAM_LOAD_MORE_TEXT,

  // Project
  noEnvVars: i18nKeys.PAGE_PAM_NO_ENV_VARS,
  noEnv: i18nKeys.PAGE_PAM_NO_ENV,
  public: i18nKeys.PAGE_PAM_PUBLIC,
  private: i18nKeys.PAGE_PAM_PRIVATE,
  readonly: i18nKeys.PAGE_PAM_READONLY,
  delete: i18nKeys.PAGE_PAM_DELETE,
  noDesc: i18nKeys.PAGE_PAM_NO_DESC,
  noEnvConfig: i18nKeys.PAGE_PAM_NO_ENV_CONFIG,
  envDemo: i18nKeys.PAGE_PAM_ENV_DEMO,
  /**
   * @deprecated
   */
  repoUrlTitle: i18nKeys.PAGE_PAM_REPO_URL_TITLE,
  envCount: i18nKeys.PAGE_PAM_ENV_COUNT,
  noProject: i18nKeys.PAGE_PAM_NO_PROJECT,
  edit: i18nKeys.PAGE_PAM_EDIT,

  // Form
  tipFalteError: i18nKeys.PAGE_PAM_TIP_FALTE_ERROR,
  labelName: i18nKeys.PAGE_PAM_LABEL_NAME,
  placeholderName: i18nKeys.PAGE_PAM_PLACEHOLDER_NAME,
  labelSlug: i18nKeys.PAGE_PAM_LABEL_SLUG,
  placeholderSlug: i18nKeys.PAGE_PAM_PLACEHOLDER_SLUG,
  labelStack: i18nKeys.PAGE_PAM_LABEL_STACK,
  placeholderStack: i18nKeys.PAGE_PAM_PLACEHOLDER_STACK,
  labelDesc: i18nKeys.PAGE_PAM_LABEL_DESC,
  placeholderDesc: i18nKeys.PAGE_PAM_PLACEHOLDER_DESC,
  labelRepo: i18nKeys.PAGE_PAM_LABEL_REPO,
  placeholderRepo: i18nKeys.PAGE_PAM_PLACEHOLDER_REPO,
  labelCategory: i18nKeys.PAGE_PAM_LABEL_CATEGORY,
  labelUnCategory: i18nKeys.PAGE_PAM_LABEL_UNCATEGORY,
  formCancel: i18nKeys.PAGE_PAM_FORM_CANCEL,
  formEdit: i18nKeys.PAGE_PAM_FORM_EDIT,
  formSave: i18nKeys.PAGE_PAM_FORM_SAVE,
  formSaveing: i18nKeys.PAGE_PAM_FORM_SAVEING,
  tipEnvVariables: i18nKeys.PAGE_PAM_TIP_ENV_VARIABLES,
  labelEnvName: i18nKeys.PAGE_PAM_LABEL_ENV_NAME,
  labelEnvUrl: i18nKeys.PAGE_PAM_LABEL_ENV_URL,
  placeholderEnvName: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_NAME,
  placeholderEnvUrl: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_URL,
  collapsed: i18nKeys.PAGE_PAM_COLLAPSED,
  uncollapsed: i18nKeys.PAGE_PAM_UNCOLLAPSED,
  envVarAdd: i18nKeys.PAGE_PAM_ENV_VAR_ADD,
  noEnvVar: i18nKeys.PAGE_PAM_NO_ENV_VAR,
  placeholderEnvVar: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_VAR,
  labelEnvValue: i18nKeys.PAGE_PAM_LABEL_ENV_VALUE,
  placehoderEnvValue: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_VALUE,
  mulitEnv: i18nKeys.PAGE_PAM_MULIT_ENV,
  envAdd: i18nKeys.PAGE_PAM_ENV_ADD,
  envTip: i18nKeys.PAGE_PAM_ENV_TIP,
  envVarAddLabel: i18nKeys.PAGE_PAM_ENV_VAR_ADD_LABEL,
  envVarTitle: i18nKeys.PAGE_PAM_ENV_VAR_TITLE,
  placeholerEnvName: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_NAME_FORM,
  envUrlTitle: i18nKeys.PAGE_PAM_ENV_URL_TITLE,
  envDelete: i18nKeys.PAGE_PAM_ENV_DELETE,
  envDirectTitle: i18nKeys.PAGE_PAM_ENV_DIRECT_TITLE,

  adminTitle: COMMON_ADMIN_TITLE
});
