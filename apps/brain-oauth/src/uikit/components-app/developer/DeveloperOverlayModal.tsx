'use client';

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
      className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] dark:bg-black/70"
        aria-label="Close"
        tabIndex={-1}
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        className={clsx(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-primary-border bg-primary shadow-xl sm:max-h-[85vh] sm:rounded-2xl',
          maxWidthClass
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-primary-border bg-elevated/50 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-base font-semibold text-primary-text sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-2xl leading-none text-secondary-text transition hover:bg-elevated hover:text-primary-text"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 text-primary-text sm:px-6 sm:py-5">
          {children}
        </div>
        {footer != null && (
          <div className="shrink-0 border-t border-primary-border bg-elevated/30 px-4 py-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
