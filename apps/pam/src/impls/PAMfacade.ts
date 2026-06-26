import {
  type StoreInterface,
  type ResourceSearchResult,
  AsyncStore,
  createAsyncState,
  AsyncStoreStateInterface,
  GatewayResult
} from '@qlover/corekit-bridge';
import { cloneDeep, find } from 'lodash';
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
import { PAMApi } from './appApi/PAMApi';
import type { LoggerInterface } from '@qlover/logger';

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
        ...cloneDeep(defaultSearchParams.sort)
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

  constructor(
    @inject(PAMApi)
    protected readonly pamApi: PAMApi
  ) {
    this.searchStore = new AsyncStore({ defaultState: defaultFacadeState });
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
    params?: PAMSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const mergedParams = Object.assign(
      {},
      this.searchStore.getState().searchParams,
      params
    );

    this.searchStore.start();

    return this.pamApi
      .searchProjects(mergedParams)
      .then((response) => {
        this.searchStore.success(response);
        this.searchStore.emit({
          searchParams: mergedParams
        });

        return response;
      })
      .catch((error) => {
        this.searchStore.failed(error);
        return this.getFacadeStore().getState().result!;
      });
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
    const projects = this.getFacadeStore().getState().result?.items ?? [];
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
  }
}
