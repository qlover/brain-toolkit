import * as commonKeys from '../i18n-identifier/common/common';

/**
 * 全局反馈表单 / FAB Modal 文案（common 命名空间，各页默认可取）。
 */
export const feedbackFormI18n = Object.freeze({
  fab: commonKeys.COMMON_FEEDBACK_FAB,
  modalTitle: commonKeys.COMMON_FEEDBACK_MODAL_TITLE,
  close: commonKeys.COMMON_CANCEL,
  category: commonKeys.COMMON_FEEDBACK_CATEGORY,
  body: commonKeys.COMMON_FEEDBACK_BODY,
  bodyPlaceholder: commonKeys.COMMON_FEEDBACK_BODY_PLACEHOLDER,
  screenshots: commonKeys.COMMON_FEEDBACK_SCREENSHOTS,
  screenshotsAdd: commonKeys.COMMON_FEEDBACK_SCREENSHOTS_ADD,
  deviceNotice: commonKeys.COMMON_FEEDBACK_DEVICE_NOTICE,
  submit: commonKeys.COMMON_FEEDBACK_SUBMIT,
  submitting: commonKeys.COMMON_FEEDBACK_SUBMITTING,
  success: commonKeys.COMMON_FEEDBACK_SUCCESS,
  screenshotsError: commonKeys.COMMON_FEEDBACK_SCREENSHOTS_ERROR,
  error: commonKeys.COMMON_FEEDBACK_ERROR,
  categoryBug: commonKeys.COMMON_FEEDBACK_CATEGORY_BUG,
  categoryUx: commonKeys.COMMON_FEEDBACK_CATEGORY_UX,
  categoryFeature: commonKeys.COMMON_FEEDBACK_CATEGORY_FEATURE,
  categoryPerformance: commonKeys.COMMON_FEEDBACK_CATEGORY_PERFORMANCE,
  categoryContent: commonKeys.COMMON_FEEDBACK_CATEGORY_CONTENT,
  categoryOther: commonKeys.COMMON_FEEDBACK_CATEGORY_OTHER
});

export type FeedbackFormI18nInterface = typeof feedbackFormI18n;
