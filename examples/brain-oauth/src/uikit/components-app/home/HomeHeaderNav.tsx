'use client';

import { CloseOutlined, MenuOutlined } from '@ant-design/icons';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { API_REFERENCE } from '@config/apiRoutes';
import type { HomeI18nInterface } from '@config/i18n-mapping/HomeI18n';
import { headerActionButtonClassName } from '../headerStyles';

const navLinkClassName =
  'block py-2 text-sm font-medium text-secondary-text hover:text-primary-text transition';

interface HomeHeaderNavProps {
  tt: HomeI18nInterface;
}

export function HomeHeaderNav({ tt }: HomeHeaderNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        data-testid="HomeHeaderNav"
        className="hidden md:flex items-center gap-6 ml-6 lg:ml-8"
        aria-label="Home"
      >
        <a
          href={API_REFERENCE}
          className="text-secondary-text hover:text-primary-text transition text-sm font-medium"
          target="_blank"
          rel="noopener noreferrer"
        >
          {tt.navDocs}
        </a>
        <Link
          href="/about"
          className="text-secondary-text hover:text-primary-text transition text-sm font-medium"
        >
          {tt.navAbout}
        </Link>
      </nav>

      <button
        type="button"
        data-testid="HomeHeaderNavMenuToggle"
        className={clsx(
          headerActionButtonClassName,
          'md:hidden ml-2 shrink-0 px-2.5'
        )}
        aria-expanded={menuOpen}
        aria-controls="HomeHeaderNavMobilePanel"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <CloseOutlined className="text-base" /> : <MenuOutlined className="text-base" />}
      </button>

      <div
        id="HomeHeaderNavMobilePanel"
        data-testid="HomeHeaderNavMobilePanel"
        className={clsx(
          'md:hidden fixed left-0 right-0 top-16 z-40 border-b border-primary-border bg-primary/95 backdrop-blur-md shadow-sm',
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        )}
      >
        <nav
          className="max-w-7xl mx-auto px-4 py-3 flex flex-col"
          aria-label="Home mobile"
          onClick={closeMenu}
        >
          <a
            href={API_REFERENCE}
            className={navLinkClassName}
            target="_blank"
            rel="noopener noreferrer"
          >
            {tt.navDocs}
          </a>
          <Link href="/about" className={navLinkClassName}>
            {tt.navAbout}
          </Link>
        </nav>
      </div>
    </>
  );
}
