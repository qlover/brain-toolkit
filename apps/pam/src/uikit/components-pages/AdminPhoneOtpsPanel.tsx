'use client';

import {
  asyncErrorMessage,
  runAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useEffect, useState } from 'react';
import { AdminPhoneOtpsApi } from '@/impls/appApi/AdminPhoneOtpsApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminPhoneOtpsI18nInterface } from '@config/i18n-mapping/admin18n';
import type { PamPhoneOtpAdminItem } from '@schemas/PamPhoneOtpSchema';

const AUTO_REFRESH_MS = 5_000;

function formatTime(value: string | null): string {
  if (!value) {
    return '—';
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

export function AdminPhoneOtpsPanel({
  tt
}: {
  tt: AdminPhoneOtpsI18nInterface;
}) {
  const api = useIOC(AdminPhoneOtpsApi);
  const [phone, setPhone] = useState('');
  const [list, listStore] =
    usePendingAsyncStore<AsyncState<PamPhoneOtpAdminItem[]>>();
  const rows = list.result ?? [];
  const loading = list.loading;
  const error = asyncErrorMessage(list.error);

  const load = useCallback(async () => {
    await runAsyncStore(
      listStore,
      api.list({
        phone: phone.trim() || undefined,
        limit: 80
      }),
      {
        keep: true,
        mapError: () => tt.description
      }
    );
  }, [api, listStore, phone, tt.description]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void load();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const columns: TableColumn<PamPhoneOtpAdminItem>[] = [
    {
      title: tt.colCreated,
      key: 'createdAt',
      width: 170,
      render: (_, row) => formatTime(row.createdAt)
    },
    {
      title: tt.colPhone,
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: tt.colCode,
      key: 'code',
      width: 110,
      render: (_, row) => (
        <span
          data-testid="columns"
          className="font-mono text-sm tracking-wider"
        >
          {row.code ?? tt.codeHidden}
        </span>
      )
    },
    {
      title: tt.colProvider,
      dataIndex: 'provider',
      key: 'provider',
      width: 100
    },
    {
      title: tt.colStatus,
      dataIndex: 'status',
      key: 'status',
      width: 100
    },
    {
      title: tt.colAttempts,
      key: 'attempts',
      width: 100,
      render: (_, row) => `${row.attempts}/${row.maxAttempts}`
    },
    {
      title: tt.colExpires,
      key: 'expiresAt',
      width: 170,
      render: (_, row) => formatTime(row.expiresAt)
    },
    {
      title: tt.colIp,
      key: 'createdIp',
      width: 130,
      render: (_, row) => row.createdIp || '—'
    }
  ];

  return (
    <div data-testid="AdminPhoneOtpsPanel" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={tt.searchPlaceholder}
          className="w-full rounded-lg border border-primary-border bg-surface px-3 py-2 text-sm text-primary-text sm:max-w-md"
        />
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand"
        >
          {tt.refresh}
        </button>
        <p className="text-xs text-secondary-text sm:ml-auto">
          {tt.autoRefresh}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <AdminPanelLoading testId="AdminPhoneOtpsLoading" />
      ) : (
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          emptyText={tt.empty}
        />
      )}
    </div>
  );
}
