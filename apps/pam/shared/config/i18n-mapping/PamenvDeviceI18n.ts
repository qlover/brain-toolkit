import { COMMON_ADMIN_TITLE } from '../i18n-identifier/common/common';
import * as i18nKeys from '../i18n-identifier/pages/page.pamenv.device';

export type PamenvDeviceI18nInterface = typeof pamenvDeviceI18n;

export const pamenvDeviceI18nNamespace = 'page_pamenv_device';

export const pamenvDeviceI18n = Object.freeze({
  title: i18nKeys.PAGE_PAMENV_DEVICE_TITLE,
  description: i18nKeys.PAGE_PAMENV_DEVICE_DESCRIPTION,
  content: i18nKeys.PAGE_PAMENV_DEVICE_CONTENT,
  keywords: i18nKeys.PAGE_PAMENV_DEVICE_KEYWORDS,

  headerSubtitle: i18nKeys.PAGE_PAMENV_DEVICE_HEADER_SUBTITLE,
  heading: i18nKeys.PAGE_PAMENV_DEVICE_HEADING,
  subtitle: i18nKeys.PAGE_PAMENV_DEVICE_SUBTITLE,
  codeLabel: i18nKeys.PAGE_PAMENV_DEVICE_CODE_LABEL,
  codePlaceholder: i18nKeys.PAGE_PAMENV_DEVICE_CODE_PLACEHOLDER,
  approve: i18nKeys.PAGE_PAMENV_DEVICE_APPROVE,
  approving: i18nKeys.PAGE_PAMENV_DEVICE_APPROVING,
  authorized: i18nKeys.PAGE_PAMENV_DEVICE_AUTHORIZED,
  codeRequired: i18nKeys.PAGE_PAMENV_DEVICE_CODE_REQUIRED,
  approveFailed: i18nKeys.PAGE_PAMENV_DEVICE_APPROVE_FAILED,
  success: i18nKeys.PAGE_PAMENV_DEVICE_SUCCESS,
  loading: i18nKeys.PAGE_PAMENV_DEVICE_LOADING,

  adminTitle: COMMON_ADMIN_TITLE
});
