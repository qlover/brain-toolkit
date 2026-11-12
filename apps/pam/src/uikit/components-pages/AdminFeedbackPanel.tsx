'use client';

import {
  runAsyncStore,
  useAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, useMemo, useState } from 'react';
import { PamUserFeedbackApi } from '@/impls/appApi/PamUserFeedbackApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { PermissionKey, useCan } from '@/uikit/hook/useHasPermission';
import { useIOC } from '@/uikit/hook/useIOC';
import type { AdminFeedbackI18nInterface } from '@config/i18n-mapping/admin18n';
import {
  PamUserFeedbackCategory,
  PamUserFeedbackGithubSyncStatus,
  PamUserFeedbackStatus,
  type PamUserFeedbackAdminItemType,
  type PamUserFeedbackCategoryType,
  type PamUserFeedbackStatusType
} from '@schemas/PamUserFeedbackSchema';

type ActionState = AsyncState<true> & {
  targetId: string | null;
};

const STATUS_OPTIONS: readonly PamUserFeedbackStatusType[] = [
  PamUserFeedbackStatus.open,
  PamUserFeedbackStatus.reviewing,
  PamUserFeedbackStatus.resolved,
  PamUserFeedbackStatus.closed
];

/**
 * Admin 用户反馈列表：状态切换与手动创建 GitHub Issue。
 */
