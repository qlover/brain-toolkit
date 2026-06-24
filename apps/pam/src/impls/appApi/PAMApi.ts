import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import { API_PAM_CREATE, API_PAM_SEARCH } from '@config/apiRoutes';
import {
  PAMApiProjectSchemaType,
  PAMProjectCreateWithEnvSchemaType,
  PAMProjectWithEnvironmentsSchemaType,
  PAMSearchParams
} from '@schemas/PAMProjectSchema';
import { AppApiSuccessInterface } from '@interfaces/AppApiInterface';
import { AppApiRequester } from './AppApiRequester';

@injectable()
export class PAMApi {
  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  public async searchProjects(
    params: PAMSearchParams
  ): Promise<ResourceSearchResult<PAMApiProjectSchemaType>> {
    const response = await this.appApiRequester.get<
      AppApiSuccessInterface<ResourceSearchResult<PAMApiProjectSchemaType>>,
      PAMSearchParams
    >(API_PAM_SEARCH, {
      params: {
        ...params,
        sort: JSON.stringify(params.sort)
      }
    });

    // 使用了 AppApiPlugin 插件会自动处理 AppApiErrorInterface 情况
    // if (!response.data.success) {
    //   throw new Error(response.data.message);
    // }

    return response.data.data!;
  }

  public async createProject(
    data: PAMProjectCreateWithEnvSchemaType
  ): Promise<PAMProjectWithEnvironmentsSchemaType> {
    const response = await this.appApiRequester.post<
      AppApiSuccessInterface<PAMProjectWithEnvironmentsSchemaType>,
      PAMProjectCreateWithEnvSchemaType
    >(API_PAM_CREATE, data);

    return response.data.data!;
  }
}
