'use client';

import { useMountedClient } from '@brain-toolkit/react-kit';
import {
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { AsyncStoreStatus } from '@qlover/corekit-bridge';
import {
  useStore,
  useStrictEffect,
  usePageI18nMapping
} from '@qlover/next-kit/client';
import { clsx } from 'clsx';
import { useRouter } from '@/i18n/routing';
import { PAMFacade, ProjectsStrategy } from '@/impls/PAMfacade';
import { PAMFacadeInfinite } from '@/impls/PAMFacadeInfinite';
import { PAMViewMode } from '@/interface/PAMFacadeInterface';
import type { PAMI18nInterface } from '@config/i18n-mapping/PAMI18n';
import { mergePamCategories } from '@config/pamCategories';
import { ROUTE_PROJECT_GENERAL } from '@config/route';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { PAMForm, PAM_PROJECT_FORM_ID } from '../components/pam/PAMForm';
import { PAMLoadMoreTrigger } from '../components/pam/PAMLoadMoreTrigger';
import { PAMProjectList } from '../components/pam/PAMProjectList';
import { PAMToolbar } from '../components/pam/PAMToolbar';
import { ResponsiveModal } from '../components/ResponsiveModal';
import { useIOC } from '../hook/useIOC';
import { useUserAuth } from '../hook/useUserAuth';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';

export type PAMRootProps = {
  /** First-page public projects from RSC/ISR (auth merge happens client-side). */
  initialList?: ResourceSearchResult<SearchPAMProject> | null;
  /** Public categories from RSC/ISR (avoids waiting on `/api/pam/categories`). */
  initialCategories?: readonly string[] | null;
};

function categoryFromFilters(filters: unknown): string {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return '';
  }
  const category = (filters as { category?: unknown }).category;
  return typeof category === 'string' ? category.trim() : '';
}

function visibilityFromFilters(filters: unknown): string {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
    return '';
  }
  const visibility = (filters as { visibility?: unknown }).visibility;
  if (visibility === 'public' || visibility === 'private') {
    return visibility;
  }
  return '';
}

function visibilitySummaryLabel(value: string, tt: PAMI18nInterface): string {
  if (value === 'public') {
    return tt.public;
  }
  if (value === 'private') {
    return tt.private;
  }
  return '';
}

