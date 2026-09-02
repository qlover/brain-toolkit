import * as commonTablesKeys from '../i18n-identifier/common/admin.table';
import * as commonKeys from '../i18n-identifier/common/common';
import * as homeKeys from '../i18n-identifier/pages/page.admin.home';
import * as phoneOtpsKeys from '../i18n-identifier/pages/page.admin.phone-otps';
import * as requestLogsKeys from '../i18n-identifier/pages/page.admin.request-logs';
import * as settingsKeys from '../i18n-identifier/pages/page.admin.settings';
import * as userKeys from '../i18n-identifier/pages/page.admin.user';

export const adminTableHeaderI18n = {
  create: commonTablesKeys.COMMON_ADMIN_TABLE_CREATE,
  refresh: commonTablesKeys.COMMON_ADMIN_TABLE_REFRESH,
  search: commonTablesKeys.COMMON_ADMIN_TABLE_SEARCH,
  reset: commonTablesKeys.COMMON_ADMIN_TABLE_RESET,
  export: commonTablesKeys.COMMON_ADMIN_TABLE_EXPORT,
  settings: commonTablesKeys.COMMON_ADMIN_TABLE_SETTINGS
} as const;

export const adminTableI18n = {
  ...adminTableHeaderI18n,
  action: commonTablesKeys.COMMON_ADMIN_TABLE_ACTION,
  editText: commonTablesKeys.COMMON_ADMIN_TABLE_EDIT,
  deleteText: commonTablesKeys.COMMON_ADMIN_TABLE_DELETE,
  detailText: commonTablesKeys.COMMON_ADMIN_TABLE_DETAIL,
  prev: commonTablesKeys.COMMON_ADMIN_TABLE_PREV,
  next: commonTablesKeys.COMMON_ADMIN_TABLE_NEXT,
  pageSize: commonTablesKeys.COMMON_ADMIN_TABLE_PAGE_SIZE
} as const;

export const admin18n = Object.freeze({
  // basic meta properties
  title: homeKeys.ADMIN_HOME_TITLE,
  description: homeKeys.ADMIN_HOME_DESCRIPTION,
  content: homeKeys.ADMIN_HOME_DESCRIPTION,
  keywords: homeKeys.ADMIN_HOME_KEYWORDS,

  // admin page
  welcome: homeKeys.ADMIN_HOME_WELCOME
});

export type AdminUsersI18nInterface = typeof adminUsers18n;

export type AdminRequestLogsI18nInterface = typeof adminRequestLogs18n;

export type AdminSettingsI18nInterface = typeof adminSettings18n;

export type AdminPhoneOtpsI18nInterface = typeof adminPhoneOtps18n;

export const adminPhoneOtps18n = Object.freeze({
  title: phoneOtpsKeys.ADMIN_PHONE_OTPS_TITLE,
  description: phoneOtpsKeys.ADMIN_PHONE_OTPS_DESCRIPTION,
  content: phoneOtpsKeys.ADMIN_PHONE_OTPS_DESCRIPTION,
  keywords: phoneOtpsKeys.ADMIN_PHONE_OTPS_KEYWORDS,
  searchPlaceholder: phoneOtpsKeys.ADMIN_PHONE_OTPS_SEARCH_PLACEHOLDER,
  refresh: phoneOtpsKeys.ADMIN_PHONE_OTPS_REFRESH,
  autoRefresh: phoneOtpsKeys.ADMIN_PHONE_OTPS_AUTO_REFRESH,
  colPhone: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_PHONE,
  colCode: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_CODE,
  colProvider: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_PROVIDER,
  colStatus: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_STATUS,
  colAttempts: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_ATTEMPTS,
  colExpires: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_EXPIRES,
  colCreated: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_CREATED,
  colIp: phoneOtpsKeys.ADMIN_PHONE_OTPS_COL_IP,
  empty: phoneOtpsKeys.ADMIN_PHONE_OTPS_EMPTY,
  codeHidden: phoneOtpsKeys.ADMIN_PHONE_OTPS_CODE_HIDDEN
});

