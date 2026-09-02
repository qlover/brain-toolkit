'use client';

import { UserGroupIcon } from '@heroicons/react/24/outline';
import { ROUTE_ADMIN } from '@config/route';
import { headerIconButtonClass } from './headerChrome';
import { LocaleLink } from '../components/LocaleLink';
import { usePlatformAdmin } from '../hook/usePlatformAdmin';
import { useUserAuth } from '../hook/useUserAuth';

/**
 * Admin console entry affordance: local UI only.
 *
 * Shown only for platform admins. Page entry is middleware + PlatformAdminPlugin.
 */
export function AdminButton(props: { adminTitle: string; locale?: string }) {
  const { adminTitle, locale } = props;
  const { success, loading } = useUserAuth();
  const { platformAdmin } = usePlatformAdmin();

  if (loading || !success || !platformAdmin) return null;

  return (
    <LocaleLink
      data-testid="AdminButton"
      key="admin-button"
      href={ROUTE_ADMIN}
      title={adminTitle}
      locale={locale}
      className={headerIconButtonClass}
    >
      <UserGroupIcon className="h-5 w-5" />
    </LocaleLink>
  );
}
