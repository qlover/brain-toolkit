'use client';

import {
  runAsyncStore,
  usePendingAsyncStore,
  type AsyncState
} from '@brain-toolkit/react-kit';
import { useStrictEffect } from '@qlover/next-kit/client';
import { useCallback, type ReactNode } from 'react';
import { PamUserFeedbackApi } from '@/impls/appApi/PamUserFeedbackApi';
import { Table, type TableColumn } from '@/uikit/components/Table';
import { AdminPanelLoading } from '@/uikit/components-pages/AdminPanelLoading';
import { useIOC } from '@/uikit/hook/useIOC';
import {
  PamUserFeedbackCategory,
  PamUserFeedbackStatus,
  type PamUserFeedbackCategoryType,
  type PamUserFeedbackItemPublicType,
  type PamUserFeedbackStatusType
} from '@schemas/PamUserFeedbackSchema';

export type PamAccountFeedbackListTtType = {
  readonly empty: string;
  readonly loadFailed: string;
  readonly colCategory: string;
  readonly colBody: string;
  readonly colStatus: string;
  readonly colTime: string;
  readonly categoryBug: string;
  readonly categoryUx: string;
  readonly categoryFeature: string;
  readonly categoryPerformance: string;
  readonly categoryContent: string;
  readonly categoryOther: string;
  readonly statusOpen: string;
  readonly statusReviewing: string;
  readonly statusResolved: string;
  readonly statusClosed: string;
};

/**
 * 当前用户自己的反馈记录列表。
 */
export function PamAccountFeedbackListPanel({
  tt
}: {
  readonly tt: PamAccountFeedbackListTtType;
}): ReactNode {
  const api = useIOC(PamUserFeedbackApi);
  const [list, listStore] =
    usePendingAsyncStore<
      AsyncState<readonly PamUserFeedbackItemPublicType[]>
    >();
  const rows = list.result ?? [];
  const loading = list.loading;
  const error = list.status === 'failed' ? tt.loadFailed : null;

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
    await runAsyncStore(listStore, api.listOwn(), { keep: true });
  }, [api, listStore]);

  useStrictEffect(() => {
    void load();
  }, [load]);

  const columns: TableColumn<PamUserFeedbackItemPublicType>[] = [
    {
      key: 'category',
      title: tt.colCategory,
      render: (_value, row) => categoryLabel(row.category)
    },
    {
      key: 'body',
      title: tt.colBody,
      render: (_value, row) => (
        <span
          data-testid="columns"
          className="line-clamp-2 max-w-md whitespace-pre-wrap break-words"
        >
          {row.body}
        </span>
      )
    },
    {
      key: 'status',
      title: tt.colStatus,
      render: (_value, row) => statusLabel(row.status)
    },
    {
      key: 'createdAt',
      title: tt.colTime,
      render: (_value, row) =>
        new Date(row.createdAt).toLocaleString(undefined, {
          hour12: false
        })
    }
  ];

  if (loading && rows.length === 0) {
    return <AdminPanelLoading testId="PamAccountFeedbackListLoading" />;
  }

  return (
    <div
      data-testid="PamAccountFeedbackListPanel"
      className="flex flex-col gap-4"
    >
      {error ? (
        <p className="text-sm text-(--fe-color-error)" role="alert">
          {error}
        </p>
      ) : null}
      {rows.length === 0 && !loading ? (
        <p className="text-sm text-secondary-text">{tt.empty}</p>
      ) : (
        <Table columns={columns} dataSource={rows} rowKey={(row) => row.id} />
      )}
    </div>
  );
}
