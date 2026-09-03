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
  labelPreviewImage: i18nKeys.PAGE_PAM_GENERAL_LABEL_PREVIEW_IMAGE,
  placeholderPreviewImage: i18nKeys.PAGE_PAM_GENERAL_PLACEHOLDER_PREVIEW_IMAGE,
  previewCapture: i18nKeys.PAGE_PAM_GENERAL_PREVIEW_CAPTURE,
  previewRefresh: i18nKeys.PAGE_PAM_GENERAL_PREVIEW_REFRESH,
  previewCapturing: i18nKeys.PAGE_PAM_GENERAL_PREVIEW_CAPTURING,
  previewNoUrl: i18nKeys.PAGE_PAM_GENERAL_PREVIEW_NO_URL,
  previewSource: i18nKeys.PAGE_PAM_GENERAL_PREVIEW_SOURCE,
  labelCategory: i18nKeys.PAGE_PAM_GENERAL_LABEL_CATEGORY,
  labelUnCategory: i18nKeys.PAGE_PAM_GENERAL_LABEL_UNCATEGORY,
  categoryCustom: i18nKeys.PAGE_PAM_GENERAL_CATEGORY_CUSTOM,
  categoryCustomPlaceholder:
    i18nKeys.PAGE_PAM_GENERAL_CATEGORY_CUSTOM_PLACEHOLDER,
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
  descPreviewImage: i18nKeys.PAGE_PAM_GENERAL_DESC_PROJECT_PREVIEW_IMAGE,

  deleteZoneTitle: i18nKeys.PAGE_PAM_GENERAL_DELETE_ZONE_TITLE,
  deleteZoneDesc: i18nKeys.PAGE_PAM_GENERAL_DELETE_ZONE_DESC,
  deleteProject: i18nKeys.PAGE_PAM_GENERAL_DELETE_PROJECT,
  deleteTitle: i18nKeys.PAGE_PAM_GENERAL_DELETE_TITLE,
  deleteContent: i18nKeys.PAGE_PAM_GENERAL_DELETE_CONTENT,

  transferZoneTitle: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_ZONE_TITLE,
  transferZoneDesc: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_ZONE_DESC,
  transferStart: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_START,
  transferPickerTitle: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_PICKER_TITLE,
  transferSearchPlaceholder:
    i18nKeys.PAGE_PAM_GENERAL_TRANSFER_SEARCH_PLACEHOLDER,
  transferLoading: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_LOADING,
  transferEmpty: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_EMPTY,
  transferEmailLabel: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_EMAIL_LABEL,
  transferEmailPlaceholder:
    i18nKeys.PAGE_PAM_GENERAL_TRANSFER_EMAIL_PLACEHOLDER,
  transferUserIdLabel: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_USER_ID_LABEL,
  transferSubmit: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_SUBMIT,
  transferTitle: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_TITLE,
  transferContent: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_CONTENT,
  transferSuccess: i18nKeys.PAGE_PAM_GENERAL_TRANSFER_SUCCESS,

  collabTitle: i18nKeys.PAGE_PAM_GENERAL_COLLAB_TITLE,
  collabDesc: i18nKeys.PAGE_PAM_GENERAL_COLLAB_DESC,
  collabAdd: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ADD,
  collabRoleAdmin: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ROLE_ADMIN,
  collabRoleMember: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ROLE_MEMBER,
  collabRoleOwner: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ROLE_OWNER,
  collabEmpty: i18nKeys.PAGE_PAM_GENERAL_COLLAB_EMPTY,
  collabRemove: i18nKeys.PAGE_PAM_GENERAL_COLLAB_REMOVE,
  collabRemoveTitle: i18nKeys.PAGE_PAM_GENERAL_COLLAB_REMOVE_TITLE,
  collabRemoveContent: i18nKeys.PAGE_PAM_GENERAL_COLLAB_REMOVE_CONTENT,
  collabAddSuccess: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ADD_SUCCESS,
  collabRemoveSuccess: i18nKeys.PAGE_PAM_GENERAL_COLLAB_REMOVE_SUCCESS,
  collabRoleUpdateSuccess: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ROLE_UPDATE_SUCCESS,
  collabRoleUpdating: i18nKeys.PAGE_PAM_GENERAL_COLLAB_ROLE_UPDATING,
  collabPickerTitle: i18nKeys.PAGE_PAM_GENERAL_COLLAB_PICKER_TITLE,
  collabLoading: i18nKeys.PAGE_PAM_GENERAL_COLLAB_LOADING,

  adminTitle: COMMON_ADMIN_TITLE
});
