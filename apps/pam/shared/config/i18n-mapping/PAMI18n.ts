import { COMMON_ADMIN_TITLE } from '@config/i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.pam';

/**
 * PAM home list + create-modal i18n interface
 */
export type PAMI18nInterface = typeof pamI18n;

export const pamI18nNamespace = 'page_pam';

export const pamI18n = Object.freeze({
  // Meta
  title: i18nKeys.PAGE_PAM_TITLE,
  subtitle: i18nKeys.PAGE_PAM_SUBTITLE,
  headerSubtitle: i18nKeys.PAGE_PAM_SUBTITLE,
  description: i18nKeys.PAGE_PAM_DESCRIPTION,
  content: i18nKeys.PAGE_PAM_DESCRIPTION,
  keywords: i18nKeys.PAGE_PAM_KEYWORDS,

  // Common / list toolbar
  placeholderSearch: i18nKeys.PAGE_PAM_PLACEHOLDER_SEARCH,
  allCategory: i18nKeys.PAGE_PAM_ALL_CATEGORY,
  allVisibility: i18nKeys.PAGE_PAM_ALL_VISIBILITY,
  labelVisibility: i18nKeys.PAGE_PAM_LABEL_VISIBILITY,
  labelSort: i18nKeys.PAGE_PAM_LABEL_SORT,
  sortByCreated: i18nKeys.PAGE_PAM_SORT_BY_CREATED,
  sortByUpdated: i18nKeys.PAGE_PAM_SORT_BY_UPDATED,
  sortOrderDesc: i18nKeys.PAGE_PAM_SORT_ORDER_DESC,
  sortOrderAsc: i18nKeys.PAGE_PAM_SORT_ORDER_ASC,
  labelSortOrder: i18nKeys.PAGE_PAM_LABEL_SORT_ORDER,
  updatedAt: i18nKeys.PAGE_PAM_UPDATED_AT,
  visibilityFilterSummary: i18nKeys.PAGE_PAM_VISIBILITY_FILTER_SUMMARY,
  noSearchMatch: i18nKeys.PAGE_PAM_NO_SEARCH_MATCH,
  searchResultSummary: i18nKeys.PAGE_PAM_SEARCH_RESULT_SUMMARY,
  categoryFilterSummary: i18nKeys.PAGE_PAM_CATEGORY_FILTER_SUMMARY,
  clearFilters: i18nKeys.PAGE_PAM_CLEAR_FILTERS,
  filters: i18nKeys.PAGE_PAM_FILTERS,
  categoryCustom: i18nKeys.PAGE_PAM_CATEGORY_CUSTOM,
  categoryCustomPlaceholder: i18nKeys.PAGE_PAM_CATEGORY_CUSTOM_PLACEHOLDER,
  addPam: i18nKeys.PAGE_PAM_ADD_PAM,
  addPamsm: i18nKeys.PAGE_PAM_ADD_PAMSM,
  pamViewModeCard: i18nKeys.PAGE_PAM_VIEW_MODE_CARD,
  pamViewModeList: i18nKeys.PAGE_PAM_VIEW_MODE_LIST,
  createProjectTitle: i18nKeys.PAGE_PAM_CREATE_PROJECT_TITLE,
  deleteProjectTitle: i18nKeys.PAGE_PAM_DELETE_PROJECT_TITLE,
  deleteProjectContent: i18nKeys.PAGE_PAM_DELETE_PROJECT_CONTENT,
  loadingText: i18nKeys.PAGE_PAM_LOADING_TEXT,
  noMoreText: i18nKeys.PAGE_PAM_NO_MORE_TEXT,
  errorText: i18nKeys.PAGE_PAM_ERROR_TEXT,
  loadMoreText: i18nKeys.PAGE_PAM_LOAD_MORE_TEXT,

  // List card / item
  public: i18nKeys.PAGE_PAM_PUBLIC,
  private: i18nKeys.PAGE_PAM_PRIVATE,
  readonly: i18nKeys.PAGE_PAM_READONLY,
  delete: i18nKeys.PAGE_PAM_DELETE,
  noDesc: i18nKeys.PAGE_PAM_NO_DESC,
  noProject: i18nKeys.PAGE_PAM_NO_PROJECT,
  envDirectTitle: i18nKeys.PAGE_PAM_ENV_DIRECT_TITLE,
  openRepo: i18nKeys.PAGE_PAM_OPEN_REPO,
  moreActions: i18nKeys.PAGE_PAM_MORE_ACTIONS,
  copyOwnerId: i18nKeys.PAGE_PAM_COPY_OWNER_ID,
  copyOwnerIdSuccess: i18nKeys.PAGE_PAM_COPY_OWNER_ID_SUCCESS,

  // Create form fields
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
  labelPreviewImage: i18nKeys.PAGE_PAM_LABEL_PREVIEW_IMAGE,
  placeholderPreviewImage: i18nKeys.PAGE_PAM_PLACEHOLDER_PREVIEW_IMAGE,
  labelCategory: i18nKeys.PAGE_PAM_LABEL_CATEGORY,
  labelUnCategory: i18nKeys.PAGE_PAM_LABEL_UNCATEGORY,
  formCancel: i18nKeys.PAGE_PAM_FORM_CANCEL,
  formSave: i18nKeys.PAGE_PAM_FORM_SAVE,
  formSaveing: i18nKeys.PAGE_PAM_FORM_SAVEING,

  // Create-modal env section (PAMEnvFormI18n)
  placeholderEnvName: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_NAME,
  placeholderEnvUrl: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_URL,
  collapsed: i18nKeys.PAGE_PAM_COLLAPSED,
  uncollapsed: i18nKeys.PAGE_PAM_UNCOLLAPSED,
  envVarAdd: i18nKeys.PAGE_PAM_ENV_VAR_ADD,
  noEnvVar: i18nKeys.PAGE_PAM_NO_ENV_VAR,
  placeholderEnvVar: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_VAR,
  placehoderEnvValue: i18nKeys.PAGE_PAM_PLACEHOLDER_ENV_VALUE,
  envVarSensitive: i18nKeys.PAGE_PAM_ENV_VAR_SENSITIVE,
  envVarSensitiveLocked: i18nKeys.PAGE_PAM_ENV_VAR_SENSITIVE_LOCKED,
  envVarSensitivePlaceholder: i18nKeys.PAGE_PAM_ENV_VAR_SENSITIVE_PLACEHOLDER,
  envVarImport: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT,
  envVarImportFile: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_FILE,
  envVarImportPlaceholder: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_PLACEHOLDER,
  envVarImportConfirm: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_CONFIRM,
  envVarImportCancel: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_CANCEL,
  envVarImportEmpty: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_EMPTY,
  envVarImportResult: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_RESULT,
  envVarImportInvalid: i18nKeys.PAGE_PAM_ENV_VAR_IMPORT_INVALID,
  mulitEnv: i18nKeys.PAGE_PAM_MULIT_ENV,
  envAdd: i18nKeys.PAGE_PAM_ENV_ADD,
  envTip: i18nKeys.PAGE_PAM_ENV_TIP,
  envVarTitle: i18nKeys.PAGE_PAM_ENV_VAR_TITLE,
  envUrlTitle: i18nKeys.PAGE_PAM_ENV_URL_TITLE,
  envDelete: i18nKeys.PAGE_PAM_ENV_DELETE,

  adminTitle: COMMON_ADMIN_TITLE
});
