import { SearchParamsValidator } from '@qlover/next-kit/common';
import { inject, injectable } from '@shared/container';
import { RequestLogsAdminRepo } from '@server/repositorys/RequestLogsAdminRepo';
import type {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import type {
  RequestLogRow,
  ValidatorInterface
} from '@qlover/next-kit/common';

@injectable()
export class AdminRequestLogsController {
  constructor(
    @inject(SearchParamsValidator)
    protected readonly searchParamsValidator: ValidatorInterface<ResourceSearchParams>,
    @inject(RequestLogsAdminRepo)
    protected readonly requestLogsAdminRepo: RequestLogsAdminRepo
  ) {}

  public async searchAll(
    query: unknown
  ): Promise<ResourceSearchResult<RequestLogRow>> {
    const criteria = await this.searchParamsValidator.getThrow(query);
    return this.requestLogsAdminRepo.searchAll(criteria);
  }
}
