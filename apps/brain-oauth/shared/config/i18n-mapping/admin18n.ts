import * as commonKeys from '../i18n-identifier/common/common';
import * as homeKeys from '../i18n-identifier/pages/page.admin.home';
import * as requestLogsKeys from '../i18n-identifier/pages/page.admin.request-logs';
import * as settingsKeys from '../i18n-identifier/pages/page.admin.settings';
import * as userKeys from '../i18n-identifier/pages/page.admin.user';

/** Header, side nav and pager labels shared by every admin page. */
export const adminShellI18n = Object.freeze({
  appName: commonKeys.COMMON_APP_NAME,
  adminTitle: commonKeys.COMMON_ADMIN_TITLE,
  navConsole: commonKeys.COMMON_HEADER_CONSOLE,
  navDocs: commonKeys.COMMON_HEADER_NAV_DOCS,
  navOverview: commonKeys.COMMON_ADMIN_NAV_DASHBOARD,
  navUsers: commonKeys.COMMON_ADMIN_NAV_USER_MANAGEMENT,
  navLogs: commonKeys.COMMON_ADMIN_NAV_REQUEST_LOGS,
  navSettings: commonKeys.COMMON_ADMIN_NAV_SITE_SETTINGS,
  menu: homeKeys.ADMIN_HOME_SHELL_MENU,
  adminTag: homeKeys.ADMIN_HOME_SHELL_ADMIN_TAG,
  forbidden: homeKeys.ADMIN_HOME_SHELL_FORBIDDEN,
  refresh: homeKeys.ADMIN_HOME_SHELL_REFRESH,
  refreshed: homeKeys.ADMIN_HOME_SHELL_REFRESHED,
  all: homeKeys.ADMIN_HOME_SHELL_ALL,
  loadFailed: homeKeys.ADMIN_HOME_SHELL_LOAD_FAILED,
  close: homeKeys.ADMIN_HOME_SHELL_CLOSE,
  detail: homeKeys.ADMIN_HOME_SHELL_DETAIL,
  copy: homeKeys.ADMIN_HOME_SHELL_COPY,
  copied: homeKeys.ADMIN_HOME_SHELL_COPIED,
  range: homeKeys.ADMIN_HOME_SHELL_RANGE,
  perPage: homeKeys.ADMIN_HOME_SHELL_PER_PAGE,
  prevPage: homeKeys.ADMIN_HOME_SHELL_PREV_PAGE,
  nextPage: homeKeys.ADMIN_HOME_SHELL_NEXT_PAGE,
  loginPhoneOtp: homeKeys.ADMIN_HOME_SHELL_LOGIN_PHONE_OTP,
  loginPassword: homeKeys.ADMIN_HOME_SHELL_LOGIN_PASSWORD
});

export type AdminShellI18nInterface = typeof adminShellI18n;

export const admin18n = Object.freeze({
  title: homeKeys.ADMIN_HOME_TITLE,
  description: homeKeys.ADMIN_HOME_DESCRIPTION,
  content: homeKeys.ADMIN_HOME_DESCRIPTION,
  descriptionOwn: homeKeys.ADMIN_HOME_DESCRIPTION_OWN,
  keywords: homeKeys.ADMIN_HOME_KEYWORDS,
  statUsers: homeKeys.ADMIN_HOME_STAT_USERS,
  statUsersTrend: homeKeys.ADMIN_HOME_STAT_USERS_TREND,
  statApps: homeKeys.ADMIN_HOME_STAT_APPS,
  statAppsTrend: homeKeys.ADMIN_HOME_STAT_APPS_TREND,
  statAuth: homeKeys.ADMIN_HOME_STAT_AUTH,
  statFail: homeKeys.ADMIN_HOME_STAT_FAIL,
  statVsYesterday: homeKeys.ADMIN_HOME_STAT_VS_YESTERDAY,
  statNoCompare: homeKeys.ADMIN_HOME_STAT_NO_COMPARE,
  chartTitle: homeKeys.ADMIN_HOME_CHART_TITLE,
  chartSub: homeKeys.ADMIN_HOME_CHART_SUB,
  recentTitle: homeKeys.ADMIN_HOME_RECENT_TITLE,
  viewAll: homeKeys.ADMIN_HOME_RECENT_VIEW_ALL,
  recentEmpty: homeKeys.ADMIN_HOME_RECENT_EMPTY
});

