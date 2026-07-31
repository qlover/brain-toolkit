import {
  useI18nMapping as useKitI18nMapping,
  type TranslateI18nOptions
} from '@qlover/next-kit/client';
import { logger } from '@/impls/globals';
import { i18nWarnMissingTranslation } from '@config/common';

const defaultOptions: TranslateI18nOptions = {
  warnMissing: i18nWarnMissingTranslation,
  logger
};

/**
 * Translate an i18n-identifier key map into resolved strings, with pam's
 * warn-missing-translation defaults.
 *
 * @example
 * ```ts
 * export const admin18n = Object.freeze({
 *  title: homeKeys.ADMIN_HOME_TITLE,
 *  description: homeKeys.ADMIN_HOME_DESCRIPTION,
 *  content: homeKeys.ADMIN_HOME_DESCRIPTION,
 *  keywords: homeKeys.ADMIN_HOME_KEYWORDS,
 *  welcome: homeKeys.ADMIN_HOME_WELCOME
 * });
 *
 * const mapping = useI18nMapping(admin18n);
 *
 * mapping.title // translated title
 * ```
 *
 * @param i18nInterface - The i18n interface to translate
 * @param options - Optional translation options override
 * @returns The translated i18n interface
 */
export function useI18nMapping<T extends Record<string, string>>(
  i18nInterface: T,
  options?: TranslateI18nOptions
): T {
  return useKitI18nMapping(i18nInterface, {
    ...defaultOptions,
    ...options
  });
}
