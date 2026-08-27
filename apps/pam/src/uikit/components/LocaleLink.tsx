'use client';

import {
  LocaleLink as KitLocaleLink,
  type LocaleLinkProps
} from '@qlover/next-kit/client';
import { useLocale } from 'next-intl';
import { useLocaleRoutes } from '@config/common';
import { i18nConfig } from '@config/i18n';

type AppLocaleLinkProps = Omit<
  LocaleLinkProps,
  'fallbackLocale' | 'useLocaleRoutes'
> & {
  fallbackLocale?: string;
  useLocaleRoutes?: boolean;
};

/**
 * App LocaleLink — injects i18n / routing defaults from config.
 *
 * Uses the active next-intl locale when `locale` is omitted so Sign in /
 * auth links stay on `/zh/...` instead of falling back to English.
 */
export function LocaleLink(props: AppLocaleLinkProps) {
  const localeFromHook = useLocale();
  const {
    locale = localeFromHook,
    fallbackLocale = i18nConfig.fallbackLng,
    useLocaleRoutes: useLocaleRoutesProp = useLocaleRoutes,
    ...rest
  } = props;

  return (
    <KitLocaleLink
      {...rest}
      locale={locale}
      fallbackLocale={fallbackLocale}
      useLocaleRoutes={useLocaleRoutesProp}
    />
  );
}
