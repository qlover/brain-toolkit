'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, usePathname } from '@/i18n/routing';
import { PAMApi } from '@/impls/appApi/PAMApi';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMProjectI18nInterface } from '@config/i18n-mapping/PAMProjectI18n';
import { ROUTE_HOME } from '@config/route';
import type { PAMProjectDetail } from '@schemas/PAMProjectSchema';
import { Loading } from '../../components/Loading';
import { usePageI18nMapping } from '../../context/PageI18nContext';

export type PAMProjectDetailTabType = 'general' | 'environments';

export type PAMProjectDetailShellProps = {
  readonly projectId: string;
  readonly children: React.ReactNode;
};

/**
 * Project detail chrome: back link, title, General | Environments tabs.
 *
 * Significance: Shared layout shell for project detail App Router pages.
 * Core idea: Load project name once; tabs navigate with locale-aware Link.
 * Main function: Header + tab bar + child panel slot.
 * Main purpose: Consistent navigation between general and environments.
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void pamApi
      .getProjectDetail({ id: projectId })
      .then((detail) => {
        if (!cancelled) {
          setProject(detail);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(tt.projectNotFound);
          setProject(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pamApi, projectId, tt.projectNotFound]);

  const tabClass = (tab: PAMProjectDetailTabType): string =>
    clsx(
      'border-b-2 px-3 py-2 text-sm font-semibold transition touch-manipulation',
      activeTab === tab
        ? 'border-brand text-brand'
        : 'border-transparent text-secondary-text hover:text-primary-text'
    );

  return (
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
          <h1 className="truncate text-2xl font-bold tracking-tight text-primary-text sm:text-3xl">
            {project?.name ?? ''}
          </h1>
        )}

        <nav
          data-testid="PAMProjectDetailTabs"
          className="flex gap-1 border-b border-primary-border"
        >
          <Link
            href={{
              pathname: '/projects/[projectId]/general',
              params: { projectId }
            }}
            className={tabClass('general')}
          >
            {tt.tabGeneral}
          </Link>
          <Link
            href={{
              pathname: '/projects/[projectId]/environments',
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
  );
}
