'use client';

import { useLocale } from 'next-intl';
import { Suspense } from 'react';
import { AdminButton } from './AdminButton';
import { AppBridge } from './AppBridge';
import { AuthButton } from './AuthButton';
import { DeveloperButton } from './DeveloperButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RoutePageLayout } from './RoutePageLayout';
import type { AppRoutePageProps } from './AppRoutePage.types';

/**
 * App Router variant — may use `next-intl/navigation` via LanguageSwitcher / AppBridge.
 */
export function AppRoutePageApp({
  children,
  showAdminButton,
  showDeveloperButton,
  showHeaderLogo = true,
  showAuthButton,
  authButtonLoginOnly,
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
      topSlot={<AppBridge />}
      authSlot={
        showAuthButton ? (
          <Suspense key="auth-button">
            <AuthButton
              loginOnly={authButtonLoginOnly}
              showLogoutLabel={authButtonShowLogoutLabel}
            />
          </Suspense>
        ) : undefined
      }
      languageSlot={<LanguageSwitcher key="language-switcher" />}
      trailingSlot={
        <>
          {showDeveloperButton && developerTitle && (
            <Suspense>
              <DeveloperButton
                developerTitle={developerTitle}
                locale={locale}
              />
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
