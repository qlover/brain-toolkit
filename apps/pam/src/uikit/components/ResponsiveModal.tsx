'use client';

import {
  CloseOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { clsx } from 'clsx';
import { useState, useCallback, type ReactNode, useEffect } from 'react';

export interface ResponsiveModalProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调（点击遮罩或关闭按钮时触发） */
  onClose?: () => void;
  /** 标题（显示在头部左侧），如果传入则显示，否则只显示一个脉冲点 */
  title?: ReactNode;
  /** 头部右侧额外操作区（例如内容模式切换按钮），位于标题与全屏/关闭之间 */
  actions?: ReactNode;
  /** 完全自定义整个头部，传入后将忽略 title 和 actions */
  header?: ReactNode;
  /** 底部内容，会在容器底部固定显示 */
  footer?: ReactNode;
  /** 主体内容 */
  children: ReactNode;
  /** 是否默认全屏（非受控） */
  defaultFullscreen?: boolean;
  /** 受控全屏状态 */
  fullscreen?: boolean;
  /** 全屏状态变化回调 */
  onFullscreenChange?: (fullscreen: boolean) => void;
  /** 是否显示全屏切换按钮，默认 true */
  showFullscreenToggle?: boolean;
  /** 关闭按钮的 aria-label */
  closeLabel?: string;
  /** 展开按钮的 aria-label */
  expandLabel?: string;
  /** 收起按钮的 aria-label */
  collapseLabel?: string;
  /** 额外类名，作用于弹窗内容容器 */
  className?: string;
  bodyClassName?: string;
}

export function ResponsiveModal({
  open,
  onClose,
  title,
  actions,
  header,
  footer,
  children,
  defaultFullscreen = false,
  fullscreen: fullscreenProp,
  onFullscreenChange,
  showFullscreenToggle = true,
  closeLabel = '关闭',
  expandLabel = '展开',
  collapseLabel = '收起',
  className,
  bodyClassName
}: ResponsiveModalProps) {
  // 内部管理全屏状态（非受控模式）
  const [internalFullscreen, setInternalFullscreen] =
    useState(defaultFullscreen);
  const isFullscreen =
    fullscreenProp !== undefined ? fullscreenProp : internalFullscreen;

  const toggleFullscreen = useCallback(() => {
    const next = !isFullscreen;
    if (fullscreenProp === undefined) {
      setInternalFullscreen(next);
    }
    onFullscreenChange?.(next);
  }, [isFullscreen, fullscreenProp, onFullscreenChange]);

  // ---------- 新增：ESC 键关闭 ----------
  useEffect(() => {
    if (!open) return; // 仅在打开时监听

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);
  // ------------------------------------

  if (!open) return null;

  // 默认头部渲染
  const renderHeader = () => {
    if (header) return header;

    return (
      <div
        data-testid="renderHeader"
        className="border-primary-border bg-elevated flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-8 sm:py-4"
      >
        <div className="text-brand flex items-center gap-2 text-sm font-bold">
          {title || (
            <span className="bg-brand h-2 w-2 animate-pulse rounded-full" />
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {showFullscreenToggle && (
            <button
              type="button"
              aria-label={isFullscreen ? collapseLabel : expandLabel}
              onClick={toggleFullscreen}
              className="text-tertiary-text hover:bg-secondary hover:text-secondary-text rounded-full p-1 transition-colors"
            >
              {isFullscreen ? (
                <FullscreenExitOutlined className="h-5 w-5" />
              ) : (
                <FullscreenOutlined className="h-5 w-5" />
              )}
            </button>
          )}
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="text-tertiary-text hover:bg-secondary hover:text-secondary-text rounded-full p-1 transition-colors"
          >
            <CloseOutlined className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      data-testid="ResponsiveModal"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-100 flex flex-col justify-end sm:items-center sm:justify-center sm:p-4 pt-9 sm:pt-4"
    >
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 z-0 bg-black/60"
        onClick={onClose}
      />

      <div
        className={clsx(
          'border-primary-border bg-elevated ring-primary-border/60 overflow-hidden shadow-2xl ring-1',
          isFullscreen
            ? 'fixed inset-x-0 bottom-0 top-14 z-200 flex flex-col rounded-t-3xl sm:inset-4 sm:rounded-2xl'
            : 'relative z-10 flex w-full flex-col rounded-t-3xl sm:max-w-2xl sm:rounded-3xl',
          className
        )}
      >
        {renderHeader()}

        <div className={clsx('flex-1 overflow-y-auto', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="border-primary-border bg-secondary shrink-0 border-t px-4 py-4 sm:px-8 sm:py-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