export function PAMRoot({
  initialList = null,
  initialCategories = null
}: PAMRootProps) {
  const tt = usePageI18nMapping<PAMI18nInterface>();
  const mounted = useMountedClient();
  const {
    success: isAuthenticated,
    loading: authLoading,
    user
  } = useUserAuth();
  const router = useRouter();

  const pamFacade = useIOC(PAMFacade);
  const pamFacadeInfinite = useIOC(PAMFacadeInfinite);
  const pamFacadeStore = pamFacade.getFacadeStore();
  const createState = useStore(pamFacade.getCreateStore());
  const isSubmitting = createState.loading;
  const openDialog = useStore(pamFacadeStore, (state) => state.openDialog);

  const storeProjects = useStore(
    pamFacadeStore,
    (state) => state.projects || []
  );
  const listLoading = useStore(pamFacadeStore, (state) => state.loading);
  const persistedViewMode = useStore(pamFacadeStore, (state) => state.viewMode);
  const searchKeyword = useStore(
    pamFacadeStore,
    (state) => state.searchParams.keyword?.trim() || ''
  );
  const searchFilters = useStore(
    pamFacadeStore,
    (state) => state.searchParams.filters
  );
  const resultTotal = useStore(pamFacadeStore, (state) => {
    const apiTotal = state.result?.total;
    const loaded = state.projects?.length ?? 0;
    // Keyword/join search can return items while PostgREST count is null→0.
    if (typeof apiTotal === 'number' && apiTotal > 0) {
      return apiTotal;
    }
    return loaded;
  });

  const listStatus = useStore(pamFacadeStore, (state) => state.status);
  const categoryValue = categoryFromFilters(searchFilters);
  const visibilityValue = visibilityFromFilters(searchFilters);
  const storeCategories = useStore(pamFacadeStore, (state) => state.categories);

  // DRAFT = never fetched; after first pull (PENDING/SUCCESS/FAILED) trust store
  // even when `projects` is empty, so empty search does not fall back to SSR list.
  const listTouched = listStatus !== AsyncStoreStatus.DRAFT;

  const projects = listTouched ? storeProjects : (initialList?.items ?? []);

  // Chips = API/ISR categories ∪ categories already on the visible list
  // (avoids SSR showing 2 then jumping when list has a 3rd label).
  const categories = mergePamCategories([
    ...(storeCategories.length > 0
      ? storeCategories
      : (initialCategories ?? [])),
    ...projects.map((project) => project.category ?? '')
  ]);

  // Keep SSR + first client paint on Compact; apply persisted mode after mount.
  const viewMode = mounted ? persistedViewMode : PAMViewMode.Compact;

  const hasActiveFilter =
    searchKeyword.length > 0 ||
    categoryValue.length > 0 ||
    visibilityValue.length > 0;
  const searchingWithRows = listLoading && projects.length > 0;

  // Wait for session restore so we do not pull as guest then again as user.
  useStrictEffect(() => {
    if (initialCategories?.length) {
      pamFacade.hydrateCategories(initialCategories);
    }
  }, [pamFacade, initialCategories]);

  useStrictEffect(() => {
    if (authLoading) {
      return;
    }
    void pamFacade.ensureHomeProjectList({
      initialList,
      userId: user?.id ?? null
    });
    // Soft-refresh so private-project categories appear after login.
    if (user?.id) {
      void pamFacade.pullCategories();
    }
  }, [pamFacade, initialList, authLoading, user?.id]);

  useStrictEffect(() => {
    if (authLoading || user?.id || visibilityValue !== 'private') {
      return;
    }
    void pamFacade.searchProjectWithVisibility('');
  }, [authLoading, user?.id, visibilityValue, pamFacade]);

  const closeDialog = () => pamFacade.closeDialog();

  const clearFilters = () => {
    void pamFacade.pullProjectList({
      page: 1,
      resetResult: false,
      projectsStrategy: ProjectsStrategy.Replace,
      keyword: '',
      filters: undefined
    });
  };

  const summaryText = (() => {
    const parts: string[] = [];
    if (searchKeyword) {
      parts.push(
        tt.searchResultSummary
          .replace('%keyword%', searchKeyword)
          .replace('%count%', String(resultTotal))
      );
    }
    if (visibilityValue) {
      parts.push(
        tt.visibilityFilterSummary
          .replace('%visibility%', visibilitySummaryLabel(visibilityValue, tt))
          .replace('%count%', String(resultTotal))
      );
    }
    if (categoryValue) {
      parts.push(
        tt.categoryFilterSummary
          .replace('%category%', categoryValue)
          .replace('%count%', String(resultTotal))
      );
    }
    if (parts.length === 0) {
      return '';
    }
    const activeCount = [searchKeyword, visibilityValue, categoryValue].filter(
      Boolean
    ).length;
    if (activeCount > 1) {
      const keywordPart = searchKeyword
        ? tt.searchResultSummary
            .replace('%keyword%', searchKeyword)
            .replace('%count%', String(resultTotal))
        : '';
      const visibilityPart = visibilityValue
        ? visibilitySummaryLabel(visibilityValue, tt)
        : '';
      const categoryPart = categoryValue || '';
      return [keywordPart, visibilityPart, categoryPart]
        .filter(Boolean)
        .join(' · ');
    }
    return parts[0] ?? '';
  })();

  return (
    <div
      data-testid="PAMRoot"
      className={clsx(
        'mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 sm:py-4 md:py-8 lg:px-8',
        isAuthenticated && 'max-sm:pb-20'
      )}
    >
      <PAMToolbar
        tt={tt}
        facadeInterface={pamFacade}
        categoryValue={categoryValue}
        onCategoryChange={(value) => {
          void pamFacade.searchProjectWithCategory(value);
        }}
        visibilityValue={visibilityValue}
        onVisibilityChange={(value) => {
          void pamFacade.searchProjectWithVisibility(value);
        }}
        showPrivateVisibility={isAuthenticated}
        viewMode={viewMode}
        onViewModeChange={(mode) => pamFacade.changeViewMode(mode)}
        categories={categories}
        canCreate={isAuthenticated}
        searching={listLoading}
        onCreate={() => {
          if (!isAuthenticated) return;
          pamFacade.openDialog();
        }}
      />

      {hasActiveFilter ? (
        <div
          data-testid="PAMSearchSummary"
          className="mb-2 flex flex-wrap items-center justify-between gap-1.5 text-xs text-secondary-text sm:mb-4 sm:gap-2 sm:text-sm"
        >
          <p className="min-w-0 truncate">{summaryText}</p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-0.5 text-brand transition hover:bg-brand/10 sm:px-2 sm:py-1"
          >
            <XMarkIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {tt.clearFilters}
          </button>
        </div>
      ) : null}

      <PAMProjectList
        tt={tt}
        projects={projects}
        viewMode={viewMode}
        loading={listLoading && projects.length === 0}
        searching={searchingWithRows}
        emptyFiltered={hasActiveFilter}
        highlightKeyword={searchKeyword}
        highlightCategory={categoryValue}
        isAuthenticated={isAuthenticated}
        isOwner={(data) => !!data.is_owner}
      />

      <PAMLoadMoreTrigger
        loadingText={tt.loadingText}
        noMoreText={tt.noMoreText}
        errorText={tt.errorText}
        loadMoreText={tt.loadMoreText}
        infiniteFacade={pamFacadeInfinite}
        skipInitialLoad
      />

      <ResponsiveModal
        open={isAuthenticated && openDialog}
        title={tt.createProjectTitle}
        onClose={closeDialog}
        footer={
          <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isSubmitting}
              className="w-full cursor-pointer rounded-[10px] border border-primary-border px-4 py-2.5 text-sm text-secondary-text transition hover:bg-elevated disabled:opacity-50 sm:w-auto sm:px-6 sm:py-3 sm:text-base"
            >
              {tt.formCancel}
            </button>
            <button
              type="submit"
              form={PAM_PROJECT_FORM_ID}
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-brand px-4 py-2.5 text-sm font-medium text-on-brand shadow-sm transition hover:bg-brand-hover active:bg-brand-active disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-35 sm:px-6 sm:py-3 sm:text-base"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  {tt.formSaveing}
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4" />
                  {tt.formSave}
                </>
              )}
            </button>
          </div>
        }
      >
        <PAMForm
          tt={tt}
          formId={PAM_PROJECT_FORM_ID}
          showActions={false}
          isSubmitting={isSubmitting}
          categories={categories}
          onCancel={closeDialog}
          onSubmit={async (data) => {
            const result = await pamFacade.createProject(data);
            if (result.data?.id) {
              router.push({
                pathname: ROUTE_PROJECT_GENERAL,
                params: { projectId: result.data.slug }
              });
              void pamFacade.pullCategories();
            }
          }}
        />
      </ResponsiveModal>
    </div>
  );
}
