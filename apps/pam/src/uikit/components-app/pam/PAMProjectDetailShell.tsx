'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { isAbortError } from '@qlover/fe-corekit/aborter';
import {
  Loading,
  useStrictEffect,
  usePageI18nMapping
} from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { PAMAbortId, PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMProjectI18nInterface } from '@config/i18n-mapping/PAMProjectI18n';
import {
  ROUTE_HOME,
  ROUTE_PROJECT_ENVIRONMENTS,
  ROUTE_PROJECT_GENERAL
} from '@config/route';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';

export type PAMProjectDetailTabType = 'general' | 'environments';

export type PAMProjectDetailShellProps = {
  readonly projectId: string;
  readonly children: React.ReactNode;
};

export type PAMProjectDetailValue = {
  readonly projectId: string;
  readonly project: PAMProjectDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  /** Owner-only mutations; non-owners may view but not save. */
  readonly canEdit: boolean;
  readonly setProject: Dispatch<SetStateAction<PAMProjectDetail | null>>;
};

const PAMProjectDetailContext = createContext<PAMProjectDetailValue | null>(
  null
);

/**
 * Read project detail loaded by {@link PAMProjectDetailShell}.
 * Panels must not call getProjectDetail again.
 */
export function usePAMProjectDetail(): PAMProjectDetailValue {
  const value = useContext(PAMProjectDetailContext);
  if (!value) {
    throw new Error('usePAMProjectDetail requires PAMProjectDetailShell');
  }
  return value;
}

/**
 * Project detail chrome: back link, title, General | Environments tabs.
 *
 * Significance: Shared layout shell for project detail App Router pages.
 * Core idea: Load project detail once here; tab panels reuse via context.
 * Main function: Header + tab bar + child panel slot.
 * Main purpose: One getProjectDetail for the whole detail tree.
 *
 * @example
 * <PAMProjectDetailShell projectId={id}>
 *   <PAMProjectGeneralPanel projectId={id} />
 * </PAMProjectDetailShell>
 */
export function PAMProjectDetailShell({
  projectId,
  children
}: PAMProjectDetailShellProps) {
  const tt = usePageI18nMapping<PAMProjectI18nInterface>();
  const pathname = usePathname();
  const pamApi = useIOC(PAMApi);
  const [project, setProject] = useState<PAMProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTab: PAMProjectDetailTabType = useMemo(() => {
    if (pathname.includes('/environments')) {
      return 'environments';
    }
    return 'general';
  }, [pathname]);

  useStrictEffect(() => {
    setLoading(true);
    setError(null);

    void pamApi
      .getProjectDetail({ id: projectId })
      .then((detail) => {
        setProject(detail);
        setLoading(false);
      })
      .catch((caught) => {
        if (isAbortError(caught)) {
          return;
        }
        setError(tt.projectNotFound);
        setProject(null);
        setLoading(false);
      });

    return () => {
      pamApi.stop(PAMAbortId.projectDetail(projectId));
    };
  }, [pamApi, projectId]);

  const canEdit = Boolean(project?.is_owner);

  const detailValue = useMemo<PAMProjectDetailValue>(
    () => ({
      projectId,
      project,
      loading,
      error,
      canEdit,
      setProject
    }),
    [projectId, project, loading, error, canEdit]
  );

  const tabClass = (tab: PAMProjectDetailTabType): string =>
    clsx(
      'border-b-2 px-3 py-2 text-sm font-semibold transition touch-manipulation',
      activeTab === tab
        ? 'border-brand text-brand'
        : 'border-transparent text-secondary-text hover:text-primary-text'
    );

  return (
    <PAMProjectDetailContext.Provider value={detailValue}>
      <div
        data-testid="PAMProjectDetailShell"
        className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 md:py-8 lg:px-8"
      >
        <div className="mb-4 flex flex-col gap-3 sm:mb-6">
          <Link
            href={ROUTE_HOME}
            className="inline-flex w-fit items-center gap-1.5 text-sm text-secondary-text transition hover:text-brand"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            {tt.backToProjects}
          </Link>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-tertiary-text">
              <Loading />
              {tt.loadingText}
            </div>
          ) : error ? (
            <p className="text-sm text-(--fe-color-error)">{error}</p>
          ) : (
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight text-primary-text sm:text-3xl">
                {project?.name ?? ''}
              </h1>
              {!canEdit ? (
                <span className="inline-flex shrink-0 items-center rounded-full border border-primary-border bg-elevated px-2 py-0.5 text-xs font-semibold text-secondary-text">
                  {tt.readonly}
                </span>
              ) : null}
            </div>
          )}

          <nav
            data-testid="PAMProjectDetailTabs"
            className="flex gap-1 border-b border-primary-border"
          >
            <Link
              href={{
                pathname: ROUTE_PROJECT_GENERAL,
                params: { projectId }
              }}
              className={tabClass('general')}
            >
              {tt.tabGeneral}
            </Link>
            <Link
              href={{
                pathname: ROUTE_PROJECT_ENVIRONMENTS,
                params: { projectId }
              }}
              className={tabClass('environments')}
            >
              {tt.tabEnvironments}
            </Link>
          </nav>
        </div>

        {!error ? children : null}
      </div>
    </PAMProjectDetailContext.Provider>
  );
}
