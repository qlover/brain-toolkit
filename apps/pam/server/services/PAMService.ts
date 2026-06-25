import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import {
  API_NOT_AUTHORIZED,
  API_PAM_ENV_NAME_EXISTS,
  API_PAM_SLUG_EXISTS
} from '@config/i18n-identifier/api';
import {
  SearchPAMProject,
  PAMProjectEnvKey,
  type PAMProjectCreateWithEnv,
  type PAMProjectUpdateSchemaType,
  type PAMProjectWithEnvironments
} from '@schemas/PAMProjectSchema';
import type {
  PAMServiceInterface,
  ProjectDetailParams
} from '@server/interfaces/PAMServiceInterface';
import type { ServerAuthInterface } from '@server/interfaces/ServerAuthInterface';
import { PAMProjectRepo } from '@server/repositorys/PAMProjectRepo';
import { OAuthUserService } from './OAuthUserService';

@injectable()
export class PAMService implements PAMServiceInterface {
  @inject(PAMProjectRepo)
  protected readonly projectRepo!: PAMProjectRepo;

  @inject(OAuthUserService)
  protected readonly userService!: ServerAuthInterface;

  /**
   * @override
   */
  public async searchProjects(
    params: ResourceSearchParams
  ): Promise<ResourceSearchResult<SearchPAMProject>> {
    const user = await this.userService.getUser();

    const result = await this.projectRepo.searchProjects({
      ...params,
      // 如果已经登陆则查询包含用户本身的
      // 如果没有登陆则查询公开项目
      user_id: user?.id
    });

    if (user && result.items && result.items.length > 0) {
      const newItems = result.items.map((item) =>
        Object.assign({}, item, {
          is_owner: user.id === item.owner_id
        } as SearchPAMProject)
      );

      return Object.assign(result, { items: newItems });
    }

    return result;
  }

  /**
   * @override
   */
  public async getProjectDetail(
    params: ProjectDetailParams
  ): Promise<PAMProjectWithEnvironments | null> {
    const { id, withEnvironments } = params;
    if (withEnvironments) {
      return await this.projectRepo.getProjectWithEnvironments(id);
    }

    return await this.projectRepo.getProjectById(id);
  }

  /**
   * @override
   */
  public async updateProject(
    id: string,
    params: PAMProjectUpdateSchemaType,
    extra?: { useRPC?: boolean }
  ): Promise<PAMProjectUpdateSchemaType> {
    // 检查是否有权限
    const project = await this.projectRepo.hasAuthProject(id);

    if (!project) {
      throw new Error(API_NOT_AUTHORIZED);
    }

    if (extra?.useRPC) {
      return await this.projectRepo.rpc_updateProject(id, params);
    }

    return await this.projectRepo.updateProject(id, params);
  }

  /**
   * @override
   */
  public async createProject(
    params: PAMProjectCreateWithEnv
  ): Promise<PAMProjectWithEnvironments> {
    const { slug, [PAMProjectEnvKey]: envs } = params;
    // slug 不能重复
    const pamWithSlug = await this.projectRepo.hasProjectWithSlug(slug);

    if (pamWithSlug) {
      throw new ExecutorError(API_PAM_SLUG_EXISTS, { slug });
    }

    // env 不能重复
    // FIXME: scheam 可能已经验证
    if (Array.isArray(envs)) {
      const len = envs.length;
      const names = new Set(envs.map(({ name }) => name));
      if (names.size !== len) {
        throw new ExecutorError(API_PAM_ENV_NAME_EXISTS, { names });
      }
    }
    const user = await this.userService.getUser(true);

    return await this.projectRepo.createProject({
      ...params,
      owner_id: user.id
    });
  }
}
