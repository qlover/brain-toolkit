'use client';

import { AdminPermissionsPanel as KitAdminPermissionsPanel } from '@brain-toolkit/next-app-kit/client';
import { useCallback } from 'react';
import { AdminPermissionsApi } from '@/impls/appApi/AdminPermissionsApi';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { useCan, PermissionKey } from '@/uikit/hook/useHasPermission';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import { permissionI18nKey } from '@shared/auth/permissionKeys';
import type { AdminPermissionsI18nInterface } from '@config/i18n-mapping/admin18n';
import type { AdminPermissionItem } from '@brain-toolkit/next-app-kit/shared';

/**
 * Super-admin permission catalog: list / create / update pam_role_permissions.
 */
export function AdminPermissionsPanel({
  tt
}: {
  tt: AdminPermissionsI18nInterface;
}) {
  const api = useIOC(AdminPermissionsApi);
  const t = useWarnTranslations();
  const { allowed: canRead, loading: authLoading } = useCan(
    PermissionKey.admin_permissions_read
  );
  const { allowed: canWrite } = useCan(PermissionKey.admin_permissions_write);

  const permissionLabel = useCallback(
    (item: AdminPermissionItem) => {
      const key = permissionI18nKey(item.permissionKey);
      const translated = t(key);
      return translated === key ? item.permissionKey : translated;
    },
    [t]
  );

  return (
    <KitAdminPermissionsPanel
      api={api}
      tt={tt}
      canRead={canRead}
      canWrite={canWrite}
      authLoading={authLoading}
      writePermissionKey={PermissionKey.admin_permissions_write}
      permissionLabel={permissionLabel}
      renderLoading={() => (
        <AdminPanelLoading testId="AdminPermissionsLoading" />
      )}
    />
  );
}
