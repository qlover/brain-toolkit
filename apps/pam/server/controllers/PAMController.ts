import { ResourceSearchResult } from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit/executor';
import { SearchParamsValidator, uuidSchema } from '@qlover/next-kit/common';
import { isEmpty } from 'lodash-es';
import { inject, injectable } from '@shared/container';
import { API_REQUEST_BODY_EMPTY } from '@config/i18n-identifier/api';
import {
  PAMEnvCreateSchema,
  PAMEnvReplaceVariablesSchema,
  type PAMEnvWriteable
} from '@schemas/PAMEnvironmentSchema';
import {
  PAMProjectCreateSchema,
  PAMProjectDetail,
  PAMProjectForkSchema,
  PAMProjectUpdateSchema,
  SearchPAMProject
} from '@schemas/PAMProjectSchema';
import type { PAMServiceInterface } from '@server/interfaces/PAMServiceInterface';
import { PAMService } from '@server/services/PAMService';
import type { NextRequest } from 'next/server';

@injectable()
export class PAMController {
  @inject(PAMService)
  protected pamService!: PAMServiceInterface;

  @inject(SearchParamsValidator)
  protected searchParamsValidator!: SearchParamsValidator;

  /**
   * 是否在返回数据的时候
   */
  protected checkResult: boolean = true;

  public async searchPamList(
    request: NextRequest
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const searchParams = request.nextUrl.searchParams;
    const search = this.searchParamsValidator.getThrow(searchParams);

    const result = await this.pamService.searchProjects(search);

    return result;
  }

  public getPamDetail(
    pamId: string,
    request: NextRequest
  ): Promise<PAMProjectDetail | null> {
    const id = uuidSchema.parse(pamId);

    const withEnvironments = request.nextUrl.searchParams.get('isEnv') === '1';

    return this.pamService.getProjectDetail({
      id,
      withEnvironments
    });
  }

  public async updateProject(
    id: string,
    request: NextRequest
  ): Promise<PAMProjectDetail> {
    const body = await request.json();

    const useRPC = request.nextUrl.searchParams.get('rpc') === '1';

    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PAMProjectUpdateSchema.parse({ ...body, id });

    if (isEmpty(parsed)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    // When environments are omitted, update basics only (does not wipe envs).
    if (parsed.environments === undefined) {
      const { environments: _ignored, ...basics } = parsed;
      return this.pamService.updateProjectBasics(basics);
    }

    return this.pamService.updateProject(parsed, {
      useRPC
    });
  }

  public async createProject(request: NextRequest): Promise<PAMProjectDetail> {
    const body = await request.json();
    const parsed = PAMProjectCreateSchema.parse(body);

    return this.pamService.createProject(parsed);
  }

  /**
   * Forks a readable project into a private owned copy.
   *
   * @param sourceId - Source project id path param
   * @param request - Optional `{ slug?, name? }` body (empty body allowed)
   * @returns Newly created project detail
   */
  public async forkProject(
    sourceId: string,
    request: NextRequest
  ): Promise<PAMProjectDetail> {
    const id = uuidSchema.parse(sourceId);
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = isEmpty(body) ? {} : PAMProjectForkSchema.parse(body ?? {});

    return this.pamService.forkProject(id, parsed);
  }

  public deleteProject(id: string): unknown {
    return this.pamService.deleteProject(id);
  }

  /**
   * Lists environments for a project (sensitive values redacted).
   *
   * @param projectId - Project id path param
   * @returns Redacted environment list
   */
  public listEnvironments(projectId: string): Promise<PAMEnvWriteable[]> {
    const id = uuidSchema.parse(projectId);
    return this.pamService.listEnvironments(id);
  }

  /**
   * Creates an environment under a project.
   *
   * @param projectId - Project id path param
   * @param request - Incoming request with create body
   * @returns Created environment (redacted)
   */
  public async createEnvironment(
    projectId: string,
    request: NextRequest
  ): Promise<PAMEnvWriteable> {
    const id = uuidSchema.parse(projectId);
    const body = await request.json();

    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PAMEnvCreateSchema.parse(body);
    return this.pamService.createEnvironment(id, parsed);
  }

  /**
   * Deletes an environment.
   *
   * @param projectId - Project id path param
   * @param envId - Environment id path param
   */
  public deleteEnvironment(projectId: string, envId: string): Promise<void> {
    const projectUuid = uuidSchema.parse(projectId);
    const envUuid = uuidSchema.parse(envId);
    return this.pamService.deleteEnvironment(projectUuid, envUuid);
  }

  /**
   * Replaces the full variable list for one environment.
   *
   * @param projectId - Project id path param
   * @param envId - Environment id path param
   * @param request - Incoming request with `{ variables }`
   * @returns Updated environment (redacted)
   */
  public async replaceEnvironmentVariables(
    projectId: string,
    envId: string,
    request: NextRequest
  ): Promise<PAMEnvWriteable> {
    const projectUuid = uuidSchema.parse(projectId);
    const envUuid = uuidSchema.parse(envId);
    const body = await request.json();

    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }

    const parsed = PAMEnvReplaceVariablesSchema.parse(body);
    return this.pamService.replaceEnvironmentVariables(
      projectUuid,
      envUuid,
      parsed
    );
  }

  /**
   * Owner-only decrypted dotenv export for CLI.
   *
   * @param projectId - Project id path param
   * @param envId - Environment id path param
   */
  public exportEnvironment(
    projectId: string,
    envId: string
  ): Promise<{
    projectId: string;
    projectSlug: string;
    environmentId: string;
    environmentName: string;
    content: string;
    sensitiveKeys: string[];
    variables: Array<{
      key: string;
      value: string;
      sensitive: boolean;
      comments?: string[];
    }>;
  }> {
    const projectUuid = uuidSchema.parse(projectId);
    const envUuid = uuidSchema.parse(envId);
    return this.pamService.exportEnvironment(projectUuid, envUuid);
  }
}
