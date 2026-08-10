/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type StoreInterface,
  type ResourceSearchResult,
  AsyncStore,
  AsyncStoreStatus,
  createAsyncState,
  AsyncStoreStateInterface,
  GatewayResult
} from '@qlover/corekit-bridge';
import { KeyStorage, type StorageInterface } from '@qlover/fe-corekit/storage';
import { cloneDeep } from 'lodash-es';
import {
  PAMViewMode,
  PAMViewModeType,
  type PAMFacadeInterface,
  type PAMFacadeStateInterface
} from '@/interface/PAMFacadeInterface';
import { inject, injectable } from '@shared/container';
import { defaultSearchParams } from '@config/common';
import { I } from '@config/ioc-identifiter';
import type {
  SearchPAMProject,
  PAMSearchParams,
  PAMProjectDetail,
  PAMProjectCreate
} from '@schemas/PAMProjectSchema';
import type { SeedSrcConfigInterface } from '@interfaces/SeedConfigInterface';
import { PAMApi } from './appApi/PAMApi';
import type { ValueOf } from '@qlover/fe-corekit/common';
import type { LoggerInterface } from '@qlover/logger';

export const ProjectsStrategy = {
  Push: 'push',
  Replace: 'replace'
} as const;

export type ProjectsStrategyType = ValueOf<typeof ProjectsStrategy>;

function defaultFacadeState(): PAMFacadeStateInterface<SearchPAMProject> {
  return Object.assign<
    PAMFacadeStateInterface<SearchPAMProject>,
    Partial<PAMFacadeStateInterface<SearchPAMProject>>
  >(createAsyncState(), {
    result: {
      page: defaultSearchParams.page,
      pageSize: defaultSearchParams.pageSize,
      total: 0,
      items: []
    },
    searchParams: {
      page: defaultSearchParams.page,
      pageSize: defaultSearchParams.pageSize,
      sort: [
        { orderBy: 'is_public', order: 'desc' },
        ...cloneDeep(defaultSearchParams.sort),
        { orderBy: 'id', order: 'desc' }
      ]
    },
    projects: [],
    viewMode: PAMViewMode.Compact,
    openDialog: false,
    categories: []
  });
}

@injectable()
export class PAMFacade implements PAMFacadeInterface<SearchPAMProject> {
  @inject(I.Logger)
  protected readonly logger!: LoggerInterface;

  protected searchStore: AsyncStore<
    PAMFacadeStateInterface<SearchPAMProject>,
    string
  >;

  /**
   * 仅用于创建 pam 时的状态
   */
  protected createStore: AsyncStore<
    AsyncStoreStateInterface<SearchPAMProject>,
    string
  >;

  /** Latest list request id — stale responses are ignored. */
  protected listRequestId = 0;

  /**
   * Home-list scope key: `'anon'` or logged-in user id.
   * Not persisted — session memory only for `ensureHomeProjectList`.
   */
  protected homeListOwnerKey: string | null = null;

  constructor(
    @inject(PAMApi)
    protected readonly pamApi: PAMApi,
    @inject(I.LocalStorage)
    localStorage: StorageInterface<string, any>,
    @inject(I.AppConfig)
    config: SeedSrcConfigInterface
  ) {
    this.searchStore = new AsyncStore({
      /**
       * corekit-bridge 3.4: KeyStorage + persistKeys.
       * `initRestore` loads viewMode as soon as the store is created (client).
       * UI must defer applying it until after mount (see PAMRoot + useMountedClient)
       * so SSR HTML stays on the default Compact.
       */
      persist: new KeyStorage(config.pamStorageKey, localStorage),
      persistKeys: ['viewMode'],
      initRestore: true,
      defaultState: () => defaultFacadeState()
    });
    this.createStore = new AsyncStore();
  }

  /**
   * @override
   */
  public getFacadeStore(): StoreInterface<
    PAMFacadeStateInterface<SearchPAMProject>
  > {
    return this.searchStore.getStore();
  }

  public getCreateStore(): StoreInterface<
    AsyncStoreStateInterface<SearchPAMProject>
  > {
    return this.createStore.getStore();
  }

