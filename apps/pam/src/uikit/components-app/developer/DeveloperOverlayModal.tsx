'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { useEffect, type ReactNode } from 'react';

export function DeveloperOverlayModal(props: {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  closeOnBackdrop?: boolean;
}) {
  const {
    open,
    title,
    onClose,
    children,
    footer,
    maxWidthClass = 'max-w-xl',
    closeOnBackdrop = true
  } = props;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnBackdrop) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, closeOnBackdrop]);

  if (!open) return null;

  return (
    <div
      data-testid="DeveloperOverlayModal"
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px] dark:bg-black/65"
        aria-label="Close"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={clsx(
          'relative flex w-full flex-col overflow-hidden',
          'max-h-[min(92vh,100dvh)] rounded-t-2xl border border-primary-border bg-primary shadow-2xl',
          'sm:max-h-[85vh] sm:rounded-2xl',
          'pb-[env(safe-area-inset-bottom)]',
          maxWidthClass
        )}
      >
        <div
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-primary-border sm:hidden"
          aria-hidden
        />

        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 pb-3 sm:border-b sm:border-primary-border sm:bg-elevated/40 sm:px-5 sm:pt-4 sm:pb-4">
          <h2 className="min-w-0 truncate text-base font-semibold text-primary-text sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary-text transition hover:bg-elevated hover:text-primary-text focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 text-primary-text sm:px-5 sm:py-5">
          {children}
        </div>

        {footer != null && (
          <div className="shrink-0 border-t border-primary-border bg-primary px-4 py-3 sm:bg-elevated/20 sm:px-5 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
