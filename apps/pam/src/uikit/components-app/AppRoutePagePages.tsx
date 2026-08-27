'use client';

import { useLocale } from 'next-intl';
import { Suspense } from 'react';
import { AdminButton } from './AdminButton';
import { AppBridgePages } from './AppBridgePages';
import { AppHeaderNavPages } from './AppHeaderNavPages';
import { AuthButton } from './AuthButton';
import { DeveloperButton } from './DeveloperButton';
import { LanguageSwitcherPages } from './LanguageSwitcherPages';
import { RoutePageLayout } from './RoutePageLayout';
import type { AppRoutePageProps } from './AppRoutePage';

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
  showHeaderNav = true,
  headerNav,
  authButtonLoginOnly: _authButtonLoginOnly,
  tt,
  ...layoutProps
}: AppRoutePageProps) {
  const locale = useLocale();
  const developerTitle = tt.developerTitle || '';
  const resolvedHeaderNav =
    headerNav ?? (showHeaderNav ? <AppHeaderNavPages /> : undefined);

  return (
    <RoutePageLayout
      {...layoutProps}
      tt={tt}
      showHeaderLogo={showHeaderLogo}
      headerNav={resolvedHeaderNav}
      topSlot={<AppBridgePages />}
      authSlot={
        showAuthButton ? (
          <Suspense key="auth-button">
            <AuthButton showLogoutLabel={authButtonShowLogoutLabel} />
          </Suspense>
        ) : undefined
      }
      languageSlot={<LanguageSwitcherPages key="language-switcher" />}
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
