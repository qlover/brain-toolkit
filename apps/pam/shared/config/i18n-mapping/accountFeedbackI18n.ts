import * as commonKeys from '../i18n-identifier/common/common';
import * as accountKeys from '../i18n-identifier/pages/page.account';
import { PAGE_HOME_TITLE } from '../i18n-identifier/pages/page.home';

/**
 * 账号「我的反馈」列表页文案。
 */
export const accountFeedbackI18n = Object.freeze({
  appBrandTitle: PAGE_HOME_TITLE,
  adminTitle: commonKeys.COMMON_ADMIN_TITLE,
  title: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_TITLE,
  description: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_DESCRIPTION,
  content: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_DESCRIPTION,
  keywords: accountKeys.PAGE_ACCOUNT_KEYWORDS,
  empty: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_EMPTY,
  loadFailed: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_LOAD_FAILED,
  colCategory: commonKeys.COMMON_FEEDBACK_CATEGORY,
  colBody: commonKeys.COMMON_FEEDBACK_BODY,
  colStatus: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_COL_STATUS,
  colTime: accountKeys.PAGE_ACCOUNT_FEEDBACK_LIST_COL_TIME,
  categoryBug: commonKeys.COMMON_FEEDBACK_CATEGORY_BUG,
  categoryUx: commonKeys.COMMON_FEEDBACK_CATEGORY_UX,
  categoryFeature: commonKeys.COMMON_FEEDBACK_CATEGORY_FEATURE,
  categoryPerformance: commonKeys.COMMON_FEEDBACK_CATEGORY_PERFORMANCE,
  categoryContent: commonKeys.COMMON_FEEDBACK_CATEGORY_CONTENT,
  categoryOther: commonKeys.COMMON_FEEDBACK_CATEGORY_OTHER,
  statusOpen: accountKeys.PAGE_ACCOUNT_FEEDBACK_STATUS_OPEN,
  statusReviewing: accountKeys.PAGE_ACCOUNT_FEEDBACK_STATUS_REVIEWING,
  statusResolved: accountKeys.PAGE_ACCOUNT_FEEDBACK_STATUS_RESOLVED,
  statusClosed: accountKeys.PAGE_ACCOUNT_FEEDBACK_STATUS_CLOSED
});

export type AccountFeedbackI18nInterface = typeof accountFeedbackI18n;
