import {
  TranslateI18nUtil,
  type TranslateI18nOptions
} from '@qlover/next-kit/common';
import { useMemo } from 'react';
import { useWarnTranslations } from './useWarnTranslations';

/**
 * 将 i18n-identifier 的映射对象直接翻译成 i18n-mapping 对象
 *
 * Uses app-local `useTranslations` (via {@link useWarnTranslations}) so Pages
 * Router SSG shares the same next-intl Context as `_app`.
 *
 * @example
 * ```ts
 * export const admin18n = Object.freeze({
 *  // basic meta properties
 *  title: homeKeys.ADMIN_HOME_TITLE,
 *  description: homeKeys.ADMIN_HOME_DESCRIPTION,
 *  content: homeKeys.ADMIN_HOME_DESCRIPTION,
 *  keywords: homeKeys.ADMIN_HOME_KEYWORDS,
 *
 *  // admin page
 *  welcome: homeKeys.ADMIN_HOME_WELCOME
 * });
 *
 * const mapping = useI18nMapping(admin18n);
 *
 * mapping.title // 翻译后的标题
 *
 * ```
 *
 * @param i18nInterface - The i18n interface to get
 * @param options - Optional translation options override
 * @returns The i18n interface
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
