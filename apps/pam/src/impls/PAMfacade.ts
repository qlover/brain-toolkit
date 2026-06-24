import {
  type StoreInterface,
  type ResourceSearchResult,
  AsyncStore,
  createAsyncState,
  AsyncStoreStateInterface,
  GatewayResult
} from '@qlover/corekit-bridge';
import { cloneDeep } from 'lodash';
import {
  PAMViewMode,
  type PAMFacadeInterface,
  type PAMFacadeStateInterface
} from '@/interface/PAMFacadeInterface';
import { inject, injectable } from '@shared/container';
import { defaultSearchParams } from '@config/common';
import { I } from '@config/ioc-identifiter';
import type {
  PAMApiProjectSchemaType,
  PAMProjectCreateWithEnvSchemaType,
  PAMProjectWithEnvironmentsSchemaType,
  PAMSearchParams
} from '@schemas/PAMProjectSchema';
import { PAMApi } from './appApi/PAMApi';
import type { LoggerInterface } from '@qlover/logger';

function defaultFacadeState(): PAMFacadeStateInterface<PAMApiProjectSchemaType> {
  return Object.assign<
    PAMFacadeStateInterface<PAMApiProjectSchemaType>,
    Partial<PAMFacadeStateInterface<PAMApiProjectSchemaType>>
  >(createAsyncState(), {
    result: {
      page: defaultSearchParams.page,
      pageSize: defaultSearchParams.pageSize,
      total: 0,
      items: []
    },
    searchParams: cloneDeep(defaultSearchParams),
    projects: [],
    viewMode: PAMViewMode.Compact,
    openDialog: false
  });
}

@injectable()
export class PAMFacade implements PAMFacadeInterface<PAMApiProjectSchemaType> {
  @inject(I.Logger)
  protected readonly logger!: LoggerInterface;

  protected searchStore: AsyncStore<
    PAMFacadeStateInterface<PAMApiProjectSchemaType>,
    string
  >;

  /**
   * 仅用于创建 pam 时的状态
   */
  protected createStore: AsyncStore<
    AsyncStoreStateInterface<PAMApiProjectSchemaType>,
    string
  >;
  constructor(
    @inject(PAMApi)
    protected readonly pamApi: PAMApi
  ) {
    this.searchStore = new AsyncStore({ defaultState: defaultFacadeState });
    this.createStore = new AsyncStore();
  }

  /**
   * @override
   */
  public getFacadeStore(): StoreInterface<
    PAMFacadeStateInterface<PAMApiProjectSchemaType>
  > {
    return this.searchStore.getStore();
  }

  public getCreateStore(): StoreInterface<
    AsyncStoreStateInterface<PAMApiProjectSchemaType>
  > {
    return this.createStore.getStore();
  }

  /**
   * @override
   */
  public pullProjectList(
    params?: PAMSearchParams
  ): Promise<ResourceSearchResult<PAMApiProjectSchemaType>> {
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
    data: PAMProjectCreateWithEnvSchemaType
  ): Promise<GatewayResult<PAMProjectWithEnvironmentsSchemaType>> {
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
}
