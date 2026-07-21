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
import { defaultSearchParams, pamViewModeStorageKey } from '@config/common';
import { I } from '@config/ioc-identifiter';
import type {
  SearchPAMProject,
  PAMSearchParams,
  PAMProjectDetail,
  PAMProjectCreate,
  PAMProjectUpdate
} from '@schemas/PAMProjectSchema';
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
   * ????? pam ????
   */
  protected createStore: AsyncStore<
    AsyncStoreStateInterface<SearchPAMProject>,
    string
  >;

  /**
   * ????? pam ????
   */
  protected detailStore: AsyncStore<
    AsyncStoreStateInterface<PAMProjectDetail>,
    string
  >;

  constructor(
    @inject(PAMApi)
    protected readonly pamApi: PAMApi,
    @inject(I.LocalStorage)
    localStorage: StorageInterface<string, unknown>
  ) {
    this.searchStore = new AsyncStore({
      /**
       * corekit-bridge 3.4 persistence:
       * - `persist`: KeyStorage binds one localStorage key
       * - `persistKeys`: only these state fields are written / restored
       * - `initRestore`: hydrate on construct
       * - `emit` / `success` / ? auto-persist the picked snapshot
       */
      persist: new KeyStorage<
        string,
        Partial<PAMFacadeStateInterface<SearchPAMProject>>
      >(
        pamViewModeStorageKey,
        localStorage as StorageInterface<
          string,
          Partial<PAMFacadeStateInterface<SearchPAMProject>>
        >
      ),
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
       * ???????????? result ???? items ??
       *
       * ??????????????????????????? result ?? items ??
       *
       * @default `true`
       */
      resetResult?: boolean;
      /**
       * ?????? projects ?????
       *
       * - `'push'` ???????? projects ???, ??????
       * - `'replace'` ??????? projects ??????, ??????
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

    return this.pamApi
      .searchProjects(mergedParams)
      .then((response) => {
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
   * ??????????,????????
   *
   * ??? ????????? 1 ??????????
   *
   * FIXME: ?????????, ????,???????
   * ???? offset + pageSize ?????
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

        // ?? projects ????, ????????
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

    // ???? dialog
    this.openDialog();

    // ????????list ????
    // ?????? env ??, ?????? await??????????
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
        // ?????????????????
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
    // emit auto-persists `{ viewMode }` via persistKeys
    this.searchStore.emit({
      viewMode: mode
    });
  }

  public async deleteProject(project: SearchPAMProject): Promise<void> {
    await this.pamApi.deleteProject(project.id);
    // ???? await,??????
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
      resetResult: true,
      projectsStrategy: ProjectsStrategy.Replace,
      keyword
    });
  }
}
