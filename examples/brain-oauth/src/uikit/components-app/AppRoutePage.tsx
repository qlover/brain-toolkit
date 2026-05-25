'use client';

import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import { Suspense, type HTMLAttributes, type ReactNode } from 'react';
import { AdminButton } from './AdminButton';
import { AppBridge } from './AppBridge';
import { AuthButton } from './AuthButton';
import { DeveloperButton } from './DeveloperButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleLink } from '../components/LocaleLink';

export interface AppRoutePageTT {
  title: string;
  adminTitle: string;
  developerTitle?: string;
}

export interface AppRoutePageProps extends HTMLAttributes<HTMLDivElement> {
  showAdminButton?: boolean;
  showDeveloperButton?: boolean;
  showHeaderLogo?: boolean;
  mainProps?: HTMLAttributes<HTMLElement>;
  showAuthButton?: boolean;
  authButtonLoginOnly?: boolean;
  /** Show text label on logout control (home header). */
  authButtonShowLogoutLabel?: boolean;
  headerClassName?: string;
  headerHref?: string;
  headerNav?: ReactNode;
  tt: AppRoutePageTT;
}

/**
 * App Route Page
 *
 * 主要用于 /src/app 目录下页面的基础布局，包含头部、主体内容等
 *
 * @description
 * - /src/app/[locale]/page.tsx
 * - /src/app/[locale]/login/page.tsx
 *
 */
export function AppRoutePage({
  children,
  showAdminButton,
  showDeveloperButton,
  showHeaderLogo = true,
  mainProps,
  headerClassName,
  showAuthButton,
  authButtonLoginOnly,
  authButtonShowLogoutLabel,
  headerNav,
  tt,
  headerHref = '/',
  ...props
}: AppRoutePageProps) {
  const locale = useLocale();
  const adminTitle = tt.adminTitle;
  const developerTitle = tt.developerTitle || '';
  const showHeaderLeading = showHeaderLogo || headerNav != null;

  return (
    <div
      data-testid="AppRoutePage"
      className="flex flex-col min-h-screen"
      {...props}
    >
      <AppBridge />
      <header
        data-testid="BaseHeader"
        className="relative h-16 bg-primary/80 backdrop-blur-md border-b border-primary-border sticky top-0 z-50"
      >
        <div
          className={clsx(
            'flex items-center h-full gap-2 px-3 sm:px-4 mx-auto max-w-7xl min-w-0',
            showHeaderLeading ? 'justify-between' : 'justify-end',
            headerClassName
          )}
        >
          {showHeaderLeading && (
            <div className="flex items-center min-w-0 flex-1">
              {showHeaderLogo && (
                <LocaleLink
                  data-testid="BaseHeaderLogo"
                  title={tt.title}
                  href={headerHref}
                  locale={locale}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0 shrink"
                >
                  <span
                    data-testid="base-header-app-name"
                    className="text-base sm:text-lg font-semibold text-primary-text truncate max-w-[8.5rem] min-[380px]:max-w-[10rem] sm:max-w-none"
                  >
                    {tt.title}
                  </span>
                </LocaleLink>
              )}
              {headerNav}
            </div>
          )}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            {showAuthButton && (
              <Suspense>
                <AuthButton
                  loginOnly={authButtonLoginOnly}
                  showLogoutLabel={authButtonShowLogoutLabel}
                />
              </Suspense>
            )}

            <ThemeSwitcher key="theme-switcher" />
            <LanguageSwitcher key="language-switcher" />

            {showDeveloperButton && developerTitle && (
              <Suspense>
                <DeveloperButton developerTitle={developerTitle} locale={locale} />
              </Suspense>
            )}

            {showAdminButton && (
              <Suspense>
                <AdminButton adminTitle={adminTitle} locale={locale} />
              </Suspense>
            )}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-primary" {...mainProps}>
        {children}
      </main>
    </div>
  );
}
