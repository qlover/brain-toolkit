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
  PAMProjectCollaboratorAddSchema,
  PAMProjectCollaboratorUpdateSchema,
  type PAMProjectCollaboratorItem
} from '@schemas/PAMProjectCollaboratorSchema';
import {
  PAMProjectCreateSchema,
  PAMProjectDetail,
  PAMProjectForkSchema,
  PAMProjectTransferSchema,
  PAMProjectUpdateSchema,
  SearchPAMProject,
  type PAMAuthUserSummary
} from '@schemas/PAMProjectSchema';
import type { PAMServiceInterface } from '@server/interfaces/PAMServiceInterface';
import { PAMService } from '@server/services/PAMService';
import type { FetchedSiteLogo } from '@server/utils/PAMSiteLogoFetchUtil';
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

  /**
   * Distinct categories from projects the caller can see.
   */
  public listCategories(): Promise<string[]> {
    return this.pamService.listCategories();
  }

  public getPamDetail(
    pamId: string,
    request: NextRequest
  ): Promise<PAMProjectDetail | null> {
    const withEnvironments = request.nextUrl.searchParams.get('isEnv') === '1';

    return this.pamService.getProjectDetail({
      id: pamId,
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
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = isEmpty(body) ? {} : PAMProjectForkSchema.parse(body ?? {});

    return this.pamService.forkProject(sourceId, parsed);
  }

  /**
   * Transfers project ownership (owner only).
   *
   * @param id - Project id
   * @param request - `{ email? }` and/or `{ user_id? }`
   */
  public async transferProject(
    id: string,
    request: NextRequest
  ): Promise<{ ok: true }> {
    const body = await request.json();
    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    const parsed = PAMProjectTransferSchema.parse(body);
    await this.pamService.transferProject(id, parsed);
    return { ok: true };
  }

  /**
   * Lists users for transfer recipient picker.
   *
   * @param request - Optional `q` query
   */
  public searchUsersForTransfer(
    request: NextRequest
  ): Promise<PAMAuthUserSummary[]> {
    const q = request.nextUrl.searchParams.get('q') || undefined;
    return this.pamService.searchUsersForTransfer(q);
  }

  /**
   * Captures and stores project cover screenshot.
   *
   * @param id - Project id
   */
  public refreshPreviewImage(id: string): Promise<PAMProjectDetail> {
    return this.pamService.refreshPreviewImage(uuidSchema.parse(id));
  }

  public listCollaborators(
    projectId: string
  ): Promise<PAMProjectCollaboratorItem[]> {
    return this.pamService.listCollaborators(uuidSchema.parse(projectId));
  }

  public async addCollaborator(
    projectId: string,
    request: NextRequest
  ): Promise<PAMProjectCollaboratorItem> {
    const body = await request.json();
    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    const parsed = PAMProjectCollaboratorAddSchema.parse(body);
    return this.pamService.addCollaborator(uuidSchema.parse(projectId), parsed);
  }

  public async updateCollaborator(
    projectId: string,
    userId: string,
    request: NextRequest
  ): Promise<PAMProjectCollaboratorItem> {
    const body = await request.json();
    if (isEmpty(body)) {
      throw new ExecutorError(API_REQUEST_BODY_EMPTY);
    }
    const parsed = PAMProjectCollaboratorUpdateSchema.parse(body);
    return this.pamService.updateCollaboratorRole(
      uuidSchema.parse(projectId),
      uuidSchema.parse(userId),
      parsed
    );
  }

  public removeCollaborator(projectId: string, userId: string): Promise<void> {
    return this.pamService.removeCollaborator(
      uuidSchema.parse(projectId),
      uuidSchema.parse(userId)
    );
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

  /**
   * Proxies site favicon/logo for list avatars (`?url=` page URL).
   */
  public getSiteLogo(request: NextRequest): Promise<FetchedSiteLogo | null> {
    const siteUrl = request.nextUrl.searchParams.get('url') ?? '';
    return this.pamService.fetchSiteLogo(siteUrl);
  }
}
