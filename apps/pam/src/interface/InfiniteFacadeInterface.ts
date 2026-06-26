import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import type { PAMFacadeStateInterface } from './PAMFacadeInterface';
import type {
  ResourceSearchResult,
  StoreInterface
} from '@qlover/corekit-bridge';

/**
 * 用于无限滚动交互的接口定义
 *
 * @template T 数据节点
 */
export interface InfiniteFacadeInterface<T extends SearchPAMProject> {
  getStore(): StoreInterface<PAMFacadeStateInterface<T>>;
  /**
   * 设置滚动到底部的监听节点
   *
   * @param node
   */
  setSentinelRef(node?: Element | null | undefined): void;

  /**
   * 用于加载数据方法
   */
  loadMore(): Promise<ResourceSearchResult<T>>;
}
