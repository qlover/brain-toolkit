import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { inject, injectable } from '@shared/container';
import type { PAMProjectSchemaType } from '@schemas/PAMProjectSchema';
import type { UserSchema } from '@schemas/UserSchema';
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
    let user: UserSchema | null = null;
    try {
      // FIXME: 按理说 ServerAuthInterface 定义 getUser 不应该抛出错误, 但是 OAuthUserService 会抛出错误
      user = await this.userService.getUser();
    } catch {}

    return await this.projectRepo.searchProjects({
      ...params,
      // 如果已经登陆则查询包含用户本身的
      // 如果没有登陆则查询公开项目
      user_id: user?.id
    });
  }
}
