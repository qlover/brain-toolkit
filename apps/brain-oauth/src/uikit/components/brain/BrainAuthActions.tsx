'use client';

import { useI18nMapping } from '@/uikit/hook/useI18nMapping';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { isBrainAdminUser } from '@shared/auth/brainAdmin';
import { headerNavI18n } from '@config/i18n-mapping/headerNavI18n';
import { ROUTE_ADMIN, ROUTE_DEVELOPER_APPS, ROUTE_LOGIN } from '@config/route';
import { BrainAvatar } from './BrainAvatar';
import { LogoutButton } from '../../components-app/LogoutButton';
import { LocaleLink } from '../LocaleLink';

export interface BrainAuthActionsProps {
  /** Console pill next to the avatar (home). */
  showConsole?: boolean;
  /** Round logout button after the avatar (console). */
  showLogout?: boolean;
  /** Admin backend pill for Brain admins (default true; off inside admin). */
  showAdmin?: boolean;
}

/** Brain header auth area: sign-in pill for guests, avatar for signed-in users. */
export function BrainAuthActions({
  showConsole,
  showLogout,
  showAdmin = true
}: BrainAuthActionsProps) {
  const tt = useI18nMapping(headerNavI18n);
  const { success, loading, user } = useUserAuth();

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

  const displayName = user?.name || user?.email || user?.phone;

  return (
    <div data-testid="BrainAuthActions" className="flex items-center gap-2.5">
      {showAdmin && isBrainAdminUser(user) && (
        <LocaleLink
          data-testid="BrainAuthAdmin"
          href={ROUTE_ADMIN}
          title={tt.admin}
          className="brain-btn sm auto brain-hide-mobile"
        >
          {tt.admin}
        </LocaleLink>
      )}
      {showConsole && (
        <LocaleLink
          href={ROUTE_DEVELOPER_APPS}
          title={tt.console}
          className="brain-btn sm auto brain-hide-mobile"
        >
          {tt.console}
        </LocaleLink>
      )}
      <span title={displayName}>
        <BrainAvatar name={displayName} />
      </span>
      {showLogout && <LogoutButton showLabel />}
    </div>
  );
}
