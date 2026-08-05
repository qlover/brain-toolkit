'use client';

import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import { useUserAuth } from '@/uikit/hook/useUserAuth';
import type { PAMProjectI18nInterface } from '@config/i18n-mapping/PAMProjectI18n';
import { ROUTE_PROJECT_GENERAL } from '@config/route';

export type PAMProjectForkButtonProps = {
  readonly projectId: string;
  readonly tt: PAMProjectI18nInterface;
};

/**
 * One-click fork control for project detail chrome.
 *
 * Significance: Lets signed-in viewers derive a private copy without editing.
 * Core idea: Call fork API then navigate to the new project general tab.
 * Main function: Trigger fork and surface toast feedback.
 * Main purpose: Friendly project derivation entry point.
 *
 * @example
 * <PAMProjectForkButton projectId={id} tt={tt} />
 */
export function PAMProjectForkButton({
  projectId,
  tt
}: PAMProjectForkButtonProps) {
  const pamApi = useIOC(PAMApi);
  const router = useRouter();
  const { success: isAuthenticated } = useUserAuth();
  const [forking, setForking] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const onFork = async (): Promise<void> => {
    if (forking) {
      return;
    }

    setForking(true);
    try {
      const created = await pamApi.forkProject(projectId);
      toast.success(tt.forkSuccess);
      router.push({
        pathname: ROUTE_PROJECT_GENERAL,
        params: { projectId: created.slug }
      });
    } catch {
      toast.error(tt.forkFailed);
    } finally {
      setForking(false);
    }
  };

  return (
    <button
      data-testid="PAMProjectForkButton"
      type="button"
      disabled={forking}
      onClick={() => {
        void onFork();
      }}
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary-border bg-elevated px-2.5 py-1.5 text-xs font-semibold text-primary-text transition touch-manipulation',
        'hover:border-brand hover:text-brand',
        'disabled:cursor-not-allowed disabled:opacity-60'
      )}
    >
      <DocumentDuplicateIcon className="h-4 w-4" />
      {forking ? tt.forking : tt.fork}
    </button>
  );
}
