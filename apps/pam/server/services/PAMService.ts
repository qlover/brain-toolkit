import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import type {
  PAMProjectSchemaType,
  PAMProjectWithEnvironmentsSchemaType
} from '@schemas/PAMProjectSchema';
import type { PAMServiceInterface } from '@server/interfaces/PAMServiceInterface';
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
  public async getProjectWithEnvironment(
    id: string
  ): Promise<PAMProjectWithEnvironmentsSchemaType | null> {
    const project = await this.projectRepo.getProjectWithEnvironments(id);

    return project;
  }
}
