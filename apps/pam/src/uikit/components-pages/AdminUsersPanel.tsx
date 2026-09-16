'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useState } from 'react';
import { AdminUsersApi } from '@/impls/appApi/AdminUsersApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { useIOC } from '@/uikit/hook/useIOC';
import { SystemRole, type SystemRoleType } from '@shared/auth/systemRole';
import { resolveUserDisplayLabel } from '@shared/utils/pamUserIdentity';
import type { AdminUsersI18nInterface } from '@config/i18n-mapping/admin18n';
import type { PamAdminUserListItem } from '@schemas/PamUserSchema';

const SYSTEM_ROLES: SystemRoleType[] = [
  SystemRole.User,
  SystemRole.Operator,
  SystemRole.Admin
];

export function AdminUsersPanel({ tt }: { tt: AdminUsersI18nInterface }) {
  const adminUsersApi = useIOC(AdminUsersApi);
  const [rows, setRows] = useState<PamAdminUserListItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleLabel = useCallback(
    (role: SystemRoleType) => {
      if (role === SystemRole.Admin) return tt.systemRoleAdmin;
      if (role === SystemRole.Operator) return tt.systemRoleOperator;
      return tt.systemRoleUser;
    },
    [tt.systemRoleAdmin, tt.systemRoleOperator, tt.systemRoleUser]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await adminUsersApi.search({
        q: query.trim() || undefined
      });
      setRows(items);
    } catch {
      setError(tt.description);
    } finally {
      setLoading(false);
    }
  }, [adminUsersApi, query, tt.description]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = useCallback(
    async (row: PamAdminUserListItem, systemRole: SystemRoleType) => {
      if (row.systemRole === systemRole) {
        return;
      }
      setPendingId(row.id);
      setError(null);
      try {
        await adminUsersApi.setSystemRole(row.id, systemRole);
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? {
                  ...item,
                  systemRole,
                  isPlatformAdmin: systemRole === SystemRole.Admin
                }
              : item
          )
        );
      } catch {
        setError(tt.description);
      } finally {
        setPendingId(null);
      }
    },
    [adminUsersApi, tt.description]
  );

  const columns: TableColumn<PamAdminUserListItem>[] = [
    {
      title: tt.emailLabel,
      key: 'identity',
      render: (_, row) =>
        resolveUserDisplayLabel({
          displayName: row.displayName,
          phone: row.phone,
          email: row.email,
          userId: row.id
        })
    },
    {
      title: tt.systemRoleLabel,
      key: 'systemRole',
      width: 180,
      render: (_, row) => (
        <select
          data-testid="AdminUsersSystemRoleSelect"
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
      )
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

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        emptyText={tt.empty}
      />
    </div>
  );
}
