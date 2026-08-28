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
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { PAMAbortId, PAMApi } from '@/impls/appApi/PAMApi';
import { PAMFacade } from '@/impls/PAMfacade';
import { PAMProjectForkButton } from '@/uikit/components-app/pam/PAMProjectForkButton';
import { useIOC } from '@/uikit/hook/useIOC';
import type { PAMProjectI18nInterface } from '@config/i18n-mapping/PAMProjectI18n';
import { I } from '@config/ioc-identifiter';
import {
  ROUTE_PROJECT_ENVIRONMENTS,
  ROUTE_PROJECT_GENERAL,
  ROUTE_PROJECTS
} from '@config/route';
import type { PAMEnvWriteable } from '@schemas/PAMEnvironmentSchema';
import {
  PAMPublicType,
  type PAMProjectDetail
} from '@schemas/PAMProjectSchema';

export type PAMProjectDetailTabType = 'general' | 'environments';

export type PAMProjectDetailShellProps = {
  /** URL segment: preferred slug; legacy UUID still accepted. */
  readonly projectId: string;
  readonly children: React.ReactNode;
};

export type PAMProjectDetailValue = {
  /** Resolved project UUID for API calls (empty while loading). */
  readonly projectId: string;
  readonly project: PAMProjectDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  /** Owner-only mutations; non-owners may view but not save. */
  readonly canEdit: boolean;
  readonly deleting: boolean;
  /** Opens the delete confirmation dialog (owner only). */
  readonly requestDeleteProject: () => void;
  readonly setProject: Dispatch<SetStateAction<PAMProjectDetail | null>>;
  /** Lazy-loaded env list (cached in layout while switching tabs). */
  readonly environments: PAMEnvWriteable[] | null;
  readonly environmentsLoading: boolean;
  readonly ensureEnvironments: () => Promise<void>;
  readonly setEnvironments: Dispatch<SetStateAction<PAMEnvWriteable[] | null>>;
};

const PAMProjectDetailContext = createContext<PAMProjectDetailValue | null>(
  null
);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeUuid(value: string): boolean {
  return UUID_RE.test(value);
}

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
 * Main purpose: One lightweight getProjectDetail for the detail tree;
 * environments load on demand via `/api/pam/:id/environments` on that tab.
 */
export function PAMProjectDetailShell({
  projectId: routeKey,
  children
}: PAMProjectDetailShellProps) {
  const tt = usePageI18nMapping<PAMProjectI18nInterface>();
  const pathname = usePathname();
  const router = useRouter();
  const pamApi = useIOC(PAMApi);
  const pamFacade = useIOC(PAMFacade);
  const dialog = useIOC(I.DialogHandler);
  const [project, setProject] = useState<PAMProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [environments, setEnvironments] = useState<PAMEnvWriteable[] | null>(
    null
  );
  const [environmentsLoading, setEnvironmentsLoading] = useState(false);
  const envLoadedForProjectRef = useRef('');
  const envLoadInflightRef = useRef<Promise<void> | null>(null);

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
      .getProjectDetail({ id: routeKey })
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
      pamApi.stop(PAMAbortId.projectDetail(routeKey));
    };
  }, [pamApi, routeKey, tt.projectNotFound]);

  useStrictEffect(() => {
    void pamFacade.pullCategories();
  }, [pamFacade]);

  useEffect(() => {
    envLoadedForProjectRef.current = '';
    envLoadInflightRef.current = null;
    setEnvironments(null);
    setEnvironmentsLoading(false);
  }, [routeKey]);

  const ensureEnvironments = useCallback(async (): Promise<void> => {
    const id = project?.id ?? '';
    if (!id) {
      return;
    }
    if (envLoadedForProjectRef.current === id) {
      return;
    }
    if (envLoadInflightRef.current) {
      await envLoadInflightRef.current;
      return;
    }

    const load = (async () => {
      setEnvironmentsLoading(true);
      try {
        const list = await pamApi.listEnvironments(id);
        envLoadedForProjectRef.current = id;
        setEnvironments(list);
      } catch (caught) {
        if (isAbortError(caught)) {
          return;
        }
        envLoadedForProjectRef.current = id;
        setEnvironments([]);
      } finally {
        setEnvironmentsLoading(false);
        envLoadInflightRef.current = null;
      }
    })();

    envLoadInflightRef.current = load;
    await load;
  }, [pamApi, project?.id]);

  // Legacy UUID URLs → replace with slug while keeping the current tab.
  useEffect(() => {
    if (!project?.slug || !looksLikeUuid(routeKey)) {
      return;
    }
    if (routeKey === project.slug) {
      return;
    }
    router.replace({
      pathname:
        activeTab === 'environments'
          ? ROUTE_PROJECT_ENVIRONMENTS
          : ROUTE_PROJECT_GENERAL,
      params: { projectId: project.slug }
    });
  }, [project, routeKey, activeTab, router]);

  const canEdit = Boolean(project?.is_owner);
  const canFork =
    Boolean(project) && !canEdit && project?.is_public === PAMPublicType.public;
  const routeSlug = project?.slug || routeKey;
  const resolvedProjectId = project?.id ?? '';

  const onDelete = useCallback((): void => {
    if (!project || !canEdit || deleting) {
      return;
    }
    dialog.confirm({
      okType: 'danger',
      title: tt.deleteTitle,
      content: tt.deleteContent.replace('[name]', project.name),
      onOk: async () => {
        setDeleting(true);
        try {
          await pamFacade.deleteProject(project);
          router.push(ROUTE_PROJECTS);
        } finally {
          setDeleting(false);
        }
      }
    });
  }, [
    project,
    canEdit,
    deleting,
    dialog,
    tt.deleteTitle,
    tt.deleteContent,
    pamFacade,
    router
  ]);

  const detailValue = useMemo<PAMProjectDetailValue>(
    () => ({
      projectId: resolvedProjectId,
      project,
      loading,
      error,
      canEdit,
      deleting,
      requestDeleteProject: onDelete,
      setProject,
      environments,
      environmentsLoading,
      ensureEnvironments,
      setEnvironments
    }),
    [
      resolvedProjectId,
      project,
      loading,
      error,
      canEdit,
      deleting,
      onDelete,
      environments,
      environmentsLoading,
      ensureEnvironments
    ]
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
            href={ROUTE_PROJECTS}
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
              {canFork && project ? (
                <PAMProjectForkButton projectId={project.id} tt={tt} />
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
                params: { projectId: routeSlug }
              }}
              className={tabClass('general')}
            >
              {tt.tabGeneral}
            </Link>
            <Link
              href={{
                pathname: ROUTE_PROJECT_ENVIRONMENTS,
                params: { projectId: routeSlug }
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
