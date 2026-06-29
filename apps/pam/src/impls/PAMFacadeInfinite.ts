import {
  AsyncStoreStatus,
  type ResourceSearchResult,
  type StoreInterface
} from '@qlover/corekit-bridge';
import type { InfiniteFacadeInterface } from '@/interface/InfiniteFacadeInterface';
import { PAMFacadeStateInterface } from '@/interface/PAMFacadeInterface';
import { inject, injectable } from '@shared/container';
import { I } from '@config/ioc-identifiter';
import type { SearchPAMProject } from '@schemas/PAMProjectSchema';
import { PAMFacade, ProjectsStrategy } from './PAMfacade';
import type { LoggerInterface } from '@qlover/logger';

@injectable()
export class PAMFacadeInfinite
  implements InfiniteFacadeInterface<SearchPAMProject>
{
  @inject(I.Logger)
  protected readonly logger!: LoggerInterface;
  @inject(PAMFacade)
  protected readonly facade!: PAMFacade;

  protected sentinelRef?: Element;

  /**
   * @override
   */
  public getStore(): StoreInterface<PAMFacadeStateInterface<SearchPAMProject>> {
    return this.facade.getFacadeStore();
  }

  /**
   * @override
   */
  public setSentinelRef(node?: Element | null | undefined): void {
    if (node) {
      this.sentinelRef = node;
    }
  }

  /**
   * @override
   */
  public loadMore(): Promise<ResourceSearchResult<SearchPAMProject>> {
    const state = this.getStore().getState();

    if (state.loading || state.status === AsyncStoreStatus.PENDING) {
      return Promise.resolve(state.result!);
    }

    if (state.searchParams.page == null) {
      throw new Error('page is not set');
    }

    if (state.result?.hasMore === false) {
      return Promise.resolve(state.result!);
    }

    // 控制请求间隔不要太快
    if (state.endTime && Date.now() - state.endTime < 500) {
      this.logger.debug('PAMFacadeInfinite loadMore too fast(500ms)');
      return Promise.resolve(state.result!);
    }

    // 每次自动新增一页
    const lastPage = state.searchParams.page;
    const newPage =
      state.status === AsyncStoreStatus.DRAFT ? lastPage : lastPage + 1;
    this.logger.debug(
      `PAMFacadeInfinite loadMore lastPage ${lastPage}, newPage ${newPage}`
    );

    return this.facade.pullProjectList({
      page: newPage,
      projectsStrategy: ProjectsStrategy.Push
    });
  }
}
