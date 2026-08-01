import {
  TranslateI18nUtil,
  type TranslateI18nOptions
} from '@qlover/next-kit/common';
import { useMemo } from 'react';
import { useWarnTranslations } from './useWarnTranslations';

/**
 * Translate an i18n-identifier key map into resolved strings, with pam's
 * warn-missing-translation defaults.
 *
 * Uses app-local `useTranslations` (via {@link useWarnTranslations}) so Pages
 * Router SSG shares the same next-intl Context as `_app`.
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
  const t = useWarnTranslations(options);

  return useMemo(
    () => TranslateI18nUtil.translate(i18nInterface, t),
    [i18nInterface, t]
  );
}
