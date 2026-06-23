import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import { API_PAM_SEARCH } from '@config/apiRoutes';
import {
  PAMProjectSchemaType,
  PAMSearchParams
} from '@schemas/PAMProjectSchema';
import { AppApiRequester } from './AppApiRequester';

@injectable()
export class PAMApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async searchProjects(
    params: PAMSearchParams
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
    const response = await this.appApiRequester.get(API_PAM_SEARCH, {
      params: {
        ...params,
        sort: JSON.stringify(params.sort)
      }
    });

    // FIXME: 类型问题
    return response.data.data;
  }
}
