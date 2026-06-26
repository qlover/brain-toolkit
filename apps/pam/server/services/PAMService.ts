import {
  ResourceSearchParams,
  ResourceSearchResult
} from '@qlover/corekit-bridge';
import { ExecutorError } from '@qlover/fe-corekit';
import { inject, injectable } from '@shared/container';
import {
  API_NOT_AUTHORIZED,
  API_PAM_ENV_ID_NOT_EXISTS,
  API_PAM_ENV_NAME_EXISTS,
  API_PAM_SLUG_EXISTS,
  API_PAM_VARIABLE_KEY_DUPLICATE
} from '@config/i18n-identifier/api';
import {
  SearchPAMProject,
  PAMProjectEnvKey,
  PAMProjectDetail,
  PAMProjectUpdate,
  PAMProjectCreate
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
  ): Promise<PAMProjectDetail | null> {
    const { id, withEnvironments } = params;
    if (withEnvironments) {
      return await this.projectRepo.getProjectWithEnvironments(id);
    }

    return await this.projectRepo.getProjectById(id);
  }

  /**
   * 校验项目环境名称的唯一性（含修改、新增、互换场景）
   * @param existingEnvs 数据库中现有的环境列表 [{ id, name }]
   * @param requestEnvs  请求中的环境列表（PAMEnvWriteable[]）
   * @throws ExecutorError 当存在名称冲突时
   */
  private validateEnvironmentNames(
    existingEnvs: { id: string; name: string }[],
    requestEnvs: { id?: string; name: string }[]
  ): void {
    const idToName = new Map(existingEnvs.map((e) => [e.id, e.name]));
    const allExistingNames = new Set(idToName.values());

    // 1. 检查请求内部重复名称
    const nameCount = new Map<string, number>();
    for (const env of requestEnvs) {
      if (!env.name) continue;
      nameCount.set(env.name, (nameCount.get(env.name) || 0) + 1);
    }
    for (const [name, count] of nameCount) {
      if (count > 1) {
        throw new ExecutorError(
          API_PAM_ENV_NAME_EXISTS,
          `Duplicate environment name "${name}" in request`
        );
      }
    }

    // 2. 构建占用名称集合并释放所有被修改环境的旧名称（无条件）
    const occupied = new Set(allExistingNames);
    for (const env of requestEnvs) {
      if (env.id && idToName.has(env.id)) {
        const oldName = idToName.get(env.id)!;
        occupied.delete(oldName); // 关键：无论是否改名都释放
      }
    }

    // 3. 校验新名称是否与占用集合冲突
    for (const env of requestEnvs) {
      if (env.name && occupied.has(env.name)) {
        throw new ExecutorError(
          API_PAM_ENV_NAME_EXISTS,
          `Environment name "${env.name}" already exists in this project`
        );
      }
    }

    // 4. 校验修改的环境 id 必须存在
    for (const env of requestEnvs) {
      if (env.id && !idToName.has(env.id)) {
        throw new ExecutorError(
          API_PAM_ENV_ID_NOT_EXISTS,
          `Environment ID ${env.id} not exists in this project`
        );
      }
    }
  }

  /**
   * @override
   */
  public async updateProject(
    params: PAMProjectUpdate,
    extra?: { useRPC?: boolean }
  ): Promise<PAMProjectDetail> {
    const { id } = params;
    // 权限校验
    const project = await this.projectRepo.hasAuthProject(id);
    if (!project) throw new Error(API_NOT_AUTHORIZED);

    // --- 补充 slug 唯一性校验 ---
    if (params.slug) {
      const existing = await this.projectRepo.getProjectWithSlug(params.slug);
      if (existing && existing.id !== id) {
        throw new ExecutorError(API_PAM_SLUG_EXISTS, { slug: params.slug });
      }
    }

    // --- 环境校验 ---
    if (Array.isArray(params.environments) && params.environments.length > 0) {
      // 获取现有环境（仅需 id 和 name）
      const existingEnvs =
        await this.projectRepo.getEnvIdAndNamesByProjectId(id);
      this.validateEnvironmentNames(existingEnvs, params.environments);
    }

    // --- 变量键唯一性校验（可选） ---
    for (const env of params.environments || []) {
      if (env.variables && env.variables.length > 0) {
        const keys = env.variables.map((v) => v.key);
        if (new Set(keys).size !== keys.length) {
          throw new ExecutorError(
            API_PAM_VARIABLE_KEY_DUPLICATE,
            `Duplicate variable keys in environment "${env.name}"`
          );
        }
      }
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
    params: PAMProjectCreate
  ): Promise<PAMProjectDetail> {
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
