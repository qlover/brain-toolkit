'use client';

import {
  AdminRolesPanel as KitAdminRolesPanel,
  type AdminRolesPanelSection
} from '@brain-toolkit/next-app-kit/client';
import { useCallback, useMemo } from 'react';
import { AdminRolesApi } from '@/impls/appApi/AdminRolesApi';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { useIOC } from '@/uikit/hook/useIOC';
import { useWarnTranslations } from '@/uikit/hook/useWarnTranslations';
import {
  isPlatformPermissionKey,
  permissionI18nKey
} from '@shared/auth/permissionKeys';
import { PlatformRoleKey, RoleKind, TeamRoleKey } from '@shared/auth/roleKeys';
import type { AdminRolesI18nInterface } from '@config/i18n-mapping/admin18n';
import type {
  AdminPermissionItem,
  AdminRoleItem
} from '@brain-toolkit/next-app-kit/shared';

const PLATFORM_ORDER = [
  PlatformRoleKey.User,
  PlatformRoleKey.Operator,
  PlatformRoleKey.Admin
] as const;

const TEAM_ORDER = [
  TeamRoleKey.Owner,
  TeamRoleKey.Admin,
  TeamRoleKey.Member
] as const;

export function AdminRolesPanel({ tt }: { tt: AdminRolesI18nInterface }) {
  const adminRolesApi = useIOC(AdminRolesApi);
  const t = useWarnTranslations();

  const sections = useMemo<AdminRolesPanelSection[]>(
    () => [
      {
        kind: RoleKind.Platform,
        title: tt.sectionSystem,
        hint: tt.hintPlatform,
        order: PLATFORM_ORDER,
        filterCatalog: (item) => isPlatformPermissionKey(item.permissionKey)
      },
      {
        kind: RoleKind.Team,
        title: tt.sectionOrg,
        hint: tt.hintTeam,
        order: TEAM_ORDER,
        filterCatalog: (item) => !isPlatformPermissionKey(item.permissionKey)
      }
    ],
    [tt.hintPlatform, tt.hintTeam, tt.sectionOrg, tt.sectionSystem]
  );

  const roleLabel = useCallback(
    (role: AdminRoleItem) => {
      switch (role.key) {
        case PlatformRoleKey.User:
          return tt.systemUser;
        case PlatformRoleKey.Operator:
          return tt.systemOperator;
        case PlatformRoleKey.Admin:
          return tt.systemAdmin;
        case TeamRoleKey.Member:
          return tt.orgMember;
        case TeamRoleKey.Admin:
          return tt.orgAdmin;
        case TeamRoleKey.Owner:
          return tt.orgOwner;
        default:
          return role.name || role.key;
      }
    },
    [
      tt.orgAdmin,
      tt.orgMember,
      tt.orgOwner,
      tt.systemAdmin,
      tt.systemOperator,
      tt.systemUser
    ]
  );

  const permissionLabel = useCallback(
    (item: AdminPermissionItem) => {
      const key = permissionI18nKey(item.permissionKey);
      const translated = t(key);
      return translated === key ? item.permissionKey : translated;
    },
    [t]
  );

  return (
    <KitAdminRolesPanel
      api={adminRolesApi}
      tt={tt}
      sections={sections}
      roleLabel={roleLabel}
      permissionLabel={permissionLabel}
      defaultRoleKey={PlatformRoleKey.Admin}
      renderLoading={() => <AdminPanelLoading testId="AdminRolesLoading" />}
    />
  );
}
