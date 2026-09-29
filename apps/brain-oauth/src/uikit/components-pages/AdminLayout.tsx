'use client';

import { BrainIcon } from '@brain-toolkit/next-app-kit/client';
import {
  Bars3Icon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  Squares2X2Icon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { ClientSeo } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import type { NavItemInterface } from '@config/adminNavs';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LocaleLink } from '../components/LocaleLink';
import { ThemeSwitcher } from '../components-app/ThemeSwitcher';
import { useUserAuth } from '../hook/useUserAuth';
import { useWarnTranslations } from '../hook/useWarnTranslations';
import type { PageI18nInterface } from '@qlover/next-kit/common';
import type { ComponentType, SVGProps } from 'react';

const NAV_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  dashboard: HomeIcon,
  users: UsersIcon,
  'request-logs': ClipboardDocumentListIcon,
  settings: Cog6ToothIcon
};

export interface AdminLayoutTT {
  title: string;
}

export interface AdminLayoutProps {
  children: React.ReactNode;
  /** Sidebar navigation items */
  navItems: NavItemInterface[];
  /** Whether sidebar is collapsed (controlled) */
  collapsedSidebar?: boolean;
  /** Called when sidebar toggle is clicked (optional; uses internal state if not provided) */
  onToggleSidebar?: () => void;
  /** Header title and i18n */
  seoMetadata: PageI18nInterface;
  /** Extra class for the root container */
  className?: string;
}

/**
 * Admin layout with header, collapsible sidebar and main content.
 * Follows existing theme: bg-primary, bg-secondary, border-c-border, text-primary-text.
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
  const { user } = useUserAuth();
  const isAdmin = isBrainAdminUser(user);
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.adminOnly || isAdmin),
    [navItems, isAdmin]
  );

  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = isControlled ? controlledCollapsed : internalCollapsed;
  const handleToggle = useCallback(() => {
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  }, [onToggleSidebar]);

  const sidebarWidth = collapsed ? 64 : 208;
  const linkHref = (item: NavItemInterface) => item.pathname ?? '#';

  const isActive = useCallback(
    (item: NavItemInterface) => {
      if (!item.pathname) return false;
      const path = String(pathname ?? '');
      const withLocale = `/${locale}${item.pathname}`;
      if (item.pathname === '/admin') {
        return (
          path === withLocale || path === '/admin' || path.endsWith('/admin')
        );
      }
      return path === withLocale || path.startsWith(withLocale + '/');
    },
    [pathname, locale]
  );

  return (
    <div
      data-testid="AdminLayout"
      className={clsx('flex flex-col min-h-screen bg-primary', className)}
    >
      <ClientSeo i18nInterface={seoMetadata} />
      <header
        data-testid="AdminLayoutHeader"
        className="h-14 bg-secondary border-b border-c-border sticky top-0 z-50 shrink-0"
      >
        <div className="flex items-center justify-between h-full px-4 mx-auto max-w-[1920px]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={handleToggle}
              className="text-primary-text hover:text-primary-text-hover p-1.5 rounded transition-colors"
            >
              {collapsed ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
            <LocaleLink
              href="/admin"
              locale={locale}
              title={seoMetadata.title}
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition-opacity"
            >
              <BrainIcon
                data-testid="AdminLayoutBrainIcon"
                className="h-6 w-auto shrink-0 text-primary-text"
              />
              <span
                data-testid="admin-header-title"
                className="text-lg font-semibold text-primary-text truncate"
              >
                {seoMetadata.title}
              </span>
            </LocaleLink>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          data-testid="AdminLayoutSidebar"
          className="shrink-0 bg-secondary border-r border-c-border transition-[width] duration-200 ease-in-out flex flex-col"
          style={{ width: sidebarWidth }}
        >
          <nav className="flex flex-col py-2 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const active = isActive(item);
              const href = linkHref(item);
              const label = t(item.i18nKey);
              const Icon = NAV_ICONS[item.key] ?? Squares2X2Icon;
              return (
                <LocaleLink
                  key={item.key}
                  href={href}
                  locale={locale}
                  title={label}
                  className={clsx(
                    'mx-2 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'text-primary-text hover:text-primary-text-hover hover:bg-elevated',
                    collapsed && 'justify-center',
                    active && 'bg-elevated text-primary-text-hover'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  {collapsed ? (
                    <span className="sr-only">{label}</span>
                  ) : (
                    <span className="truncate">{label}</span>
                  )}
                </LocaleLink>
              );
            })}
          </nav>
        </aside>

        <main
          data-testid="AdminLayoutMain"
          className="flex-1 flex flex-col min-w-0 overflow-auto bg-primary text-primary-text p-2"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
