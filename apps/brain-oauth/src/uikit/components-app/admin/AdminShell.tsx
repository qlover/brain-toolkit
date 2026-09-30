'use client';

import {
  Cog6ToothIcon,
  ListBulletIcon,
  Squares2X2Icon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { ClientSeo } from '@qlover/next-kit/client';
import { BrainFooter } from '@/uikit/components/brain/BrainFooter';
import { BrainHeaderNav } from '@/uikit/components/brain/BrainHeaderNav';
import { BrainScene } from '@/uikit/components/brain/BrainScene';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import { AppRoutePagePages } from '@/uikit/components-app/AppRoutePagePages';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { adminShellI18n } from '@config/i18n-mapping/admin18n';
import {
  ROUTE_ADMIN,
  ROUTE_ADMIN_SETTINGS,
  ROUTE_ADMIN_USERS,
  ROUTE_DEVELOPER_APPS,
  ROUTE_DOCS_OAUTH,
  ROUTE_REQUEST_LOGS
} from '@config/route';
import type { PageI18nInterface } from '@qlover/next-kit/common';
import type { ComponentType, ReactNode, SVGProps } from 'react';

export type AdminNavKey = 'overview' | 'users' | 'logs' | 'settings';

interface AdminNavItem {
  key: AdminNavKey;
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
}

export interface AdminShellProps {
  active: AdminNavKey;
  seo: PageI18nInterface;
  /** Page content is replaced by a "no access" card for non-admins. */
  adminOnly?: boolean;
  children: ReactNode;
}

/**
 * Brain header + side nav frame shared by every admin page.
 */
export function AdminShell({
  active,
  seo,
  adminOnly,
  children
}: AdminShellProps) {
  const tt = useI18nMapping(adminShellI18n);
  const { user, loading } = useUserAuth();
  const isAdmin = isBrainAdminUser(user);

  const items: AdminNavItem[] = [
    {
      key: 'overview',
      href: ROUTE_ADMIN,
      label: tt.navOverview,
      icon: Squares2X2Icon
    },
    {
      key: 'users',
      href: ROUTE_ADMIN_USERS,
      label: tt.navUsers,
      icon: UsersIcon,
      adminOnly: true
    },
    {
      key: 'logs',
      href: ROUTE_REQUEST_LOGS,
      label: tt.navLogs,
      icon: ListBulletIcon
    },
    {
      key: 'settings',
      href: ROUTE_ADMIN_SETTINGS,
      label: tt.navSettings,
      icon: Cog6ToothIcon,
      adminOnly: true
    }
  ];

  let content = children;
  if (adminOnly && loading) {
    content = (
      <div className="brain-empty" aria-busy>
        <span className="brain-spinner" aria-hidden />
      </div>
    );
  } else if (adminOnly && !isAdmin) {
    content = (
      <div data-testid="AdminForbidden" className="brain-card flat brain-empty">
        <div className="brain-empty-sphere" aria-hidden />
        <p>{tt.forbidden}</p>
      </div>
    );
  }

  return (
    <AppRoutePagePages
      tt={{
        title: tt.appName,
        adminTitle: tt.adminTitle,
        headerSubtitle: tt.adminTitle
      }}
      headerVariant="brain"
      headerNav={
        <BrainHeaderNav
          items={[
            { href: ROUTE_DEVELOPER_APPS, label: tt.navConsole },
            { href: ROUTE_DOCS_OAUTH, label: tt.navDocs }
          ]}
        />
      }
      showAdminButton={false}
      showAuthButton
      authShowLogout
    >
      <ClientSeo i18nInterface={seo} />
      <BrainScene quiet />
      <main data-testid="AdminShell" className="brain-admin">
        <aside className="brain-side">
          <span className="brain-label">{tt.menu}</span>
          <nav className="brain-side-nav">
            {items
              .filter((item) => !item.adminOnly || isAdmin)
              .map(({ key, href, label, icon: Icon, adminOnly: tagged }) => (
                <LocaleLink
                  key={key}
                  href={href}
                  title={label}
                  aria-current={key === active ? 'page' : undefined}
                >
                  <Icon aria-hidden />
                  <span>{label}</span>
                  {tagged && (
                    <span className="brain-pill sm soft">{tt.adminTag}</span>
                  )}
                </LocaleLink>
              ))}
          </nav>
        </aside>
        <div className="min-w-0">{content}</div>
      </main>
      <BrainFooter />
    </AppRoutePagePages>
  );
}