export type AdminI18nInterface = typeof admin18n;

export const adminUsers18n = Object.freeze({
  title: userKeys.ADMIN_USERS_TITLE,
  description: userKeys.ADMIN_USERS_DESCRIPTION,
  content: userKeys.ADMIN_USERS_DESCRIPTION,
  keywords: userKeys.ADMIN_USERS_KEYWORDS,
  searchPlaceholder: userKeys.ADMIN_USERS_SEARCH_PLACEHOLDER,
  roleAdmin: userKeys.ADMIN_USERS_ROLE_ADMIN,
  roleUser: userKeys.ADMIN_USERS_ROLE_USER,
  thUser: userKeys.ADMIN_USERS_TH_USER,
  thRole: userKeys.ADMIN_USERS_TH_ROLE,
  thLoginMethod: userKeys.ADMIN_USERS_TH_LOGIN_METHOD,
  thApps: userKeys.ADMIN_USERS_TH_APPS,
  thCreated: userKeys.ADMIN_USERS_TH_CREATED,
  thLastLogin: userKeys.ADMIN_USERS_TH_LAST_LOGIN,
  empty: userKeys.ADMIN_USERS_EMPTY,
  detailTitle: userKeys.ADMIN_USERS_DETAIL_TITLE,
  detailEmail: userKeys.ADMIN_USERS_DETAIL_EMAIL,
  detailPhone: userKeys.ADMIN_USERS_DETAIL_PHONE,
  detailUpdated: userKeys.ADMIN_USERS_DETAIL_UPDATED,
  detailNote: userKeys.ADMIN_USERS_DETAIL_NOTE,
  unnamed: userKeys.ADMIN_USERS_UNNAMED
});

export type AdminUsersI18nInterface = typeof adminUsers18n;

export const adminRequestLogs18n = Object.freeze({
  title: requestLogsKeys.ADMIN_REQUEST_LOGS_TITLE,
  description: requestLogsKeys.ADMIN_REQUEST_LOGS_DESCRIPTION,
  content: requestLogsKeys.ADMIN_REQUEST_LOGS_DESCRIPTION,
  keywords: requestLogsKeys.ADMIN_REQUEST_LOGS_KEYWORDS,
  searchPlaceholder: requestLogsKeys.ADMIN_REQUEST_LOGS_SEARCH_PLACEHOLDER,
  categoryLabel: requestLogsKeys.ADMIN_REQUEST_LOGS_CATEGORY_LABEL,
  allCategories: requestLogsKeys.ADMIN_REQUEST_LOGS_ALL_CATEGORIES,
  success: requestLogsKeys.ADMIN_REQUEST_LOGS_SUCCESS,
  failed: requestLogsKeys.ADMIN_REQUEST_LOGS_FAILED,
  thTime: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_TIME,
  thRequest: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_REQUEST,
  thEvent: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_EVENT,
  thResult: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_RESULT,
  thDuration: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_DURATION,
  thIp: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_IP,
  thLoginMethod: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_LOGIN_METHOD,
  thUser: requestLogsKeys.ADMIN_REQUEST_LOGS_TH_USER,
  empty: requestLogsKeys.ADMIN_REQUEST_LOGS_EMPTY,
  detailTitle: requestLogsKeys.ADMIN_REQUEST_LOGS_DETAIL_TITLE,
  detailRequestId: requestLogsKeys.ADMIN_REQUEST_LOGS_DETAIL_REQUEST_ID
});

export type AdminRequestLogsI18nInterface = typeof adminRequestLogs18n;

