'use client';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import {
  ROUTE_DEVELOPER_APPS,
  ROUTE_DOCS_CLI,
  ROUTE_DOCS_OAUTH,
  ROUTE_PROJECTS
} from '@config/route';
import {
  headerIconButtonClass,
  headerNavLinkActiveClass,
  headerNavLinkClass
} from './headerChrome';
import type { ReactNode } from 'react';

export interface AppHeaderNavTT {
  navProjects: string;
  navDocs: string;
  navCli: string;
  navAbout: string;
  navDeveloper: string;
}

type HeaderNavHref =
  | typeof ROUTE_PROJECTS
  | typeof ROUTE_DOCS_OAUTH
  | typeof ROUTE_DOCS_CLI
  | '/about'
  | typeof ROUTE_DEVELOPER_APPS;

const mobileNavLinkClassName =
  'block rounded-lg px-3 py-2.5 text-sm font-medium text-secondary-text transition-colors hover:bg-elevated hover:text-primary-text';

export interface AppHeaderNavLinkProps {
  href: HeaderNavHref;
  className: string;
  children: ReactNode;
  title: string;
}

interface AppHeaderNavPanelProps {
  pathname: string;
  tt: AppHeaderNavTT;
  NavLink: (props: AppHeaderNavLinkProps) => ReactNode;
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === ROUTE_PROJECTS) {
    return (
      pathname === ROUTE_PROJECTS || pathname.startsWith(`${ROUTE_PROJECTS}/`)
    );
  }
  if (href === '/about') {
    return pathname === '/about' || pathname.endsWith('/about');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeaderNavPanel({
  pathname,
  tt,
  NavLink
}: AppHeaderNavPanelProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links: { href: HeaderNavHref; label: string }[] = [
    { href: ROUTE_PROJECTS, label: tt.navProjects },
    { href: ROUTE_DOCS_OAUTH, label: tt.navDocs },
    { href: ROUTE_DOCS_CLI, label: tt.navCli },
    { href: '/about', label: tt.navAbout },
    { href: ROUTE_DEVELOPER_APPS, label: tt.navDeveloper }
  ];

  return (
    <>
      <nav
        data-testid="AppHeaderNav"
        className="ml-2 hidden min-w-0 items-center gap-0.5 md:flex lg:ml-4"
        aria-label="Main"
      >
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <NavLink
              key={link.href}
              href={link.href}
              className={clsx(
                headerNavLinkClass,
                active && headerNavLinkActiveClass
              )}
              title={link.label}
            >
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        data-testid="AppHeaderNavMenuToggle"
        className={clsx(headerIconButtonClass, 'ml-1 md:hidden')}
        aria-expanded={menuOpen}
        aria-controls="AppHeaderNavMobilePanel"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <Bars3Icon className="h-5 w-5" />
        )}
      </button>

      <div
        id="AppHeaderNavMobilePanel"
        data-testid="AppHeaderNavMobilePanel"
        className={clsx(
          'fixed inset-x-0 top-14 z-40 border-b border-primary-border bg-primary/95 shadow-sm backdrop-blur-md transition sm:top-16 md:hidden',
          menuOpen
            ? 'visible opacity-100'
            : 'pointer-events-none invisible opacity-0'
        )}
      >
        <nav
          className="mx-auto flex max-w-7xl flex-col gap-0.5 px-4 py-3"
          aria-label="Main mobile"
          onClick={closeMenu}
        >
          {links.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <NavLink
                key={link.href}
                href={link.href}
                className={clsx(
                  mobileNavLinkClassName,
                  active && 'bg-elevated text-primary-text'
                )}
                title={link.label}
              >
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}
