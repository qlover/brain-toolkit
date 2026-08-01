import {
  TranslateI18nUtil,
  type TranslateFn,
  type TranslateI18nOptions
} from '@qlover/next-kit/common';
import { useTranslations as useNextTranslations } from 'next-intl';
import { useMemo } from 'react';
import { logger } from '@/impls/globals';
import { i18nWarnMissingTranslation } from '@config/common';

const defaultOptions: TranslateI18nOptions = {
  warnMissing: i18nWarnMissingTranslation,
  logger
};

/**
 * App-local next-intl hook with missing-key warnings.
 *
 * Do not call `@qlover/next-kit/client`'s `useWarnTranslations` here: after
 * transpilePackages, kit may resolve a second `use-intl` Context and break
 * Pages Router SSG (`NextIntlClientProvider` not found → empty Error).
 */
export function useWarnTranslations(
  options?: TranslateI18nOptions
): TranslateFn {
  const t = useNextTranslations();

  return useMemo(
    () =>
      TranslateI18nUtil.overrideTranslateT(t, {
        ...defaultOptions,
        ...options
      }),
    [t, options]
  );
}
