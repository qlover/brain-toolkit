'use client';

import { useRouter } from 'next/router';
import { useLocale } from 'next-intl';
import { useEffect, useMemo } from 'react';
import type { useRouter as useAppRouter } from '@/i18n/routing';
import { NavigateBridge } from '@/impls/NavigateBridge';
import { useLocaleRoutes } from '@config/common';
import { i18nConfig } from '@config/i18n';
import { useIOC } from '../hook/useIOC';

/** Pages Router counterpart of {@link AppBridge}. */
export function PagesBridge() {
  const router = useRouter();
  const locale = useLocale();
  const navigateBridge = useIOC(NavigateBridge);

  const uiBridge = useMemo(() => {
    const prefix =
      useLocaleRoutes && locale !== i18nConfig.fallbackLng ? `/${locale}` : '';

    return {
      push: (href: string) => void router.push(`${prefix}${href}`),
      replace: (href: string) => void router.replace(`${prefix}${href}`)
    };
  }, [router, locale]);

  useEffect(() => {
    navigateBridge.setUIBridge(uiBridge as ReturnType<typeof useAppRouter>);
  }, [uiBridge, navigateBridge]);

  return null;
}
