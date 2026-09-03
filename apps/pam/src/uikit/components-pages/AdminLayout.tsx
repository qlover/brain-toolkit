'use client';

import {
  Bars3Icon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ClientSeo } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import type { NavItemInterface } from '@config/adminNavs';
import { ROUTE_ADMIN } from '@config/route';
import { AdminUserPanel } from './AdminUserPanel';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocaleLink } from '../components/LocaleLink';
import { ThemeSwitcher } from '../components-app/ThemeSwitcher';
import { useWarnTranslations } from '../hook/useWarnTranslations';
import type { PageI18nInterface } from '@qlover/next-kit/common';
import type { ComponentType, SVGProps } from 'react';

export interface AdminLayoutTT {
  title: string;
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  /** Sidebar navigation items */
  navItems: NavItemInterface[];
  /** Whether sidebar is collapsed (controlled, desktop only) */
  collapsedSidebar?: boolean;
  /** Called when sidebar toggle is clicked (optional; uses internal state if not provided) */
  onToggleSidebar?: () => void;
  /** Header title and i18n */
  seoMetadata: PageI18nInterface;
  /** Extra class for the root container */
  className?: string;
}

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

const NAV_ICONS: Record<string, NavIcon> = {
  dashboard: ChartBarSquareIcon,
  users: UsersIcon,
  'phone-otps': DevicePhoneMobileIcon,
  'request-logs': DocumentTextIcon,
  settings: Cog6ToothIcon
};

function isDesktopViewport(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 1024px)').matches
  );
}

/**
 * Admin layout: mobile drawer nav + desktop collapsible sidebar.
 */
export function AdminLayout({
  children,
  navItems,
  collapsedSidebar: controlledCollapsed,
  onToggleSidebar,
  seoMetadata,
  className
}: AdminLayoutProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useWarnTranslations();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = controlledCollapsed !== undefined;
  const desktopCollapsed = isControlled
    ? controlledCollapsed
    : internalCollapsed;

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  const handleToggle = useCallback(() => {
    if (isDesktopViewport()) {
      if (onToggleSidebar) {
        onToggleSidebar();
      } else {
        setInternalCollapsed((prev) => !prev);
      }
      return;
    }

    setMobileNavOpen((prev) => !prev);
  }, [onToggleSidebar]);

  const linkHref = (item: NavItemInterface) => item.pathname ?? '#';

  const isActive = useCallback(
    (item: NavItemInterface) => {
      if (!item.pathname) return false;
      const path = String(pathname ?? '');
      const withLocale = `/${locale}${item.pathname}`;
      if (item.pathname === ROUTE_ADMIN) {
        return (
          path === withLocale || path === '/admin' || path.endsWith('/admin')
        );
      }
      return path === withLocale || path.startsWith(withLocale + '/');
    },
    [pathname, locale]
  );

  const showSidebarLabels = !desktopCollapsed;

  return (
    <div
      data-testid="AdminLayout"
      className={clsx('flex min-h-screen flex-col bg-primary', className)}
    >
      <ClientSeo i18nInterface={seoMetadata} />
      <header
        data-testid="AdminLayoutHeader"
        className="sticky top-0 z-50 shrink-0 border-b border-primary-border bg-secondary/90 backdrop-blur-md"
      >
        <div className="flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <button
              type="button"
              aria-label={
                mobileNavOpen
                  ? 'Close navigation'
                  : desktopCollapsed
                    ? 'Expand sidebar'
                    : 'Open navigation'
              }
              aria-expanded={mobileNavOpen}
              onClick={handleToggle}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-secondary-text transition-colors hover:bg-elevated hover:text-primary-text touch-manipulation"
            >
              {mobileNavOpen ? (
                <XMarkIcon className="h-5 w-5 lg:hidden" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
            <LocaleLink
              href={ROUTE_ADMIN}
              locale={locale}
              title="PAM Admin"
              className="inline-flex min-w-0 items-baseline gap-1.5 truncate"
            >
              <span className="text-base font-semibold text-brand">PAM</span>
              <span className="text-sm font-medium text-secondary-text">
                Admin
              </span>
            </LocaleLink>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 top-14 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 flex-1">
        <aside
          data-testid="AdminLayoutSidebar"
          className={clsx(
            'fixed top-14 bottom-0 left-0 z-40 flex min-h-0 w-64 flex-col overflow-hidden border-r border-primary-border bg-secondary shadow-xl transition-transform duration-200 ease-in-out',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:sticky lg:top-14 lg:z-auto lg:h-[calc(100vh-3.5rem)] lg:w-60 lg:translate-x-0 lg:self-start lg:shadow-none lg:transition-[width]',
            desktopCollapsed && 'lg:w-[72px]'
          )}
        >
          <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-2">
            {navItems.map((item) => {
              const active = isActive(item);
              const href = linkHref(item);
              const label = t(item.i18nKey);
              const Icon = NAV_ICONS[item.key];

              return (
                <LocaleLink
                  key={item.key}
                  href={href}
                  locale={locale}
                  title={label}
                  onClick={() => setMobileNavOpen(false)}
                  className={clsx(
                    'group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors touch-manipulation',
                    'border-transparent text-secondary-text hover:bg-elevated hover:text-primary-text',
                    active && 'border-brand bg-brand/10 text-brand',
                    !showSidebarLabels && 'lg:justify-center lg:px-2'
                  )}
                >
                  {Icon ? (
                    <Icon
                      className={clsx(
                        'h-5 w-5 shrink-0',
                        active
                          ? 'text-brand'
                          : 'text-tertiary-text group-hover:text-primary-text'
                      )}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={clsx(
                      'truncate',
                      !showSidebarLabels && 'lg:hidden'
                    )}
                  >
                    {label}
                  </span>
                </LocaleLink>
              );
            })}
          </nav>
          <div className="mt-auto shrink-0 border-t border-primary-border bg-secondary">
            <AdminUserPanel collapsed={desktopCollapsed} />
          </div>
        </aside>

        <main
          data-testid="AdminLayoutMain"
          className="min-w-0 flex-1 overflow-auto bg-elevated/15"
        >
          <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-5 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
