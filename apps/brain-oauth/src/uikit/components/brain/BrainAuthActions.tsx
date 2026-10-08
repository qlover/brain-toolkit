'use client';

import { Dropdown, type DropdownItem } from '@qlover/next-kit/client';
import { useCallback, useMemo } from 'react';
import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { brainEnvOfUser } from '@config/brainApi';
import { headerNavI18n } from '@config/i18n-mapping/headerNavI18n';
import { I } from '@config/ioc-identifiter';
import { ROUTE_ADMIN, ROUTE_DEVELOPER_APPS, ROUTE_LOGIN } from '@config/route';
import { BrainAvatar } from './BrainAvatar';
import {
  LogoutButton,
  useLogoutConfirm
} from '../../components-app/LogoutButton';
import { LocaleLink } from '../LocaleLink';

export interface BrainAuthActionsProps {
  /** Console pill next to the avatar (home). */
  showConsole?: boolean;
  /** Round logout button after the avatar (console). */
  showLogout?: boolean;
  /** Admin backend item in the avatar menu for Brain admins (default true; off inside admin). */
  showAdmin?: boolean;
}

const MENU_ACCOUNT = 'account';
const MENU_ADMIN = 'admin';
const MENU_LOGOUT = 'logout';

/** Brain header auth area: sign-in pill for guests, avatar menu for signed-in users. */
export function BrainAuthActions({
  showConsole,
  showLogout,
  showAdmin = true
}: BrainAuthActionsProps) {
  const tt = useI18nMapping(headerNavI18n);
  const { success, loading, user } = useUserAuth();
  const routerService = useIOC(I.RouterServiceInterface);
  const logout = useLogoutConfirm();

  const displayName = user?.name || user?.email || user?.phone;
  const contact = user?.email || user?.phone;
  const canAdmin = showAdmin && isBrainAdminUser(user);
  const loginEnv = brainEnvOfUser(user);

  const items = useMemo<DropdownItem[]>(
    () => [
      {
        key: MENU_ACCOUNT,
        disabled: true,
        label: (
          <span className="flex flex-col">
            <span className="text-primary-text font-medium">{displayName}</span>
            {contact && contact !== displayName && (
              <small className="text-secondary-text">{contact}</small>
            )}
            {loginEnv && (
              <small className="text-secondary-text">
                {tt.loginEnv}：{loginEnv}
              </small>
            )}
          </span>
        )
      },
      ...(canAdmin ? [{ key: MENU_ADMIN, label: tt.admin }] : []),
      { key: MENU_LOGOUT, label: logout.title }
    ],
    [
      displayName,
      contact,
      loginEnv,
      canAdmin,
      tt.loginEnv,
      tt.admin,
      logout.title
    ]
  );

  const onSelect = useCallback(
    (key: string) => {
      if (key === MENU_ADMIN) {
        routerService.goto(ROUTE_ADMIN);
      } else if (key === MENU_LOGOUT) {
        logout.confirm();
      }
    },
    [routerService, logout]
  );

  if (loading) {
    return (
      <span
        data-testid="BrainAuthActions"
        className="brain-avatar sm opacity-0"
        aria-hidden
      />
    );
  }

  if (!success) {
    return (
      <LocaleLink
        data-testid="BrainAuthLogin"
        href={ROUTE_LOGIN}
        title={tt.login}
        className="brain-btn sm auto"
      >
        {tt.login}
      </LocaleLink>
    );
  }

  return (
    <div data-testid="BrainAuthActions" className="flex items-center gap-2.5">
      {showConsole && (
        <LocaleLink
          href={ROUTE_DEVELOPER_APPS}
          title={tt.console}
          className="brain-btn sm auto brain-hide-mobile"
        >
          {tt.console}
        </LocaleLink>
      )}
      {loginEnv && (
        <span
          data-testid="BrainAuthLoginEnv"
          title={`${tt.loginEnv}：${loginEnv}`}
          className="brain-pill sm purple brain-hide-mobile"
        >
          {loginEnv}
        </span>
      )}
      <Dropdown
        data-testid="BrainAuthMenu"
        items={items}
        placement="bottom-end"
        mobileMode="menu"
        menuMinWidth={200}
        onSelect={onSelect}
      >
        <button
          type="button"
          title={displayName}
          aria-label={displayName}
          aria-haspopup="menu"
          className="cursor-pointer rounded-full"
        >
          <BrainAvatar name={displayName} />
        </button>
      </Dropdown>
      {showLogout && <LogoutButton showLabel />}
    </div>
  );
}
