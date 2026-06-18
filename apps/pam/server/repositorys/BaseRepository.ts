import type {
  RepoSearchParams,
  RepositoryInterface
} from '@server/interfaces/DBBridgeInterface';
import type { ResourceSearchResult } from '@qlover/corekit-bridge';

/**
 * 一个抽象的中间层，可扩展一些通用能力
 */
export abstract class BaseRepository<T> implements RepositoryInterface<T> {
  constructor(public repoName: string = '') {}

  /**
   * @override
   */
  public getName(): string {
    if (!this.repoName) {
      throw new Error(
        Object.getPrototypeOf(this).constructor.name + ' must have a repoName'
      );
    }
    return this.repoName;
  }

  /**
   * @override
   */
  public abstract search(
    params: RepoSearchParams<T>
  ): Promise<ResourceSearchResult<T>>;
}
