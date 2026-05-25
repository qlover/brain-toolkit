'use client';

import { Suspense } from 'react';
import { AdminButton } from './AdminButton';
import { DeveloperButton } from './DeveloperButton';
import { LanguageSwitcherPages } from './LanguageSwitcherPages';
import { LogoutButton } from './LogoutButton';
import { RoutePageLayout } from './RoutePageLayout';
import type { AppRoutePageProps } from './AppRoutePage.types';
import { useLocale } from 'next-intl';

/**
 * Pages Router variant — no imports from `next-intl/navigation` or `@/i18n/routing`.
 */
export function AppRoutePagePages({
  children,
  showAdminButton,
  showDeveloperButton,
  showHeaderLogo = true,
  showAuthButton,
  authButtonShowLogoutLabel,
  headerNav,
  tt,
  ...layoutProps
}: AppRoutePageProps) {
  const locale = useLocale();
  const developerTitle = tt.developerTitle || '';

  return (
    <RoutePageLayout
      {...layoutProps}
      tt={tt}
      showHeaderLogo={showHeaderLogo}
      headerNav={headerNav}
      authSlot={
        showAuthButton ? (
          <LogoutButton
            key="logout-button"
            showLabel={authButtonShowLogoutLabel}
          />
        ) : undefined
      }
      languageSlot={<LanguageSwitcherPages key="language-switcher" />}
      trailingSlot={
        <>
          {showDeveloperButton && developerTitle && (
            <Suspense>
              <DeveloperButton developerTitle={developerTitle} locale={locale} />
            </Suspense>
          )}
          {showAdminButton && (
            <Suspense>
              <AdminButton adminTitle={tt.adminTitle} locale={locale} />
            </Suspense>
          )}
        </>
      }
    >
      {children}
    </RoutePageLayout>
  );
}
