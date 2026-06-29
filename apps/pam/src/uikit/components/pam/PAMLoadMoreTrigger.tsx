import { LoadingOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import type { InfiniteFacadeInterface } from '@/interface/InfiniteFacadeInterface';
import { useStore } from '@/uikit/hook/useStore';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';

interface PAMLoadMoreTriggerProps<T extends SearchPAMProject> {
  infiniteFacade: InfiniteFacadeInterface<T>;
  loadingText?: string;
  noMoreText?: string;
  errorText?: string;
  loadMoreText?: string;
  /** Hide footer loading when the list is still empty (initial load uses list empty state). */
  hideWhenListEmpty?: boolean;
}

export function PAMLoadMoreTrigger<T extends SearchPAMProject>({
  infiniteFacade,
  loadingText = '加载中...',
  noMoreText = '— 已全部加载 —',
  errorText = '加载失败，点击重试',
  loadMoreText = '加载更多',
  hideWhenListEmpty = true
}: PAMLoadMoreTriggerProps<T>) {
  const store = infiniteFacade.getStore();

  const error = useStore(store, (state) => state.error);
  const loading = useStore(store, (state) => state.loading);
  const hasMore = useStore(store, (state) => state.result?.hasMore);
  const projectCount = useStore(store, (state) => state.projects?.length ?? 0);
  const isListEmpty = projectCount === 0;

  const loadMore = useCallback(() => {
    infiniteFacade.loadMore();
  }, [infiniteFacade]);

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    if (inView && !loading && hasMore) {
      loadMore();
    }
  }, [inView, loading, hasMore, loadMore]);

  if (error) {
    return (
      <div data-testid="PAMLoadMoreTrigger" className="text-center py-4">
        <button
          type="button"
          onClick={loadMore}
          className="border border-(--fe-color-error) text-(--fe-color-error) hover:bg-(--fe-color-error)/10 rounded-xl px-4 py-2 text-sm transition"
        >
          {errorText}
        </button>
      </div>
    );
  }

  if (loading) {
    if (hideWhenListEmpty && isListEmpty) {
      return null;
    }

    return (
      <div
        data-testid="PAMLoadMoreTrigger"
        className="text-brand flex items-center justify-center gap-2 py-4 text-sm"
      >
        <LoadingOutlined spin />
        {loadingText}
      </div>
    );
  }

  if (hasMore) {
    if (hideWhenListEmpty && isListEmpty) {
      return null;
    }

    return (
      <div
        data-testid="PAMLoadMoreTrigger"
        ref={(node) => {
          infiniteFacade.setSentinelRef(node);
          sentinelRef(node);
        }}
        className="text-center py-4"
      >
        <button
          type="button"
          onClick={loadMore}
          className="border border-primary-border text-brand hover:bg-primary-bg rounded-xl px-4 py-2 text-sm transition"
        >
          {loadMoreText}
        </button>
      </div>
    );
  }

  if (hideWhenListEmpty && isListEmpty) {
    return null;
  }

  return (
    <div
      data-testid="PAMLoadMoreTrigger"
      className="text-center py-4 text-tertiary-text text-sm"
    >
      {noMoreText}
    </div>
  );
}