export const adminSettings18n = Object.freeze({
  title: settingsKeys.ADMIN_SETTINGS_TITLE,
  description: settingsKeys.ADMIN_SETTINGS_DESCRIPTION,
  content: settingsKeys.ADMIN_SETTINGS_DESCRIPTION,
  keywords: settingsKeys.ADMIN_SETTINGS_KEYWORDS,
  sectionApi: settingsKeys.ADMIN_SETTINGS_SECTION_API,
  sectionApiDesc: settingsKeys.ADMIN_SETTINGS_SECTION_API_DESC,
  save: settingsKeys.ADMIN_SETTINGS_SAVE,
  loadFailed: settingsKeys.ADMIN_SETTINGS_LOAD_FAILED,
  saveFailed: settingsKeys.ADMIN_SETTINGS_SAVE_FAILED,
  saveSuccess: settingsKeys.ADMIN_SETTINGS_SAVE_SUCCESS,
  sourceDb: settingsKeys.ADMIN_SETTINGS_SOURCE_DB,
  sourceDefault: settingsKeys.ADMIN_SETTINGS_SOURCE_DEFAULT,
  corsRules: settingsKeys.ADMIN_SETTINGS_CORS_RULES,
  corsOrigin: settingsKeys.ADMIN_SETTINGS_CORS_ORIGIN,
  corsPath: settingsKeys.ADMIN_SETTINGS_CORS_PATH,
  corsMethods: settingsKeys.ADMIN_SETTINGS_CORS_METHODS,
  corsAny: settingsKeys.ADMIN_SETTINGS_CORS_ANY,
  corsAdd: settingsKeys.ADMIN_SETTINGS_CORS_ADD,
  corsRemove: settingsKeys.ADMIN_SETTINGS_CORS_REMOVE,
  corsEmpty: settingsKeys.ADMIN_SETTINGS_CORS_EMPTY,
  corsOriginInvalid: settingsKeys.ADMIN_SETTINGS_CORS_ORIGIN_INVALID,
  corsPathInvalid: settingsKeys.ADMIN_SETTINGS_CORS_PATH_INVALID,
  corsMethodsEmpty: settingsKeys.ADMIN_SETTINGS_CORS_METHODS_EMPTY,
  corsDuplicate: settingsKeys.ADMIN_SETTINGS_CORS_DUPLICATE,
  corsFixErrors: settingsKeys.ADMIN_SETTINGS_CORS_FIX_ERRORS,
  sectionBrain: settingsKeys.ADMIN_SETTINGS_SECTION_BRAIN,
  sectionBrainDesc: settingsKeys.ADMIN_SETTINGS_SECTION_BRAIN_DESC,
  brainEnv: settingsKeys.ADMIN_SETTINGS_BRAIN_ENV,
  brainDomains: settingsKeys.ADMIN_SETTINGS_BRAIN_DOMAINS,
  brainDomainName: settingsKeys.ADMIN_SETTINGS_BRAIN_DOMAIN_NAME,
  brainDomainUrl: settingsKeys.ADMIN_SETTINGS_BRAIN_DOMAIN_URL,
  brainDomainAdd: settingsKeys.ADMIN_SETTINGS_BRAIN_DOMAIN_ADD,
  brainDomainRemove: settingsKeys.ADMIN_SETTINGS_BRAIN_DOMAIN_REMOVE,
  brainPreset: settingsKeys.ADMIN_SETTINGS_BRAIN_PRESET,
  brainUserly: settingsKeys.ADMIN_SETTINGS_BRAIN_USERLY,
  brainUserlyHelp: settingsKeys.ADMIN_SETTINGS_BRAIN_USERLY_HELP,
  brainEndpoints: settingsKeys.ADMIN_SETTINGS_BRAIN_ENDPOINTS,
  brainEndpointsDesc: settingsKeys.ADMIN_SETTINGS_BRAIN_ENDPOINTS_DESC,
  brainModified: settingsKeys.ADMIN_SETTINGS_BRAIN_MODIFIED,
  brainReset: settingsKeys.ADMIN_SETTINGS_BRAIN_RESET,
  brainResetAll: settingsKeys.ADMIN_SETTINGS_BRAIN_RESET_ALL,
  brainUrlInvalid: settingsKeys.ADMIN_SETTINGS_BRAIN_URL_INVALID,
  brainNameInvalid: settingsKeys.ADMIN_SETTINGS_BRAIN_NAME_INVALID,
  brainPathInvalid: settingsKeys.ADMIN_SETTINGS_BRAIN_PATH_INVALID,
  brainConfigInvalid: settingsKeys.ADMIN_SETTINGS_BRAIN_CONFIG_INVALID,
  brainEffective: settingsKeys.ADMIN_SETTINGS_BRAIN_EFFECTIVE,
  brainUserlyEffective: settingsKeys.ADMIN_SETTINGS_BRAIN_USERLY_EFFECTIVE
});

export type AdminSettingsI18nInterface = typeof adminSettings18n;
