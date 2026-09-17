'use client';

import {
  asyncErrorMessage,
  runAsyncStore,
  useAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useState } from 'react';
import { AdminUsersApi } from '@/impls/appApi/AdminUsersApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { PermissionKey, useCan } from '@/uikit/hook/useHasPermission';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import { SystemRole, type SystemRoleType } from '@shared/auth/systemRole';
import { resolveUserDisplayLabel } from '@shared/utils/pamUserIdentity';
import type { AdminUsersI18nInterface } from '@config/i18n-mapping/admin18n';
import type { PamAdminUserListItem } from '@schemas/PamUserSchema';

const SYSTEM_ROLES: SystemRoleType[] = [
  SystemRole.User,
  SystemRole.Operator,
  SystemRole.Admin
];

type RoleMutationState = AsyncState<true> & {
  targetId: string | null;
};

export function AdminUsersPanel({ tt }: { tt: AdminUsersI18nInterface }) {
  const adminUsersApi = useIOC(AdminUsersApi);
  const { user } = useUserAuth();
  const currentUserId = user?.id;
  const { allowed: canChangeRole } = useCan(
    PermissionKey.admin_users_system_role
  );
  const [query, setQuery] = useState('');

  const [list, listStore] =
    usePendingAsyncStore<AsyncState<PamAdminUserListItem[]>>();
  const [role, roleStore] = useAsyncStore<RoleMutationState>({
    targetId: null
  });
  const rows = list.result ?? [];
  const loading = list.loading;
  const pendingId = role.targetId;
  const error = asyncErrorMessage(list.error) ?? asyncErrorMessage(role.error);

  const roleLabel = useCallback(
    (role: SystemRoleType) => {
      if (role === SystemRole.Admin) return tt.systemRoleAdmin;
      if (role === SystemRole.Operator) return tt.systemRoleOperator;
      return tt.systemRoleUser;
    },
    [tt.systemRoleAdmin, tt.systemRoleOperator, tt.systemRoleUser]
  );

  const load = useCallback(async () => {
    await runAsyncStore(
      listStore,
      adminUsersApi.search({
        q: query.trim() || undefined
      }),
      {
        keep: true,
        mapError: () => tt.description
      }
    );
  }, [adminUsersApi, listStore, query, tt.description]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = useCallback(
    async (row: PamAdminUserListItem, systemRole: SystemRoleType) => {
      if (
        !canChangeRole ||
        row.id === currentUserId ||
        row.systemRole === systemRole
      ) {
        return;
      }
      roleStore.emit({ targetId: row.id });
      try {
        const ok = await runAsyncStore(
          roleStore,
          adminUsersApi
            .setSystemRole(row.id, systemRole)
            .then(() => true as const),
          { mapError: () => tt.description }
        );
        if (ok === undefined) {
          return;
        }
        const current = listStore.getResult() ?? [];
        listStore.success(
          current.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  systemRole,
                  isPlatformAdmin: systemRole === SystemRole.Admin
                }
              : item
          )
        );
      } finally {
        roleStore.emit({ targetId: null });
      }
    },
    [
      adminUsersApi,
      canChangeRole,
      currentUserId,
      listStore,
      roleStore,
      tt.description
    ]
  );

  const columns: TableColumn<PamAdminUserListItem>[] = [
    {
      title: tt.emailLabel,
      key: 'identity',
      render: (_, row) => {
        const label = resolveUserDisplayLabel({
          displayName: row.displayName,
          phone: row.phone,
          email: row.email,
          userId: row.id
        });
        if (row.id !== currentUserId) {
          return label;
        }
        return (
          <span
            data-testid="columns"
            className="inline-flex flex-wrap items-center gap-1.5"
          >
            <span>{label}</span>
            <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">
              {tt.you}
            </span>
          </span>
        );
      }
    },
    {
      title: tt.systemRoleLabel,
      key: 'systemRole',
      width: 180,
      render: (_, row) => {
        const isSelf = row.id === currentUserId;
        if (!canChangeRole || isSelf) {
          return (
            <span
              className="text-sm text-secondary-text"
              title={isSelf ? tt.cannotChangeSelf : tt.roleChangeForbidden}
              data-testid={
                isSelf ? 'AdminUsersSelfRoleReadonly' : 'AdminUsersRoleReadonly'
              }
            >
              {roleLabel(row.systemRole)}
            </span>
          );
        }

        return (
          <select
            data-testid="AdminUsersSystemRoleSelect"
            data-permission={PermissionKey.admin_users_system_role}
            value={row.systemRole}
            disabled={pendingId === row.id}
            onChange={(event) =>
              void handleRoleChange(row, event.target.value as SystemRoleType)
            }
            className="w-full rounded-lg border border-primary-border bg-surface px-2 py-1.5 text-sm text-primary-text disabled:opacity-50"
            aria-label={tt.systemRoleLabel}
          >
            {SYSTEM_ROLES.map((role) => (
              <option data-testid="columns" key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        );
      }
    }
  ];

  return (
    <div data-testid="AdminUsersPanel" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={tt.searchPlaceholder}
          className="w-full rounded-lg border border-primary-border bg-surface px-3 py-2 text-sm text-primary-text sm:max-w-md"
        />
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg border border-primary-border px-4 py-2 text-sm font-medium text-primary-text hover:bg-elevated disabled:opacity-50"
        >
          {tt.searchButton}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-(--fe-color-error)">{error}</p>
      ) : null}

      {loading && rows.length === 0 ? (
        <AdminPanelLoading testId="AdminUsersLoading" />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          emptyText={tt.empty}
        />
      )}
    </div>
  );
}