  /**
   * Seed the list store from SSR/ISR public data before the first client fetch.
   * Idempotent — skips if the list already has rows or a request is in flight.
   * Marks scope as `'anon'` when still unset so guests can skip a redundant pull.
   */
  public hydrateInitialList(
    result: ResourceSearchResult<SearchPAMProject>
  ): void {
    const state = this.searchStore.getState();
    if (
      state.projects.length > 0 ||
      state.status === AsyncStoreStatus.PENDING ||
      state.status === AsyncStoreStatus.SUCCESS
    ) {
      return;
    }

    const page = result.page ?? defaultSearchParams.page;
    this.searchStore.success(result);
    this.searchStore.emit({
      searchParams: {
        ...state.searchParams,
        page
      },
      projects: result.items as SearchPAMProject[]
    });
    if (this.homeListOwnerKey === null) {
      this.homeListOwnerKey = 'anon';
    }
  }

  /**
   * Home-page entry: hydrate SSR public list, then pull only when the in-memory
   * list is missing or scoped to a different auth owner (`anon` vs user id).
   * Create/delete keep using {@link reloadProjectListFromFirstPage} and do not
   * clear `homeListOwnerKey` (token-scoped refresh stays valid for that session).
   */
  public async ensureHomeProjectList(options?: {
    readonly initialList?: ResourceSearchResult<SearchPAMProject> | null;
    /** Logged-in user id; null/undefined/empty => guest (`anon`). */
    readonly userId?: string | null;
  }): Promise<void> {
    const initialList = options?.initialList;
    if (initialList?.items?.length) {
      this.hydrateInitialList(initialList);
    }

    const ownerKey = options?.userId?.trim() || 'anon';
    const state = this.searchStore.getState();
    if (state.projects.length > 0 && this.homeListOwnerKey === ownerKey) {
      this.logger.debug(
        `PAMFacade ensureHomeProjectList skip ownerKey=${ownerKey} count=${state.projects.length}`
      );
      return;
    }

    this.logger.debug(
      `PAMFacade ensureHomeProjectList pull ownerKey=${ownerKey} prev=${this.homeListOwnerKey}`
    );

    await this.pullProjectList({
      page: defaultSearchParams.page,
      resetResult: false,
      projectsStrategy: ProjectsStrategy.Replace
    });

    if (this.searchStore.getState().status === AsyncStoreStatus.SUCCESS) {
      this.homeListOwnerKey = ownerKey;
    }
  }

  /**
   * @override
   */
  public pullProjectList(
    params?: PAMSearchParams & {
      /**
       * 每次拉取之前是否重置当前 result 中保存的 items 数据
       *
       * 有些时候会需要保留当前数据的基础上再加载，成功后会替换 result 中的 items 数据
       *
       * @default `true`
       */
      resetResult?: boolean;
      /**
       * 拉取数据后对 projects 的处理策略
       *
       * - `'push'` 每次新数据追加到 projects 状态中, 适合滚动加载
       * - `'replace'` 每次新数据替换 projects 状态中的数据, 适合分页加载
       *
       * @default `'replace'`
       */
      projectsStrategy?: ProjectsStrategyType;
    }
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const {
      projectsStrategy = ProjectsStrategy.Replace,
      resetResult = true,
      ...restParams
    } = params ?? {};

    this.logger.debug(
      `PAMFacade pullProjectList page ${restParams.page}, projectsStrategy ${projectsStrategy}`
    );

    const mergedParams = Object.assign(
      {},
      this.searchStore.getState().searchParams,
      restParams
    );

    this.searchStore.start(
      resetResult ? undefined : this.searchStore.getState().result
    );

    const requestId = ++this.listRequestId;

    return this.pamApi
      .searchProjects(mergedParams)
      .then((response) => {
        if (requestId !== this.listRequestId) {
          this.logger.debug(
            `PAMFacade pullProjectList stale response ignored #${requestId}`
          );
          return response;
        }

        const projects = this.withProjectsStrategy(projectsStrategy, response);

        this.logger.debug(
          `PAMFacade pullProjectList success projects ids`,
          response.items.map((item) => item.id)
        );

        this.searchStore.success(response);
        this.searchStore.emit({
          searchParams: mergedParams,
          projects: projects
        });

        return response;
      })
      .catch((error) => {
        if (requestId !== this.listRequestId) {
          return this.getFacadeStore().getState().result!;
        }
        this.searchStore.failed(error);
        return this.getFacadeStore().getState().result!;
      });
  }

