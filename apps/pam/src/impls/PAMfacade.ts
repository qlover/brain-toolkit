import {
  type StoreInterface,
  type ResourceSearchResult,
  AsyncStore,
  createAsyncState
} from '@qlover/corekit-bridge';
import { cloneDeep } from 'lodash';
import type {
  PAMFacadeInterface,
  PAMSearchStateInterface
} from '@/interface/PAMFacadeInterface';
import { inject, injectable } from '@shared/container';
import { defaultSearchParams } from '@config/common';
import type {
  PAMProjectSchemaType,
  PAMSearchParams
} from '@schemas/PAMProjectSchema';
import { PAMApi } from './appApi/PAMApi';

@injectable()
export class PAMFacade implements PAMFacadeInterface<PAMProjectSchemaType> {
  protected searchStore: AsyncStore<
    PAMSearchStateInterface<PAMProjectSchemaType>,
    string
  >;
  constructor(
    @inject(PAMApi)
    protected readonly pamApi: PAMApi
  ) {
    this.searchStore = new AsyncStore<
      PAMSearchStateInterface<PAMProjectSchemaType>,
      string
    >({
      defaultState() {
        return Object.assign(createAsyncState(), {
          result: {
            total: 0,
            items: []
          },
          searchParams: cloneDeep(defaultSearchParams),
          projects: []
        });
      }
    });
  }

  /**
   * @override
   */
  public getSearchStore(): StoreInterface<
    PAMSearchStateInterface<PAMProjectSchemaType>
  > {
    return this.searchStore.getStore();
  }
  /**
   * @override
   */
  public pullProjectList(
    params?: PAMSearchParams
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
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
        return this.getSearchStore().getState().result!;
      });
  }
}
