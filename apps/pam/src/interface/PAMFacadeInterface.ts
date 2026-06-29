import type {
  SearchPAMProject,
  PAMSearchParams,
  PAMProjectDetail,
  PAMProjectUpdate
} from '@schemas/PAMProjectSchema';
import type {
  AsyncStoreStateInterface,
  GatewayResult,
  ResourceSearchParams,
  ResourceSearchResult,
  StoreInterface
} from '@qlover/corekit-bridge';
import type { ValueOf } from '@qlover/fe-corekit';

export const PAMViewMode = {
  Card: 'card',
  Compact: 'compact'
} as const;

export type PAMViewModeType = ValueOf<typeof PAMViewMode>;

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
export interface PAMFacadeStateInterface<T extends SearchPAMProject>
  extends AsyncStoreStateInterface<ResourceSearchResult<T>> {
  /**
   * 拉取list 请求参数
   *
   * 比如 page, pageSize, sort, keyword 等参数
   */
  searchParams: ResourceSearchParams;

  /**
   * 额外保存的拉取的所有项目数据
   */
  projects: T[];

  /**
   * 列表显示的两种模式
   */
  viewMode: PAMViewModeType;

  /**
   * 是否打开 新增/编辑 项目对话框
   */
  openDialog: boolean;
}

/**
 * 该接口用于描述前端操作 pam 相关的业务逻辑接口
 */
export interface PAMFacadeInterface<T extends SearchPAMProject> {
  getFacadeStore(): StoreInterface<PAMFacadeStateInterface<T>>;

  /**
   * 该方法用于拉取项目列表
   *
   * 同时会更新到最新的状态中，并返回当次拉取的项目列表
   * @param params
   */
  pullProjectList(params?: PAMSearchParams): Promise<ResourceSearchResult<T>>;

  /**
   * 创建一个新的项目，允许传入环境信息
   *
   * 这里使用了 GatewayResult 作为返回结果，就是期望方法不会抛出错误，而是返回错误信息
   *
   * @param data
   */
  createProject(
    data: SearchPAMProject
  ): Promise<GatewayResult<PAMProjectDetail>>;

  /**
   * 更新一个项目，允许传入环境信息
   *
   * @param id
   * @param data
   */
  updateProject(
    id: string,
    data: PAMProjectUpdate
  ): Promise<GatewayResult<PAMProjectDetail>>;

  /**
   *
   * @param keyword
   */
  searchProjectWithKeyword(keyword: string): Promise<ResourceSearchResult<T>>;
}
