'use client';

import { buttonClassName, Dropdown } from '@qlover/next-kit/client';
import { useCallback, useMemo } from 'react';
import { LocaleLink } from '@/uikit/components/LocaleLink';
import {
  COMMON_ACCOUNT_CENTER,
  COMMON_ADMIN_TITLE,
  COMMON_LOGOUT_DIALOG_CONTENT,
  COMMON_LOGOUT_DIALOG_TITLE,
  COMMON_SIGNED_IN_AS,
  COMMON_USER_AUTH_FAILED_GO_TO_LOGIN
} from '@config/i18n-identifier/common/common';
import { I } from '@config/ioc-identifiter';
import { ROUTE_ACCOUNT, ROUTE_ADMIN, ROUTE_LOGIN } from '@config/route';
import { useI18nMapping } from '../hook/useI18nMapping';
import { useIOC } from '../hook/useIOC';
import { usePlatformAdmin } from '../hook/usePlatformAdmin';
import { useWarnTranslations } from '../hook/useWarnTranslations';

/**
 * Client-only auth UI: Sign in link, or avatar menu (display label + logout).
 */
const linkPrimary = buttonClassName({
  variant: 'header',
  className:
    'h-9 rounded-full bg-brand px-3.5 text-sm font-medium text-on-brand border-transparent hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-0'
});

function labelInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  const local = trimmed.includes('@')
    ? (trimmed.split('@')[0]?.trim() ?? trimmed)
    : trimmed;
  return (local[0] ?? '?').toUpperCase();
}

export function AuthButtonUI(props: {
  hasAuth: boolean;
  /** Preferred display label (display_name / phone / email). */
  displayLabel?: string;
  /**
   * True when the account has no business email yet.
   * Kept for call-site compatibility; soft bind hint lives on `/account`.
   */
  needsBindEmail?: boolean;
  /** @deprecated Sign-up is no longer offered; prop kept for call-site compatibility. */
  loginOnly?: boolean;
  /** @deprecated Logout lives in the user menu; prop kept for call-site compatibility. */
  showLogoutLabel?: boolean;
}) {
  const { hasAuth, displayLabel } = props;
  const t = useWarnTranslations();
  const { platformAdmin } = usePlatformAdmin();
  const dialogHandler = useIOC(I.DialogHandler);
  const userService = useIOC(I.UserServiceInterface);
  const routerService = useIOC(I.RouterServiceInterface);

  const logoutTt = useI18nMapping({
    title: COMMON_LOGOUT_DIALOG_TITLE,
    content: COMMON_LOGOUT_DIALOG_CONTENT
  });

  const userLabel = displayLabel?.trim() ?? '';
  const signedInLabel = t(COMMON_SIGNED_IN_AS);
  const accountLabel = t(COMMON_ACCOUNT_CENTER);

  const menuItems = useMemo(() => {
    const items: {
      key: string;
      label: string;
      danger?: boolean;
      disabled?: boolean;
      divider?: boolean;
    }[] = [];

    if (userLabel) {
      items.push({
        key: 'identity',
        label: userLabel,
        disabled: true
      });
    }

    items.push({
      key: 'account',
      label: accountLabel
    });

    if (platformAdmin) {
      items.push({
        key: 'admin',
        label: t(COMMON_ADMIN_TITLE)
      });
    }

    items.push({
      key: 'logout',
      label: logoutTt.title,
      danger: true,
      divider: true
    });

    return items;
  }, [accountLabel, logoutTt.title, platformAdmin, t, userLabel]);

  const onLogout = useCallback(() => {
    dialogHandler.confirm({
      title: logoutTt.title,
      content: logoutTt.content,
      onOk: async () => {
        await userService.logout();
        routerService.gotoLogin();
      }
    });
  }, [dialogHandler, logoutTt, userService, routerService]);

  const onMenuSelect = useCallback(
    (key: string) => {
      if (key === 'account') {
        routerService.goto(ROUTE_ACCOUNT);
        return;
      }
      if (key === 'admin') {
        routerService.goto(ROUTE_ADMIN);
        return;
      }
      if (key === 'logout') {
        onLogout();
      }
    },
    [onLogout, routerService]
  );

  if (hasAuth) {
    const triggerLabel = userLabel || signedInLabel;

    return (
      <div data-testid="AuthButton" data-auth={hasAuth}>
        <Dropdown
          data-testid="UserMenuDropdown"
          items={menuItems}
          placement="bottom-end"
          mobileMode="menu"
          onSelect={onMenuSelect}
        >
          <button
            type="button"
            data-testid="UserMenu"
            aria-label={`${signedInLabel}${userLabel ? ` ${userLabel}` : ''}`}
            title={userLabel || signedInLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand transition hover:bg-brand/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-0"
          >
            {labelInitial(triggerLabel)}
          </button>
        </Dropdown>
      </div>
    );
  }

  return (
    <div data-testid="AuthButton" data-auth={hasAuth}>
      <LocaleLink
        href={ROUTE_LOGIN}
        className={linkPrimary}
        title={t(COMMON_USER_AUTH_FAILED_GO_TO_LOGIN)}
      >
        {t(COMMON_USER_AUTH_FAILED_GO_TO_LOGIN)}
      </LocaleLink>
    </div>
  );
}
