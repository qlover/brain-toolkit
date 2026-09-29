'use client';

import {
  runAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { useStrictEffect } from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { Fragment, useCallback, useState } from 'react';
import { AdminMailApi } from '@/impls/appApi/AdminMailApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminMailLogsI18nInterface } from '@config/i18n-mapping/admin18n';
import type {
  PamMailLogAdminItem,
  PamMailTemplate
} from '@schemas/PamMailSchema';

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

export function AdminMailLogsPanel({ tt }: { tt: AdminMailLogsI18nInterface }) {
  const api = useIOC(AdminMailApi);
  const [email, setEmail] = useState('');
  const [template, setTemplate] = useState<PamMailTemplate | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [list, listStore] =
    usePendingAsyncStore<AsyncState<PamMailLogAdminItem[]>>();
  const rows = list.result ?? [];
  const loading = list.loading;
  const error = list.status === 'failed' ? tt.loadFailed : null;

  const templateLabel: Record<PamMailTemplate, string> = {
    test: tt.templateTest,
    password_reset: tt.templatePasswordReset,
    password_changed: tt.templatePasswordChanged
  };

  const load = useCallback(async () => {
    await runAsyncStore(
      listStore,
      api.listLogs({ email: email.trim(), template, limit: 100 }),
      { keep: true }
    );
  }, [api, email, listStore, template]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const expanded = rows.find((row) => row.id === expandedId) ?? null;

  const columns: TableColumn<PamMailLogAdminItem>[] = [
    {
      title: tt.colCreated,
      key: 'createdAt',
      width: 170,
      render: (_, row) => formatTime(row.createdAt)
    },
    {
      title: tt.colTo,
      dataIndex: 'toEmail',
      key: 'toEmail'
    },
    {
      title: tt.colTemplate,
      key: 'template',
      width: 130,
      render: (_, row) => templateLabel[row.template] ?? row.template
    },
    {
      title: tt.colSubject,
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: tt.colProvider,
      dataIndex: 'provider',
      key: 'provider',
      width: 90
    },
    {
      title: tt.colStatus,
      key: 'status',
      width: 90,
      render: (_, row) => (
        <span
          data-testid="columns"
          className={clsx(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            row.status === 'sent'
              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          )}
        >
          {row.status}
        </span>
      )
    },
    {
      title: tt.colIp,
      key: 'createdIp',
      width: 130,
      render: (_, row) => row.createdIp || '—'
    },
    {
      title: tt.colDetail,
      key: 'detail',
      render: (_, row) => {
        if (row.error) {
          return (
            <span
              data-testid="columns"
              className="break-all text-xs text-red-500"
            >
              {row.error}
            </span>
          );
        }
        if (!row.bodyText) {
          return row.providerMessageId ? (
            <span className="font-mono text-xs text-tertiary-text">
              {row.providerMessageId}
            </span>
          ) : (
            '—'
          );
        }
        return (
          <button
            data-testid="columns"
            type="button"
            onClick={() =>
              setExpandedId((current) => (current === row.id ? null : row.id))
            }
            className="cursor-pointer text-xs font-medium text-brand hover:underline"
          >
            {expandedId === row.id ? tt.hideBody : tt.viewBody}
          </button>
        );
      }
    }
  ];

  return (
    <div data-testid="AdminMailLogsPanel" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={tt.searchPlaceholder}
          className="w-full rounded-lg border border-primary-border bg-surface px-3 py-2 text-sm text-primary-text sm:max-w-md"
        />
        <select
          value={template}
          onChange={(event) =>
            setTemplate(event.target.value as PamMailTemplate | '')
          }
          className="rounded-lg border border-primary-border bg-surface px-3 py-2 text-sm text-primary-text"
        >
          <option value="">{tt.templateAll}</option>
          <option value="test">{tt.templateTest}</option>
          <option value="password_reset">{tt.templatePasswordReset}</option>
          <option value="password_changed">{tt.templatePasswordChanged}</option>
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-on-brand"
        >
          {tt.refresh}
        </button>
      </div>

      {error ? (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      {loading && rows.length === 0 ? (
        <AdminPanelLoading testId="AdminMailLogsLoading" />
      ) : (
        <Fragment>
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            emptyText={tt.empty}
          />
          {expanded?.bodyText ? (
            <div
              data-testid="AdminMailLogsBody"
              className="rounded-xl border border-primary-border bg-secondary p-4"
            >
              <p className="mb-2 text-sm font-semibold text-primary-text">
                {expanded.subject}
              </p>
              <pre className="whitespace-pre-wrap break-all text-sm text-secondary-text">
                {expanded.bodyText}
              </pre>
            </div>
          ) : null}
        </Fragment>
      )}
    </div>
  );
}