export function AdminFeedbackPanel({
  tt
}: {
  readonly tt: AdminFeedbackI18nInterface;
}) {
  const api = useIOC(PamUserFeedbackApi);
  const { allowed: canUpdate } = useCan(PermissionKey.admin_feedback_update);
  const [actionError, setActionError] = useState<string | null>(null);

  const [list, listStore] =
    usePendingAsyncStore<AsyncState<readonly PamUserFeedbackAdminItemType[]>>();
  const [action, actionStore] = useAsyncStore<ActionState>({
    targetId: null
  });
  const rows = list.result ?? [];
  const loading = list.loading;
  const pendingId = action.targetId;
  const error = list.status === 'failed' ? tt.loadFailed : actionError;

  const categoryLabel = useCallback(
    (category: PamUserFeedbackCategoryType): string => {
      switch (category) {
        case PamUserFeedbackCategory.bug:
          return tt.categoryBug;
        case PamUserFeedbackCategory.ux:
          return tt.categoryUx;
        case PamUserFeedbackCategory.feature:
          return tt.categoryFeature;
        case PamUserFeedbackCategory.performance:
          return tt.categoryPerformance;
        case PamUserFeedbackCategory.content:
          return tt.categoryContent;
        default:
          return tt.categoryOther;
      }
    },
    [tt]
  );

  const statusLabel = useCallback(
    (status: PamUserFeedbackStatusType): string => {
      switch (status) {
        case PamUserFeedbackStatus.open:
          return tt.statusOpen;
        case PamUserFeedbackStatus.reviewing:
          return tt.statusReviewing;
        case PamUserFeedbackStatus.resolved:
          return tt.statusResolved;
        default:
          return tt.statusClosed;
      }
    },
    [tt]
  );

  const load = useCallback(async () => {
    await runAsyncStore(listStore, api.listAdmin(), { keep: true });
  }, [api, listStore]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const handleStatusChange = useCallback(
    async (
      row: PamUserFeedbackAdminItemType,
      status: PamUserFeedbackStatusType
    ) => {
      if (!canUpdate || row.status === status || pendingId !== null) {
        return;
      }
      setActionError(null);
      actionStore.emit({ targetId: row.id });
      try {
        const ok = await runAsyncStore(
          actionStore,
          api.updateStatus(row.id, status).then(() => true as const)
        );
        if (!actionStore.isSuccess() || ok === undefined) {
          setActionError(tt.statusChangeFailed);
          return;
        }
        const current = listStore.getResult() ?? [];
        listStore.success(
          current.map((item) =>
            item.id === row.id ? { ...item, status } : item
          )
        );
      } catch {
        setActionError(tt.statusChangeFailed);
      } finally {
        actionStore.emit({ targetId: null });
      }
    },
    [actionStore, api, canUpdate, listStore, pendingId, tt.statusChangeFailed]
  );

  const handleCreateIssue = useCallback(
    async (row: PamUserFeedbackAdminItemType) => {
      if (!canUpdate || pendingId !== null) {
        return;
      }
      setActionError(null);
      actionStore.emit({ targetId: row.id });
      try {
        const result = await runAsyncStore(
          actionStore,
          api.createGithubIssue(row.id).then((issue) => {
            if (
              issue.githubSyncStatus === PamUserFeedbackGithubSyncStatus.skipped
            ) {
              setActionError(tt.githubNotConfigured);
            } else if (
              issue.githubSyncStatus !== PamUserFeedbackGithubSyncStatus.synced
            ) {
              setActionError(tt.githubCreateFailed);
            }
            const current = listStore.getResult() ?? [];
            listStore.success(
              current.map((item) =>
                item.id === row.id
                  ? {
                      ...item,
                      githubSyncStatus: issue.githubSyncStatus,
                      githubIssueNumber: issue.githubIssueNumber,
                      githubIssueUrl: issue.githubIssueUrl,
                      githubSyncError: issue.githubSyncError
                    }
                  : item
              )
            );
            return true as const;
          })
        );
        if (!actionStore.isSuccess() || result === undefined) {
          setActionError(tt.githubCreateFailed);
        }
      } catch {
        setActionError(tt.githubCreateFailed);
      } finally {
        actionStore.emit({ targetId: null });
      }
    },
    [
      actionStore,
      api,
      canUpdate,
      listStore,
      pendingId,
      tt.githubCreateFailed,
      tt.githubNotConfigured
    ]
  );

  const columns = useMemo((): TableColumn<PamUserFeedbackAdminItemType>[] => {
    return [
      {
        title: tt.colUser,
        key: 'user',
        render: (_value, row) => (
          <span data-testid="columns" className="text-sm text-primary-text">
            {row.displayName}
          </span>
        )
      },
      {
        title: tt.colCategory,
        key: 'category',
        render: (_value, row) => (
          <span data-testid="columns" className="text-sm text-secondary-text">
            {categoryLabel(row.category)}
          </span>
        )
      },
      {
        title: tt.colBody,
        key: 'body',
        render: (_value, row) => (
          <span
            data-testid="columns"
            className="line-clamp-2 max-w-xs text-sm text-primary-text"
          >
            {row.body}
          </span>
        )
      },
      {
        title: tt.colStatus,
        key: 'status',
        width: 140,
        render: (_value, row) =>
          canUpdate ? (
            <select
              value={row.status}
              disabled={pendingId === row.id}
              onChange={(e) =>
                void handleStatusChange(
                  row,
                  e.target.value as PamUserFeedbackStatusType
                )
              }
              className="w-full rounded-lg border border-primary-border bg-surface px-2 py-1.5 text-sm text-primary-text disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((status) => (
                <option data-testid="columns" key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm">{statusLabel(row.status)}</span>
          )
      },
      {
        title: tt.colGithub,
        key: 'github',
        render: (_value, row) => (
          <div data-testid="columns" className="flex flex-col gap-1">
            {row.githubIssueUrl ? (
              <a
                href={row.githubIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-brand hover:text-brand-hover"
              >
                #{String(row.githubIssueNumber)}
              </a>
            ) : (
              <span className="text-xs text-tertiary-text">
                {row.githubSyncStatus}
              </span>
            )}
            {canUpdate && row.githubIssueNumber === null ? (
              <button
                type="button"
                disabled={pendingId === row.id}
                onClick={() => void handleCreateIssue(row)}
                className="w-fit cursor-pointer text-xs font-medium text-brand hover:text-brand-hover disabled:opacity-50"
              >
                {tt.createIssue}
              </button>
            ) : null}
            {row.githubSyncError ? (
              <span className="max-w-[12rem] truncate text-[11px] text-red-500">
                {row.githubSyncError}
              </span>
            ) : null}
          </div>
        )
      },
      {
        title: tt.colTime,
        key: 'time',
        render: (_value, row) => (
          <span
            data-testid="columns"
            className="whitespace-nowrap text-xs text-secondary-text"
          >
            {new Date(row.createdAt).toLocaleString()}
          </span>
        )
      }
    ];
  }, [
    canUpdate,
    categoryLabel,
    handleCreateIssue,
    handleStatusChange,
    pendingId,
    statusLabel,
    tt.colBody,
    tt.colCategory,
    tt.colGithub,
    tt.colStatus,
    tt.colTime,
    tt.colUser,
    tt.createIssue
  ]);

  if (loading && rows.length === 0) {
    return <AdminPanelLoading testId="AdminFeedbackLoading" />;
  }

  return (
    <div data-testid="AdminFeedbackPanel" className="flex flex-col gap-4">
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="id"
        emptyText={tt.empty}
        data-testid="AdminFeedbackTable"
      />
    </div>
  );
}
