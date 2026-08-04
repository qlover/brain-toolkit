import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { NextKitApiSuccess } from '@qlover/next-kit/common';
import { inject, injectable } from '@shared/container';
import { API_PAM_CREATE, API_PAM_SEARCH } from '@config/apiRoutes';
import {
  buildApiPamDetail,
  buildApiPamDetele,
  buildApiPamEdit,
  buildApiPamEnvironmentDelete,
  buildApiPamEnvironments,
  buildApiPamEnvironmentVariables,
  buildApiPamFork
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
  PAMProjectFork,
  PAMProjectUpdate
} from '@schemas/PAMProjectSchema';
import { AppApiRequester } from './AppApiRequester';

/** Abort ids for `pamApi.stop(...)`. Wired internally on each request. */
export const PAMAbortId = {
  projectDetail: (projectId: string) => `pam:projectDetail:${projectId}`,
  listEnvironments: (projectId: string) => `pam:listEnvironments:${projectId}`
} as const;

@injectable()
export class PAMApi {
  /** Concurrent identical search params share one in-flight request. */
  private readonly searchInflight = new Map<
    string,
    Promise<ResourceSearchResult<SearchPAMProject>>
  >();

  constructor(
    @inject(AppApiRequester) private readonly appApiRequester: AppApiRequester
  ) {}

  /**
   * Abort in-flight request by id from {@link PAMAbortId}.
   * `return () => pamApi.stop(PAMAbortId.projectDetail(id))`
   */
  public stop(abortId: string): void {
    this.appApiRequester.stop(abortId);
  }

  public async searchProjects(
    params: PAMSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const inflightKey = JSON.stringify(params);
    const pending = this.searchInflight.get(inflightKey);
    if (pending) {
      return pending;
    }

    const request = this.appApiRequester
      .get<
        NextKitApiSuccess<ResourceSearchResult<SearchPAMProject>>,
        PAMSearchParams
      >(API_PAM_SEARCH, {
        params: {
          ...params,
          sort: JSON.stringify(params.sort)
        }
      })
      .then((response) => response.data.data!)
      .finally(() => {
        this.searchInflight.delete(inflightKey);
      });

    this.searchInflight.set(inflightKey, request);
    return request;
  }

  public async createProject(
    data: PAMProjectCreate
  ): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.post<
      NextKitApiSuccess<PAMProjectDetail>,
      PAMProjectCreate
    >(API_PAM_CREATE, data);

    return response.data.data!;
  }

  /**
   * Forks a readable project into a private owned copy.
   *
   * @param sourceId - Source project id
   * @param data - Optional slug / name overrides
   * @returns Newly created project detail
   */
  public async forkProject(
    sourceId: string,
    data?: PAMProjectFork
  ): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.post<
      NextKitApiSuccess<PAMProjectDetail>,
      PAMProjectFork | Record<string, never>
    >(buildApiPamFork(sourceId), data ?? {});

    return response.data.data!;
  }

  public async getProjectDetail(params: {
    id: string;
  }): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.get<
      NextKitApiSuccess<PAMProjectDetail>,
      { isEnv: 1 | 0 }
    >(buildApiPamDetail(params.id), {
      params: { isEnv: 1 },
      abortId: PAMAbortId.projectDetail(params.id)
    });

    return response.data.data!;
  }

  public async updateProject(
    id: string,
    data: PAMProjectUpdate
  ): Promise<PAMProjectDetail> {
    const response = await this.appApiRequester.post<
      NextKitApiSuccess<PAMProjectDetail>,
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
      NextKitApiSuccess<PAMEnvWriteable[]>,
      Record<string, never>
    >(buildApiPamEnvironments(projectId), {
      abortId: PAMAbortId.listEnvironments(projectId)
    });

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
      NextKitApiSuccess<PAMEnvWriteable>,
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
      NextKitApiSuccess<PAMEnvWriteable>,
      PAMEnvReplaceVariables
    >(buildApiPamEnvironmentVariables(projectId, envId), {
      variables
    });

    return response.data.data!;
  }
}
