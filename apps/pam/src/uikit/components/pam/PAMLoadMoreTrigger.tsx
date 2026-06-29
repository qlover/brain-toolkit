import { Button, Spin } from 'antd';
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
}

export function PAMLoadMoreTrigger<T extends SearchPAMProject>({
  infiniteFacade,
  loadingText = '加载中...',
  noMoreText = '— 已全部加载 —',
  errorText = '加载失败，点击重试',
  loadMoreText = '加载更多'
}: PAMLoadMoreTriggerProps<T>) {
  const store = infiniteFacade.getStore();

  const error = useStore(store, (state) => state.error);
  const loading = useStore(store, (state) => state.loading);
  const hasMore = useStore(store, (state) => state.result?.hasMore);

  const loadMore = useCallback(() => {
    infiniteFacade.loadMore();
  }, [infiniteFacade]);

  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px' // 提前触发
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
        <Button onClick={loadMore} type="primary" danger>
          {errorText}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-testid="PAMLoadMoreTrigger" className="text-center py-4">
        <Spin>{loadingText}</Spin>
      </div>
    );
  }

  if (hasMore) {
    return (
      <div
        data-testid="PAMLoadMoreTrigger"
        ref={(node) => {
          infiniteFacade.setSentinelRef(node);
          sentinelRef(node);
        }}
        className="text-center py-4"
      >
        <Button onClick={loadMore} type="dashed">
          {loadMoreText}
        </Button>
      </div>
    );
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
