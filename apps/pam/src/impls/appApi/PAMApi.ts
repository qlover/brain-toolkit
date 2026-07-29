import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import { API_PAM_CREATE, API_PAM_SEARCH } from '@config/apiRoutes';
import {
  buildApiPamDetail,
  buildApiPamDetele,
  buildApiPamEdit,
  buildApiPamEnvironmentDelete,
  buildApiPamEnvironments,
  buildApiPamEnvironmentVariables
} from '@config/route';
import type {
  PAMEnvCreate,
  PAMEnvReplaceVariables,
  PAMEnvWriteable
} from '@schemas/PAMEnvironmentSchema';
import {
  SearchPAMProject,
  PAMSearchParams,
  PAMProjectDetail,
  PAMProjectCreate,
  PAMProjectUpdate
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
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const response = await this.appApiRequester.get<
      AppApiSuccessInterface<ResourceSearchResult<SearchPAMProject>>,
      PAMSearchParams
    >(API_PAM_SEARCH, {
      params: {
        ...params,
        sort: JSON.stringify(params.sort)
      }
    });

    return response.data.data!;
  }

  public async createProject(
    data: PAMProjectCreate
  ): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.post<
      AppApiSuccessInterface<PAMProjectDetail>,
      PAMProjectCreate
    >(API_PAM_CREATE, data);

    return response.data.data!;
  }

  public async getProjectDetail(params: {
    id: string;
  }): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.get<
      AppApiSuccessInterface<PAMProjectDetail>,
      { isEnv: 1 | 0 }
    >(buildApiPamDetail(params.id), {
      params: { isEnv: 1 }
    });

    return response.data.data!;
  }

  public async updateProject(
    id: string,
    data: PAMProjectUpdate
  ): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.post<
      AppApiSuccessInterface<PAMProjectDetail>,
      PAMProjectUpdate
    >(buildApiPamEdit(id), data);

    return response.data.data!;
  }

  public deleteProject(id: string): Promise<void> {
    return this.appApiRequester.post(buildApiPamDetele(id));
  }

  /**
   * Lists environments for a project (sensitive values redacted).
   *
   * @param projectId - Project id
   * @returns Redacted environment list
   */
  public async listEnvironments(projectId: string): Promise<PAMEnvWriteable[]> {
    const response = await this.appApiRequester.get<
      AppApiSuccessInterface<PAMEnvWriteable[]>,
      Record<string, never>
    >(buildApiPamEnvironments(projectId));

    return response.data.data!;
  }

  /**
   * Creates an environment under a project.
   *
   * @param projectId - Project id
   * @param data - Name, url, optional variables
   * @returns Created environment (redacted)
   */
  public async createEnvironment(
    projectId: string,
    data: PAMEnvCreate
  ): Promise<PAMEnvWriteable> {
    const response = await this.appApiRequester.post<
      AppApiSuccessInterface<PAMEnvWriteable>,
      PAMEnvCreate
    >(buildApiPamEnvironments(projectId), data);

    return response.data.data!;
  }

  /**
   * Deletes an environment.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   */
  public async deleteEnvironment(
    projectId: string,
    envId: string
  ): Promise<void> {
    await this.appApiRequester.post(
      buildApiPamEnvironmentDelete(projectId, envId)
    );
  }

  /**
   * Replaces the full variable list for one environment.
   *
   * @param projectId - Project id
   * @param envId - Environment id
   * @param variables - Full variables list
   * @returns Updated environment (redacted)
   */
  public async setEnvironmentVariables(
    projectId: string,
    envId: string,
    variables: PAMEnvReplaceVariables['variables']
  ): Promise<PAMEnvWriteable> {
    const response = await this.appApiRequester.post<
      AppApiSuccessInterface<PAMEnvWriteable>,
      PAMEnvReplaceVariables
    >(buildApiPamEnvironmentVariables(projectId, envId), {
      variables
    });

    return response.data.data!;
  }
}
