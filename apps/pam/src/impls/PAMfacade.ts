/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  type StoreInterface,
  type ResourceSearchResult,
  AsyncStore,
  createAsyncState,
  AsyncStoreStateInterface,
  GatewayResult
} from '@qlover/corekit-bridge';
import { KeyStorage, type StorageInterface } from '@qlover/fe-corekit/storage';
import { cloneDeep, find } from 'lodash-es';
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
  PAMProjectCreate,
  PAMProjectUpdate
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
    openDialog: false
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

  /**
   * 仅用于创建 pam 时的状态
   */
  protected detailStore: AsyncStore<
    AsyncStoreStateInterface<PAMProjectDetail>,
    string
  >;

  /** Latest list request id — stale responses are ignored. */
  protected listRequestId = 0;

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
    this.detailStore = new AsyncStore();
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

  public getDetailStore(): StoreInterface<
    AsyncStoreStateInterface<SearchPAMProject>
  > {
    return this.detailStore.getStore();
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

  /**
   * @override
   */
  public updateProject(
    id: string,
    data: PAMProjectUpdate
  ): Promise<GatewayResult<PAMProjectDetail>> {
    this.createStore.start();

    return this.pamApi
      .updateProject(id, data)
      .then((response) => {
        this.createStore.success(response);

        // 更新 projects 中的数据, 不用拉取列表数据
        this.searchStore.emit({
          projects: this.searchStore
            .getState()
            .projects.map((item) => (item.id === id ? response : item))
        });

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
    this.detailStore.reset();
    this.searchStore.emit({ openDialog: true });
  }

  public closeDialog(): void {
    this.searchStore.emit({ openDialog: false });
    this.detailStore.reset();
  }

  public triggerEdit(id: string): void {
    const projects = this.getFacadeStore().getState().projects ?? [];
    const target = find(projects, ['id', id]);

    if (!target) {
      this.logger.warn('PAMFacade.triggerEdit project not found');
      return;
    }

    if (!target.is_owner) {
      this.logger.warn('PAMFacade.triggerEdit project not authorized');
      return;
    }

    // 同时打开 dialog
    this.openDialog();

    // 先给详细数据设置list 中的数据
    // 然后后台拉取 env 变量, 这里不要使用 await，不然后阻塞打开弹窗
    this.getProjectDetail(id, target);
  }

  public getProjectDetail(
    id: string,
    preProject?: SearchPAMProject
  ): Promise<GatewayResult<PAMProjectDetail>> {
    this.detailStore.start(preProject);

    return this.pamApi
      .getProjectDetail({ id })
      .then((result) => {
        // 为了防止丢失基础数据，改用合并更新
        if (preProject) {
          const newResult = Object.assign({}, preProject, result);
          this.detailStore.success(newResult);
          return { data: newResult, error: null };
        }

        this.detailStore.success(result);
        return { data: result, error: null };
      })
      .catch((error) => {
        this.detailStore.failed(error);
        return { data: null, error };
      });
  }

  public changeViewMode(mode: PAMViewModeType): void {
    this.searchStore.emit({
      viewMode: mode
    });
  }

  public async deleteProject(project: SearchPAMProject): Promise<void> {
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
}
