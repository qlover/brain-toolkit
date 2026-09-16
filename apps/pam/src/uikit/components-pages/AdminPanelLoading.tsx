'use client';

import { clsx } from 'clsx';
import { PamLoadingIndicator } from '@/uikit/components/PamLoadingIndicator';

export interface AdminPanelLoadingProps {
  readonly testId?: string;
  readonly className?: string;
}

/**
 * Shared admin content loading placeholder (visible brand dots).
 */
export function AdminPanelLoading({
  testId = 'AdminPanelLoading',
  className
}: AdminPanelLoadingProps) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={clsx(
        'flex min-h-48 w-full items-center justify-center py-10',
        className
      )}
    >
      <PamLoadingIndicator />
    </div>
  );
}
