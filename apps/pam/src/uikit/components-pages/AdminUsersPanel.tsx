'use client';

import { useStrictEffect } from '@qlover/next-kit/client';
import clsx from 'clsx';
import { useCallback, useState } from 'react';
import { AdminUsersApi } from '@/impls/appApi/AdminUsersApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminUsersI18nInterface } from '@config/i18n-mapping/admin18n';
import type { PamAdminUserListItem } from '@schemas/PamUserSchema';

function ToggleSwitch({
  checked,
  disabled,
  onChange
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      data-testid="AdminUsersToggleSwitch"
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        checked ? 'bg-brand' : 'bg-elevated'
      )}
    >
      <span
        className={clsx(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

export function AdminUsersPanel({ tt }: { tt: AdminUsersI18nInterface }) {
  const adminUsersApi = useIOC(AdminUsersApi);
  const [rows, setRows] = useState<PamAdminUserListItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleToggle = useCallback(
    async (row: PamAdminUserListItem, enabled: boolean) => {
      setPendingId(row.id);
      setError(null);
      try {
        await adminUsersApi.setPlatformAdmin(row.id, enabled);
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id ? { ...item, isPlatformAdmin: enabled } : item
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
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: tt.platformAdminLabel,
      key: 'isPlatformAdmin',
      width: 160,
      render: (_, row) => (
        <ToggleSwitch
          checked={row.isPlatformAdmin}
          disabled={pendingId === row.id}
          onChange={(enabled) => void handleToggle(row, enabled)}
        />
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

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