  protected withProjectsStrategy(
    projectsStrategy: ProjectsStrategyType,
    response: ResourceSearchResult<SearchPAMProject>
  ): SearchPAMProject[] {
    switch (projectsStrategy) {
      case ProjectsStrategy.Push:
        return [...this.searchStore.getState().projects, ...response.items];
      case ProjectsStrategy.Replace:
        return response.items as SearchPAMProject[];
    }
  }

  protected reloadProjectListFromFirstPage(): Promise<
    ResourceSearchResult<SearchPAMProject>
  > {
    return this.pullProjectList({
      page: defaultSearchParams.page,
      resetResult: true,
      projectsStrategy: ProjectsStrategy.Replace
    });
  }

  /**
   *
   * 处理创建成功后的逻辑,主要用来重置列表
   *
   * 新增后 重置分页，重新从第 1 页加载（丢弃旧列表）
   *
   * FIXME: 数据完成后重置列表, 重新刷新,未来可考虑使用
   * 未来可用 offset + pageSize 的方式拉取
   *
   * @param response
   */
  protected handlerCreateSuccess(
    response: PAMProjectDetail
  ): Promise<PAMProjectDetail> {
    this.closeDialog();
    return this.reloadProjectListFromFirstPage().then(() => response);
  }

  /**
   * @override
   */
  public createProject(
    data: PAMProjectCreate
  ): Promise<GatewayResult<PAMProjectDetail>> {
    this.createStore.start();

    return this.pamApi
      .createProject(data)
      .then((response) => this.handlerCreateSuccess(response))
      .then((response) => {
        this.createStore.success(response);
        return { data: response, error: null };
      })
      .catch((error) => {
        this.createStore.failed(error);
        return {
          data: null,
          error
        };
      });
  }

  public openDialog(): void {
    this.searchStore.emit({ openDialog: true });
  }

  public closeDialog(): void {
    this.searchStore.emit({ openDialog: false });
  }

  public changeViewMode(mode: PAMViewModeType): void {
    this.searchStore.emit({
      viewMode: mode
    });
  }

  public async deleteProject(project: { id: string }): Promise<void> {
    await this.pamApi.deleteProject(project.id);
    // 这里不要 await,后台完成即可
    this.reloadProjectListFromFirstPage();
  }

  /**
   * @override
   */
  public async searchProjectWithKeyword(
    keyword: string
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    return this.pullProjectList({
      page: defaultSearchParams.page,
      // Keep prior list visible while searching (no empty flash).
      resetResult: false,
      projectsStrategy: ProjectsStrategy.Replace,
      keyword
    });
  }

  /**
   * @override
   */
  public async searchProjectWithCategory(
    category: string
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const trimmed = category.trim();
    const prevFilters = this.searchStore.getState().searchParams.filters;
    const nextFilters: Record<string, unknown> =
      prevFilters &&
      typeof prevFilters === 'object' &&
      !Array.isArray(prevFilters)
        ? { ...(prevFilters as Record<string, unknown>) }
        : {};

    if (trimmed) {
      nextFilters.category = trimmed;
    } else {
      delete nextFilters.category;
    }

    return this.pullProjectList({
      page: defaultSearchParams.page,
      resetResult: false,
      projectsStrategy: ProjectsStrategy.Replace,
      filters: Object.keys(nextFilters).length > 0 ? nextFilters : undefined
    });
  }

  /**
   * Seeds categories from RSC/ISR without clearing a fresher API result.
   *
   * @override
   * @param categories - Public categories from the server
   */
  public hydrateCategories(categories: readonly string[]): void {
    if (!categories.length) {
      return;
    }
    const current = this.searchStore.getState().categories;
    if (current.length > 0) {
      return;
    }
    this.searchStore.emit({ categories: [...categories] });
  }

  /**
   * @override
   */
  public async pullCategories(): Promise<string[]> {
    try {
      const categories = await this.pamApi.listCategories();
      this.searchStore.emit({ categories });
      return categories;
    } catch (error) {
      this.logger.warn('pullCategories failed', error);
      // Keep ISR/hydrated categories on failure; do not wipe to [].
      return this.searchStore.getState().categories;
    }
  }
}