export const adminSettings18n = Object.freeze({
  title: settingsKeys.ADMIN_SETTINGS_TITLE,
  description: settingsKeys.ADMIN_SETTINGS_DESCRIPTION,
  content: settingsKeys.ADMIN_SETTINGS_DESCRIPTION,
  keywords: settingsKeys.ADMIN_SETTINGS_KEYWORDS,
  sectionAuth: settingsKeys.ADMIN_SETTINGS_SECTION_AUTH,
  sectionAuthDesc: settingsKeys.ADMIN_SETTINGS_SECTION_AUTH_DESC,
  sectionBrainOAuth: settingsKeys.ADMIN_SETTINGS_SECTION_BRAIN_OAUTH,
  sectionBrainOAuthDesc: settingsKeys.ADMIN_SETTINGS_SECTION_BRAIN_OAUTH_DESC,
  sectionOpenai: settingsKeys.ADMIN_SETTINGS_SECTION_OPENAI,
  sectionOpenaiDesc: settingsKeys.ADMIN_SETTINGS_SECTION_OPENAI_DESC,
  sectionApi: settingsKeys.ADMIN_SETTINGS_SECTION_API,
  sectionApiDesc: settingsKeys.ADMIN_SETTINGS_SECTION_API_DESC,
  sectionStorage: settingsKeys.ADMIN_SETTINGS_SECTION_STORAGE,
  sectionStorageDesc: settingsKeys.ADMIN_SETTINGS_SECTION_STORAGE_DESC,
  loading: settingsKeys.ADMIN_SETTINGS_LOADING,
  save: settingsKeys.ADMIN_SETTINGS_SAVE,
  saving: settingsKeys.ADMIN_SETTINGS_SAVING,
  secretHint: settingsKeys.ADMIN_SETTINGS_SECRET_HINT,
  loadFailed: settingsKeys.ADMIN_SETTINGS_LOAD_FAILED,
  saveFailed: settingsKeys.ADMIN_SETTINGS_SAVE_FAILED,
  saveSuccess: settingsKeys.ADMIN_SETTINGS_SAVE_SUCCESS,
  sourceDb: settingsKeys.ADMIN_SETTINGS_SOURCE_DB,
  sourceEnv: settingsKeys.ADMIN_SETTINGS_SOURCE_ENV,
  sourceDefault: settingsKeys.ADMIN_SETTINGS_SOURCE_DEFAULT
});

export const adminRequestLogs18n = Object.freeze({
  title: requestLogsKeys.ADMIN_REQUEST_LOGS_TITLE,
  description: requestLogsKeys.ADMIN_REQUEST_LOGS_DESCRIPTION,
  content: requestLogsKeys.ADMIN_REQUEST_LOGS_DESCRIPTION,
  keywords: requestLogsKeys.ADMIN_REQUEST_LOGS_KEYWORDS,
  colTime: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_TIME,
  colRequestId: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_REQUEST_ID,
  colCategory: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_CATEGORY,
  colType: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_TYPE,
  colSuccess: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_SUCCESS,
  colHttp: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_HTTP,
  colStatus: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_STATUS,
  colDuration: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_DURATION,
  colIp: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_IP,
  colLoginMethod: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_LOGIN_METHOD,
  colError: requestLogsKeys.ADMIN_REQUEST_LOGS_COL_ERROR,
  empty: requestLogsKeys.ADMIN_REQUEST_LOGS_EMPTY
});

export const adminUsers18n = Object.freeze({
  // basic meta properties
  title: userKeys.ADMIN_USERS_TITLE,
  description: userKeys.ADMIN_USERS_DESCRIPTION,
  content: userKeys.ADMIN_USERS_DESCRIPTION,
  keywords: userKeys.ADMIN_USERS_KEYWORDS,

  createTitle: userKeys.ADMIN_USERS_CREATE_TITLE,
  editTitle: userKeys.ADMIN_USERS_EDIT_TITLE,
  detailTitle: userKeys.ADMIN_USERS_DETAIL_TITLE,
  deleteTitle: userKeys.ADMIN_USERS_DELETE_TITLE,
  deleteContent: userKeys.ADMIN_USERS_DELETE_CONTENT,
  saveButton: commonKeys.COMMON_SAVE,
  detailButton: commonKeys.COMMON_DETAIL,
  cancelButton: commonKeys.COMMON_CANCEL,
  createButton: commonKeys.COMMON_CREATE,
  platformAdminLabel: userKeys.ADMIN_USERS_PLATFORM_ADMIN_LABEL,
  searchPlaceholder: userKeys.ADMIN_USERS_SEARCH_PLACEHOLDER,
  empty: userKeys.ADMIN_USERS_EMPTY,
  emailLabel: userKeys.ADMIN_USERS_EMAIL_LABEL,
  searchButton: commonTablesKeys.COMMON_ADMIN_TABLE_SEARCH
});
