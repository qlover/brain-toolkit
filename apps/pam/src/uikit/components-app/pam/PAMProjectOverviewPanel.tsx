'use client';

import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { usePageI18nMapping } from '@qlover/next-kit/client';
import { Link } from '@/i18n/routing';
import {
  PAM_DETAIL_SECTION_LABEL,
  PAMProjectDescription,
  PAMProjectDetailCover,
  PAMProjectInfoList,
  PAMProjectQuickEntries
} from '@/uikit/components/pam/PAMProjectDetailBody';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { ROUTE_PROJECT_GENERAL } from '@config/route';
import { usePAMProjectDetail } from './PAMProjectDetailShell';

const CARD =
  'overflow-hidden rounded-2xl border border-primary-border bg-secondary';

const BONE = 'rounded bg-elevated';

/** Same grid as the loaded overview, so content swaps in without layout shift. */
function PAMProjectOverviewSkeleton() {
  return (
    <div
      data-testid="PAMProjectOverviewSkeleton"
      aria-hidden
      className="grid animate-pulse items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <section className={CARD}>
        <div className="border-b border-primary-border px-5 py-3.5">
          <div className={`${BONE} h-4 w-20`} />
        </div>
        <div className="space-y-2.5 px-5 py-4">
          <div className={`${BONE} h-3 w-full`} />
          <div className={`${BONE} h-3 w-11/12`} />
          <div className={`${BONE} h-3 w-4/5`} />
          <div className={`${BONE} h-3 w-2/3`} />
        </div>
      </section>
      <aside className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <section className={CARD}>
          <div className="aspect-video w-full border-b border-primary-border bg-elevated" />
          <div className="flex gap-1.5 p-4">
            <div className={`${BONE} h-6 w-14`} />
            <div className={`${BONE} h-6 w-20`} />
          </div>
        </section>
        <section className={`${CARD} space-y-2 p-4`}>
          <div className={`${BONE} h-3 w-16`} />
          <div className={`${BONE} h-3 w-full`} />
          <div className={`${BONE} h-3 w-5/6`} />
          <div className={`${BONE} h-3 w-3/4`} />
        </section>
      </aside>
    </div>
  );
}

/**
 * Project overview tab: rendered Markdown description, quick entries and info.
 * Visible to read-only users as well; the edit link only shows with edit rights.
 */
export function PAMProjectOverviewPanel() {
  const tt = usePageI18nMapping<PAMI18nInterface>();
  const { project, loading, canEdit, environments } = usePAMProjectDetail();

  if (!project) {
    return loading ? <PAMProjectOverviewSkeleton /> : null;
  }

  const model = {
    ...project,
    environments: environments ?? project.environments
  };

  return (
    <div
      data-testid="PAMProjectOverviewPanel"
      className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <section className={CARD}>
        <header className="flex items-center justify-between gap-3 border-b border-primary-border px-5 py-3">
          <h2 className="text-sm font-semibold text-primary-text">
            {tt.detailDescTitle}
          </h2>
          {canEdit ? (
            <Link
              data-testid="PAMProjectOverviewEditDesc"
              href={{
                pathname: ROUTE_PROJECT_GENERAL,
                params: { projectId: project.slug }
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand no-underline hover:text-brand-hover"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              {tt.detailEdit}
            </Link>
          ) : null}
        </header>
        <div className="min-w-0 px-5 py-4">
          <PAMProjectDescription tt={tt} description={project.description} />
        </div>
      </section>

      <aside className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <section className={CARD}>
          <PAMProjectDetailCover
            tt={tt}
            project={model}
            className="border-b border-primary-border"
          />
          <div className="p-4">
            <PAMProjectQuickEntries tt={tt} project={model} />
          </div>
        </section>
        <section className={`${CARD} p-4`}>
          <div className={PAM_DETAIL_SECTION_LABEL}>{tt.detailInfoTitle}</div>
          <PAMProjectInfoList tt={tt} project={model} showVisibility />
        </section>
      </aside>
    </div>
  );
}
