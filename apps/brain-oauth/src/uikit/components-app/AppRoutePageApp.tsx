'use client';

import { useLocale } from 'next-intl';
import { Suspense } from 'react';
import { AdminButton } from './AdminButton';
import { AppBridge } from './AppBridge';
import { AppHeaderNav } from './AppHeaderNav';
import { AuthButton } from './AuthButton';
import { DeveloperButton } from './DeveloperButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { RoutePageLayout } from './RoutePageLayout';
import { BrainAuthActions } from '../components/brain/BrainAuthActions';
import type { AppRoutePageProps } from './AppRoutePage';

/**
 * App Router variant — may use `next-intl/navigation` via LanguageSwitcher / AppBridge.
 */
export function AppRoutePageApp({
  children,
  showAdminButton,
  showDeveloperButton,
  showHeaderLogo = true,
  showAuthButton,
  authButtonShowLogoutLabel,
  showHeaderNav = true,
  headerNav,
  authShowConsole,
  authShowLogout,
  tt,
  ...layoutProps
}: AppRoutePageProps) {
  const locale = useLocale();
  const developerTitle = tt.developerTitle || '';
  const isBrain = layoutProps.headerVariant === 'brain';
  const resolvedHeaderNav =
    headerNav ?? (showHeaderNav && !isBrain ? <AppHeaderNav /> : undefined);

  return (
    <RoutePageLayout
      {...layoutProps}
      tt={tt}
      showHeaderLogo={showHeaderLogo}
      headerNav={resolvedHeaderNav}
      topSlot={<AppBridge />}
      authSlot={
        !showAuthButton ? undefined : isBrain ? (
          <BrainAuthActions
            showConsole={authShowConsole}
            showLogout={authShowLogout}
          />
        ) : (
          <Suspense key="auth-button">
            <AuthButton showLogoutLabel={authButtonShowLogoutLabel} />
          </Suspense>
        )
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
