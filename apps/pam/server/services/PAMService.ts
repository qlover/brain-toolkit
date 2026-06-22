import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import { API_NOT_AUTHORIZED } from '@config/i18n-identifier/api';
import type {
  PAMProjectSchemaType,
  PAMProjectUpdateSchemaType,
  PAMProjectWithEnvironmentsSchemaType
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
  ): Promise<ResourceSearchResult<PAMProjectSchemaType>> {
    const user = await this.userService.getUser();

    return await this.projectRepo.searchProjects({
      ...params,
      // 如果已经登陆则查询包含用户本身的
      // 如果没有登陆则查询公开项目
      user_id: user?.id
    });
  }

  /**
   * @override
   */
  public async getProjectDetail(
    params: ProjectDetailParams
  ): Promise<PAMProjectWithEnvironmentsSchemaType | null> {
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
}
