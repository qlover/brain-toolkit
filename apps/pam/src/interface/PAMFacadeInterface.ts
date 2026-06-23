import type {
  PAMProjectSchemaType,
  PAMSearchParams
} from '@schemas/PAMProjectSchema';
import type {
  AsyncStoreStateInterface,
  ResourceSearchResult,
  StoreInterface
} from '@qlover/corekit-bridge';

/**
 * 该接口用于描述前端操作 pam 列表相关的业务状态接口
 *
 * 对应方法 {@link PAMFacadeInterface.pullProjectList} 返回的当次数据
 *
 * 其中 AsyncStateInterface 是包含 loading, result, error 等异步状态的数据
 *
 * **注意不是所有数据**
 *
 * 所有数据应该额外保存
 */
export interface PAMSearchStateInterface<T extends PAMProjectSchemaType>
  extends AsyncStoreStateInterface<ResourceSearchResult<T>> {
  /**
   * 拉取list 请求参数
   *
   * 比如 page, pageSize, sort, keyword 等参数
   */
  searchParams: PAMSearchParams;

  /**
   * 额外保存的拉取的所有项目数据
   */
  projects: T[];
}

/**
 * 该接口用于描述前端操作 pam 相关的业务逻辑接口
 */
export interface PAMFacadeInterface<T extends PAMProjectSchemaType> {
  getSearchStore(): StoreInterface<PAMSearchStateInterface<T>>;

  /**
   * 该方法用于拉取项目列表
   *
   * 同时会更新到最新的状态中，并返回当次拉取的项目列表
   * @param params
   */
  pullProjectList(params?: PAMSearchParams): Promise<ResourceSearchResult<T>>;
}
