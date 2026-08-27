'use client';

import { clsx } from 'clsx';
import { useLocale } from 'next-intl';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleLink } from '../components/LocaleLink';
import { PAMLogo } from '../components/PAMLogo';
import type { AppRoutePageTT } from './AppRoutePage';
import type { HTMLAttributes, ReactNode } from 'react';

export interface RoutePageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  tt: AppRoutePageTT;
  headerHref?: string;
  headerClassName?: string;
  headerNav?: ReactNode;
  showHeaderLogo?: boolean;
  headerTitleClassName?: string;
  mainProps?: HTMLAttributes<HTMLElement>;
  /** Rendered before header (`AppBridge` / `AppBridgePages`). */
  topSlot?: ReactNode;
  authSlot?: ReactNode;
  languageSlot: ReactNode;
  trailingSlot?: ReactNode;
}

/**
 * Shared header + main shell without App Router navigation dependencies.
 */
export function RoutePageLayout({
  children,
  tt,
  headerHref = '/',
  headerClassName,
  headerNav,
  showHeaderLogo = true,
  headerTitleClassName,
  mainProps,
  topSlot,
  authSlot,
  languageSlot,
  trailingSlot,
  ...props
}: RoutePageLayoutProps) {
  const locale = useLocale();
  const headerSubtitle = tt.headerSubtitle;
  const showHeaderLeading =
    showHeaderLogo || headerNav != null || !!headerSubtitle;

  return (
    <div
      data-testid="AppRoutePage"
      className="flex min-h-screen flex-col"
      {...props}
    >
      {topSlot}
      <header
        data-testid="BaseHeader"
        className="sticky top-0 z-50 border-b border-primary-border/80 bg-primary/90 backdrop-blur-lg"
      >
        <div
          className={clsx(
            'mx-auto flex h-14 max-w-7xl min-w-0 items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8',
            showHeaderLeading ? 'justify-between' : 'justify-end',
            headerClassName
          )}
        >
          {showHeaderLeading && (
            <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              {showHeaderLogo && (
                <LocaleLink
                  data-testid="BaseHeaderLogo"
                  title={tt.title}
                  href={headerHref}
                  locale={locale}
                  className="group flex min-w-0 shrink-0 items-center gap-2 text-brand transition-opacity hover:opacity-80"
                >
                  <PAMLogo className="text-[1.75rem] sm:text-[2rem]" />
                  <span
                    data-testid="base-header-app-name"
                    className={clsx(
                      'hidden truncate text-sm font-semibold tracking-tight sm:inline sm:text-base',
                      headerTitleClassName ?? 'text-primary-text'
                    )}
                  >
                    {tt.title}
                  </span>
                </LocaleLink>
              )}

              {headerSubtitle ? (
                <span className="text-tertiary-text hidden shrink-0 font-mono text-[11px] lg:inline">
                  {headerSubtitle}
                </span>
              ) : null}

              {headerNav}
            </div>
          )}

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {trailingSlot}
            <ThemeSwitcher key="theme-switcher" />
            {languageSlot}
            {authSlot ? (
              <div className="ml-1 flex items-center border-l border-primary-border/70 pl-1.5 sm:ml-1.5 sm:pl-2">
                {authSlot}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col bg-primary" {...mainProps}>
        {children}
      </main>
    </div>
  );
}
